import type { SceneDescription, SceneElement, SceneElementType } from "./types"

let snapshotCounter = 0

const TAG_TYPE_MAP: Record<string, SceneElementType> = {
	H1: "heading",
	H2: "heading",
	H3: "heading",
	H4: "heading",
	H5: "heading",
	H6: "heading",
	P: "paragraph",
	SPAN: "paragraph",
	BLOCKQUOTE: "paragraph",
	LI: "paragraph",
	BUTTON: "button",
	A: "link",
	IMG: "image",
	INPUT: "input",
	TEXTAREA: "input",
	SELECT: "input",
	HR: "divider",
	UL: "list",
	OL: "list",
	NAV: "container",
	HEADER: "container",
	FOOTER: "container",
	MAIN: "container",
	SECTION: "container",
	ARTICLE: "container",
	ASIDE: "container",
	DIV: "container",
	FORM: "container",
}

function inferElementType(
	el: HTMLElement,
	cs: CSSStyleDeclaration
): SceneElementType {
	const tag = el.tagName
	if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE") {
		const text = el.textContent?.trim() ?? ""
		const bg = cs.backgroundColor
		const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
		const hasBoxShadow = cs.boxShadow && cs.boxShadow !== "none"
		const hasBorder = cs.borderWidth && parseFloat(cs.borderWidth) > 0
		const isSmall = el.offsetWidth < 300 && el.offsetHeight < 200
		if (
			isSmall &&
			text.length < 50 &&
			text.length > 0 &&
			(hasBg || hasBoxShadow || hasBorder)
		)
			return "badge"
		if ((hasBg || hasBoxShadow || hasBorder) && el.children.length <= 6)
			return "card"
	}
	if (tag === "A") {
		if (
			cs.display === "inline-block" ||
			cs.display === "flex" ||
			cs.display === "inline-flex"
		)
			return "button"
		return "link"
	}
	return TAG_TYPE_MAP[tag] ?? "container"
}

function parseColor(raw: string): string {
	if (!raw || raw === "transparent" || raw === "rgba(0, 0, 0, 0)") return ""
	return raw
}
function parsePx(raw: string): number {
	return parseFloat(raw) || 0
}
function getDirectTextContent(el: HTMLElement): string {
	let text = ""
	for (const node of el.childNodes) {
		if (node.nodeType === Node.TEXT_NODE) text += node.textContent
	}
	return text.trim()
}

/**
 * Injects a <base> tag into the HTML so relative stylesheet/image URLs
 * resolve against the original page's origin.
 */
function injectBaseTag(html: string, sourceUrl?: string): string {
	if (!sourceUrl) return html
	try {
		const url = new URL(sourceUrl)
		const base = `<base href="${url.origin}/">`
		// Insert after <head> if present
		if (/<head[^>]*>/i.test(html)) {
			return html.replace(/<head[^>]*>/i, (m) => m + base)
		}
		// Otherwise prepend
		return base + html
	} catch {
		return html
	}
}

