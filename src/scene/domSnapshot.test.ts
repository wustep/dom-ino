import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BLOCKED_SITE_MESSAGE } from "../utils/botChallenge"
import {
	autoSelectThrowables,
	fetchPageHtml,
	formatArchiveTimestamp,
	PageFetchError,
	prepareHtmlForViewer,
} from "./domSnapshot"
import type { SceneDescription, SceneElement } from "./types"

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: "el-1",
		type: "paragraph",
		rect: { x: 0, y: 0, width: 100, height: 50 },
		throwable: false,
		pinned: true,
		...overrides,
	}
}

function makeScene(elements: SceneElement[]): SceneDescription {
	return {
		id: "scene-1",
		name: "Test",
		width: 1200,
		height: 800,
		backgroundColor: "#fff",
		elements,
	}
}

// ── autoSelectThrowables ──

describe("autoSelectThrowables", () => {
	it("marks small buttons as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "btn",
				type: "button",
				rect: { x: 0, y: 0, width: 120, height: 40 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(true)
		expect(result.elements[0].pinned).toBe(false)
	})

	it("marks small badges as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "badge",
				type: "badge",
				rect: { x: 0, y: 0, width: 60, height: 24 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(true)
	})

	it("marks small cards as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "card",
				type: "card",
				rect: { x: 0, y: 0, width: 300, height: 200 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(true)
	})

	it("marks small images as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "img",
				type: "image",
				rect: { x: 0, y: 0, width: 200, height: 150 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(true)
	})

	it("marks small links as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "link",
				type: "link",
				rect: { x: 0, y: 0, width: 80, height: 20 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(true)
	})

	it("does NOT mark paragraphs as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "p",
				type: "paragraph",
				rect: { x: 0, y: 0, width: 100, height: 50 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(false)
	})

	it("does NOT mark headings as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "h",
				type: "heading",
				rect: { x: 0, y: 0, width: 200, height: 40 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(false)
	})

	it("does NOT mark oversized buttons as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "big-btn",
				type: "button",
				rect: { x: 0, y: 0, width: 600, height: 50 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(false)
	})

	it("does NOT mark tall elements as throwable", () => {
		const scene = makeScene([
			makeElement({
				id: "tall-card",
				type: "card",
				rect: { x: 0, y: 0, width: 300, height: 500 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(false)
	})

	it("does not mutate the original scene", () => {
		const scene = makeScene([
			makeElement({
				id: "btn",
				type: "button",
				rect: { x: 0, y: 0, width: 120, height: 40 },
			}),
		])
		autoSelectThrowables(scene)
		expect(scene.elements[0].throwable).toBe(false)
	})

	it("handles mixed elements correctly", () => {
		const scene = makeScene([
			makeElement({
				id: "p",
				type: "paragraph",
				rect: { x: 0, y: 0, width: 800, height: 100 },
			}),
			makeElement({
				id: "btn",
				type: "button",
				rect: { x: 0, y: 110, width: 120, height: 40 },
			}),
			makeElement({
				id: "img",
				type: "image",
				rect: { x: 0, y: 160, width: 200, height: 150 },
			}),
			makeElement({
				id: "h",
				type: "heading",
				rect: { x: 0, y: 320, width: 800, height: 50 },
			}),
		])
		const result = autoSelectThrowables(scene)
		expect(result.elements[0].throwable).toBe(false) // paragraph
		expect(result.elements[1].throwable).toBe(true) // button
		expect(result.elements[2].throwable).toBe(true) // image
		expect(result.elements[3].throwable).toBe(false) // heading
	})
})

// ── fetchPageHtml ──

describe("fetchPageHtml", () => {
	// fetchPageHtml rejects responses < 100 chars on the proxy path,
	// so all mock HTML must be long enough.
	const LONG_HTML =
		"<html><head><title>Test</title></head><body>" + "x".repeat(100) + "</body></html>"

	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn())
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("prepends https:// if no protocol given", async () => {
		const mockFetch = vi.mocked(fetch)
		// Return a fresh Response per call (body can only be read once)
		mockFetch.mockImplementation(async () => new Response(LONG_HTML, { status: 200 }))
		const result = await fetchPageHtml("example.com")
		expect(result.url).toBe("https://example.com")
		expect(result.html).toBe(LONG_HTML)
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("https%3A%2F%2Fexample.com"),
			expect.anything(),
		)
	})

	it("preserves existing https:// protocol", async () => {
		vi.mocked(fetch).mockImplementation(async () => new Response(LONG_HTML, { status: 200 }))
		const result = await fetchPageHtml("https://example.com")
		expect(result.url).toBe("https://example.com")
	})

	it("preserves existing http:// protocol", async () => {
		vi.mocked(fetch).mockImplementation(async () => new Response(LONG_HTML, { status: 200 }))
		const result = await fetchPageHtml("http://example.com")
		expect(result.url).toBe("http://example.com")
	})

	it("trims whitespace from URL", async () => {
		vi.mocked(fetch).mockImplementation(async () => new Response(LONG_HTML, { status: 200 }))
		const result = await fetchPageHtml("  example.com  ")
		expect(result.url).toBe("https://example.com")
	})

	it("falls back to direct fetch when proxy fails", async () => {
		const mockFetch = vi.mocked(fetch)
		mockFetch.mockImplementation(async (url) => {
			if (String(url).includes("/api/fetch-page")) {
				throw new Error("proxy down")
			}
			return new Response(LONG_HTML, { status: 200 })
		})
		const result = await fetchPageHtml("example.com")
		expect(mockFetch).toHaveBeenCalledTimes(2)
		expect(result.html).toBe(LONG_HTML)
	})

	it("throws when both proxy and direct fail", async () => {
		vi.mocked(fetch).mockRejectedValue(new Error("network error"))
		await expect(fetchPageHtml("example.com")).rejects.toThrow("Could not fetch")
	})

	it("rejects proxy response that looks like an error JSON", async () => {
		const mockFetch = vi.mocked(fetch)
		mockFetch.mockImplementation(async (url) => {
			if (String(url).includes("/api/fetch-page")) {
				return new Response('{"error": "not found"}', { status: 200 })
			}
			return new Response(LONG_HTML, { status: 200 })
		})
		const result = await fetchPageHtml("example.com")
		expect(mockFetch).toHaveBeenCalledTimes(2)
		expect(result.html).toBe(LONG_HTML)
	})

	it("rejects proxy response that is too short", async () => {
		const mockFetch = vi.mocked(fetch)
		mockFetch.mockImplementation(async (url) => {
			if (String(url).includes("/api/fetch-page")) {
				return new Response("hi", { status: 200 })
			}
			return new Response(LONG_HTML, { status: 200 })
		})
		const result = await fetchPageHtml("example.com")
		expect(mockFetch).toHaveBeenCalledTimes(2)
		expect(result.html).toBe(LONG_HTML)
	})
})

// ── fetchPageHtml: blocked sites + archive fallback ──

describe("fetchPageHtml (blocked sites)", () => {
	const PAGE = `<html><head><title>Real</title></head><body>${"<p>story</p>".repeat(30)}</body></html>`
	const CHALLENGE = `<html lang="en"><head><title>nytimes.com</title></head><body style="margin:0"><p id="cmsg">Please enable JS and disable any ad blocker</p><script src="https://ct.captcha-delivery.com/c.js"></script></body></html>`

	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn())
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("reports archive provenance from proxy headers", async () => {
		vi.mocked(fetch).mockImplementation(
			async () =>
				new Response(PAGE, {
					status: 200,
					headers: {
						"X-Dom-Ino-Source": "archive",
						"X-Dom-Ino-Archive-Timestamp": "20261116211303",
					},
				}),
		)
		const result = await fetchPageHtml("https://www.nytimes.com")
		expect(result).toEqual({
			html: PAGE,
			url: "https://www.nytimes.com",
			source: "archive",
			archiveTimestamp: "20261116211303",
		})
	})

	it("marks live responses as live", async () => {
		vi.mocked(fetch).mockImplementation(
			async () => new Response(PAGE, { status: 200, headers: { "X-Dom-Ino-Source": "live" } }),
		)
		const result = await fetchPageHtml("example.com")
		expect(result.source).toBe("live")
		expect(result.archiveTimestamp).toBeUndefined()
	})

	it("surfaces a friendly error for blocked sites without retrying directly", async () => {
		vi.mocked(fetch).mockImplementation(
			async () =>
				new Response(JSON.stringify({ error: "raw", code: "blocked", upstreamStatus: 403 }), {
					status: 502,
					headers: { "Content-Type": "application/json" },
				}),
		)
		const promise = fetchPageHtml("https://www.nytimes.com")
		await expect(promise).rejects.toBeInstanceOf(PageFetchError)
		await expect(promise).rejects.toThrow(BLOCKED_SITE_MESSAGE)
		expect(fetch).toHaveBeenCalledTimes(1)
	})

	it("passes through other structured proxy errors", async () => {
		vi.mocked(fetch).mockImplementation(
			async () =>
				new Response(
					JSON.stringify({
						error: "Requests to private networks are not allowed",
						code: "forbidden_target",
					}),
					{ status: 403 },
				),
		)
		await expect(fetchPageHtml("http://localhost")).rejects.toThrow(/private networks/)
		expect(fetch).toHaveBeenCalledTimes(1)
	})

	it("defensively rejects challenge HTML even if the proxy returned 200", async () => {
		vi.mocked(fetch).mockImplementation(async () => new Response(CHALLENGE, { status: 200 }))
		await expect(fetchPageHtml("https://www.nytimes.com")).rejects.toThrow(BLOCKED_SITE_MESSAGE)
	})

	it("defensively rejects challenge HTML from the direct-fetch fallback", async () => {
		vi.mocked(fetch).mockImplementation(async (url) => {
			if (String(url).includes("/api/fetch-page")) throw new Error("proxy down")
			return new Response(CHALLENGE, { status: 200 })
		})
		await expect(fetchPageHtml("https://www.nytimes.com")).rejects.toThrow(BLOCKED_SITE_MESSAGE)
	})
})

describe("formatArchiveTimestamp", () => {
	it("formats Wayback timestamps as short UTC dates", () => {
		expect(formatArchiveTimestamp("20261116211303")).toBe("Nov 16, 2026")
		expect(formatArchiveTimestamp("garbage")).toBeNull()
	})
})

// ── prepareHtmlForViewer: URL resolution for live + archived pages ──

describe("prepareHtmlForViewer (URL resolution)", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("uses the original page URL as <base>, never web.archive.org", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 404 })),
		)
		const html = `<html><head><title>T</title></head><body><img src="photo.jpg"><img src="/abs.jpg"></body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/blog/post", {
			archiveTimestamp: "20261116211303",
		})
		expect(result).toContain('<base href="https://www.example.com/blog/post">')
		expect(result).not.toContain("web.archive.org")
		// Page-relative refs resolve against the page path, not the origin root.
		expect(result).toContain('src="https://www.example.com/blog/photo.jpg"')
		expect(result).toContain('src="https://www.example.com/abs.jpg"')
	})

	// Regression: the `//host` rewrite also matched inside `https://host`, so
	// every absolute srcset became `https:https://…` and the NYTimes hero
	// <img src srcSet> rendered as a broken image.
	it("leaves absolute srcset candidates intact and resolves relative ones", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 404 })),
		)
		const abs =
			"https://static01.nyt.com/images/a-small.jpg?format=pjpg&amp;quality=75 1x, https://static01.nyt.com/images/a-medium.jpg?format=pjpg&amp;quality=75 2x"
		const html = `<html><head></head><body><picture><source media="(min-width: 601px)" srcSet="${abs}"><img src="https://static01.nyt.com/images/a-medium.jpg" srcSet="${abs}"></picture><img src="y.jpg" srcset="//cdn.example.com/x.jpg 1x, img/y.jpg 2x, /z.jpg 3x"></body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/blog/post")
		expect(result).not.toContain("https:https:")
		const doc = new DOMParser().parseFromString(result, "text/html")
		const expected = abs.replaceAll("&amp;", "&")
		expect(doc.querySelector("source")?.getAttribute("srcset")).toBe(expected)
		expect(doc.querySelector("picture img")?.getAttribute("srcset")).toBe(expected)
		expect(doc.querySelectorAll("img")[1].getAttribute("srcset")).toBe(
			"https://cdn.example.com/x.jpg 1x, https://www.example.com/blog/img/y.jpg 2x, https://www.example.com/z.jpg 3x",
		)
	})

	it("fetches stylesheets as proxy assets, tagged with the archive timestamp", async () => {
		const fetchMock = vi.fn(
			async (_url: string) => new Response("body { color: red; }", { status: 200 }),
		)
		vi.stubGlobal("fetch", fetchMock)
		const html = `<html><head><link rel="stylesheet" href="css/site.css"></head><body></body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/blog/post", {
			archiveTimestamp: "20261116211303",
		})
		const requested = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost")
		expect(requested.pathname).toBe("/api/fetch-page")
		expect(requested.searchParams.get("url")).toBe("https://www.example.com/blog/css/site.css")
		expect(requested.searchParams.get("asset")).toBe("1")
		expect(requested.searchParams.get("archive")).toBe("20261116211303")
		expect(result).toContain("<style>body { color: red; }</style>")
	})

	it("inlines CSS containing $-sequences verbatim", async () => {
		const css = ".a::after { content: '$&'; } .b::after { content: \"$'\"; }"
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(css, { status: 200 })),
		)
		const html = `<html><head><link rel="stylesheet" href="/x.css"></head><body></body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/")
		expect(result).toContain(`<style>${css}</style>`)
	})
})

// ── prepareHtmlForViewer (noscript image promotion) ──

describe("prepareHtmlForViewer", () => {
	it("promotes noscript img src to empty sibling img and forces opacity (NYTimes pattern)", async () => {
		const html = `<html><head><title>T</title></head><body>
      <picture>
        <source media="(min-width: 601px)"/>
        <img class="lazy" alt="Photo" loading="lazy"/>
        <noscript><img src="https://static.nyt.com/image.jpg" alt="Photo" class="full"/></noscript>
      </picture>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.nytimes.com/article")
		// The empty sibling img should now have the noscript's src
		expect(result).toContain('src="https://static.nyt.com/image.jpg"')
		// Should force opacity:1 to override JS-dependent opacity:0 CSS
		expect(result).toContain("opacity: 1")
		// The noscript tag itself should be removed
		expect(result).not.toContain("<noscript>")
	})

	it("does NOT duplicate images when sibling img already has src", async () => {
		const html = `<html><head><title>T</title></head><body>
      <picture>
        <img src="https://example.com/existing.jpg" alt="Photo"/>
        <noscript><img src="https://example.com/fallback.jpg" alt="Photo"/></noscript>
      </picture>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/page")
		// Should keep existing src and remove noscript (original behavior)
		expect(result).toContain("existing.jpg")
		expect(result).not.toContain("<noscript>")
	})

	it("unwraps noscript when no sibling media exists", async () => {
		const html = `<html><head><title>T</title></head><body>
      <div>
        <noscript><img src="https://example.com/only.jpg" alt="Only image"/></noscript>
      </div>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/page")
		// Should unwrap the noscript (original behavior)
		expect(result).toContain('src="https://example.com/only.jpg"')
		expect(result).not.toContain("<noscript>")
	})

	it("converts loading=lazy to loading=eager", async () => {
		const html = `<html><head><title>T</title></head><body>
      <img src="https://example.com/img.jpg" loading="lazy" alt="test"/>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/page")
		expect(result).toContain('loading="eager"')
		expect(result).not.toContain('loading="lazy"')
	})

	it("promotes data-src to src on images without src", async () => {
		const html = `<html><head><title>T</title></head><body>
      <img data-src="https://example.com/lazy.jpg" alt="lazy"/>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/page")
		expect(result).toContain('src="https://example.com/lazy.jpg"')
	})

	it("removes scripts from HTML", async () => {
		const html = `<html><head><title>T</title></head><body>
      <script>alert("xss")</script>
      <p>safe content</p>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/page")
		expect(result).not.toContain("<script")
		expect(result).toContain("safe content")
	})

	it("replaces position:fixed with position:relative", async () => {
		const html = `<html><head><title>T</title></head><body>
      <header style="position: fixed; top: 0;">Header</header>
    </body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.example.com/page")
		expect(result).toContain("position: relative")
		expect(result).not.toContain("position: fixed")
	})

	it("rewrites CSS url() paths using the CSS file origin, not page origin", async () => {
		// Simulate: page is on nytimes.com, CSS is on g1.nyt.com CDN
		const fontCSS = `@font-face { font-family: 'nyt-cheltenham'; src: url('/fonts/cheltenham.woff2'); }`
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(async (url: string) => {
				if (String(url).includes("g1.nyt.com")) {
					return new Response(fontCSS, { status: 200 })
				}
				return new Response("", { status: 404 })
			}),
		)

		const html = `<html><head><title>T</title>
      <link href="https://g1.nyt.com/fonts/css/web-fonts.css" rel="stylesheet" />
    </head><body><p>text</p></body></html>`
		const result = await prepareHtmlForViewer(html, "https://www.nytimes.com/article")

		// Font URL should resolve to g1.nyt.com, NOT nytimes.com
		expect(result).toContain('url("https://g1.nyt.com/fonts/cheltenham.woff2")')
		expect(result).not.toContain("nytimes.com/fonts/cheltenham")

		vi.unstubAllGlobals()
	})
})

