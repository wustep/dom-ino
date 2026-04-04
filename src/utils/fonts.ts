export const DEFAULT_SERIF = '"Source Serif 4", Georgia, serif'
export const DEFAULT_SANS = '"DM Sans", sans-serif'

/**
 * Build a CSS font shorthand string from individual properties.
 * Used by DominoScene and SnapshotPageView when constructing the
 * font string for Pretext's text measurement.
 */
export function buildFontString(
	fontSize: number,
	fontWeight?: number,
	fontFamily?: string,
	fontStyle?: string,
): string {
	const stylePrefix = fontStyle && fontStyle !== "normal" ? `${fontStyle} ` : ""
	const weightPart = fontWeight && fontWeight !== 400 ? `${fontWeight} ` : ""
	return `${stylePrefix}${weightPart}${fontSize}px ${fontFamily ?? DEFAULT_SERIF}`
}

/**
 * Parse a CSS font shorthand string to extract style, weight, and family.
 * E.g. "italic 700 17px \"Source Serif 4\", Georgia, serif"
 *   -> { style: "italic", weight: 700, family: '"Source Serif 4", Georgia, serif' }
 */
export function parseFontShorthand(font: string): {
	style: "normal" | "italic" | "oblique"
	weight: number
	family: string
} {
	const fontMatch = font.match(/^(?:(italic|oblique)\s+)?(?:(\d+)\s+)?(\d*\.?\d+px)\s+(.+)$/)
	if (fontMatch) {
		return {
			style: (fontMatch[1] as "italic" | "oblique" | undefined) ?? "normal",
			weight: fontMatch[2] ? parseInt(fontMatch[2], 10) : 400,
			family: fontMatch[4],
		}
	}

	return { style: "normal", weight: 400, family: font }
}
