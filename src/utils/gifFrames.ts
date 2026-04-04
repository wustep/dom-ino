import { decompressFrames, parseGIF } from "gifuct-js"
import type { AlphaRowInterval } from "../scene/types"

const ALPHA_THRESHOLD = 10 // Lower threshold catches more semi-transparent pixels
const INTERVAL_PADDING = 0.02 // Padding on each side (2% of width)

interface GifFrameData {
	imageData: ImageData
	delay: number
}

export interface ParsedGif {
	width: number
	height: number
	frames: GifFrameData[]
	totalDuration: number
}

/**
 * Parse a GIF from a data URL and extract all frames.
 */
export async function parseGifFromDataUrl(dataUrl: string): Promise<ParsedGif | null> {
	if (!dataUrl.startsWith("data:image/gif")) return null

	try {
		const base64 = dataUrl.split(",")[1]
		const binary = atob(base64)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i)
		}

		const gif = parseGIF(bytes.buffer)
		const rawFrames = decompressFrames(gif, true)

		if (rawFrames.length === 0) return null

		const width = gif.lsd.width
		const height = gif.lsd.height

		const canvas = document.createElement("canvas")
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext("2d", { willReadFrequently: true })
		if (!ctx) return null

		const frames: GifFrameData[] = []
		let totalDuration = 0

		for (const frame of rawFrames) {
			const frameImageData = ctx.createImageData(width, height)

			// GIF frames can be smaller than the full image (partial update)
			// We need to composite them properly
			if (frame.disposalType === 2) {
				// Clear to background
				frameImageData.data.fill(0)
			} else if (frames.length > 0) {
				// Copy previous frame
				frameImageData.data.set(frames[frames.length - 1].imageData.data)
			}

			// Apply this frame's patch
			const patch = frame.patch
			for (let y = 0; y < frame.dims.height; y++) {
				for (let x = 0; x < frame.dims.width; x++) {
					const patchIdx = (y * frame.dims.width + x) * 4
					const destX = frame.dims.left + x
					const destY = frame.dims.top + y
					const destIdx = (destY * width + destX) * 4

					// Only copy if not transparent in the patch
					if (patch[patchIdx + 3] > 0) {
						frameImageData.data[destIdx] = patch[patchIdx]
						frameImageData.data[destIdx + 1] = patch[patchIdx + 1]
						frameImageData.data[destIdx + 2] = patch[patchIdx + 2]
						frameImageData.data[destIdx + 3] = patch[patchIdx + 3]
					}
				}
			}

			const delay = frame.delay // gifuct-js already converts delays to milliseconds
			totalDuration += delay

			frames.push({
				imageData: frameImageData,
				delay,
			})
		}

		return { width, height, frames, totalDuration }
	} catch (e) {
		console.error("[gifFrames] Failed to parse GIF:", e)
		return null
	}
}

/**
 * Extract alpha rows from ImageData.
 * Samples multiple pixel rows per interval to catch thin features.
 * Adds padding to intervals for more conservative bounds.
 */
export function extractAlphaRowsFromImageData(
	imageData: ImageData,
	rowCount?: number,
): AlphaRowInterval[] | null {
	const w = imageData.width
	const h = imageData.height
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

function getLoopTime(totalDuration: number, elapsed: number): number {
	if (totalDuration <= 0) return 0
	const remainder = elapsed % totalDuration
	return remainder >= 0 ? remainder : remainder + totalDuration
}

function getFrameIndexAtLoopTime(gif: ParsedGif, loopTime: number): number {
	if (gif.totalDuration <= 0) return 0
	let accum = 0
	for (let i = 0; i < gif.frames.length; i++) {
		accum += gif.frames[i].delay
		if (loopTime < accum) return i
	}
	return Math.max(0, gif.frames.length - 1)
}

/**
 * GIF animation controller that provides frame-synced alpha data.
 * Uses timing-based frame calculation (browsers don't expose current GIF frame via canvas).
 */
export class GifAlphaController {
	private gif: ParsedGif
	private currentFrameIndex = 0
	private alphaCache: Map<number, AlphaRowInterval[] | null> = new Map()
	private renderSurfaceCache: Map<number, HTMLCanvasElement | null> = new Map()
	private startTime: number
	private pausedAt: number | null = null

	/**
	 * @param gif - Parsed GIF data
	 * @param startTime - When the GIF started playing (e.g., when element was first seen)
	 */
	constructor(gif: ParsedGif, startTime?: number) {
		this.gif = gif
		this.startTime = startTime ?? performance.now()

		// Pre-compute alpha rows for all frames
		for (let i = 0; i < gif.frames.length; i++) {
			const rows = extractAlphaRowsFromImageData(gif.frames[i].imageData)
			this.alphaCache.set(i, rows)
		}
	}

	/**
	 * Reset the start time (for re-syncing).
	 */
	setStartTime(time: number): void {
		this.startTime = time
	}

	pause(): void {
		if (this.pausedAt !== null) return
		this.pausedAt = performance.now()
	}

	resume(): void {
		if (this.pausedAt === null) return
		this.startTime += performance.now() - this.pausedAt
		this.pausedAt = null
	}

	/**
	 * Get the current frame state for both rendering and alpha extraction.
	 * The returned image data and alpha rows come from the same frame index.
	 */
	getCurrentFrameState(): {
		frameIndex: number
		imageData: ImageData
		alphaRows: AlphaRowInterval[] | null
	} {
		const now = this.pausedAt ?? performance.now()
		const elapsed = now - this.startTime
		const loopTime = getLoopTime(this.gif.totalDuration, elapsed)
		this.currentFrameIndex = getFrameIndexAtLoopTime(this.gif, loopTime)

		return {
			frameIndex: this.currentFrameIndex,
			imageData: this.gif.frames[this.currentFrameIndex].imageData,
			alphaRows: this.alphaCache.get(this.currentFrameIndex) ?? null,
		}
	}

	getRenderSurface(frameIndex: number = this.currentFrameIndex): HTMLCanvasElement | null {
		const cached = this.renderSurfaceCache.get(frameIndex)
		if (cached !== undefined) return cached

		const frame = this.gif.frames[frameIndex]
		if (!frame) return null

		const canvas = document.createElement("canvas")
		canvas.width = frame.imageData.width
		canvas.height = frame.imageData.height
		const ctx = canvas.getContext("2d")
		if (!ctx) {
			this.renderSurfaceCache.set(frameIndex, null)
			return null
		}

		ctx.putImageData(frame.imageData, 0, 0)
		this.renderSurfaceCache.set(frameIndex, canvas)
		return canvas
	}

	getFrameDelay(frameIndex: number = this.currentFrameIndex): number {
		return this.gif.frames[frameIndex]?.delay ?? 0
	}

	get isPaused(): boolean {
		return this.pausedAt !== null
	}

	/**
	 * Get alpha rows for the current frame based on elapsed time.
	 * Updates currentFrameIndex internally.
	 */
	getCurrentAlphaRows(): AlphaRowInterval[] | null {
		return this.getCurrentFrameState().alphaRows
	}

	get frameCount(): number {
		return this.gif.frames.length
	}

	get currentFrame(): number {
		return this.currentFrameIndex
	}

	get totalDuration(): number {
		return this.gif.totalDuration
	}
}
