import { getSiteCSS, getSiteCssLinks, getSiteRemoveSelectors } from "../siteStyles"

// Classes that JS adds/removes at runtime to signal loading state.
// We strip scripts, so these classes would stay forever — remove them.
const REMOVE_CLASS_TOKENS = new Set([
	"show-curtain",
	"opaque",
	"loading",
	"reading",
	"writing",
	"saving",
	"searching",
	"pacify",
])

function replaceClassTokens(className: string): string {
	const tokens = className
		.split(/\s+/)
		.map((token) => {
			if (token === "client-nojs") return "client-js"
			if (token === "no-js" || token === "nojs") return "js"
			if (REMOVE_CLASS_TOKENS.has(token)) return ""
			return token
		})
		.filter(Boolean)
	return Array.from(new Set(tokens)).join(" ")
}

function rewriteFetchedDocumentMarkup(html: string): string {
	const parser = new DOMParser()
	const doc = parser.parseFromString(html, "text/html")

	for (const root of [doc.documentElement, doc.body]) {
		if (!root) continue
		const className = root.getAttribute("class")
		if (!className) continue
		root.setAttribute("class", replaceClassTokens(className))
	}

	// Unwrap <noscript> only when it is the sole media source for that slot.
	// If a sibling media element already exists, keeping both commonly duplicates
	// the same image after lazy-src promotion.
	for (const noscript of Array.from(doc.querySelectorAll("noscript"))) {
		const parent = noscript.parentElement
		const raw = noscript.innerHTML?.trim() ?? ""
		if (!parent || !raw) {
			noscript.remove()
			continue
		}

		const hasMediaFallback = /<(img|picture|video|source)\b/i.test(raw)
		const hasSiblingMedia = Array.from(parent.children).some((child) => {
			if (child === noscript) return false
			return /^(IMG|PICTURE|VIDEO|SOURCE)$/.test(child.tagName)
		})

		if (hasMediaFallback && hasSiblingMedia) {
			// Check if sibling media elements actually have source URLs.
			// NYTimes (and similar) ship <img> with opacity:0 and no src, relying
			// on JS to populate src and reveal it. The only real URL + visible
			// styling lives inside <noscript>. Promote the noscript src to the
			// empty sibling img and force it visible (override JS-dependent
			// opacity:0 CSS). We keep the sibling img for layout since it provides
			// sizing via width/vertical-align, while the noscript img uses
			// position:absolute and would collapse its container.
			const siblingImgs = Array.from(
				parent.querySelectorAll(":scope > img, :scope > picture img"),
			) as HTMLImageElement[]
			const allSiblingsEmpty =
				siblingImgs.length > 0 &&
				siblingImgs.every((img) => !img.getAttribute("src") && !img.getAttribute("data-src"))
			if (allSiblingsEmpty) {
				const noscriptDoc = parser.parseFromString(`<body>${raw}</body>`, "text/html")
				const noscriptImg = noscriptDoc.querySelector("img")
				if (noscriptImg) {
					const noscriptSrc = noscriptImg.getAttribute("src")
					if (noscriptSrc && siblingImgs.length > 0) {
						const target = siblingImgs[0]
						target.setAttribute("src", noscriptSrc)
						// Force visible — the original class likely has opacity:0 for
						// JS-based reveal that won't run without scripts
						target.style.opacity = "1"
						const noscriptAlt = noscriptImg.getAttribute("alt")
						if (noscriptAlt && !target.getAttribute("alt")) {
							target.setAttribute("alt", noscriptAlt)
						}
					}
				}
			}
			noscript.remove()
			continue
		}

		const fragmentDoc = parser.parseFromString(`<body>${raw}</body>`, "text/html")
		const fragment = doc.createDocumentFragment()
		for (const child of Array.from(fragmentDoc.body.childNodes)) {
			fragment.appendChild(child.cloneNode(true))
		}
		noscript.replaceWith(fragment)
	}

	for (const img of Array.from(doc.querySelectorAll("img"))) {
		const dataSrc = img.getAttribute("data-src")?.trim()
		if (dataSrc && !img.getAttribute("src")) {
			img.setAttribute("src", dataSrc)
		}
		if (!img.getAttribute("src")?.trim()) {
			img.remove()
			continue
		}
		if (img.getAttribute("loading") === "lazy") {
			img.setAttribute("loading", "eager")
		}
	}

	// Strip href from anchors to prevent navigation inside the viewer iframe
	for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
		a.removeAttribute("href")
	}

	for (const source of Array.from(doc.querySelectorAll("source"))) {
		const dataSrcset = source.getAttribute("data-srcset")?.trim()
		if (dataSrcset && !source.getAttribute("srcset")) {
			source.setAttribute("srcset", dataSrcset)
		}
	}

	for (const el of Array.from(doc.querySelectorAll("[data-srcset]"))) {
		if (el.getAttribute("srcset")) continue
		const dataSrcset = el.getAttribute("data-srcset")?.trim()
		if (dataSrcset) el.setAttribute("srcset", dataSrcset)
	}

	return `<!doctype html>\n${doc.documentElement.outerHTML}`
}

