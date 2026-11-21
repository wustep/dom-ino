import { describe, expect, it } from "vitest"
import type { SnapshotCandidate } from "../scene/snapshotHelpers"
import type { SceneElement } from "../scene/types"
import { absolutizeCssUrls, sameCandidates, sameTextBlocks } from "./useSnapshotScanner"

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

describe("sameCandidates / sameTextBlocks", () => {
	const node = document.createElement("div")
	const element = (overrides: Partial<SceneElement> = {}): SceneElement => ({
		id: "a",
		type: "card",
		rect: { x: 10, y: 20, width: 100, height: 50 },
		throwable: true,
		pinned: false,
		text: "Hello",
		...overrides,
	})
	const candidate = (overrides: Partial<SnapshotCandidate> = {}): SnapshotCandidate => ({
		id: "a",
		x: 10,
		y: 20,
		width: 100,
		height: 50,
		saved: false,
		node,
		sceneElement: element(),
		display: "block",
		...overrides,
	})

	it("treats a rescan with identical results as unchanged", () => {
		expect(sameCandidates([candidate()], [candidate()])).toBe(true)
		expect(
			sameTextBlocks(
				[{ id: "a", node, sceneElement: element() }],
				[{ id: "a", node, sceneElement: element() }],
			),
		).toBe(true)
	})

	it("detects layout, style, and membership changes", () => {
		expect(sameCandidates([candidate()], [candidate({ y: 21 })])).toBe(false)
		expect(
			sameCandidates([candidate()], [candidate({ sceneElement: element({ fontSize: 18 }) })]),
		).toBe(false)
		expect(sameCandidates([candidate()], [candidate(), candidate({ id: "b" })])).toBe(false)
		expect(
			sameTextBlocks(
				[{ id: "a", node, sceneElement: element() }],
				[{ id: "a", node, sceneElement: element({ text: "Changed" }) }],
			),
		).toBe(false)
	})
})