// ── snapshotHtmlToScene (structure-based fallback) ──

// In jsdom, iframe.sandbox is not a DOMTokenList — we patch it so
// renderAndWalk can proceed. It still won't find enough elements
// (jsdom iframes don't render), so snapshotHtmlToScene falls back
// to parseHtmlStructure.

describe("snapshotHtmlToScene (structure-based fallback)", () => {
	let snapshotHtmlToScene: typeof import("./domSnapshot").snapshotHtmlToScene
	let origCreateElement: typeof document.createElement

	beforeEach(async () => {
		const mod = await import("./domSnapshot")
		snapshotHtmlToScene = mod.snapshotHtmlToScene

		// Patch iframe.sandbox for jsdom
		origCreateElement = document.createElement.bind(document)
		vi.spyOn(document, "createElement").mockImplementation(
			(tag: string, options?: ElementCreationOptions) => {
				const el = origCreateElement(tag, options)
				if (tag === "iframe") {
					// Provide a fake DOMTokenList for sandbox
					// biome-ignore lint/suspicious/noExplicitAny: jsdom iframe.sandbox is not a DOMTokenList
					;(el as any).sandbox = { add: vi.fn() }
					// Make the iframe immediately error so we skip the 10s timeout
					setTimeout(() => (el as HTMLIFrameElement).onerror?.(new Event("error")), 0)
				}
				return el
			},
		)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("extracts title from HTML", async () => {
		const html = "<html><head><title>Test Page</title></head><body><p>text</p></body></html>"
		const scene = await snapshotHtmlToScene(html, 1200, "Fallback")
		const heading = scene.elements.find((el) => el.type === "heading")
		expect(heading?.text).toBe("Test Page")
	})

	it("extracts meta description", async () => {
		const html = `<html><head><title>T</title><meta name="description" content="A test page about testing"></head><body></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200, "Test")
		const desc = scene.elements.find((el) => el.text === "A test page about testing")
		expect(desc).toBeDefined()
		expect(desc?.type).toBe("paragraph")
	})

	it("extracts headings from body", async () => {
		const html = `<html><head><title>T</title></head><body><h1>Main Title</h1><h2>Subtitle</h2><p>content</p></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200)
		const headings = scene.elements.filter((el) => el.type === "heading")
		expect(headings.length).toBeGreaterThanOrEqual(3)
		expect(headings.some((h) => h.text === "Main Title")).toBe(true)
		expect(headings.some((h) => h.text === "Subtitle")).toBe(true)
	})

	it("extracts paragraphs from body", async () => {
		const html = `<html><head><title>T</title></head><body><p>Hello world this is a paragraph</p></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200)
		const paras = scene.elements.filter((el) => el.type === "paragraph")
		expect(paras.some((p) => p.text === "Hello world this is a paragraph")).toBe(true)
	})

	it("sets scene dimensions", async () => {
		const html = `<html><head><title>T</title></head><body><p>text</p></body></html>`
		const scene = await snapshotHtmlToScene(html, 1000)
		expect(scene.width).toBe(1000)
		expect(scene.height).toBeGreaterThanOrEqual(800)
	})

	it("uses scene name", async () => {
		const html = `<html><head><title>T</title></head><body></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200, "My Page")
		expect(scene.name).toBe("My Page")
	})

	it("skips script and style tags", async () => {
		const html = `<html><head><title>T</title></head><body><script>alert('hi')</script><style>.x{}</style><p>visible</p></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200)
		const allText = scene.elements.map((e) => e.text).join(" ")
		expect(allText).not.toContain("alert")
		expect(allText).not.toContain(".x{}")
	})

	it("skips hidden/modal elements by class", async () => {
		const html = `<html><head><title>T</title></head><body><div class="hidden">secret</div><div class="modal">overlay</div><p>visible content here</p></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200)
		const allText = scene.elements.map((e) => e.text).join(" ")
		expect(allText).not.toContain("secret")
		expect(allText).not.toContain("overlay")
		expect(allText).toContain("visible content here")
	})

	it("extracts og:image as throwable image element", async () => {
		const html = `<html><head><title>T</title><meta property="og:image" content="https://example.com/img.jpg"></head><body></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200)
		const img = scene.elements.find((el) => el.type === "image")
		expect(img).toBeDefined()
		expect(img?.imageSrc).toBe("https://example.com/img.jpg")
		expect(img?.throwable).toBe(true)
	})

	it("extracts list items as paragraphs with bullet prefix", async () => {
		const html = `<html><head><title>T</title></head><body><ul><li>First item</li><li>Second item</li></ul></body></html>`
		const scene = await snapshotHtmlToScene(html, 1200)
		const listItems = scene.elements.filter((el) => el.text?.startsWith("\u2022"))
		expect(listItems).toHaveLength(2)
		expect(listItems[0].text).toContain("First item")
	})
})