export async function snapshotHtmlToScene(
	html: string,
	containerWidth: number = 1200,
	sceneName: string = "Custom Page",
	sourceUrl?: string
): Promise<SceneDescription> {
	return new Promise((resolve) => {
		const iframe = document.createElement("iframe")
		iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${containerWidth}px;height:3000px;border:none;visibility:hidden;pointer-events:none;`
		// allow-same-origin so we can read the DOM; allow-scripts for JS-dependent layouts
		iframe.sandbox.add("allow-same-origin")
		iframe.srcdoc = injectBaseTag(html, sourceUrl)

		iframe.onload = () => {
			// Longer wait for external stylesheets to load
			setTimeout(() => {
				try {
					const doc = iframe.contentDocument
					const win = doc?.defaultView
					if (!doc || !doc.body || !win) {
						resolve(makeFallbackScene(html, containerWidth, sceneName))
						document.body.removeChild(iframe)
						return
					}

					const elements: SceneElement[] = []
					const bodyRect = doc.body.getBoundingClientRect()
					walkElement(doc.body, elements, bodyRect, 0, win)

					const maxY = elements.reduce(
						(m, el) => Math.max(m, el.rect.y + el.rect.height),
						600
					)
					const bodyCs = win.getComputedStyle(doc.body)
					const bgColor = parseColor(bodyCs.backgroundColor) || "#ffffff"

					document.body.removeChild(iframe)

					if (elements.length === 0) {
						resolve(makeFallbackScene(html, containerWidth, sceneName))
						return
					}

					resolve({
						id: `snapshot-${Date.now()}`,
						name: sceneName,
						width: containerWidth,
						height: Math.max(maxY + 100, 800),
						backgroundColor: bgColor,
						elements,
					})
				} catch {
					document.body.removeChild(iframe)
					resolve(makeFallbackScene(html, containerWidth, sceneName))
				}
			}, 1000)
		}

		iframe.onerror = () => {
			document.body.removeChild(iframe)
			resolve(makeFallbackScene(html, containerWidth, sceneName))
		}

		document.body.appendChild(iframe)
	})
}

function makeFallbackScene(
	html: string,
	width: number,
	name: string
): SceneDescription {
	const tmp = document.createElement("div")
	tmp.innerHTML = html
	const text =
		tmp.textContent?.trim().slice(0, 2000) || "Could not parse page content."
	return {
		id: `snapshot-${Date.now()}`,
		name,
		width,
		height: 800,
		backgroundColor: "#ffffff",
		elements: [
			{
				id: `snap-fallback-${snapshotCounter++}`,
				type: "paragraph",
				rect: { x: 40, y: 40, width: Math.min(width - 80, 700), height: 600 },
				throwable: false,
				pinned: true,
				text,
				fontSize: 16,
				fontWeight: 400,
				fontFamily: '"DM Sans", sans-serif',
				lineHeight: 26,
				color: "#333",
			},
		],
	}
}

export async function fetchPageHtml(
	url: string
): Promise<{ html: string; url: string }> {
	let normalizedUrl = url.trim()
	if (
		!normalizedUrl.startsWith("http://") &&
		!normalizedUrl.startsWith("https://")
	) {
		normalizedUrl = "https://" + normalizedUrl
	}

	try {
		const res = await fetch(
			`/api/fetch-page?url=${encodeURIComponent(normalizedUrl)}`,
			{ signal: AbortSignal.timeout(18000) }
		)
		if (res.ok) {
			const text = await res.text()
			if (text.length > 100 && !text.startsWith('{"error'))
				return { html: text, url: normalizedUrl }
		}
	} catch {
		/* try fallback */
	}

	try {
		const res = await fetch(normalizedUrl, {
			signal: AbortSignal.timeout(8000),
		})
		if (res.ok) return { html: await res.text(), url: normalizedUrl }
	} catch {
		/* fall through */
	}

	throw new Error(
		`Could not fetch ${normalizedUrl}. Try pasting HTML directly instead.`
	)
}

function walkElement(
	el: HTMLElement,
	out: SceneElement[],
	rootRect: DOMRect,
	depth: number,
	win: Window
) {
	if (depth > 12) return
	const children = Array.from(el.children).filter(
		(c): c is HTMLElement => c instanceof HTMLElement
	)
	for (const child of children) {
		const tag = child.tagName
		if (
			tag === "SCRIPT" ||
			tag === "STYLE" ||
			tag === "NOSCRIPT" ||
			tag === "SVG" ||
			tag === "LINK" ||
			tag === "META" ||
			tag === "HEAD" ||
			tag === "TEMPLATE"
		)
			continue
		const cs = win.getComputedStyle(child)
		if (
			cs.display === "none" ||
			cs.visibility === "hidden" ||
			parsePx(cs.opacity) === 0
		)
			continue
		const rect = child.getBoundingClientRect()
		const x = rect.left - rootRect.left,
			y = rect.top - rootRect.top,
			w = rect.width,
			h = rect.height
		if (w < 4 || h < 4) {
			walkElement(child, out, rootRect, depth + 1, win)
			continue
		}
		// Skip elements positioned far offscreen
		if (x + w < -100 || y + h < -100 || x > rootRect.width + 100) continue
		const type = inferElementType(child, cs)
		const id = `snap-${snapshotCounter++}`
		if (type === "container" && child.children.length > 0) {
			const bg = parseColor(cs.backgroundColor)
			const hasBorder = parsePx(cs.borderWidth) > 0
			const hasBoxShadow = cs.boxShadow && cs.boxShadow !== "none"
			if (bg || hasBorder || hasBoxShadow) {
				out.push({
					id,
					type: "card",
					rect: { x, y, width: w, height: h },
					throwable: false,
					pinned: true,
					backgroundColor: bg || undefined,
					borderRadius: parsePx(cs.borderRadius),
					border: hasBorder ? cs.border : undefined,
					boxShadow: hasBoxShadow ? cs.boxShadow : undefined,
					padding: parsePx(cs.padding),
				})
			}
			walkElement(child, out, rootRect, depth + 1, win)
			continue
		}
		if (type === "list") {
			walkElement(child, out, rootRect, depth + 1, win)
			continue
		}
		const directText = getDirectTextContent(child)
		const fullText = (child.textContent ?? "").trim()
		const displayText =
			directText || (child.children.length === 0 ? fullText : "")
		// Skip elements with no meaningful text (likely decorative or structural)
		if (!displayText && type !== "image" && type !== "input") {
			if (child.children.length > 0)
				walkElement(child, out, rootRect, depth + 1, win)
			continue
		}
		const fontSize = parsePx(cs.fontSize) || 16
		const fontWeight = parseInt(cs.fontWeight) || 400
		const fontFamily = cs.fontFamily || "sans-serif"
		const lineHeight = parsePx(cs.lineHeight) || fontSize * 1.5
		const element: SceneElement = {
			id,
			type,
			rect: { x, y, width: w, height: h },
			throwable: false,
			pinned: true,
			text: displayText || undefined,
			fontSize,
			fontWeight,
			fontFamily,
			lineHeight: Math.round(lineHeight),
			color: parseColor(cs.color) || "#333",
			backgroundColor: parseColor(cs.backgroundColor) || undefined,
			borderRadius: parsePx(cs.borderRadius),
			padding: parsePx(cs.padding),
			border: parsePx(cs.borderWidth) > 0 ? cs.border : undefined,
			boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : undefined,
			mass: 1,
		}
		if (type === "image" || tag === "IMG") {
			element.type = "image"
			element.imageSrc = (child as HTMLImageElement).src
			element.imageAlt = (child as HTMLImageElement).alt
		}
		out.push(element)
		if (type === "card" && child.children.length > 0) {
			const childElements: SceneElement[] = []
			walkElement(child, childElements, rootRect, depth + 1, win)
			element.children = childElements.map((ce) => ({
				...ce,
				rect: { ...ce.rect, x: ce.rect.x - x, y: ce.rect.y - y },
			}))
		}
	}
}

export function autoSelectThrowables(
	scene: SceneDescription
): SceneDescription {
	const throwableTypes: SceneElementType[] = [
		"button",
		"badge",
		"card",
		"image",
		"link",
	]
	return {
		...scene,
		elements: scene.elements.map((el) =>
			throwableTypes.includes(el.type) &&
			el.rect.width < 500 &&
			el.rect.height < 400
				? { ...el, throwable: true, pinned: false }
				: el
		),
	}
}
