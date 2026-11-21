import { memo, useEffect, useRef } from "react"
import { withDominoHiddenNodesRevealed } from "../scene/snapshotHelpers"
import { toAbsoluteSrcset, toAbsoluteUrl } from "../utils/url"

interface ImportedPhysicsCloneProps {
	sourceNode: HTMLElement
	sourceWindow: Window
	x: number
	y: number
	angle: number
	width: number
	height: number
	showDebug: boolean
}

const URL_ATTRS = new Set(["href", "src", "poster", "xlink:href"])

/**
 * Never recreated in the app document: scripts would execute (elements built
 * with createElement run when inserted, unlike innerHTML), and stylesheets
 * would apply the site's CSS to the whole app. Computed styles are inlined, so
 * dropping <style>/<link> loses nothing visually.
 */
const SKIPPED_TAGS = new Set(["script", "noscript", "template", "style", "link", "meta", "base"])

/**
 * Embedded browsing contexts and plugins: inside the sandboxed snapshot iframe
 * they can't run script, but a copy in the app document would load the third
 * party page unsandboxed. Keep their box, drop the content.
 */
const PLACEHOLDER_TAGS = new Set(["iframe", "frame", "frameset", "object", "embed", "portal"])

function copyMediaAttributes(sourceEl: Element, cloneEl: Element, baseUrl: string) {
	for (const attr of Array.from(sourceEl.attributes)) {
		if (attr.name === "style" || /^on/i.test(attr.name)) continue
		if (attr.name === "srcset") {
			cloneEl.setAttribute(attr.name, toAbsoluteSrcset(attr.value, baseUrl))
			continue
		}
		if (URL_ATTRS.has(attr.name)) {
			cloneEl.setAttribute(attr.name, toAbsoluteUrl(attr.value, baseUrl))
			continue
		}
		cloneEl.setAttribute(attr.name, attr.value)
	}
}

function computedStyleText(sourceWindow: Window, el: Element): string {
	// computed.cssText is unreliable/empty for getComputedStyle() on some elements.
	const computed = sourceWindow.getComputedStyle(el)
	return Array.from(computed)
		.map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
		.join("")
}

/**
 * Deep-clones `node` into `targetDocument`, inlining each element's computed
 * style so the copy renders like the original outside the source document.
 * Exported for tests; use via `ImportedPhysicsClone`.
 */
export function cloneWithInlineStyles(
	node: Node,
	sourceWindow: Window,
	targetDocument: Document,
): Node {
	if (node.nodeType === Node.TEXT_NODE) {
		return targetDocument.createTextNode(node.textContent ?? "")
	}

	if (node.nodeType !== Node.ELEMENT_NODE) {
		return targetDocument.createTextNode("")
	}

	const sourceEl = node as Element
	const localName = sourceEl.localName.toLowerCase()
	if (SKIPPED_TAGS.has(localName)) return targetDocument.createTextNode("")

	const baseUrl = sourceEl.baseURI || sourceWindow.location.href

	if (PLACEHOLDER_TAGS.has(localName)) {
		const placeholder = targetDocument.createElement("div")
		placeholder.setAttribute("style", computedStyleText(sourceWindow, sourceEl))
		// Embeds default to display:inline, which would ignore width/height on a div.
		if (placeholder.style.display === "inline") placeholder.style.display = "inline-block"
		placeholder.style.pointerEvents = "none"
		return placeholder
	}

	// Preserve SVG and other non-HTML element subtrees instead of dropping them.
	if (sourceEl.namespaceURI && sourceEl.namespaceURI !== "http://www.w3.org/1999/xhtml") {
		const cloneEl = targetDocument.createElementNS(sourceEl.namespaceURI, sourceEl.tagName)
		copyMediaAttributes(sourceEl, cloneEl, baseUrl)
		cloneEl.setAttribute("style", computedStyleText(sourceWindow, sourceEl))
		for (const child of Array.from(sourceEl.childNodes)) {
			cloneEl.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument))
		}
		return cloneEl
	}

	const htmlNode = sourceEl as HTMLElement
	// A <picture>'s <source>s would make the copy pick its own candidate again
	// (against the app viewport); once the page has chosen one, the cloned
	// <img> below is pinned to it instead.
	if (localName === "source" && sourceEl.parentElement?.localName === "picture") {
		const chosen = sourceEl.parentElement.querySelector("img")?.currentSrc
		if (chosen) return targetDocument.createTextNode("")
	}
	const clone = targetDocument.createElement(localName)
	copyMediaAttributes(sourceEl, clone, baseUrl)
	// Descendants keep their own computed margins, box-sizing and visibility —
	// only the clone root is normalized (see normalizeCloneRoot).
	clone.setAttribute("style", computedStyleText(sourceWindow, htmlNode))
	clone.style.pointerEvents = "none"

	if (localName === "img") {
		const imageNode = htmlNode as HTMLImageElement
		const cloneImg = clone as HTMLImageElement
		if (imageNode.currentSrc) {
			// Show exactly the candidate the page loaded (already in the cache):
			// srcset/sizes would be re-evaluated for the copy, and lazy loading
			// could leave an off-screen copy blank.
			cloneImg.removeAttribute("srcset")
			cloneImg.removeAttribute("sizes")
			cloneImg.removeAttribute("loading")
		}
		cloneImg.src = toAbsoluteUrl(
			imageNode.currentSrc || imageNode.getAttribute("src") || imageNode.src,
			baseUrl,
		)
		cloneImg.alt = imageNode.alt
	}
	if (localName === "input") {
		;(clone as HTMLInputElement).value = (htmlNode as HTMLInputElement).value
	}
	if (localName === "textarea") {
		;(clone as HTMLTextAreaElement).value = (htmlNode as HTMLTextAreaElement).value
	}
	if (localName === "canvas") {
		const dataUrl = (htmlNode as HTMLCanvasElement).toDataURL?.()
		if (dataUrl) {
			const img = targetDocument.createElement("img")
			img.src = dataUrl
			img.style.width = "100%"
			img.style.height = "100%"
			img.style.objectFit = "cover"
			return img
		}
	}

	const lightChildren = Array.from(htmlNode.childNodes)
	if (lightChildren.length > 0) {
		for (const child of lightChildren) {
			clone.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument))
		}
	} else {
		// Custom elements using Declarative Shadow DOM (e.g. <nyt-betamax>) have
		// their visual content in a shadow root — childNodes is empty after the
		// <template shadowrootmode> is consumed during parsing. Fall back to the
		// shadow root's children (non-visual nodes are skipped above).
		const shadowRoot = htmlNode.shadowRoot
		if (shadowRoot) {
			for (const child of Array.from(shadowRoot.childNodes)) {
				clone.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument))
			}
		}
	}
	return clone
}

