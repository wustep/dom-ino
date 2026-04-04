import type { SceneDescription, SceneElementType } from "../types"

// ─── URL fetching ───

/** Fetches a web page via the dev proxy, normalizing the URL and validating the response. */
export async function fetchPageHtml(url: string): Promise<{ html: string; url: string }> {
	let normalizedUrl = url.trim()
	if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
		normalizedUrl = `https://${normalizedUrl}`
	}
	try {
		const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(normalizedUrl)}`, {
			signal: AbortSignal.timeout(18000),
		})
		if (res.ok) {
			const text = await res.text()
			if (text.length > 100 && !text.startsWith('{"error'))
				return { html: text, url: normalizedUrl }
		}
	} catch (e) {
		console.warn("[DOMino] Proxy fetch failed, trying direct:", e)
	}
	try {
		const res = await fetch(normalizedUrl, {
			signal: AbortSignal.timeout(8000),
		})
		if (res.ok) return { html: await res.text(), url: normalizedUrl }
	} catch (e) {
		console.warn("[DOMino] Direct fetch also failed:", e)
	}
	throw new Error(`Could not fetch ${normalizedUrl}. Try pasting HTML directly instead.`)
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
