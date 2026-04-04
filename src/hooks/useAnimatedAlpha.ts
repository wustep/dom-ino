import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import type { AlphaRowInterval, AlphaTightBounds, SceneElement } from "../scene/types"
import { GifAlphaController, parseGifFromDataUrl } from "../utils/gifFrames"
import { computeTightBoundsFromAlphaRows, isAnimatedImageSrc } from "../utils/imageAlpha"

const MAX_DISPLACEMENT_UPDATES_PER_SECOND = 12
const MIN_DISPLACEMENT_UPDATE_INTERVAL_MS = 1000 / MAX_DISPLACEMENT_UPDATES_PER_SECOND

interface AnimatedAlphaEntry {
	frameIndex: number
	controller: GifAlphaController
	rows: AlphaRowInterval[] | null
	bounds: AlphaTightBounds | null
}

export interface AnimatedAlphaMap {
	[elementId: string]: AnimatedAlphaEntry
}

/**
 * Hook that continuously updates alpha rows from animated GIFs.
 * Uses gifuct-js to parse GIF frames and provides frame-synced alpha data
 * based on timing (since browsers don't expose current GIF frame via canvas).
 */
const EMPTY_ALPHA_STATE: AnimatedAlphaMap = {}

export function useAnimatedAlpha(
	elements: SceneElement[],
	paused: boolean = false,
): AnimatedAlphaMap {
	const [alphaState, setAlphaState] = useState<AnimatedAlphaMap>(EMPTY_ALPHA_STATE)
	const controllersRef = useRef<Map<string, GifAlphaController>>(new Map())
	const prevFrameRef = useRef<Map<string, number>>(new Map())
	const lastPublishedAtRef = useRef<Map<string, number>>(new Map())
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

				const gif = await parseGifFromDataUrl(el.imageSrc)
				if (gif && !cancelled) {
					const startTime = elementFirstSeenRef.current.get(el.id) ?? performance.now()
					const controller = new GifAlphaController(gif, startTime)
					if (paused) controller.pause()
					controllersRef.current.set(el.id, controller)
				}
			}
		}

		initControllers()

		return () => {
			cancelled = true
		}
	}, [animatedElements, paused])

	useEffect(() => {
		for (const controller of controllersRef.current.values()) {
			if (paused) controller.pause()
			else controller.resume()
		}
	}, [paused])

	// Animation loop - runs continuously to update alpha based on timing
	useEffect(() => {
		if (animatedElements.length === 0) {
			controllersRef.current.clear()
			prevFrameRef.current.clear()
			setAlphaState(EMPTY_ALPHA_STATE)
			return
		}
		if (paused) return

		let running = true
		let timeoutId: number | null = null

		const tick = () => {
			if (!running) return

			const updates: AnimatedAlphaMap = {}
			let hasChanges = false

			for (const el of animatedElements) {
				const controller = controllersRef.current.get(el.id)
				if (!controller) continue

				// Rendering and displacement both read from the same authoritative frame.
				const frameState = controller.getCurrentFrameState()
				const { alphaRows: rows, frameIndex: currentFrame } = frameState
				const prevFrame = prevFrameRef.current.get(el.id)
				const now = performance.now()
				const lastPublishedAt = lastPublishedAtRef.current.get(el.id) ?? -Infinity
				const shouldPublishFrame =
					currentFrame !== prevFrame &&
					(prevFrame === undefined || now - lastPublishedAt >= MIN_DISPLACEMENT_UPDATE_INTERVAL_MS)

				// Update state when frame changes
				if (shouldPublishFrame) {
					const bounds = rows ? computeTightBoundsFromAlphaRows(rows) : null
					updates[el.id] = { frameIndex: currentFrame, controller, rows, bounds }
					prevFrameRef.current.set(el.id, currentFrame)
					lastPublishedAtRef.current.set(el.id, now)
					hasChanges = true
				}
			}

			if (hasChanges) {
				startTransition(() => {
					setAlphaState((prev) => ({ ...prev, ...updates }))
				})
			}

			if (running) {
				timeoutId = window.setTimeout(tick, MIN_DISPLACEMENT_UPDATE_INTERVAL_MS)
			}
		}

		tick()

		return () => {
			running = false
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
		}
	}, [animatedElements, paused])

	// Cleanup stale controllers
	useEffect(() => {
		const currentIds = new Set(animatedElements.map((el) => el.id))
		for (const id of controllersRef.current.keys()) {
			if (!currentIds.has(id)) {
				controllersRef.current.delete(id)
				prevFrameRef.current.delete(id)
				lastPublishedAtRef.current.delete(id)
				elementFirstSeenRef.current.delete(id)
			}
		}
	}, [animatedElements])

	return alphaState
}