/**
 * The wrapper is already placed at the element's on-screen box
 * (getBoundingClientRect includes transforms, offsets and margins), so any
 * positioning carried over in the root's computed style would apply twice —
 * e.g. `left:50%; transform:translateX(-50%)` or `position:absolute; top:30px`
 * pushed the copy out of its (overflow:hidden) wrapper, making it invisible.
 */
export function normalizeCloneRoot(root: HTMLElement | SVGElement) {
	const s = root.style
	s.position = "relative" // still a containing block for absolute descendants
	s.top = "auto"
	s.right = "auto"
	s.bottom = "auto"
	s.left = "auto"
	s.margin = "0"
	s.float = "none"
	s.transform = "none"
	s.translate = "none"
	s.rotate = "none"
	s.scale = "none"
	s.width = "100%"
	s.height = "100%"
	s.minWidth = "0"
	s.minHeight = "0"
	s.maxWidth = "none"
	s.maxHeight = "none"
	s.boxSizing = "border-box"
	s.overflow = "hidden"
	s.visibility = "visible"
}

/** Renders a deep-cloned copy of an iframe DOM node at physics-driven coordinates. */
export const ImportedPhysicsClone = memo(function ImportedPhysicsClone({
	sourceNode,
	sourceWindow,
	x,
	y,
	angle,
	width,
	height,
	showDebug,
}: ImportedPhysicsCloneProps) {
	const mountRef = useRef<HTMLDivElement | null>(null)

	// Re-clone when the source re-lays out to a new size (e.g. after web fonts
	// load) so the copy's inlined geometry matches the physics body.
	// biome-ignore lint/correctness/useExhaustiveDependencies: width/height trigger a re-clone.
	useEffect(() => {
		const mount = mountRef.current
		if (!mount) return
		mount.replaceChildren()

		// The original (and possibly hidden text inside it) is visibility:hidden
		// while its clone is live; read styles from the page as the site drew it.
		const clone = withDominoHiddenNodesRevealed(sourceNode.ownerDocument, () =>
			cloneWithInlineStyles(sourceNode, sourceWindow, mount.ownerDocument),
		)
		if (clone instanceof HTMLElement || clone instanceof SVGElement) normalizeCloneRoot(clone)
		mount.appendChild(clone)
	}, [sourceNode, sourceWindow, width, height])

	// Position with a compositor transform rather than left/top: this re-renders
	// every physics frame, and transforms skip layout.
	const transform = `translate3d(${x}px, ${y}px, 0)${angle !== 0 ? ` rotate(${angle}rad)` : ""}`

	return (
		<>
			<div
				role="button"
				aria-label={`Physics clone ${sourceNode.tagName.toLowerCase()}`}
				data-domino-physics-clone="true"
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width,
					height,
					transform,
					transformOrigin: "center center",
					willChange: "transform",
					zIndex: 20,
					pointerEvents: "none",
					overflow: "hidden",
					cursor: "grab",
				}}
			>
				<div ref={mountRef} style={{ width: "100%", height: "100%" }} />
			</div>
			{showDebug && (
				<div
					style={{
						position: "absolute",
						left: -1,
						top: -1,
						width: width + 2,
						height: height + 2,
						transform,
						transformOrigin: "center center",
						border: "2px dashed rgba(231,76,60,0.45)",
						backgroundColor: "rgba(231,76,60,0.04)",
						pointerEvents: "none",
						zIndex: 100,
						boxSizing: "border-box",
					}}
				/>
			)}
		</>
	)
})
