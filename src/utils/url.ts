/**
 * Resolve a potentially relative URL against a base URL.
 * Preserves fragments, data: URIs, and already-absolute URLs.
 */
export function toAbsoluteUrl(raw: string, baseUrl: string): string {
	const value = raw.trim()
	if (!value || value.startsWith("#") || /^[a-z][a-z\d+\-.]*:/i.test(value)) {
		return value
	}
	try {
		return new URL(value, baseUrl).href
	} catch {
		return value
	}
}

const isSrcsetSpace = (ch: string) =>
	ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f"

/**
 * Rewrites every candidate URL in a srcset, leaving descriptors untouched.
 * Splits candidates the way the HTML spec does: a URL is a run of
 * non-whitespace (so commas inside it, as in `w_300,h_200` CDN paths or
 * `data:` URLs, are kept), and a candidate ends at a comma after its
 * descriptors.
 */
export function mapSrcsetUrls(raw: string, map: (url: string) => string): string {
	const out: string[] = []
	const n = raw.length
	let i = 0
	while (i < n) {
		while (i < n && (isSrcsetSpace(raw[i]) || raw[i] === ",")) i++
		if (i >= n) break
		const urlStart = i
		while (i < n && !isSrcsetSpace(raw[i])) i++
		let url = raw.slice(urlStart, i)
		let descriptor = ""
		if (url.endsWith(",")) {
			url = url.replace(/,+$/, "")
		} else {
			const descStart = i
			let depth = 0
			while (i < n) {
				const ch = raw[i]
				if (ch === "(") depth++
				else if (ch === ")") depth = Math.max(0, depth - 1)
				else if (ch === "," && depth === 0) break
				i++
			}
			descriptor = raw.slice(descStart, i).trim()
			i++
		}
		if (url) out.push(descriptor ? `${map(url)} ${descriptor}` : map(url))
	}
	return out.join(", ")
}

/**
 * Resolve relative URLs inside a srcset attribute string.
 * Each comma-separated entry is `<url> [<descriptor>]`.
 */
export function toAbsoluteSrcset(raw: string, baseUrl: string): string {
	if (!raw) return raw
	return mapSrcsetUrls(raw, (url) => toAbsoluteUrl(url, baseUrl))
}
