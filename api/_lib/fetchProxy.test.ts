// @vitest-environment node
import { describe, expect, it, vi } from "vitest"
import { BLOCKED_SITE_MESSAGE } from "../../src/utils/botChallenge.js"
import {
	ARCHIVE_TIMESTAMP_HEADER,
	buildArchiveRawUrl,
	buildCdxUrl,
	detectBlockedResponse,
	handleFetchPageRequest,
	isPrivateAddress,
	MAX_RESPONSE_BYTES,
	type ProxyDeps,
	parseCdxTimestamp,
	SOURCE_HEADER,
	validateTargetUrl,
	validateTargetUrlWithDns,
} from "./fetchProxy.js"

// The real 771-byte DataDome interstitial nytimes.com serves to non-browser clients.
const DATADOME_PAGE = `<html lang="en"><head><title>nytimes.com</title><style>#cmsg{animation: A 1.5s;}@keyframes A{0%{opacity:0;}99%{opacity:0;}100%{opacity:1;}}</style></head><body style="margin:0"><p id="cmsg">Please enable JS and disable any ad blocker</p><script data-cfasync="false">var dd={'rt':'c','cid':'AHrlqAAAAAMA','hsh':'499AE341','t':'bv','s':60446,'host':'geo.captcha-delivery.com'}</script><script data-cfasync="false" src="https://ct.captcha-delivery.com/c.js"></script></body></html>`

const CLOUDFLARE_PAGE = `<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="refresh" content="390"></head><body><div class="main-wrapper"><noscript><div>Enable JavaScript and cookies to continue</div></noscript></div><script>(function(){window._cf_chl_opt={cvId: '3'};})();</script></body></html>`

const REAL_PAGE = `<!doctype html><html><head><title>The New York Times</title></head><body><main>${"<article><h2>Headline</h2><p>Story text goes here.</p></article>".repeat(20)}</main></body></html>`

const TIMESTAMP = "20261116211303"

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>

function makeDeps(routes: Record<string, Route>, addresses: string[] = ["151.101.1.164"]) {
	const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
		const url = String(input)
		for (const [prefix, route] of Object.entries(routes)) {
			if (url.startsWith(prefix)) return route(url, init)
		}
		throw new TypeError(`fetch failed (unmocked ${url})`)
	})
	const deps: ProxyDeps = {
		fetch: fetchMock as unknown as typeof fetch,
		lookup: vi.fn(async () => addresses),
	}
	return { deps, fetchMock, calledUrls: () => fetchMock.mock.calls.map((c) => String(c[0])) }
}

const html = (body: string, status = 200, headers: Record<string, string> = {}) =>
	new Response(body, {
		status,
		headers: { "content-type": "text/html; charset=utf-8", ...headers },
	})

describe("validateTargetUrl", () => {
	it.each([
		["", 400],
		["not a url", 400],
		["ftp://example.com/file", 400],
		["file:///etc/passwd", 400],
		["javascript:alert(1)", 400],
		["https://user:pass@example.com/", 400],
	])("rejects %s with %i", (raw, status) => {
		const result = validateTargetUrl(raw)
		expect(result.ok).toBe(false)
		if (!result.ok) expect(result.status).toBe(status)
	})

	it.each([
		"http://localhost/",
		"http://LOCALHOST./",
		"http://api.localhost/",
		"http://printer.local/",
		"http://metadata.google.internal/computeMetadata/v1/",
		"http://intranet/",
		"http://127.0.0.1/",
		"http://127.1/",
		"http://2130706433/", // 127.0.0.1 as a single integer
		"http://0x7f.0.0.1/",
		"http://10.1.2.3/",
		"http://172.16.0.1/",
		"http://172.31.255.255/",
		"http://192.168.1.1/",
		"http://169.254.169.254/latest/meta-data/",
		"http://100.64.0.1/",
		"http://0.0.0.0/",
		"http://224.0.0.1/",
		"http://[::1]/",
		"http://[::]/",
		"http://[fe80::1]/",
		"http://[fd12:3456::1]/",
		"http://[::ffff:127.0.0.1]/",
		"http://[::ffff:169.254.169.254]/",
		"http://[64:ff9b::a9fe:a9fe]/",
		"https://example.com:8443/",
		"http://example.com:22/",
	])("forbids private or non-standard target %s", (raw) => {
		const result = validateTargetUrl(raw)
		expect(result.ok).toBe(false)
		if (!result.ok) expect(result.status).toBe(403)
	})

	it.each([
		"https://www.nytimes.com",
		"https://en.wikipedia.org/wiki/Main_Page",
		"http://93.184.216.34/",
		"http://172.32.0.1/",
		"https://example.com:443/",
		"http://example.com:80/",
		"https://[2606:4700:4700::1111]/",
	])("allows public target %s", (raw) => {
		expect(validateTargetUrl(raw).ok).toBe(true)
	})
})

