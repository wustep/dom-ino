import { parseHtmlStructure } from "./snapshot/parser"
import { type PrepareHtmlOptions, prepareHtml } from "./snapshot/prepare"
import { renderAndWalk } from "./snapshot/walker"
import type { SceneDescription } from "./types"

export {
	archiveViewUrl,
	autoSelectThrowables,
	type FetchedPage,
	fetchPageHtml,
	formatArchiveTimestamp,
	PageFetchError,
} from "./snapshot/fetchPage"
export { type PrepareHtmlOptions, prepareHtml } from "./snapshot/prepare"

// ─── Main snapshot function ───

/** Converts raw HTML into a SceneDescription by preparing, rendering in an iframe, and walking the DOM. */
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

/** Prepares fetched HTML for safe iframe rendering: inlines CSS, rewrites URLs, strips scripts. */
export async function prepareHtmlForViewer(
	html: string,
	sourceUrl?: string,
	options?: PrepareHtmlOptions,
): Promise<string> {
	return sourceUrl ? prepareHtml(html, sourceUrl, options) : html
}
