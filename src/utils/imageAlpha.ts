import type { AlphaRowInterval } from "../scene/types"

const ALPHA_THRESHOLD = 10 // Lower threshold catches more semi-transparent pixels
const INTERVAL_PADDING = 0.02 // Padding on each side (2% of width)
const BOUNDS_PADDING = 0.02 // Padding for tight bounds (2% of dimension)

/**
 * Extract per-row alpha intervals from an image element (captures current frame for GIFs).
 */
export function extractAlphaRowsFromElement(
	img: HTMLImageElement,
	rowCount?: number,
): AlphaRowInterval[] | null {
	if (!img.complete || img.naturalWidth === 0) return null

	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d", { willReadFrequently: true })
	if (!ctx) return null

	const w = img.naturalWidth || img.width
	const h = img.naturalHeight || img.height
	if (w < 1 || h < 1) return null

	canvas.width = w
	canvas.height = h
	ctx.clearRect(0, 0, w, h)

	try {
		ctx.drawImage(img, 0, 0)
	} catch {
		return null
	}

	let imageData: ImageData
	try {
		imageData = ctx.getImageData(0, 0, w, h)
	} catch {
		return null
	}

	const { data } = imageData
	const rows = Math.min(rowCount ?? h, 100, h)
	const intervals: AlphaRowInterval[] = []
	let hasTransparency = false

	for (let row = 0; row < rows; row++) {
		// Sample multiple pixel rows for each interval row to catch thin features
		const normalizedY = row / rows
		const pixelYStart = Math.floor(normalizedY * h)
		const pixelYEnd = Math.min(Math.floor(((row + 1) / rows) * h), h - 1)

		let leftmost = -1
		let rightmost = -1

		// Check all pixel rows in this band
		for (let pixelY = pixelYStart; pixelY <= pixelYEnd; pixelY++) {
			const rowStart = pixelY * w * 4

			for (let x = 0; x < w; x++) {
				const alpha = data[rowStart + x * 4 + 3]
				if (alpha > ALPHA_THRESHOLD) {
					if (leftmost === -1) leftmost = x
					rightmost = Math.max(rightmost, x)
				} else {
					hasTransparency = true
				}
			}
		}

		if (leftmost === -1) continue

		// Add padding and clamp to [0, 1]
		const left = Math.max(0, leftmost / w - INTERVAL_PADDING)
		const right = Math.min(1, (rightmost + 1) / w + INTERVAL_PADDING)

		intervals.push({
			y: normalizedY,
			left,
			right,
		})
	}

	if (!hasTransparency) {
		const allFullWidth = intervals.every((int) => int.left < 0.02 && int.right > 0.98)
		if (allFullWidth) return null
	}

	return intervals.length > 0 ? intervals : null
}

/**
 * Extract per-row alpha intervals from an image.
 * Returns normalized coordinates (0-1) for each row where opaque pixels exist.
 *
 * @param imageSrc - Data URL or image source
 * @param rowCount - Number of rows to sample (default: image height, max 200)
 * @returns Promise resolving to array of alpha row intervals, or null if fully opaque
 */
export async function extractAlphaRows(
	imageSrc: string,
	rowCount?: number,
): Promise<AlphaRowInterval[] | null> {
	return new Promise((resolve) => {
		const img = new Image()
		img.crossOrigin = "anonymous"

		img.onload = () => {
			resolve(extractAlphaRowsFromElement(img, rowCount))
		}

		img.onerror = () => resolve(null)
		img.src = imageSrc
	})
}

/**
 * Check if an image source is likely an animated format (GIF, APNG, WebP).
 */
export function isAnimatedImageSrc(src: string): boolean {
	if (!src) return false
	const lower = src.toLowerCase()
	if (lower.startsWith("data:image/gif")) return true
	if (lower.includes(".gif")) return true
	if (lower.startsWith("data:image/webp")) return true
	if (lower.includes(".webp")) return true
	if (lower.startsWith("data:image/apng")) return true
	if (lower.includes(".apng")) return true
	return false
}

/**
 * Compute tight bounding box from alpha row intervals.
 * Returns normalized coordinates (0-1) for the smallest rectangle containing all opaque pixels.
 * Adds padding for more conservative bounds.
 */
export function computeTightBoundsFromAlphaRows(
	alphaRows: AlphaRowInterval[],
): { top: number; bottom: number; left: number; right: number } | null {
	if (!alphaRows || alphaRows.length === 0) return null

	let minY = 1
	let maxY = 0
	let minX = 1
	let maxX = 0

	for (const row of alphaRows) {
		minY = Math.min(minY, row.y)
		maxY = Math.max(maxY, row.y)
		minX = Math.min(minX, row.left)
		maxX = Math.max(maxX, row.right)
	}

	if (maxY <= minY || maxX <= minX) return null

	// Add padding and clamp to [0, 1]
	return {
		top: Math.max(0, minY - BOUNDS_PADDING),
		bottom: Math.min(1, maxY + BOUNDS_PADDING),
		left: Math.max(0, minX - BOUNDS_PADDING),
		right: Math.min(1, maxX + BOUNDS_PADDING),
	}
}

/** Returns true if an image element has enough transparent pixels to warrant alpha-aware text flow. */
export async function hasSignificantTransparency(imageSrc: string): Promise<boolean> {
	return new Promise((resolve) => {
		const img = new Image()
		img.crossOrigin = "anonymous"

		img.onload = () => {
			const canvas = document.createElement("canvas")
			const ctx = canvas.getContext("2d", { willReadFrequently: true })
			if (!ctx) {
				resolve(false)
				return
			}

			const w = img.naturalWidth || img.width
			const h = img.naturalHeight || img.height
			canvas.width = w
			canvas.height = h
			ctx.drawImage(img, 0, 0)

			let imageData: ImageData
			try {
				imageData = ctx.getImageData(0, 0, w, h)
			} catch {
				resolve(false)
				return
			}

			const { data } = imageData
			const sampleSize = Math.min(w * h, 10000)
			const step = Math.max(1, Math.floor((w * h) / sampleSize))
			let transparentCount = 0
			let edgeTransparent = 0

			for (let i = 3; i < data.length; i += step * 4) {
				if (data[i] < ALPHA_THRESHOLD) {
					transparentCount++
					const pixelIndex = (i - 3) / 4
					const x = pixelIndex % w
					const y = Math.floor(pixelIndex / w)
					if (x < 5 || x >= w - 5 || y < 5 || y >= h - 5) {
						edgeTransparent++
					}
				}
			}

			const transparentRatio = transparentCount / (data.length / 4 / step)
			resolve(transparentRatio > 0.05 || edgeTransparent > 10)
		}

		img.onerror = () => resolve(false)
		img.src = imageSrc
	})
}
