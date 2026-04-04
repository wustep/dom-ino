import { useEffect, useRef } from "react"
import { toAbsoluteSrcset, toAbsoluteUrl } from "../utils/url"
import { restoreRevealedAncestors, revealHiddenAncestors } from "./snapshotHelpers"

interface ImportedPhysicsCloneProps {
	sourceNode: HTMLElement
	sourceWindow: Window
	x: number
	y: number
	angle: number
	width: number
	height: number
	showDebug: boolean
	renderVersion?: number | string | boolean
}

const URL_ATTRS = new Set(["href", "src", "poster", "xlink:href"])

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

function cloneWithInlineStyles(node: Node, sourceWindow: Window, targetDocument: Document): Node {
	if (node.nodeType === Node.TEXT_NODE) {
		return targetDocument.createTextNode(node.textContent ?? "")
	}

	if (node.nodeType !== Node.ELEMENT_NODE) {
		return targetDocument.createTextNode("")
	}

	const sourceEl = node as Element

	// Preserve SVG and other non-HTML element subtrees instead of dropping them.
	if (sourceEl.namespaceURI && sourceEl.namespaceURI !== "http://www.w3.org/1999/xhtml") {
		const cloneEl = targetDocument.createElementNS(sourceEl.namespaceURI, sourceEl.tagName)
		copyMediaAttributes(sourceEl, cloneEl, sourceEl.baseURI || sourceWindow.location.href)
		const computed = sourceWindow.getComputedStyle(sourceEl)
		const styleText = Array.from(computed)
			.map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
			.join("")
		cloneEl.setAttribute("style", styleText)
		for (const child of Array.from(sourceEl.childNodes)) {
			cloneEl.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument))
		}
		return cloneEl
	}

	const htmlNode = sourceEl as HTMLElement
	const tagName = htmlNode.tagName.toLowerCase()
	const clone = targetDocument.createElement(tagName)
	const baseUrl = sourceEl.baseURI || sourceWindow.location.href
	const computed = sourceWindow.getComputedStyle(htmlNode)
	copyMediaAttributes(sourceEl, clone, baseUrl)
	// Build an explicit inline style string from computed properties.
	// computed.cssText is unreliable/empty for getComputedStyle() on some elements.
	const styleText = Array.from(computed)
		.map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
		.join("")
	clone.setAttribute("style", styleText)

	clone.style.margin = "0"
	clone.style.boxSizing = "border-box"
	clone.style.pointerEvents = "none"
	clone.style.visibility = "visible"

	if (tagName === "img") {
		const imageNode = htmlNode as HTMLImageElement
		;(clone as HTMLImageElement).src = toAbsoluteUrl(
			imageNode.currentSrc || imageNode.getAttribute("src") || imageNode.src,
			baseUrl,
		)
		;(clone as HTMLImageElement).alt = imageNode.alt
	}
	if (tagName === "input") {
		;(clone as HTMLInputElement).value = (htmlNode as HTMLInputElement).value
	}
	if (tagName === "textarea") {
		;(clone as HTMLTextAreaElement).value = (htmlNode as HTMLTextAreaElement).value
	}
	if (tagName === "canvas") {
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
		// shadow root's children, skipping non-visual script/link nodes.
		const shadowRoot = htmlNode.shadowRoot
		if (shadowRoot) {
			for (const child of Array.from(shadowRoot.childNodes)) {
				if (child.nodeType === Node.ELEMENT_NODE) {
					const childTag = (child as Element).tagName.toUpperCase()
					if (childTag === "SCRIPT" || childTag === "LINK") continue
				}
				clone.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument))
			}
		}
	}
	return clone
}

export function ImportedPhysicsClone({
	sourceNode,
	sourceWindow,
	x,
	y,
	angle,
	width,
	height,
	showDebug,
	renderVersion,
}: ImportedPhysicsCloneProps) {
	const mountRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const mount = mountRef.current
		if (!mount) return
		mount.innerHTML = ""

		// Temporarily restore visibility on the source node (and ancestors)
		// so getComputedStyle returns the real visual styles, not 'hidden'.
		const hiddenNodes = revealHiddenAncestors(sourceNode)

		const clone = cloneWithInlineStyles(sourceNode, sourceWindow, mount.ownerDocument)

		// Restore hidden state on originals
		restoreRevealedAncestors(hiddenNodes)

		if (clone.nodeType === Node.ELEMENT_NODE) {
			const cloneEl = clone as HTMLElement
			cloneEl.style.width = "100%"
			cloneEl.style.height = "100%"
			cloneEl.style.overflow = "hidden"
		}
		mount.appendChild(clone)
	}, [sourceNode, sourceWindow, renderVersion])

	return (
		<>
			<div
				role="button"
				aria-label={`Physics clone ${sourceNode.tagName.toLowerCase()}`}
				data-domino-physics-clone="true"
				style={{
					position: "absolute",
					left: x,
					top: y,
					width,
					height,
					transform: angle !== 0 ? `rotate(${angle}rad)` : undefined,
					transformOrigin: "center center",
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
						left: x - 1,
						top: y - 1,
						width: width + 2,
						height: height + 2,
						transform: angle !== 0 ? `rotate(${angle}rad)` : undefined,
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
}
