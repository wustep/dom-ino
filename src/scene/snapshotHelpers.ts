import type { SceneElement } from "../scene/types"
import type { ViewportRectLike } from "./snapshotViewUtils"

// ── Types ──

export type SnapshotCandidate = {
	id: string
	x: number
	y: number
	width: number
	height: number
	borderRadius?: number
	saved: boolean
	node: HTMLElement
	sceneElement: SceneElement | null
	display: string
}

export type SnapshotTextBlock = {
	id: string
	sceneElement: SceneElement
	node: HTMLElement
}

export type RevealedVisibilityNode = {
	node: HTMLElement
	original: string
}

// ── Constants ──

export const INLINE_TAGS = new Set([
	"SPAN",
	"EM",
	"STRONG",
	"B",
	"I",
	"A",
	"SMALL",
	"SUB",
	"SUP",
	"MARK",
	"ABBR",
	"CODE",
	"TIME",
	"BR",
	"WBR",
	"S",
	"U",
	"Q",
	"CITE",
	"DFN",
	"KBD",
	"SAMP",
	"VAR",
	"DATA",
	"INS",
	"DEL",
])

// ── Pure helpers ──

export function isTextSceneElement(
	sceneElement: SceneElement | null,
): sceneElement is SceneElement & { type: "paragraph" | "heading" } {
	return sceneElement?.type === "paragraph" || sceneElement?.type === "heading"
}

export function coerceForcedTextSceneElement(
	node: HTMLElement,
	sceneElement: SceneElement | null,
	forceText: boolean,
): SceneElement | null {
	if (!sceneElement || !forceText || isTextSceneElement(sceneElement)) {
		return sceneElement
	}

	return {
		...sceneElement,
		type: /^H[1-6]$/.test(node.tagName) ? "heading" : "paragraph",
	}
}

export function getStableNodeId(root: HTMLElement, node: HTMLElement): string {
	const existing = node.dataset.dominoId
	if (existing) return existing
	if (node.id) return `id:${node.id}`
	const parts: string[] = []
	let current: HTMLElement | null = node
	while (current && current !== root) {
		const parent: HTMLElement | null = current.parentElement
		const tag = current.tagName.toLowerCase()
		if (!parent) {
			parts.push(tag)
			break
		}
		const siblings = (Array.from(parent.children) as HTMLElement[]).filter(
			(el) => el.tagName === current!.tagName,
		)
		const index = siblings.indexOf(current)
		parts.push(`${tag}:${index}`)
		current = parent
	}
	return `path:${parts.reverse().join("/")}`
}

function collectText(node: Node, out: string[]): void {
	if (node.nodeType === Node.TEXT_NODE) {
		out.push(node.textContent ?? "")
	} else if (node.nodeType === Node.ELEMENT_NODE) {
		const tag = (node as HTMLElement).tagName
		// Skip style/script/noscript — sites like Wikipedia embed <style> blocks
		// directly inside content divs (TemplateStyles), and their CSS text must
		// not leak into the Pretext-rendered text.
		if (tag === "STYLE" || tag === "SCRIPT" || tag === "NOSCRIPT") return
		for (const child of Array.from(node.childNodes)) {
			collectText(child, out)
		}
	}
}

export function textOf(el: HTMLElement): string {
	const parts: string[] = []
	collectText(el, parts)
	return parts.join("").replace(/\s+/g, " ").trim()
}

// ── Inline style runs ──

export type InlineStyleRun = {
	start: number
	end: number
	fontWeight?: number
	fontStyle?: string
	fontFamily?: string
	color?: string
	textDecoration?: string
}

/**
 * Walk an element's DOM tree and extract styled runs that differ from the
 * element's own computed style. Returns runs keyed by character offset in the
 * normalized plain-text (same string that `textOf()` produces).
 */