describe("isPrivateAddress", () => {
	it("classifies DNS results", () => {
		expect(isPrivateAddress("10.0.0.5")).toBe(true)
		expect(isPrivateAddress("::ffff:10.0.0.5")).toBe(true)
		expect(isPrivateAddress("fe80::abcd%en0")).toBe(true)
		expect(isPrivateAddress("151.101.1.164")).toBe(false)
		expect(isPrivateAddress("2a04:4e42::644")).toBe(false)
	})
})

describe("validateTargetUrlWithDns", () => {
	it("rejects hostnames that resolve to private addresses (DNS rebinding)", async () => {
		const result = await validateTargetUrlWithDns("https://rebind.example/", async () => [
			"151.101.1.164",
			"127.0.0.1",
		])
		expect(result).toMatchObject({ ok: false, status: 403 })
	})

	it("reports unresolvable hosts as unreachable", async () => {
		const result = await validateTargetUrlWithDns("https://nope.example/", async () => {
			throw new Error("ENOTFOUND")
		})
		expect(result).toMatchObject({ ok: false, status: 502, code: "unreachable" })
	})

	it("skips DNS for public IP literals", async () => {
		const lookup = vi.fn(async () => ["10.0.0.1"])
		const result = await validateTargetUrlWithDns("http://93.184.216.34/", lookup)
		expect(result.ok).toBe(true)
		expect(lookup).not.toHaveBeenCalled()
	})
})

describe("detectBlockedResponse", () => {
	it("flags the DataDome interstitial by status and by content", () => {
		expect(detectBlockedResponse({ status: 403, body: DATADOME_PAGE })).toBe("http_status")
		expect(detectBlockedResponse({ status: 200, body: DATADOME_PAGE })).toBe("challenge")
	})

	it("flags Cloudflare 'Just a moment' pages", () => {
		expect(detectBlockedResponse({ status: 200, body: CLOUDFLARE_PAGE })).toBe("challenge")
	})

	it("flags empty shells", () => {
		expect(detectBlockedResponse({ status: 200, body: "<html><body></body></html>" })).toBe("empty")
	})

	it("accepts real pages, even large ones that reference a bot-protection vendor", () => {
		expect(detectBlockedResponse({ status: 200, body: REAL_PAGE })).toBeNull()
		const bigWithTag = `${REAL_PAGE.repeat(100)}<script src="https://js.captcha-delivery.com/tags.js"></script>`
		expect(bigWithTag.length).toBeGreaterThan(64 * 1024)
		expect(detectBlockedResponse({ status: 200, body: bigWithTag })).toBeNull()
	})
})

describe("Wayback helpers", () => {
	it("builds a CDX query for the newest HTTP-200 HTML capture", () => {
		const url = new URL(buildCdxUrl("https://www.nytimes.com/"))
		expect(url.origin + url.pathname).toBe("https://web.archive.org/cdx/search/cdx")
		expect(url.searchParams.get("url")).toBe("https://www.nytimes.com/")
		expect(url.searchParams.get("limit")).toBe("-1")
		expect(url.searchParams.get("fl")).toBe("timestamp")
		expect(url.searchParams.getAll("filter")).toEqual(["statuscode:200", "mimetype:text/html"])
	})

	it("builds raw (id_) capture URLs", () => {
		expect(buildArchiveRawUrl(TIMESTAMP, "https://www.nytimes.com/")).toBe(
			"https://web.archive.org/web/20261116211303id_/https://www.nytimes.com/",
		)
	})

	it("parses the newest timestamp from CDX output", () => {
		expect(parseCdxTimestamp("20261116211303\n")).toBe(TIMESTAMP)
		expect(parseCdxTimestamp("20250101000000\n20261116211303\n20260101000000")).toBe(TIMESTAMP)
		expect(parseCdxTimestamp("")).toBeNull()
		expect(parseCdxTimestamp("<html>error</html>")).toBeNull()
	})
})

