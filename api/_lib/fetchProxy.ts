/**
 * Shared implementation of `/api/fetch-page`, used by the Vercel function
 * (`api/fetch-page.ts`) and the Vite dev middleware (`vite.config.ts`).
 *
 * - Validates targets (http/https, default ports, no private/loopback/link-local
 *   hosts — checked on the literal hostname, on DNS results, and on every
 *   redirect hop) so the proxy can't be used for SSRF.
 * - Caps response size and total time.
 * - Detects bot-challenge / block pages and falls back to the most recent
 *   HTTP-200 Wayback Machine snapshot (raw `id_` mode, so the HTML still
 *   references the original site). No attempt is made to get past the
 *   challenge itself.
 * - Never serves fetched content as HTML from our own origin.
 *
 * Underscore-prefixed directories under `api/` are not deployed as functions.
 */
import { lookup as dnsLookup } from "node:dns/promises"
import { BLOCKED_SITE_MESSAGE, detectBotChallenge } from "../../src/utils/botChallenge.js"

export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
export const LIVE_TIMEOUT_MS = 12_000
export const CDX_TIMEOUT_MS = 8_000
export const ARCHIVE_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 5
/** 2xx HTML bodies shorter than this are treated as empty shells. */
const MIN_PAGE_CHARS = 256

const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export const SOURCE_HEADER = "X-Dom-Ino-Source"
export const ARCHIVE_TIMESTAMP_HEADER = "X-Dom-Ino-Archive-Timestamp"

// ─── Target validation ───

export type ValidationResult =
	| { ok: true; url: URL }
	| { ok: false; status: number; code: string; error: string }

function reject(status: number, code: string, error: string): ValidationResult {
	return { ok: false, status, code, error }
}

function parseIPv4(host: string): number[] | null {
	const parts = host.split(".")
	if (parts.length !== 4) return null
	const bytes = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : Number.NaN))
	return bytes.every((b) => b >= 0 && b <= 255) ? bytes : null
}

function isPrivateIPv4([a, b, c]: number[]): boolean {
	return (
		a === 0 || // "this" network
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) || // CGNAT
		(a === 169 && b === 254) || // link-local, cloud metadata
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 0 && c === 0) ||
		(a === 192 && b === 168) ||
		(a === 198 && (b === 18 || b === 19)) || // benchmarking
		a >= 224 // multicast + reserved + broadcast
	)
}

/** Expands an IPv6 literal (no brackets) to 8 16-bit groups. */
function parseIPv6(addr: string): number[] | null {
	let input = addr.toLowerCase()
	const zone = input.indexOf("%")
	if (zone !== -1) input = input.slice(0, zone)
	// Trailing embedded IPv4 (e.g. ::ffff:127.0.0.1)
	const lastColon = input.lastIndexOf(":")
	const tail = input.slice(lastColon + 1)
	if (tail.includes(".")) {
		const v4 = parseIPv4(tail)
		if (!v4) return null
		input = `${input.slice(0, lastColon + 1)}${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`
	}
	const halves = input.split("::")
	if (halves.length > 2) return null
	const head = halves[0] ? halves[0].split(":") : []
	const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : []
	const missing = 8 - head.length - rest.length
	if (halves.length === 1 ? missing !== 0 : missing < 1) return null
	const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest]
	const parsed = groups.map((g) =>
		/^[0-9a-f]{1,4}$/.test(g) ? Number.parseInt(g, 16) : Number.NaN,
	)
	return parsed.every((g) => !Number.isNaN(g)) ? parsed : null
}

function isPrivateIPv6(groups: number[]): boolean {
	const allZeroPrefix = (n: number) => groups.slice(0, n).every((g) => g === 0)
	if (allZeroPrefix(7) && (groups[7] === 0 || groups[7] === 1)) return true // :: and ::1
	const embeddedV4 = [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff]
	if (allZeroPrefix(5) && groups[5] === 0xffff) return isPrivateIPv4(embeddedV4) // ::ffff:a.b.c.d
	if (allZeroPrefix(6)) return isPrivateIPv4(embeddedV4) // ::a.b.c.d (deprecated)
	if (groups[0] === 0x64 && groups[1] === 0xff9b) return isPrivateIPv4(embeddedV4) // NAT64
	if ((groups[0] & 0xfe00) === 0xfc00) return true // unique local fc00::/7
	if ((groups[0] & 0xffc0) === 0xfe80) return true // link-local fe80::/10
	if ((groups[0] & 0xff00) === 0xff00) return true // multicast
	return false
}