export function extractInlineStyles(el: HTMLElement, win: Window): InlineStyleRun[] {
	const baseCs = win.getComputedStyle(el)
	const baseWeight = parseInt(baseCs.fontWeight, 10) || 400
	const baseStyle = baseCs.fontStyle || "normal"
	const baseFamily = baseCs.fontFamily || ""
	const baseColor = baseCs.color || ""
	const baseDecoration = baseCs.textDecorationLine || baseCs.textDecoration || "none"

	const runs: InlineStyleRun[] = []
	let offset = 0
	// Track whether the previous character was whitespace, so we can collapse
	// runs of whitespace the same way textOf()'s .replace(/\s+/g, " ") does.
	let prevWasSpace = true // true to trim leading whitespace

	function walkNode(node: Node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const raw = node.textContent ?? ""
			// Replicate the whitespace normalization of textOf():
			// collapse runs of whitespace to single spaces, trim leading/trailing.
			for (const ch of raw) {
				if (/\s/.test(ch)) {
					if (!prevWasSpace) {
						offset++
						prevWasSpace = true
					}
				} else {
					offset++
					prevWasSpace = false
				}
			}
			return
		}
		if (node.nodeType !== Node.ELEMENT_NODE) return
		const childEl = node as HTMLElement
		if (childEl.tagName === "BR" || childEl.tagName === "WBR") return

		let cs: CSSStyleDeclaration
		try {
			cs = win.getComputedStyle(childEl)
		} catch {
			return
		}

		// Hidden elements: still advance offset (textOf includes their text
		// via textContent) but don't emit style runs.
		if (cs.display === "none" || cs.visibility === "hidden") {
			for (const child of Array.from(childEl.childNodes)) {
				walkNode(child)
			}
			return
		}

		const weight = parseInt(cs.fontWeight, 10) || 400
		const style = cs.fontStyle || "normal"
		const family = cs.fontFamily || ""
		const color = cs.color || ""
		const decoration = cs.textDecorationLine || cs.textDecoration || "none"

		const differs =
			weight !== baseWeight ||
			style !== baseStyle ||
			family !== baseFamily ||
			color !== baseColor ||
			(decoration !== baseDecoration && decoration !== "none")

		const startOffset = offset
		for (const child of Array.from(childEl.childNodes)) {
			walkNode(child)
		}
		const endOffset = offset

		if (differs && endOffset > startOffset) {
			const run: InlineStyleRun = { start: startOffset, end: endOffset }
			if (weight !== baseWeight) run.fontWeight = weight
			if (style !== baseStyle) run.fontStyle = style
			if (family !== baseFamily) run.fontFamily = family
			if (color !== baseColor) run.color = color
			if (decoration !== baseDecoration && decoration !== "none") run.textDecoration = decoration
			runs.push(run)
		}
	}

	for (const child of Array.from(el.childNodes)) {
		walkNode(child)
	}

	// Trim trailing space offset (matches textOf's .trim())
	return runs
}

export function revealHiddenAncestors(sourceNode: HTMLElement): RevealedVisibilityNode[] {
	const hiddenNodes: RevealedVisibilityNode[] = []
	let current: HTMLElement | null = sourceNode

	while (current) {
		if (current.style.visibility === "hidden") {
			hiddenNodes.push({ node: current, original: current.style.visibility })
			current.style.visibility = "visible"
		}
		current = current.parentElement
	}

	return hiddenNodes
}

export function restoreRevealedAncestors(hiddenNodes: RevealedVisibilityNode[]) {
	for (const { node, original } of hiddenNodes) {
		node.style.visibility = original
	}
}

export function hasSignificantMediaDescendants(el: HTMLElement): boolean {
	const mediaNodes = Array.from(
		el.querySelectorAll("img, picture, video, svg, canvas"),
	) as HTMLElement[]

	return mediaNodes.some((mediaNode) => {
		const mediaRect = mediaNode.getBoundingClientRect()
		return mediaRect.width > 48 || mediaRect.height > 48
	})
}

