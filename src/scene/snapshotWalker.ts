import {
	getForceAutoSelectSelectors,
	isForcePretextNode,
	isPretextBlockEligible,
} from "./siteStyles"
import type { SnapshotCandidate, SnapshotTextBlock } from "./snapshotHelpers"
import {
	coerceForcedTextSceneElement,
	elementToSceneElement,
	getStableNodeId,
	hasSignificantMediaDescendants,
	isTextSceneElement,
	pickContentRoot,
	textOf,
} from "./snapshotHelpers"
import { toStageRect } from "./snapshotViewUtils"

export interface ScanResult {
	candidates: SnapshotCandidate[]
	textBlocks: SnapshotTextBlock[]
	textBodyBlocks: SnapshotTextBlock[]
	nodes: Map<string, HTMLElement>
	textNodes: Map<string, HTMLElement>
	bodyHeight: number
}

/** Pure DOM scanning: walks an iframe document tree to discover candidates, text blocks, and text body blocks. */
export function scanIframeDom(
	doc: Document,
	win: Window,
	iframeClientHeight: number,
	sourceUrl?: string,
	savedIds?: Set<string>,
): ScanResult {
	const root = pickContentRoot(doc)
	const viewportRect = new DOMRect(0, 0, 0, 0)
	const nodes = new Map<string, HTMLElement>()
	const textNodes = new Map<string, HTMLElement>()
	const candidates: SnapshotCandidate[] = []
	const textBlocks: SnapshotTextBlock[] = []
	const textBodyBlocks: SnapshotTextBlock[] = []
	const saved = savedIds ?? new Set<string>()

	let counter = 0

	const visitNode = (
		childEl: HTMLElement,
		depth: number,
		insideTextBlock: boolean,
		insideTextBodyBlock: boolean,
	) => {
		if (depth > 40) return
		const tag = childEl.tagName
		if (["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "HEAD", "TEMPLATE"].includes(tag)) return
		const role = childEl.getAttribute("role")
		if (role === "navigation" || role === "banner" || role === "complementary") return
		const cls = (childEl.className || "").toString().toLowerCase()
		const id = (childEl.id || "").toLowerCase()
		if (
			cls.includes("sidebar") ||
			cls.includes("navigation") ||
			cls.includes("interlanguage") ||
			id.includes("sidebar")
		)
			return

		let cs: CSSStyleDeclaration
		try {
			cs = win.getComputedStyle(childEl)
		} catch {
			return
		}
		if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity || "1") === 0)
			return
		if (cs.position === "fixed" || cs.position === "sticky") return

		const rect = childEl.getBoundingClientRect()
		if (rect.width < 12 || rect.height < 12) {
			walk(childEl, depth + 1, insideTextBlock, insideTextBodyBlock)
			return
		}
		if (rect.bottom < 0 || rect.right < 0 || rect.left > win.innerWidth) {
			walk(childEl, depth + 1, insideTextBlock, insideTextBodyBlock)
			return
		}

		const text = textOf(childEl)
		const display = cs.display || ""
		const inlineish = display === "inline" || display === "contents"
		const bg = cs.backgroundColor
		const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
		const hasBorder = parseFloat(cs.borderWidth || "0") > 0
		const hasShadow = cs.boxShadow && cs.boxShadow !== "none"
		const semantic =
			/^(BUTTON|A|IMG|PICTURE|VIDEO|SVG|INPUT|TEXTAREA|SELECT|H[1-6]|P|BLOCKQUOTE|FIGCAPTION|TABLE|FIGURE)$/.test(
				tag,
			)
		const mediaElement = /^(IMG|PICTURE|VIDEO|SVG|FIGURE)$/.test(tag)
		const sizableBlock = rect.width >= 48 && rect.height >= 24
		if (inlineish && !mediaElement && !hasBg && !hasBorder && !hasShadow) {
			walk(childEl, depth + 1, insideTextBlock, insideTextBodyBlock)
			return
		}
		if (!semantic && !hasBg && !hasBorder && !hasShadow && text.length < 12 && !sizableBlock) {
			walk(childEl, depth + 1, insideTextBlock, insideTextBodyBlock)
			return
		}

		const idRoot = root.contains(childEl) ? root : doc.body
		const dominoId = getStableNodeId(idRoot, childEl) || `snapshot-node-${counter++}`
		if (nodes.has(dominoId)) return
		childEl.dataset.dominoId = dominoId
		const baseSceneElement = elementToSceneElement(childEl, viewportRect, cs, rect, text)
		const sceneElement = coerceForcedTextSceneElement(
			childEl,
			baseSceneElement,
			isForcePretextNode(childEl, sourceUrl),
		)
		const textSceneElement = isTextSceneElement(sceneElement) ? sceneElement : null
		const hasMediaDescendants = hasSignificantMediaDescendants(childEl)
		nodes.set(dominoId, childEl)

		const isTextBodyBlock =
			textSceneElement !== null && text.length > 0 && (!hasMediaDescendants || tag === "FIGCAPTION")

		const isTextBlock =
			isTextBodyBlock && isPretextBlockEligible(childEl, textSceneElement, sourceUrl)

		if (isTextBlock && !insideTextBlock) {
			textNodes.set(dominoId, childEl)
			textBlocks.push({ id: dominoId, sceneElement: textSceneElement, node: childEl })
		}
		if (isTextBodyBlock && !insideTextBodyBlock) {
			if (!isTextBlock) textNodes.set(dominoId, childEl)
			textBodyBlocks.push({ id: dominoId, sceneElement: textSceneElement, node: childEl })
		}

		const stageRect = toStageRect(rect)
		candidates.push({
			id: dominoId,
			x: stageRect.x,
			y: stageRect.y,
			width: stageRect.width,
			height: stageRect.height,
			borderRadius: parseFloat(cs.borderRadius) || 0,
			saved: saved.has(dominoId),
			node: childEl,
			sceneElement,
			display,
		})

		walk(childEl, depth + 1, insideTextBlock || isTextBlock, insideTextBodyBlock || isTextBodyBlock)
	}

	const walk = (
		el: HTMLElement,
		depth: number,
		insideTextBlock: boolean,
		insideTextBodyBlock: boolean,
	) => {
		if (depth > 40) return
		for (let i = 0; i < el.children.length; i++) {
			const child = el.children[i]
			if (child.nodeType !== Node.ELEMENT_NODE) continue
			visitNode(child as HTMLElement, depth, insideTextBlock, insideTextBodyBlock)
		}
	}

	walk(root, 0, false, false)
	for (const selector of getForceAutoSelectSelectors(sourceUrl)) {
		for (const node of doc.querySelectorAll(selector)) {
			if (node.nodeType !== Node.ELEMENT_NODE) continue
			if (root.contains(node)) continue
			visitNode(node as HTMLElement, 0, false, false)
		}
	}

	const bodyH = Math.max(
		doc.body.scrollHeight,
		doc.documentElement?.scrollHeight || 0,
		iframeClientHeight,
	)

	return {
		candidates,
		textBlocks,
		textBodyBlocks,
		nodes,
		textNodes,
		bodyHeight: Math.max(800, bodyH),
	}
}