/** True if an IP literal (v4, or v6 with or without brackets) is non-public. */
export function isPrivateAddress(address: string): boolean {
	const bare = address.replace(/^\[|\]$/g, "")
	const v4 = parseIPv4(bare)
	if (v4) return isPrivateIPv4(v4)
	if (bare.includes(":")) {
		const v6 = parseIPv6(bare)
		// Unparseable IPv6 → refuse rather than guess.
		return v6 ? isPrivateIPv6(v6) : true
	}
	return false
}

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa", ".lan"]

/** Synchronous checks on a URL: scheme, credentials, port, and hostname. */
export function validateTargetUrl(raw: string | null | undefined): ValidationResult {
	if (!raw || typeof raw !== "string") return reject(400, "missing_url", "Missing ?url= parameter")
	let url: URL
	try {
		url = new URL(raw)
	} catch {
		return reject(400, "invalid_url", "Invalid URL")
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return reject(400, "invalid_url", "Only http and https URLs are allowed")
	}
	if (url.username || url.password) {
		return reject(400, "invalid_url", "URLs with credentials are not allowed")
	}
	// `url.port` is "" for the scheme's default port (80/443).
	if (url.port !== "") {
		return reject(403, "forbidden_target", "Only default ports are allowed")
	}
	const host = url.hostname.toLowerCase().replace(/\.$/, "")
	if (
		!host ||
		host === "localhost" ||
		BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
		isPrivateAddress(host) ||
		// Single-label names (e.g. "intranet", "metadata") resolve via search domains.
		(!host.includes(".") && !host.includes(":"))
	) {
		return reject(403, "forbidden_target", "Requests to private networks are not allowed")
	}
	return { ok: true, url }
}

export type LookupFn = (hostname: string) => Promise<string[]>

const defaultLookup: LookupFn = async (hostname) => {
	const results = await dnsLookup(hostname, { all: true, verbatim: true })
	return results.map((r) => r.address)
}

/** Validates a URL and, for DNS names, that every resolved address is public. */
export async function validateTargetUrlWithDns(
	raw: string,
	lookup: LookupFn = defaultLookup,
): Promise<ValidationResult> {
	const result = validateTargetUrl(raw)
	if (!result.ok) return result
	const host = result.url.hostname.replace(/^\[|\]$/g, "")
	if (parseIPv4(host) || host.includes(":")) return result
	let addresses: string[]
	try {
		addresses = await lookup(host)
	} catch {
		return reject(502, "unreachable", `Could not resolve ${host}`)
	}
	if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
		return reject(403, "forbidden_target", "Requests to private networks are not allowed")
	}
	return result
}

// ─── Fetching ───

export type FetchFn = typeof fetch

export interface ProxyDeps {
	fetch: FetchFn
	lookup: LookupFn
}

const defaultDeps: ProxyDeps = { fetch: (...args) => fetch(...args), lookup: defaultLookup }

export class ProxyFetchError extends Error {
	readonly code: "timeout" | "too_large" | "forbidden_target" | "unreachable" | "too_many_redirects"
	constructor(code: ProxyFetchError["code"], message: string) {
		super(message)
		this.code = code
	}
}

export interface FetchedResponse {
	status: number
	contentType: string
	body: string
	finalUrl: string
}

function decodeBody(bytes: Uint8Array, contentType: string): string {
	const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1]
	try {
		return new TextDecoder(charset || "utf-8").decode(bytes)
	} catch {
		return new TextDecoder("utf-8").decode(bytes)
	}
}

async function readCappedBody(response: Response, maxBytes: number): Promise<Uint8Array> {
	const declared = Number(response.headers.get("content-length"))
	if (Number.isFinite(declared) && declared > maxBytes) {
		await response.body?.cancel()
		throw new ProxyFetchError("too_large", "Response is too large")
	}
	if (!response.body) return new Uint8Array(await response.arrayBuffer())
	const reader = response.body.getReader()
	const chunks: Uint8Array[] = []
	let total = 0
	for (;;) {
		const { done, value } = await reader.read()
		if (done) break
		total += value.byteLength
		if (total > maxBytes) {
			await reader.cancel()
			throw new ProxyFetchError("too_large", "Response is too large")
		}
		chunks.push(value)
	}
	const out = new Uint8Array(total)
	let offset = 0
	for (const chunk of chunks) {
		out.set(chunk, offset)
		offset += chunk.byteLength
	}
	return out
}

/**
 * Fetches a URL, following redirects manually so every hop is re-validated
 * (a public URL must not be able to bounce us onto a private address).
 */
