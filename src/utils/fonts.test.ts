import { describe, expect, it } from "vitest"
import { buildFontString, DEFAULT_SANS, DEFAULT_SERIF, parseFontShorthand } from "./fonts"

describe("buildFontString", () => {
	it("builds basic font string with size only", () => {
		expect(buildFontString(16)).toBe(`16px ${DEFAULT_SERIF}`)
	})

	it("includes weight when not 400", () => {
		expect(buildFontString(16, 700)).toBe(`700 16px ${DEFAULT_SERIF}`)
	})

	it("omits weight when 400", () => {
		expect(buildFontString(16, 400)).toBe(`16px ${DEFAULT_SERIF}`)
	})

	it("includes font style when not normal", () => {
		expect(buildFontString(16, 400, undefined, "italic")).toBe(`italic 16px ${DEFAULT_SERIF}`)
	})

	it("includes both style and weight", () => {
		expect(buildFontString(14, 700, DEFAULT_SANS, "oblique")).toBe(
			`oblique 700 14px ${DEFAULT_SANS}`,
		)
	})

	it("uses custom font family", () => {
		expect(buildFontString(18, undefined, "Arial, sans-serif")).toBe("18px Arial, sans-serif")
	})

	it("omits style prefix when normal", () => {
		expect(buildFontString(16, 600, undefined, "normal")).toBe(`600 16px ${DEFAULT_SERIF}`)
	})
})

describe("parseFontShorthand", () => {
	it("parses basic font string", () => {
		expect(parseFontShorthand('16px "Source Serif 4", Georgia, serif')).toEqual({
			style: "normal",
			weight: 400,
			family: '"Source Serif 4", Georgia, serif',
		})
	})

	it("parses font with weight", () => {
		expect(parseFontShorthand("700 16px serif")).toEqual({
			style: "normal",
			weight: 700,
			family: "serif",
		})
	})

	it("parses font with style and weight", () => {
		expect(parseFontShorthand('italic 700 17px "Source Serif 4", Georgia, serif')).toEqual({
			style: "italic",
			weight: 700,
			family: '"Source Serif 4", Georgia, serif',
		})
	})

	it("parses oblique style", () => {
		expect(parseFontShorthand("oblique 14px sans-serif")).toEqual({
			style: "oblique",
			weight: 400,
			family: "sans-serif",
		})
	})

	it("parses decimal pixel sizes", () => {
		expect(parseFontShorthand("700 37.8px sans-serif")).toEqual({
			style: "normal",
			weight: 700,
			family: "sans-serif",
		})
	})

	it("falls back to defaults for unparseable input", () => {
		expect(parseFontShorthand("Arial")).toEqual({
			style: "normal",
			weight: 400,
			family: "Arial",
		})
	})
})

describe("font constants", () => {
	it("DEFAULT_SERIF contains Source Serif 4", () => {
		expect(DEFAULT_SERIF).toContain("Source Serif 4")
	})

	it("DEFAULT_SANS contains DM Sans", () => {
		expect(DEFAULT_SANS).toContain("DM Sans")
	})
})
