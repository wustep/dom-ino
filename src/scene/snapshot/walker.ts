import type { SceneDescription, SceneElement, SceneElementType } from "../types"

let snapshotCounter = 0

// ─── Iframe render + walk ───

/** Delay (ms) between each render attempt to let images/fonts/CSS settle */
const IFRAME_RENDER_DELAY_MS = 500
/** How many times to retry if the DOM walk finds <3 elements */
const IFRAME_RENDER_RETRIES = 3
/** Hard timeout (ms) before giving up on the iframe entirely */
const IFRAME_RENDER_TIMEOUT_MS = 10000

/** Renders HTML in a hidden iframe and walks the live DOM to extract SceneElements. */
export function renderAndWalk(
	html: string,
	containerWidth: number,
	sceneName: string,
): Promise<SceneDescription | null> {
	const removeIframe = (iframe: HTMLIFrameElement) => {
		if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
	}

	return new Promise((resolve) => {
		const iframe = document.createElement("iframe")
		iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${containerWidth}px;height:6000px;border:none;visibility:hidden;pointer-events:none;`
		// Only allow-same-origin (no scripts since we stripped them)
		iframe.sandbox.add("allow-same-origin")
		iframe.srcdoc = html

		const timeout = setTimeout(() => {
			removeIframe(iframe)
			resolve(null)
		}, IFRAME_RENDER_TIMEOUT_MS)

		iframe.onload = () => {
			// CSS is inlined so it applies immediately; small wait for images
			const attempt = (retries: number) => {
				setTimeout(() => {
					try {
						const doc = iframe.contentDocument
						const win = iframe.contentWindow
						if (!doc?.body || !win) {
							clearTimeout(timeout)
							removeIframe(iframe)
							resolve(null)
							return
						}

						const elements: SceneElement[] = []
						const bodyRect = doc.body.getBoundingClientRect()
						walkElement(doc.body, elements, bodyRect, 0, win)

						if (elements.length < 3 && retries > 0) {
							attempt(retries - 1)
							return
						}

						const maxY = elements.reduce((m, el) => Math.max(m, el.rect.y + el.rect.height), 600)

						let bgColor = "#ffffff"
						try {
							const bodyBg = parseColor(win.getComputedStyle(doc.body).backgroundColor)
							const htmlBg = parseColor(win.getComputedStyle(doc.documentElement).backgroundColor)
							if (bodyBg) bgColor = bodyBg
							else if (htmlBg) bgColor = htmlBg
						} catch {
							/* */
						}

						clearTimeout(timeout)
						removeIframe(iframe)

						resolve(
							elements.length >= 3
								? {
										id: `snapshot-${Date.now()}`,
										name: sceneName,
										width: containerWidth,
										height: Math.max(maxY + 100, 800),
										backgroundColor: bgColor,
										elements,
									}
								: null,
						)
					} catch {
						if (retries > 0) {
							attempt(retries - 1)
							return
						}
						clearTimeout(timeout)
						removeIframe(iframe)
						resolve(null)
					}
				}, IFRAME_RENDER_DELAY_MS)
			}

			attempt(IFRAME_RENDER_RETRIES)
		}

		iframe.onerror = () => {
			clearTimeout(timeout)
			removeIframe(iframe)
			resolve(null)
		}

		document.body.appendChild(iframe)
	})
}

// ─── DOM walker ───

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

function inferElementType(el: HTMLElement, cs: CSSStyleDeclaration): SceneElementType {
	const tag = el.tagName
	if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE") {
		const text = el.textContent?.trim() ?? ""
		const bg = cs.backgroundColor
		const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
		const hasBoxShadow = cs.boxShadow && cs.boxShadow !== "none"
		const hasBorder = cs.borderWidth && parseFloat(cs.borderWidth) > 0
		const isSmall = el.offsetWidth < 300 && el.offsetHeight < 200
		if (isSmall && text.length < 50 && text.length > 0 && (hasBg || hasBoxShadow || hasBorder))
			return "badge"
		if ((hasBg || hasBoxShadow || hasBorder) && el.children.length <= 6) return "card"
	}
	if (tag === "A") {
		if (cs.display === "inline-block" || cs.display === "flex" || cs.display === "inline-flex")
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

function walkElement(
	el: HTMLElement,
	out: SceneElement[],
	rootRect: DOMRect,
	depth: number,
	win: Window,
) {
	if (depth > 20) return
	const children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
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
			tag === "TEMPLATE" ||
			tag === "NAV" ||
			tag === "FOOTER"
		)
			continue
		// Skip sidebar, navigation, and other non-content elements by role/class/id
		const role = child.getAttribute("role")
		if (role === "navigation" || role === "banner" || role === "complementary") continue
		const elId = child.id?.toLowerCase() || ""
		const elCls = (child.className?.toString() || "").toLowerCase()
		if (
			elId.includes("sidebar") ||
			elId.includes("footer") ||
			elId.includes("cookie") ||
			elId.includes("modal") ||
			elCls.includes("sidebar") ||
			elCls.includes("footer") ||
			elCls.includes("cookie") ||
			elCls.includes("modal") ||
			elCls.includes("nav-") ||
			elCls.includes("navigation") ||
			elCls.includes("interlanguage")
		)
			continue
		let cs: CSSStyleDeclaration
		try {
			cs = win.getComputedStyle(child)
		} catch {
			continue
		}
		if (cs.display === "none" || cs.visibility === "hidden" || parsePx(cs.opacity) === 0) continue
		// Skip fixed/sticky positioned elements (headers, banners)
		if (cs.position === "fixed" || cs.position === "sticky") continue
		const rect = child.getBoundingClientRect()
		const x = rect.left - rootRect.left,
			y = rect.top - rootRect.top,
			w = rect.width,
			h = rect.height
		if (w < 1 || h < 1) {
			walkElement(child, out, rootRect, depth + 1, win)
			continue
		}
		if (x + w < -100 || y + h < -100 || x > rootRect.width + 200) continue
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
		const displayText = directText || (child.children.length === 0 ? fullText : "")
		if (!displayText && type !== "image" && type !== "input") {
			if (child.children.length > 0) walkElement(child, out, rootRect, depth + 1, win)
			continue
		}
		const fontSize = parsePx(cs.fontSize) || 16
		const fontWeight = parseInt(cs.fontWeight, 10) || 400
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