export async function safeFetch(
	rawUrl: string,
	deps: ProxyDeps,
	{ timeoutMs, maxBytes = MAX_RESPONSE_BYTES }: { timeoutMs: number; maxBytes?: number },
): Promise<FetchedResponse> {
	const signal = AbortSignal.timeout(timeoutMs)
	let current = rawUrl
	try {
		for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
			const check = await validateTargetUrlWithDns(current, deps.lookup)
			if (!check.ok) {
				throw new ProxyFetchError(
					check.code === "unreachable" ? "unreachable" : "forbidden_target",
					check.error,
				)
			}
			const response = await deps.fetch(check.url.href, {
				headers: {
					"User-Agent": USER_AGENT,
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/css,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.9",
				},
				redirect: "manual",
				signal,
			})
			const location = response.headers.get("location")
			if (response.status >= 300 && response.status < 400 && location) {
				await response.body?.cancel()
				current = new URL(location, check.url).href
				continue
			}
			const contentType = response.headers.get("content-type") ?? ""
			const bytes = await readCappedBody(response, maxBytes)
			return {
				status: response.status,
				contentType,
				body: decodeBody(bytes, contentType),
				finalUrl: check.url.href,
			}
		}
	} catch (e) {
		if (e instanceof ProxyFetchError) throw e
		if (signal.aborted) throw new ProxyFetchError("timeout", "Timed out fetching the page")
		throw new ProxyFetchError("unreachable", "Failed to fetch the requested URL")
	}
	throw new ProxyFetchError("too_many_redirects", "Too many redirects")
}

// ─── Challenge detection ───

export type BlockReason = "http_status" | "challenge" | "empty"

/** Classifies a fetched page as usable (null) or blocked/unusable. */
export function detectBlockedResponse(response: {
	status: number
	body: string
}): BlockReason | null {
	if (response.status < 200 || response.status >= 300) return "http_status"
	if (detectBotChallenge(response.body)) return "challenge"
	if (response.body.trim().length < MIN_PAGE_CHARS) return "empty"
	return null
}

// ─── Wayback Machine fallback ───

const WAYBACK = "https://web.archive.org"

/** CDX query for the newest HTTP-200 capture (`limit=-1` = last result only). */
export function buildCdxUrl(url: string, { htmlOnly = true } = {}): string {
	const params = new URLSearchParams({ url, limit: "-1", fl: "timestamp" })
	params.append("filter", "statuscode:200")
	if (htmlOnly) params.append("filter", "mimetype:text/html")
	return `${WAYBACK}/cdx/search/cdx?${params.toString()}`
}

/**
 * Raw capture URL (`id_` = original bytes, no Wayback toolbar or URL
 * rewriting), so relative and absolute references still point at the
 * original site.
 */
export function buildArchiveRawUrl(timestamp: string, url: string): string {
	return `${WAYBACK}/web/${timestamp}id_/${url}`
}

/** Picks the newest well-formed timestamp from a CDX text response. */
export function parseCdxTimestamp(text: string): string | null {
	const stamps = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => /^\d{14}$/.test(line))
		.sort()
	return stamps.at(-1) ?? null
}

export async function findLatestArchiveTimestamp(
	url: string,
	deps: ProxyDeps,
	options?: { htmlOnly?: boolean },
): Promise<string | null> {
	try {
		const res = await safeFetch(buildCdxUrl(url, options), deps, {
			timeoutMs: CDX_TIMEOUT_MS,
			maxBytes: 64 * 1024,
		})
		if (res.status !== 200) return null
		return parseCdxTimestamp(res.body)
	} catch {
		return null
	}
}

/** Formats a 14-digit Wayback timestamp as an ISO date-time (UTC). */
export function archiveTimestampToIso(timestamp: string): string | null {
	const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(timestamp)
	return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null
}

// ─── Request handler ───

export interface ProxyResult {
	status: number
	headers: Record<string, string>
	body: string
}

/**
 * Fetched bodies are third-party content served from our origin. Serve them
 * as inert text (never `text/html`) so `/api/fetch-page?url=evil` can't run
 * script on this origin; the client only ever reads them with `res.text()`.
 */
const CONTENT_HEADERS = {
	"Content-Type": "text/plain; charset=utf-8",
	"X-Content-Type-Options": "nosniff",
	"Content-Security-Policy": "default-src 'none'; sandbox",
	"Access-Control-Expose-Headers": `${SOURCE_HEADER}, ${ARCHIVE_TIMESTAMP_HEADER}`,
}