// ─── HTML preparation: inline CSS + fix URLs ───

/** Prepares fetched HTML for viewer: inlines external CSS, rewrites URLs, promotes noscript images, strips scripts. */
export async function prepareHtml(html: string, sourceUrl: string): Promise<string> {
	let origin: string
	try {
		origin = new URL(sourceUrl).origin
	} catch {
		return html
	}

	let modified = html

	// 1. Fetch external stylesheets through our proxy and inline them
	const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi
	const hrefRegex = /href=["']([^"']+)["']/i
	const links = modified.match(linkRegex) || []

	const cssResults = await Promise.all(
		links.map(async (linkTag) => {
			const m = linkTag.match(hrefRegex)
			if (!m) return null
			// Decode HTML entities in href
			const rawHref = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
			const cssUrl =
				rawHref.startsWith("http") || rawHref.startsWith("//")
					? rawHref.startsWith("//")
						? `https:${rawHref}`
						: rawHref
					: origin + (rawHref.startsWith("/") ? "" : "/") + rawHref
			try {
				const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(cssUrl)}`, {
					signal: AbortSignal.timeout(8000),
				})
				if (res.ok) {
					let css = await res.text()
					if (css.length > 10 && css.length < 1000000) {
						// Rewrite url() references in CSS to absolute.
						// Use the CSS file's own origin for absolute paths (/foo),
						// not the page origin — fonts often live on a different CDN.
						const cssBase = cssUrl.replace(/[^/]*$/, "")
						let cssOrigin: string
						try {
							cssOrigin = new URL(cssUrl).origin
						} catch {
							cssOrigin = origin
						}
						css = css.replace(
							/url\(\s*['"]?(?!data:|https?:|\/\/)([^'")]+)['"]?\s*\)/gi,
							(_, ref: string) => {
								const abs = ref.startsWith("/") ? cssOrigin + ref : cssBase + ref
								return `url("${abs}")`
							},
						)
						return { linkTag, css }
					}
				}
			} catch (e) {
				console.warn("[DOMino] Failed to fetch stylesheet:", cssUrl, e)
			}
			return null
		}),
	)

	for (const r of cssResults) {
		if (!r) continue
		modified = modified.replace(r.linkTag, `<style>${r.css}</style>`)
	}

	// 1b. Fetch site-specific CSS files (for sites that load CSS via JS)
	const siteCssLinks = getSiteCssLinks(sourceUrl)
	if (siteCssLinks.length > 0) {
		const siteCssResults = await Promise.all(
			siteCssLinks.map(async (href) => {
				const cssUrl =
					href.startsWith("http") || href.startsWith("//")
						? href.startsWith("//")
							? `https:${href}`
							: href
						: origin + (href.startsWith("/") ? "" : "/") + href
				try {
					const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(cssUrl)}`, {
						signal: AbortSignal.timeout(8000),
					})
					if (res.ok) {
						let css = await res.text()
						if (css.length > 10 && css.length < 1000000) {
							let cssOrigin: string
							try {
								cssOrigin = new URL(cssUrl).origin
							} catch {
								cssOrigin = origin
							}
							const cssBase = cssUrl.replace(/[^/]*$/, "")
							css = css.replace(
								/url\(\s*['"]?(?!data:|https?:|\/\/)([^'")]+)['"]?\s*\)/gi,
								(_, ref: string) => {
									const abs = ref.startsWith("/") ? cssOrigin + ref : cssBase + ref
									return `url("${abs}")`
								},
							)
							return css
						}
					}
				} catch (e) {
					console.warn("[DOMino] Failed to fetch site CSS:", href, e)
				}
				return null
			}),
		)
		const inlinedSiteCss = siteCssResults.filter(Boolean).join("\n")
		if (inlinedSiteCss) {
			// Inject before </head> or at start of document
			if (/<\/head>/i.test(modified)) {
				modified = modified.replace(
					/<\/head>/i,
					`<style data-domino-site-css>${inlinedSiteCss}</style></head>`,
				)
			} else {
				modified = `<style data-domino-site-css>${inlinedSiteCss}</style>${modified}`
			}
		}
	}

	// 2. Rewrite <img src> to absolute (including protocol-relative //urls)
	modified = modified.replace(
		/<img([^>]*)\ssrc=["']\/\/([^"']+)["']/gi,
		(_match, before: string, ref: string) => `<img${before} src="https://${ref}"`,
	)
	modified = modified.replace(
		/<img([^>]*)\ssrc=["'](?!data:|https?:|\/\/)([^"']+)["']/gi,
		(_match, before: string, ref: string) =>
			`<img${before} src="${origin}${ref.startsWith("/") ? "" : "/"}${ref}"`,
	)

	// 3. Rewrite srcset to absolute (including protocol-relative)
	modified = modified.replace(/srcset=["']([^"']+)["']/gi, (_, srcset: string) => {
		const fixed = srcset
			.replace(/\/\/([^\s,]+)/g, "https://$1")
			.replace(/(?:^|,\s*)(?!https?:)(\/[^\s,]+)/g, (m2, ref: string) =>
				m2.replace(ref, origin + ref),
			)
		return `srcset="${fixed}"`
	})

	// 4. Normalize markup: noscript / lazy media / root classes (see rewriteFetchedDocumentMarkup)
	modified = rewriteFetchedDocumentMarkup(modified)

	// 5. Remove scripts to prevent foreign JS execution
	modified = modified.replace(/<script[\s\S]*?<\/script>/gi, "")

	// 6. JS-dependent root classes are normalized inside rewriteFetchedDocumentMarkup().

	// 7. Fix fixed/sticky positioning so headers flow naturally in the iframe
	modified = modified.replace(/position\s*:\s*fixed/gi, "position: relative")
	modified = modified.replace(/position\s*:\s*sticky/gi, "position: relative")

	// 8. Add base tag for remaining relative URLs + header positioning fix + site-specific CSS
	const siteCSS = getSiteCSS(sourceUrl)
	const removeSelectors = getSiteRemoveSelectors(sourceUrl)
	const removeCSS =
		removeSelectors.length > 0
			? `${removeSelectors.join(",\n    ")} { display: none !important; }`
			: ""
	const headerFix = `<style data-domino-fix>
    header, nav, [role="banner"], [role="navigation"],
    [class*="header"], [class*="nav-"], [class*="navbar"],
    [class*="sticky"], [class*="fixed-header"] {
      position: relative !important;
    }
    ${removeCSS}
    ${siteCSS}
  </style>`
	const base = `<base href="${origin}/">`
	if (/<head[^>]*>/i.test(modified)) {
		modified = modified.replace(/<head[^>]*>/i, (m) => m + base + headerFix)
	} else {
		modified = `<head>${base}${headerFix}</head>${modified}`
	}

	return modified
}
