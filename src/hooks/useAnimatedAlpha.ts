import { useEffect, useMemo, useRef, useState } from "react"
import type { AlphaRowInterval, AlphaTightBounds, SceneElement } from "../scene/types"
import { GifAlphaController, parseGifFromDataUrl } from "../utils/gifFrames"
import { computeTightBoundsFromAlphaRows, isAnimatedImageSrc } from "../utils/imageAlpha"

const DEBUG_HOOK = true
// Offset to compensate for delay between browser loading GIF and us detecting it
// Negative = our animation is ahead, Positive = behind
const TIMING_OFFSET_MS = -100

interface AnimatedAlphaEntry {
	rows: AlphaRowInterval[] | null
	bounds: AlphaTightBounds | null
}

interface AnimatedAlphaState {
	[elementId: string]: AnimatedAlphaEntry
}

/**
 * Hook that continuously updates alpha rows from animated GIFs.
 * Uses gifuct-js to parse GIF frames and provides frame-synced alpha data
 * based on timing (since browsers don't expose current GIF frame via canvas).
 */
const EMPTY_ALPHA_STATE: AnimatedAlphaState = {}

export function useAnimatedAlpha(elements: SceneElement[]): AnimatedAlphaState {
	const [alphaState, setAlphaState] = useState<AnimatedAlphaState>(EMPTY_ALPHA_STATE)
	const controllersRef = useRef<Map<string, GifAlphaController>>(new Map())
	const prevFrameRef = useRef<Map<string, number>>(new Map())
	// Track when each element was first seen (approximates when browser started playing)
	const elementFirstSeenRef = useRef<Map<string, number>>(new Map())

	const animatedElements = useMemo(
		() =>
			elements.filter(
				(el) => el.type === "image" && el.imageSrc && isAnimatedImageSrc(el.imageSrc),
			),
		[elements],
	)

	// Track when elements first appear
	useEffect(() => {
		const now = performance.now()
		for (const el of animatedElements) {
			if (!elementFirstSeenRef.current.has(el.id)) {
				elementFirstSeenRef.current.set(el.id, now)
				if (DEBUG_HOOK) {
					console.log(`[useAnimatedAlpha] First saw ${el.id} at ${now.toFixed(0)}ms`)
				}
			}
		}
	}, [animatedElements])

	// Parse GIFs and create controllers
	useEffect(() => {
		let cancelled = false

		const initControllers = async () => {
			for (const el of animatedElements) {
				if (!el.imageSrc?.startsWith("data:image/gif")) continue
				if (controllersRef.current.has(el.id)) continue

				if (DEBUG_HOOK) {
					console.log(`[useAnimatedAlpha] Parsing GIF for ${el.id}...`)
				}

				const gif = await parseGifFromDataUrl(el.imageSrc)
				if (gif && !cancelled) {
					// Use the time we first saw this element as the start time
					// Apply offset to compensate for detection delay
					const startTime =
						(elementFirstSeenRef.current.get(el.id) ?? performance.now()) + TIMING_OFFSET_MS
					controllersRef.current.set(el.id, new GifAlphaController(gif, startTime))
					if (DEBUG_HOOK) {
						console.log(
							`[useAnimatedAlpha] Created controller for ${el.id}, ${gif.frames.length} frames, startTime=${startTime.toFixed(0)}ms`,
						)
					}
				}
			}
		}

		initControllers()

		return () => {
			cancelled = true
		}
	}, [animatedElements])

	// Animation loop - runs continuously to update alpha based on timing
	useEffect(() => {
		if (animatedElements.length === 0) {
			controllersRef.current.clear()
			prevFrameRef.current.clear()
			setAlphaState(EMPTY_ALPHA_STATE)
			return
		}

		let running = true
		let rafId: number | null = null

		const tick = () => {
			if (!running) return

			const updates: AnimatedAlphaState = {}
			let hasChanges = false

			for (const el of animatedElements) {
				const controller = controllersRef.current.get(el.id)
				if (!controller) continue

				// Get current frame based on timing
				const rows = controller.getCurrentAlphaRows()
				const currentFrame = controller.currentFrame
				const prevFrame = prevFrameRef.current.get(el.id)

				// Update state when frame changes
				if (currentFrame !== prevFrame) {
					const bounds = rows ? computeTightBoundsFromAlphaRows(rows) : null
					updates[el.id] = { rows, bounds }
					prevFrameRef.current.set(el.id, currentFrame)
					hasChanges = true

					if (DEBUG_HOOK) {
						console.log(
							`[useAnimatedAlpha] ${el.id} frame ${prevFrame ?? "?"} -> ${currentFrame}, rows=${rows?.length ?? 0}`,
						)
					}
				}
			}

			if (hasChanges) {
				setAlphaState((prev) => ({ ...prev, ...updates }))
			}

			if (running) {
				rafId = requestAnimationFrame(tick)
			}
		}

		rafId = requestAnimationFrame(tick)

		return () => {
			running = false
			if (rafId !== null) {
				cancelAnimationFrame(rafId)
			}
		}
	}, [animatedElements])

	// Cleanup stale controllers
	useEffect(() => {
		const currentIds = new Set(animatedElements.map((el) => el.id))
		for (const id of controllersRef.current.keys()) {
			if (!currentIds.has(id)) {
				controllersRef.current.delete(id)
				prevFrameRef.current.delete(id)
				elementFirstSeenRef.current.delete(id)
			}
		}
	}, [animatedElements])

	return alphaState
}