function ok(body: string, extra: Record<string, string>): ProxyResult {
	return {
		status: 200,
		headers: {
			...CONTENT_HEADERS,
			"Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=86400",
			...extra,
		},
		body,
	}
}

function errorResult(
	status: number,
	code: string,
	error: string,
	extra: Record<string, unknown> = {},
): ProxyResult {
	return {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
			"Cache-Control": "no-store",
		},
		body: JSON.stringify({ error, code, ...extra }),
	}
}

export interface ProxyQuery {
	url?: string | null
	/** Sub-resource (stylesheet) fetch: no challenge detection, status passed through. */
	asset?: string | null
	/** Wayback timestamp of the page this asset belongs to (archived pages). */
	archive?: string | null
}

async function fetchAsset(url: string, archive: string | null, deps: ProxyDeps) {
	let live: FetchedResponse | null = null
	try {
		live = await safeFetch(url, deps, { timeoutMs: LIVE_TIMEOUT_MS })
		if (live.status >= 200 && live.status < 300) {
			return ok(live.body, { [SOURCE_HEADER]: "live" })
		}
	} catch (e) {
		if (e instanceof ProxyFetchError && e.code === "too_large") {
			return errorResult(502, "too_large", e.message)
		}
	}
	// Assets of archived pages may have rotated off the live CDN.
	if (archive && /^\d{14}$/.test(archive)) {
		try {
			const archived = await safeFetch(buildArchiveRawUrl(archive, url), deps, {
				timeoutMs: ARCHIVE_TIMEOUT_MS,
			})
			if (archived.status >= 200 && archived.status < 300) {
				return ok(archived.body, { [SOURCE_HEADER]: "archive" })
			}
		} catch {
			/* fall through */
		}
	}
	return errorResult(502, "upstream_error", "Failed to fetch the requested asset", {
		upstreamStatus: live?.status,
	})
}

const BLOCKING_STATUSES = new Set([401, 403, 407, 429, 451, 503])

/** Framework-agnostic implementation of `GET /api/fetch-page`. */
export async function handleFetchPageRequest(
	query: ProxyQuery,
	deps: ProxyDeps = defaultDeps,
): Promise<ProxyResult> {
	const syntax = validateTargetUrl(query.url)
	if (!syntax.ok) return errorResult(syntax.status, syntax.code, syntax.error)
	const target = syntax.url.href

	if (query.asset) return fetchAsset(target, query.archive ?? null, deps)

	let live: FetchedResponse | null = null
	let liveError: ProxyFetchError | null = null
	try {
		live = await safeFetch(target, deps, { timeoutMs: LIVE_TIMEOUT_MS })
	} catch (e) {
		liveError = e instanceof ProxyFetchError ? e : new ProxyFetchError("unreachable", String(e))
	}

	if (liveError?.code === "forbidden_target") {
		return errorResult(403, "forbidden_target", liveError.message)
	}
	if (liveError?.code === "too_large") {
		return errorResult(502, "too_large", "This page is too large to import (over 5 MB).")
	}

	const reason = live ? detectBlockedResponse(live) : null
	if (live && !reason) return ok(live.body, { [SOURCE_HEADER]: "live" })

	// Blocked, challenged, empty, or unreachable: try the newest HTTP-200 capture.
	const timestamp = await findLatestArchiveTimestamp(target, deps)
	if (timestamp) {
		try {
			const archived = await safeFetch(buildArchiveRawUrl(timestamp, target), deps, {
				timeoutMs: ARCHIVE_TIMEOUT_MS,
			})
			if (!detectBlockedResponse(archived)) {
				return ok(archived.body, {
					[SOURCE_HEADER]: "archive",
					[ARCHIVE_TIMESTAMP_HEADER]: timestamp,
					"Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
				})
			}
		} catch {
			/* fall through to the error below */
		}
	}

	// A genuinely tiny-but-valid page is still better than an error.
	if (live && reason === "empty") return ok(live.body, { [SOURCE_HEADER]: "live" })

	if (live && (reason === "challenge" || BLOCKING_STATUSES.has(live.status))) {
		return errorResult(502, "blocked", BLOCKED_SITE_MESSAGE, { upstreamStatus: live.status })
	}
	if (live) {
		return errorResult(502, "upstream_error", `The site responded with HTTP ${live.status}.`, {
			upstreamStatus: live.status,
		})
	}
	if (liveError?.code === "timeout") {
		return errorResult(504, "timeout", "Timed out fetching the page.")
	}
	return errorResult(502, "unreachable", liveError?.message ?? "Failed to fetch the requested URL")
}