export function inferSnapshotElementType(
	el: HTMLElement,
	cs: CSSStyleDeclaration,
	text: string,
	rect: DOMRect,
): SceneElement["type"] {
	const tag = el.tagName
	if (/^H[1-6]$/.test(tag)) return "heading"
	if (
		tag === "P" ||
		tag === "BLOCKQUOTE" ||
		tag === "FIGCAPTION" ||
		tag === "LI" ||
		tag === "DD" ||
		tag === "DT" ||
		tag === "TD" ||
		tag === "TH" ||
		tag === "CAPTION" ||
		tag === "PRE" ||
		tag === "ADDRESS" ||
		tag === "LABEL"
	)
		return "paragraph"
	if (tag === "BUTTON") return "button"
	if (tag === "A") return cs.display === "inline" ? "link" : "button"
	if (tag === "IMG" || tag === "PICTURE" || tag === "VIDEO" || tag === "SVG") return "image"
	// FIGURE elements that contain images/videos are images
	if (tag === "FIGURE") {
		if (el.querySelector("img, picture, video, svg")) return "image"
		// Custom element video players (e.g. nyt-betamax) host their <video> in a
		// shadow root — querySelector above won't find it, so check shadow roots too.
		for (const child of Array.from(el.querySelectorAll("*"))) {
			if ((child as HTMLElement).shadowRoot?.querySelector("video")) return "image"
		}
	}
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return "input"
	// Divs/sections that contain an image as primary content
	if ((tag === "DIV" || tag === "SECTION" || tag === "ARTICLE") && el.children.length <= 3) {
		const img = el.querySelector("img, picture, video")
		if (img && img instanceof HTMLElement) {
			const imgRect = img.getBoundingClientRect()
			// If the image fills most of the container, treat the container as an image
			if (imgRect.width > rect.width * 0.6 && imgRect.height > rect.height * 0.4) return "image"
		}
		// Also check shadow DOM of custom element children (e.g. web component video players)
		if (!img) {
			for (const child of Array.from(el.querySelectorAll("*"))) {
				const shadowVideo = (child as HTMLElement).shadowRoot?.querySelector("video")
				if (shadowVideo instanceof HTMLElement) {
					const videoRect = shadowVideo.getBoundingClientRect()
					if (videoRect.width > rect.width * 0.5 && videoRect.height > rect.height * 0.4)
						return "image"
				}
			}
		}
	}
	// Generic elements (div, span, section, etc.) that are primarily text containers
	// — all children are inline elements and there is meaningful text content
	if (text.length > 20) {
		const children = Array.from(el.children)
		const allInline = children.length === 0 || children.every((c) => INLINE_TAGS.has(c.tagName))
		if (allInline) return "paragraph"
	}
	const bg = cs.backgroundColor
	const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
	const hasBorder = parseFloat(cs.borderWidth || "0") > 0
	const hasShadow = cs.boxShadow && cs.boxShadow !== "none"
	const shortText = text.length > 0 && text.length < 40
	const small = el.offsetWidth < 300 && el.offsetHeight < 120
	if (shortText && small && (hasBg || hasBorder || hasShadow)) return "badge"
	if (hasBg || hasBorder || hasShadow) return "card"
	return "container"
}

export function getResolvedImageSrc(el: HTMLImageElement): string | undefined {
	const raw = el.currentSrc || el.getAttribute("src") || el.src
	if (!raw) return undefined
	try {
		return new URL(raw, el.baseURI).href
	} catch {
		return raw
	}
}

