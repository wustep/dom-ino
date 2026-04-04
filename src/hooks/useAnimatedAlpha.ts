import { useEffect, useRef, useState } from "react"
import type { AlphaRowInterval, AlphaTightBounds, SceneElement } from "../scene/types"
import { computeTightBoundsFromAlphaRows, isAnimatedImageSrc } from "../utils/imageAlpha"

const DEBUG_ALPHA = false

interface AnimatedAlphaEntry {
	rows: AlphaRowInterval[] | null
	bounds: AlphaTightBounds | null
}

interface AnimatedAlphaState {
	[elementId: string]: AnimatedAlphaEntry
}

/**
 * Hook that continuously samples alpha rows from animated images (GIFs, WebP, APNG).
 * Uses createImageBitmap to capture the current animation frame.
 * Returns a map of element IDs to their current alpha rows and tight bounds.
 */
export function useAnimatedAlpha(elements: SceneElement[]): AnimatedAlphaState {
	const [alphaState, setAlphaState] = useState<AnimatedAlphaState>({})
	const rafRef = useRef<number | null>(null)
	const prevJsonRef = useRef<Map<string, string>>(new Map())

	const animatedElements = elements.filter(
		(el) => el.type === "image" && el.imageSrc && isAnimatedImageSrc(el.imageSrc),
	)

	useEffect(() => {
		if (animatedElements.length === 0) {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
			setAlphaState({})
			prevJsonRef.current.clear()
			return
		}

		let running = true

		const sampleAlpha = async () => {
			if (!running) return

			const updates: AnimatedAlphaState = {}
			let hasChanges = false

			for (const el of animatedElements) {
				// Find the actual rendered <img> element in the DOM
				const img = document.querySelector<HTMLImageElement>(
					`img[data-domino-image-id="${el.id}"]`,
				)

				if (DEBUG_ALPHA && !img) {
					console.log(`[useAnimatedAlpha] No img found for ${el.id}`)
				}

				if (img?.complete && img.naturalWidth > 0) {
					// Use the existing extractAlphaRowsFromElement which works for initial load
					// For animated GIFs, this will only capture the current displayed frame
					const { extractAlphaRowsFromElement } = await import("../utils/imageAlpha")
					const rows = extractAlphaRowsFromElement(img)
					const json = JSON.stringify(rows)
					const prevJson = prevJsonRef.current.get(el.id)

					if (DEBUG_ALPHA) {
						console.log(`[useAnimatedAlpha] ${el.id}: rows=${rows?.length ?? 0}, changed=${json !== prevJson}`)
					}

					if (json !== prevJson) {
						const bounds = rows ? computeTightBoundsFromAlphaRows(rows) : null
						updates[el.id] = { rows, bounds }
						prevJsonRef.current.set(el.id, json)
						hasChanges = true

						if (DEBUG_ALPHA && bounds) {
							console.log(`[useAnimatedAlpha] ${el.id}: bounds=`, bounds)
						}
					}
				} else if (DEBUG_ALPHA) {
					console.log(`[useAnimatedAlpha] ${el.id}: img not ready, complete=${img?.complete}, naturalWidth=${img?.naturalWidth}`)
				}
			}

			if (hasChanges) {
				setAlphaState((prev) => ({ ...prev, ...updates }))
			}

			// Schedule next frame
			if (running) {
				rafRef.current = requestAnimationFrame(sampleAlpha)
			}
		}

		// Start sampling
		rafRef.current = requestAnimationFrame(sampleAlpha)

		return () => {
			running = false
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
		}
	}, [animatedElements])

	// Cleanup stale entries
	useEffect(() => {
		const currentIds = new Set(animatedElements.map((el) => el.id))
		for (const id of prevJsonRef.current.keys()) {
			if (!currentIds.has(id)) {
				prevJsonRef.current.delete(id)
			}
		}
	}, [animatedElements])

	return alphaState
}
