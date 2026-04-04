import type { SceneDescription, SceneElement } from "../types"

let parserCounter = 0

// ─── Structure-based fallback parser ───

/** Regex-based fallback parser for when iframe rendering yields too few elements. */
export function parseHtmlStructure(
	html: string,
	containerWidth: number,
	sceneName: string,
): SceneDescription {
	const SANS = '"DM Sans", "Helvetica Neue", sans-serif'
	const SERIF = '"Source Serif 4", Georgia, serif'
	const mx = 40
	const contentW = Math.min(containerWidth - 80, 800)
	const elements: SceneElement[] = []
	let y = 32

	const parser = new DOMParser()
	const doc = parser.parseFromString(html, "text/html")

	const title = doc.title?.trim() || sceneName
	elements.push({
		id: `sp-${parserCounter++}`,
		type: "heading",
		rect: { x: mx, y, width: contentW, height: 44 },
		throwable: false,
		pinned: true,
		text: title,
		fontSize: 30,
		fontWeight: 700,
		fontFamily: SANS,
		lineHeight: 38,
		color: "#1a1a1a",
	})
	y += 52

	const descMeta = doc.querySelector('meta[name="description"]') as HTMLMetaElement | null
	if (descMeta?.content) {
		elements.push({
			id: `sp-${parserCounter++}`,
			type: "paragraph",
			rect: { x: mx, y, width: contentW, height: 60 },
			throwable: false,
			pinned: true,
			text: descMeta.content.trim(),
			fontSize: 15,
			fontWeight: 400,
			fontFamily: SANS,
			lineHeight: 24,
			color: "#666",
		})
		y += 70
	}

	const ogImage = doc.querySelector('meta[property="og:image"]') as HTMLMetaElement | null
	if (ogImage?.content) {
		elements.push({
			id: `sp-${parserCounter++}`,
			type: "image",
			rect: { x: mx, y, width: Math.min(contentW, 600), height: 300 },
			throwable: true,
			pinned: false,
			backgroundColor: "#f0f0f0",
			borderRadius: 8,
			imageSrc: ogImage.content,
			imageAlt: "Page preview",
			mass: 2,
		})
		y += 316
	}

	const body = doc.body
	if (body) {
		const skipTags = new Set([
			"SCRIPT",
			"STYLE",
			"NOSCRIPT",
			"SVG",
			"LINK",
			"META",
			"HEAD",
			"NAV",
			"FOOTER",
			"ASIDE",
			"TEMPLATE",
			"IFRAME",
		])
		function walk(el: Element) {
			if (y > 5000) return
			for (const child of Array.from(el.children)) {
				if (y > 5000) return
				const tag = child.tagName
				if (skipTags.has(tag)) continue
				const cls = (child.className || "").toString().toLowerCase()
				const cid = (child.id || "").toLowerCase()
				if (
					cls.includes("hidden") ||
					cls.includes("modal") ||
					cls.includes("popup") ||
					cls.includes("cookie") ||
					cid.includes("hidden") ||
					cid.includes("modal")
				)
					continue
				if (tag === "HR") {
					elements.push({
						id: `sp-${parserCounter++}`,
						type: "divider",
						rect: { x: mx, y, width: contentW, height: 1 },
						throwable: false,
						pinned: true,
						backgroundColor: "#ddd",
					})
					y += 16
					continue
				}
				if (tag === "IMG") {
					elements.push({
						id: `sp-${parserCounter++}`,
						type: "image",
						rect: { x: mx, y, width: Math.min(contentW, 400), height: 200 },
						throwable: true,
						pinned: false,
						backgroundColor: "#e8e5e0",
						borderRadius: 8,
						imageAlt: (child as HTMLImageElement).alt,
						imageSrc: (child as HTMLImageElement).src,
						mass: 2,
					})
					y += 216
					continue
				}
				if (/^H[1-6]$/.test(tag)) {
					const text = (child.textContent || "").trim()
					if (!text || text.length > 500) {
						walk(child)
						continue
					}
					const level = parseInt(tag[1], 10)
					const fs = [0, 28, 24, 20, 17, 15, 14][level]
					const lh = [0, 34, 30, 26, 24, 22, 20][level]
					const h = Math.min(
						Math.ceil(text.length / Math.floor(contentW / (fs * 0.55))) * lh + 8,
						120,
					)
					elements.push({
						id: `sp-${parserCounter++}`,
						type: "heading",
						rect: { x: mx, y, width: contentW, height: h },
						throwable: false,
						pinned: true,
						text,
						fontSize: fs,
						fontWeight: 700,
						fontFamily: level <= 2 ? SERIF : SANS,
						lineHeight: lh,
						color: "#1a1a1a",
					})
					y += h + 12
					continue
				}
				if (tag === "P" || tag === "BLOCKQUOTE" || tag === "FIGCAPTION") {
					const text = (child.textContent || "").trim()
					if (!text || text.length < 3 || text.length > 5000) {
						walk(child)
						continue
					}
					const cpl = Math.floor(contentW / 9)
					const h = Math.min(Math.ceil(text.length / cpl) * 24 + 8, 600)
					elements.push({
						id: `sp-${parserCounter++}`,
						type: "paragraph",
						rect: { x: mx, y, width: contentW, height: h },
						throwable: false,
						pinned: true,
						text,
						fontSize: 15,
						fontWeight: 400,
						fontFamily: SERIF,
						lineHeight: 24,
						color: "#333",
					})
					y += h + 14
					continue
				}
				if (tag === "LI") {
					const text = (child.textContent || "").trim()
					if (!text || text.length < 3 || text.length > 1000) continue
					const h = Math.min(Math.ceil(text.length / Math.floor((contentW - 16) / 9)) * 22 + 4, 200)
					elements.push({
						id: `sp-${parserCounter++}`,
						type: "paragraph",
						rect: { x: mx + 16, y, width: contentW - 16, height: h },
						throwable: false,
						pinned: true,
						text: `\u2022 ${text}`,
						fontSize: 14,
						fontWeight: 400,
						fontFamily: SANS,
						lineHeight: 22,
						color: "#444",
					})
					y += h + 6
					continue
				}
				walk(child)
			}
		}
		walk(body)
	}

	return {
		id: `snapshot-${Date.now()}`,
		name: sceneName,
		width: containerWidth,
		height: Math.max(y + 100, 800),
		backgroundColor: "#ffffff",
		elements,
	}
}
