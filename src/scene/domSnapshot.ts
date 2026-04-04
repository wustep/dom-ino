import { parseHtmlStructure } from "./snapshot/parser"
import { prepareHtml } from "./snapshot/prepare"
import { renderAndWalk } from "./snapshot/walker"
import type { SceneDescription } from "./types"

export { autoSelectThrowables, fetchPageHtml } from "./snapshot/fetchPage"
export { prepareHtml } from "./snapshot/prepare"

// ─── Main snapshot function ───

export async function snapshotHtmlToScene(
	html: string,
	containerWidth: number = 1200,
	sceneName: string = "Custom Page",
	sourceUrl?: string,
): Promise<SceneDescription> {
	const prepared = sourceUrl ? await prepareHtml(html, sourceUrl) : html

	// Step 2: Render in iframe and walk the live DOM
	const result = await renderAndWalk(prepared, containerWidth, sceneName)
	if (result && result.elements.length >= 3) {
		return result
	}

	// Step 3: Fall back to structure parser
	return parseHtmlStructure(html, containerWidth, sceneName)
}

export async function prepareHtmlForViewer(html: string, sourceUrl?: string): Promise<string> {
	return sourceUrl ? prepareHtml(html, sourceUrl) : html
}