export function elementToSceneElement(
	el: HTMLElement,
	rootRect: ViewportRectLike,
	cs: CSSStyleDeclaration,
	rect: DOMRect,
	text: string,
): SceneElement | null {
	if (rect.width < 4 || rect.height < 4) return null
	const type = inferSnapshotElementType(el, cs, text, rect)
	return {
		id: el.dataset.dominoId || `snapshot-${Math.random().toString(36).slice(2, 8)}`,
		type,
		rect: {
			x: rect.left - rootRect.left,
			y: rect.top - rootRect.top,
			width: rect.width,
			height: rect.height,
		},
		throwable: true,
		pinned: false,
		text: text || undefined,
		fontSize: parseFloat(cs.fontSize) || 16,
		fontWeight: parseInt(cs.fontWeight, 10) || 400,
		fontStyle: (cs.fontStyle as SceneElement["fontStyle"]) || "normal",
		fontFamily: cs.fontFamily || '"DM Sans", sans-serif',
		lineHeight: parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 16) * 1.5,
		color: cs.color || "#333",
		letterSpacing: cs.letterSpacing && cs.letterSpacing !== "normal" ? cs.letterSpacing : undefined,
		textAlign:
			cs.textAlign && cs.textAlign !== "start" && cs.textAlign !== "left"
				? cs.textAlign
				: undefined,
		backgroundColor:
			cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)"
				? cs.backgroundColor
				: undefined,
		borderRadius: parseFloat(cs.borderRadius) || 0,
		padding: parseFloat(cs.paddingLeft) || 0,
		paddingVertical: parseFloat(cs.paddingTop) || 0,
		border: parseFloat(cs.borderWidth) > 0 ? cs.border : undefined,
		boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : undefined,
		imageSrc: (() => {
			if (el.tagName === "IMG") return getResolvedImageSrc(el as HTMLImageElement)
			// For figure/picture/div containers, find the inner img
			const innerImg = el.querySelector("img") as HTMLImageElement | null
			if (innerImg) return getResolvedImageSrc(innerImg)
			return undefined
		})(),
		imageAlt: (() => {
			if (el.tagName === "IMG") return (el as HTMLImageElement).alt
			const innerImg = el.querySelector("img") as HTMLImageElement | null
			return innerImg?.alt
		})(),
		mass: 1,
	}
}

export function isStaticTextFlowObstacleCandidate(
	candidate: SnapshotCandidate,
	sourceWindow: Window | null,
): boolean {
	if (!candidate.sceneElement || isTextSceneElement(candidate.sceneElement)) {
		return false
	}
	if (candidate.display === "inline" || candidate.display === "contents") {
		return false
	}
	if (candidate.width < 60 || candidate.height < 24) {
		return false
	}

	const cls = (candidate.node.className || "").toString().toLowerCase()
	const id = (candidate.node.id || "").toLowerCase()
	const tag = candidate.node.tagName
	const looksLikeMediaAnchor =
		candidate.sceneElement.type === "image" ||
		tag === "FIGURE" ||
		tag === "TABLE" ||
		tag === "TBODY" ||
		tag === "THEAD"
	const looksLikeLayoutAnchor =
		cls.includes("infobox") ||
		cls.includes("thumb") ||
		cls.includes("gallery") ||
		cls.includes("trow") ||
		id.includes("infobox")

	let isFloatAnchor = false
	try {
		if (sourceWindow) {
			const cs = sourceWindow.getComputedStyle(candidate.node)
			isFloatAnchor = cs.float === "left" || cs.float === "right"
		}
	} catch {
		// Ignore style lookup failures inside the sandboxed iframe.
	}

	return looksLikeMediaAnchor || looksLikeLayoutAnchor || isFloatAnchor
}

export function pickContentRoot(doc: Document): HTMLElement {
	const selectors = [
		"main article",
		"main",
		"article",
		"#mw-content-text .mw-parser-output",
		"#mw-content-text",
		".mw-body-content",
		"#content",
		"[role='main']",
		"#__next main",
		"#__next",
		"#root main",
		"#root",
		"body",
	]
	for (const selector of selectors) {
		const node = doc.querySelector(selector)
		if (node instanceof HTMLElement) return node
	}
	return doc.body as HTMLElement
}

export function syncHiddenNodes(
	hiddenNodes: Map<HTMLElement, string>,
	desiredNodes: Iterable<HTMLElement>,
) {
	const desired = new Set(desiredNodes)

	for (const [node, originalVisibility] of Array.from(hiddenNodes.entries())) {
		if (desired.has(node)) continue
		node.style.visibility = originalVisibility
		hiddenNodes.delete(node)
	}

	for (const node of desired) {
		if (hiddenNodes.has(node)) continue
		hiddenNodes.set(node, node.style.visibility || "")
		node.style.visibility = "hidden"
	}
}

export function restoreHiddenNodes(hiddenNodes: Map<HTMLElement, string>) {
	for (const [node, originalVisibility] of Array.from(hiddenNodes.entries())) {
		node.style.visibility = originalVisibility
	}
	hiddenNodes.clear()
}
