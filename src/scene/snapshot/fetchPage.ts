import { BLOCKED_SITE_MESSAGE, detectBotChallenge } from "../../utils/botChallenge"
import type { SceneDescription, SceneElementType } from "../types"

// ─── URL fetching ───

/** Response headers set by `/api/fetch-page` (see `api/_lib/fetchProxy.ts`). */
const SOURCE_HEADER = "X-Dom-Ino-Source"
const ARCHIVE_TIMESTAMP_HEADER = "X-Dom-Ino-Archive-Timestamp"

/**
 * Upper bound for the proxy round-trip. The server may try the live site
 * (≤12s), then a Wayback CDX lookup (≤8s) and the archived copy (≤15s).
 */
const PROXY_TIMEOUT_MS = 45_000
const DIRECT_TIMEOUT_MS = 8_000

export interface FetchedPage {
	html: string
	/** Normalized request URL — used as the page's identity and base URL. */
	url: string
	/** Where the HTML came from; "archive" means a Wayback Machine snapshot. */
	source: "live" | "archive"
	/** 14-digit Wayback timestamp when `source === "archive"`. */
	archiveTimestamp?: string
}

/** A fetch failure with a user-facing message (e.g. the site blocks bots). */
export class PageFetchError extends Error {
	readonly code: string
	constructor(code: string, message: string) {
		super(message)
		this.name = "PageFetchError"
		this.code = code
	}
}

function parseProxyError(text: string): { error: string; code?: string } | null {
	if (!text.startsWith("{")) return null
	try {
		const parsed = JSON.parse(text) as { error?: unknown; code?: unknown }
		if (typeof parsed.error !== "string") return null
		return { error: parsed.error, code: typeof parsed.code === "string" ? parsed.code : undefined }
	} catch {
		return null
	}
}

function assertNotChallenge(html: string) {
	// Defensive: never import a bot-challenge interstitial as the page.
	if (detectBotChallenge(html)) throw new PageFetchError("blocked", BLOCKED_SITE_MESSAGE)
}

/** Fetches a web page via the dev proxy, normalizing the URL and validating the response. */
export async function fetchPageHtml(url: string): Promise<FetchedPage> {
	let normalizedUrl = url.trim()
	if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
		normalizedUrl = `https://${normalizedUrl}`
	}
	try {
		const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(normalizedUrl)}`, {
			signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
		})
		const text = await res.text()
		const proxyError = parseProxyError(text)
		if (proxyError?.code) {
			// Structured proxy error (blocked site, invalid/forbidden URL, timeout):
			// a direct browser fetch would hit the same wall or CORS, so stop here.
			throw new PageFetchError(
				proxyError.code,
				proxyError.code === "blocked" ? BLOCKED_SITE_MESSAGE : proxyError.error,
			)
		}
		if (res.ok && !proxyError && text.length > 100) {
			assertNotChallenge(text)
			const archived = res.headers.get(SOURCE_HEADER) === "archive"
			const timestamp = res.headers.get(ARCHIVE_TIMESTAMP_HEADER)
			return {
				html: text,
				url: normalizedUrl,
				source: archived ? "archive" : "live",
				archiveTimestamp: archived && timestamp ? timestamp : undefined,
			}
		}
	} catch (e) {
		if (e instanceof PageFetchError) throw e
		console.warn("[DOMino] Proxy fetch failed, trying direct:", e)
	}
	try {
		const res = await fetch(normalizedUrl, {
			signal: AbortSignal.timeout(DIRECT_TIMEOUT_MS),
		})
		if (res.ok) {
			const html = await res.text()
			assertNotChallenge(html)
			return { html, url: normalizedUrl, source: "live" }
		}
	} catch (e) {
		if (e instanceof PageFetchError) throw e
		console.warn("[DOMino] Direct fetch also failed:", e)
	}
	throw new Error(`Could not fetch ${normalizedUrl}. Try pasting HTML directly instead.`)
}

/** Builds the Wayback Machine page URL for an archived snapshot (for "view original" links). */
export function archiveViewUrl(timestamp: string, url: string): string {
	return `https://web.archive.org/web/${timestamp}/${url}`
}

/** Formats a 14-digit Wayback timestamp as e.g. "Nov 16, 2026" (UTC). */
export function formatArchiveTimestamp(timestamp: string): string | null {
	const m = /^(\d{4})(\d{2})(\d{2})/.exec(timestamp)
	if (!m) return null
	const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
	if (Number.isNaN(date.getTime())) return null
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	})
}

/** Marks likely-interactive elements (buttons, badges, images) as throwable in a scene. */
export function autoSelectThrowables(scene: SceneDescription): SceneDescription {
	const throwableTypes: SceneElementType[] = ["button", "badge", "card", "image", "link"]
	return {
		...scene,
		elements: scene.elements.map((el) =>
			throwableTypes.includes(el.type) && el.rect.width < 500 && el.rect.height < 400
				? { ...el, throwable: true, pinned: false }
				: el,
		),
	}
}
