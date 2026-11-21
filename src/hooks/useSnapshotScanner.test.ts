import { describe, expect, it } from "vitest"
import { absolutizeCssUrls } from "./useSnapshotScanner"

describe("absolutizeCssUrls", () => {
	// Regression: copied @font-face rules kept relative url()s, which then
	// resolved against the app's origin instead of the fetched page.
	it("resolves relative font URLs against the stylesheet base", () => {
		const css = `@font-face { font-family: F; src: url("f.woff2") format("woff2"), url('/abs.woff'), url(../up.ttf); }`
		expect(absolutizeCssUrls(css, "https://site.example/a/b/")).toBe(
			`@font-face { font-family: F; src: url("https://site.example/a/b/f.woff2") format("woff2"), url('https://site.example/abs.woff'), url("https://site.example/a/up.ttf"); }`,
		)
	})

	it("leaves absolute and data URLs untouched", () => {
		const css = `src: url("https://cdn.example/f.woff2"), url(data:font/woff2;base64,AAAA)`
		expect(absolutizeCssUrls(css, "https://site.example/")).toBe(css)
	})
})