describe("handleFetchPageRequest", () => {
	const NYT = "https://www.nytimes.com/"
	const CDX = "https://web.archive.org/cdx/"
	const ARCHIVE = `https://web.archive.org/web/${TIMESTAMP}id_/`

	it("returns live pages as inert text", async () => {
		const { deps } = makeDeps({ [NYT]: () => html(REAL_PAGE) })
		const result = await handleFetchPageRequest({ url: "https://www.nytimes.com" }, deps)
		expect(result.status).toBe(200)
		expect(result.body).toBe(REAL_PAGE)
		expect(result.headers[SOURCE_HEADER]).toBe("live")
		expect(result.headers["Content-Type"]).toBe("text/plain; charset=utf-8")
		expect(result.headers["X-Content-Type-Options"]).toBe("nosniff")
		expect(result.headers["Access-Control-Allow-Origin"]).toBeUndefined()
	})

	it("falls back to the newest HTTP-200 Wayback capture when the site serves a 403 challenge", async () => {
		const { deps, calledUrls } = makeDeps({
			[NYT]: () => html(DATADOME_PAGE, 403),
			[CDX]: () => new Response(`${TIMESTAMP}\n`, { status: 200 }),
			[ARCHIVE]: () => html(REAL_PAGE),
		})
		const result = await handleFetchPageRequest({ url: "https://www.nytimes.com" }, deps)
		expect(result.status).toBe(200)
		expect(result.body).toBe(REAL_PAGE)
		expect(result.headers[SOURCE_HEADER]).toBe("archive")
		expect(result.headers[ARCHIVE_TIMESTAMP_HEADER]).toBe(TIMESTAMP)
		const cdxCall = calledUrls().find((u) => u.startsWith(CDX))
		expect(cdxCall).toContain("filter=statuscode%3A200")
		expect(calledUrls()).toContain(`${ARCHIVE}https://www.nytimes.com/`)
	})

	it("falls back when a 200 response is a challenge page", async () => {
		const { deps } = makeDeps({
			[NYT]: () => html(CLOUDFLARE_PAGE),
			[CDX]: () => new Response(TIMESTAMP),
			[ARCHIVE]: () => html(REAL_PAGE),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.headers[SOURCE_HEADER]).toBe("archive")
	})

	it("falls back when the live site is unreachable", async () => {
		const { deps } = makeDeps({
			[NYT]: () => {
				throw new TypeError("fetch failed")
			},
			[CDX]: () => new Response(TIMESTAMP),
			[ARCHIVE]: () => html(REAL_PAGE),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(200)
		expect(result.headers[SOURCE_HEADER]).toBe("archive")
	})

	it("returns a friendly blocked error when no capture exists", async () => {
		const { deps } = makeDeps({
			[NYT]: () => html(DATADOME_PAGE, 403),
			[CDX]: () => new Response(""),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(502)
		expect(result.headers["Content-Type"]).toContain("application/json")
		expect(JSON.parse(result.body)).toEqual({
			error: BLOCKED_SITE_MESSAGE,
			code: "blocked",
			upstreamStatus: 403,
		})
	})

	it("refuses an archived capture that is itself a challenge", async () => {
		const { deps } = makeDeps({
			[NYT]: () => html(DATADOME_PAGE, 403),
			[CDX]: () => new Response(TIMESTAMP),
			[ARCHIVE]: () => html(DATADOME_PAGE),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(502)
		expect(JSON.parse(result.body).code).toBe("blocked")
	})

	it("serves a tiny-but-valid live page when there is no capture", async () => {
		const tiny = "<html><body><p>Hi</p></body></html>"
		const { deps } = makeDeps({ [NYT]: () => html(tiny), [CDX]: () => new Response("") })
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(200)
		expect(result.body).toBe(tiny)
	})

	it("reports non-blocking upstream errors with their status", async () => {
		const { deps } = makeDeps({
			[NYT]: () => html("Not Found", 404),
			[CDX]: () => new Response(""),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(502)
		expect(JSON.parse(result.body)).toMatchObject({ code: "upstream_error", upstreamStatus: 404 })
	})

	it("never fetches forbidden targets", async () => {
		const { deps, fetchMock } = makeDeps({})
		const result = await handleFetchPageRequest({ url: "http://169.254.169.254/" }, deps)
		expect(result.status).toBe(403)
		expect(fetchMock).not.toHaveBeenCalled()
		expect((await handleFetchPageRequest({ url: null }, deps)).status).toBe(400)
	})

	it("re-validates redirects and refuses hops to private addresses", async () => {
		const { deps, calledUrls } = makeDeps({
			[NYT]: () =>
				new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } }),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(403)
		expect(calledUrls()).toEqual([NYT])
	})

	it("follows public redirects", async () => {
		const { deps, calledUrls } = makeDeps({
			"https://nytimes.com/": () =>
				new Response(null, { status: 301, headers: { location: "https://www.nytimes.com/" } }),
			[NYT]: () => html(REAL_PAGE),
		})
		const result = await handleFetchPageRequest({ url: "https://nytimes.com" }, deps)
		expect(result.status).toBe(200)
		expect(calledUrls()).toEqual(["https://nytimes.com/", NYT])
	})

	it("rejects hosts whose DNS points at private networks", async () => {
		const { deps, fetchMock } = makeDeps({ [NYT]: () => html(REAL_PAGE) }, ["10.0.0.8"])
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.status).toBe(403)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it("caps response size by content-length and while streaming", async () => {
		const declared = makeDeps({
			[NYT]: () => html("x", 200, { "content-length": String(MAX_RESPONSE_BYTES + 1) }),
		})
		const r1 = await handleFetchPageRequest({ url: NYT }, declared.deps)
		expect(r1.status).toBe(502)
		expect(JSON.parse(r1.body).code).toBe("too_large")

		const chunk = new Uint8Array(1024 * 1024).fill(120)
		const streamed = makeDeps({
			[NYT]: () =>
				new Response(
					new ReadableStream({
						pull(controller) {
							controller.enqueue(chunk)
						},
					}),
					{ status: 200 },
				),
		})
		const r2 = await handleFetchPageRequest({ url: NYT }, streamed.deps)
		expect(JSON.parse(r2.body).code).toBe("too_large")
	})

	it("decodes non-UTF-8 pages using the declared charset", async () => {
		const latin1 = new Uint8Array([...new TextEncoder().encode(REAL_PAGE.slice(0, -14)), 0xe9])
		const { deps } = makeDeps({
			[NYT]: () =>
				new Response(latin1, { headers: { "content-type": "text/html; charset=ISO-8859-1" } }),
		})
		const result = await handleFetchPageRequest({ url: NYT }, deps)
		expect(result.body.endsWith("é")).toBe(true)
	})

	describe("asset mode", () => {
		const CSS = "https://g1.nyt.com/fonts/css/web-fonts.css"

		it("passes stylesheets through without challenge detection", async () => {
			const { deps } = makeDeps({ [CSS]: () => new Response("a{}", { status: 200 }) })
			const result = await handleFetchPageRequest({ url: CSS, asset: "1" }, deps)
			expect(result.status).toBe(200)
			expect(result.body).toBe("a{}")
		})

		it("does not query the archive for failed assets of live pages", async () => {
			const { deps, calledUrls } = makeDeps({ [CSS]: () => new Response("", { status: 404 }) })
			const result = await handleFetchPageRequest({ url: CSS, asset: "1" }, deps)
			expect(result.status).toBe(502)
			expect(calledUrls()).toEqual([CSS])
		})

		it("falls back to the page's capture for assets of archived pages", async () => {
			const { deps, calledUrls } = makeDeps({
				[CSS]: () => new Response("", { status: 404 }),
				[ARCHIVE]: () => new Response("body{color:red}"),
			})
			const result = await handleFetchPageRequest(
				{ url: CSS, asset: "1", archive: TIMESTAMP },
				deps,
			)
			expect(result.status).toBe(200)
			expect(result.body).toBe("body{color:red}")
			expect(calledUrls()).toContain(`${ARCHIVE}${CSS}`)
		})
	})
})
