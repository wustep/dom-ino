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

/**
 * Resolve relative URLs inside a srcset attribute string.
 * Each comma-separated entry is `<url> [<descriptor>]`.
 */
export function toAbsoluteSrcset(raw: string, baseUrl: string): string {
	if (!raw || raw.includes("data:")) return raw
	return raw
		.split(",")
		.map((entry) => {
			const trimmed = entry.trim()
			if (!trimmed) return ""
			const firstSpace = trimmed.search(/\s/)
			const urlPart = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)
			const descriptor = firstSpace === -1 ? "" : trimmed.slice(firstSpace)
			return `${toAbsoluteUrl(urlPart, baseUrl)}${descriptor}`
		})
		.filter(Boolean)
		.join(", ")
}
