import type { LayoutCursor } from "@chenglou/pretext"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useSavedElements } from "../contexts/SavedElementsContext"
import { type SceneSettings, SettingsContext } from "../contexts/SettingsContext"
import { useScenePhysics } from "../hooks/useScenePhysics"
import type { PhysicsEngine } from "../physics/engine"
import { createPhysicsEngine } from "../physics/engine"
import type { ObstacleRect, SavedElement, SceneDescription, SceneElement } from "../scene/types"
import { measureGlyphBodiesFromDomNode } from "../textflow/glyphBodies"
import { getObstacleAABB } from "../textflow/obstacles"
import { computeTextFlow } from "../textflow/useTextFlow"
import { buildFontString } from "../utils/fonts"
import { loadSettings, saveSettings } from "../utils/persistence"
import { isAcceptableStashImageFile, savedElementFromImageFile } from "../utils/stashImageFromFile"
import { getBackgroundStyle } from "../utils/styles"
import { PhysicsDomItem } from "./PhysicsDomItem"
import { QuickSavePicker } from "./picker/QuickSavePicker"
import { ThrowablePicker } from "./picker/ThrowablePicker"
import { SceneTextLayer } from "./SceneTextLayer"
import { Toolbar } from "./Toolbar"

const NOOP = () => {}

interface DominoSceneProps {
	scene: SceneDescription
	onSceneChange?: (scene: SceneDescription, remount?: boolean) => void
	onResetAll?: () => void
}

function computeTextMaxHeights(
	textElements: SceneElement[],
	allElements: SceneElement[],
	sceneHeight: number,
): Map<string, number> {
	const allYStops: number[] = []
	for (const el of allElements) {
		if (el.type !== "divider") allYStops.push(el.rect.y)
	}
	allYStops.push(sceneHeight)
	allYStops.sort((a, b) => a - b)
	const result = new Map<string, number>()
	for (const el of textElements) {
		const elBottom = el.rect.y + el.rect.height
		let nextY = sceneHeight
		for (const stop of allYStops) {
			if (stop > elBottom - 4) {
				nextY = stop
				break
			}
		}
		result.set(el.id, Math.min(Math.max(el.rect.height, nextY - el.rect.y - 4), 3000))
	}
	return result
}

/** Orchestrates a preset scene: physics simulation, text reflow, throwable elements, and picker overlays. */
export function DominoScene({ scene, onSceneChange, onResetAll }: DominoSceneProps) {
	const {
		savedElements,
		saveElement: onSaveElement,
		unsaveElement: onUnsaveElement,
		saveStashImageFiles,
	} = useSavedElements()
	const containerRef = useRef<HTMLDivElement>(null)
	const physicsRef = useRef<PhysicsEngine | null>(null)

	const [totalLineCount, setTotalLineCount] = useState(0)
	const [textBodyElements, setTextBodyElements] = useState<SceneElement[]>([])
	const textMeasureRefs = useRef<Map<string, HTMLDivElement>>(new Map())
	const [addedElements, setAddedElements] = useState<SceneElement[]>([])
	const addedElementIdsRef = useRef<Set<string>>(new Set())
	const effectiveElements = useMemo(
		() => [...scene.elements, ...addedElements],
		[scene.elements, addedElements],
	)

	const [settings, setSettingsRaw] = useState<SceneSettings>(loadSettings)
	const setSettings = useCallback((s: SceneSettings) => {
		setSettingsRaw(s)
		saveSettings(s)
	}, [])

	const {
		pickerMode,
		handleTogglePicker,
		handleToggleSavePicker,
		handleClosePicker,
		bodyPositions,
		fps,
		animatedAlpha,
		gifPlaybackPaused,
	} = useScenePhysics({ physicsRef, settings, animatedElements: effectiveElements })

	const { textElements, throwableElements, staticElements } = useMemo(() => {
		const text: SceneElement[] = [],
			throwable: SceneElement[] = [],
			staticEls: SceneElement[] = []
		for (const el of effectiveElements) {
			const isText = (el.type === "paragraph" || el.type === "heading") && el.text && !el.throwable
			if (isText) text.push(el)
			if (el.throwable) throwable.push(el)
			else if (!isText) staticEls.push(el)
		}
		return { textElements: text, throwableElements: throwable, staticElements: staticEls }
	}, [effectiveElements])

	const savedIds = useMemo(
		() => new Set(savedElements.map((saved) => saved.element.id)),
		[savedElements],
	)

	const nextTextElementByContinuationId = useMemo(() => {
		const nextById = new Map<string, SceneElement>()
		for (const el of textElements) {
			if (el.textContinuationId) {
				nextById.set(el.textContinuationId, el)
			}
		}
		return nextById
	}, [textElements])

	const textMaxHeights = useMemo(
		() => computeTextMaxHeights(textElements, effectiveElements, scene.height),
		[textElements, effectiveElements, scene.height],
	)

	// Measure glyph bodies from a transparent clone of each text block rendered in the DOM.
	useLayoutEffect(() => {
		if (!settings.textBodiesEnabled) {
			setTextBodyElements([])
			return
		}
		const container = containerRef.current
		if (!container) return
		const rootRect = container.getBoundingClientRect()
		const nextBodies: SceneElement[] = []
		for (const el of textElements) {
			const node = textMeasureRefs.current.get(el.id)
			if (!node) continue
			nextBodies.push(
				...measureGlyphBodiesFromDomNode(node, {
					idPrefix: `${el.id}-text-body`,
					rootRect,
					zIndex: (el.zIndex ?? 2) + 4,
				}).map((body) => ({ ...body, color: el.color ?? body.color })),
			)
		}
		setTextBodyElements(nextBodies)
	}, [settings.textBodiesEnabled, textElements])

	// Track element identity so we can distinguish resize (same elements,
	// different dimensions) from real element changes (drop, delete, toggle).
	const prevElementsKeyRef = useRef("")

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const newKey = scene.elements.map((el) => `${el.id}:${el.throwable}`).join(",")

		if (physicsRef.current && prevElementsKeyRef.current === newKey) {
			// Only dimensions changed (window resize) — update walls, keep bodies
			physicsRef.current.resize(scene.width, scene.height)
			return
		}

		// Element change or first mount — recreate engine
		physicsRef.current?.destroy()
		physicsRef.current = createPhysicsEngine(scene, container)
		prevElementsKeyRef.current = newKey
	}, [scene])

	// Cleanup on unmount (component remounts on preset change via key={sceneKey})
	useEffect(
		() => () => {
			physicsRef.current?.destroy()
			physicsRef.current = null
		},
		[],
	)

	useEffect(() => {
		if (settings.paused) physicsRef.current?.pause()
		else physicsRef.current?.resume()
	}, [settings.paused])

	const obstacles: ObstacleRect[] = useMemo(() => {
		if (!settings.pretextEnabled) return []
		return effectiveElements
			.filter((el) => {
				const participates = el.affectsTextFlow ?? el.throwable
				if (!participates) return false
				if (el.type === "divider") return false
				if ((el.type === "paragraph" || el.type === "heading") && !el.throwable) return false
				return true
			})
			.map((el) => {
				const pos = bodyPositions.get(el.id)
				const liveAlphaEntry = animatedAlpha[el.id]
				const alphaRows =
					liveAlphaEntry?.rows !== undefined ? (liveAlphaEntry.rows ?? undefined) : el.alphaRows
				return {
					id: el.id,
					x: pos?.x ?? el.rect.x,
					y: pos?.y ?? el.rect.y,
					width: pos?.w ?? el.rect.width,
					height: pos?.h ?? el.rect.height,
					angle: pos?.angle ?? 0,
					borderRadius: el.borderRadius,
					physicsShape: el.physicsShape,
					polygonPoints: el.polygonPoints,
					alphaRows,
				}
			})
	}, [effectiveElements, bodyPositions, settings.pretextEnabled, animatedAlpha])

	// Compute start cursors for text continuation chains.
	// E.g. col2 continues from col1, col3 from col2 — we run computeTextFlow
	// for predecessors to derive where each successor should start.
	const continuationCursors = useMemo(() => {
		const cursors = new Map<string, LayoutCursor>()
		if (!settings.pretextEnabled) return cursors

		// Build ordered chains starting from each root (elements without textContinuationId)
		const visited = new Set<string>()
		for (const el of textElements) {
			if (el.textContinuationId || visited.has(el.id)) continue
			// Walk the chain forward
			let current: SceneElement | undefined = el
			let prevCursor: LayoutCursor | undefined
			while (current) {
				visited.add(current.id)
				if (prevCursor) {
					cursors.set(current.id, prevCursor)
				}
				// Find next element in chain
				const nextEl = nextTextElementByContinuationId.get(current.id)
				if (!nextEl) break

				// Compute flow for current element to get end cursor
				const fs = current.fontSize ?? 16
				const font = buildFontString(fs, current.fontWeight, current.fontFamily, current.fontStyle)
				const pad = current.padding ?? 0
				const flowResult = computeTextFlow(
					current.text!,
					font,
					current.lineHeight ?? 28,
					current.rect.x + pad,
					current.rect.y + pad,
					current.rect.width - pad * 2,
					(textMaxHeights.get(current.id) ?? current.rect.height) - pad * 2,
					obstacles,
					8,
					current.minSegmentWidth ?? (current.type === "heading" ? 80 : 8),
					current.allowWordBreaks ??
						(current.type === "heading" ? false : settings.allowWordBreaks),
					prevCursor,
				)
				prevCursor = flowResult.endCursor
				current = nextEl
			}
		}
		return cursors
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		textElements,
		textMaxHeights,
		obstacles,
		settings.pretextEnabled,
		settings.allowWordBreaks,
		nextTextElementByContinuationId,
	])

	const handleExplode = useCallback(() => physicsRef.current?.explode(), [])
	const handleReset = useCallback((keepComponents?: boolean) => {
		if (!keepComponents) {
			// Remove manually added elements from physics and state
			for (const id of addedElementIdsRef.current) {
				physicsRef.current?.removeBody(id)
			}
			addedElementIdsRef.current.clear()
			setAddedElements([])
		}
		physicsRef.current?.reset()
	}, [])
	const handleToggleThrowable = useCallback(
		(elementId: string) => {
			if (!onSceneChange) return
			const allElements = [...scene.elements, ...addedElements]
			onSceneChange(
				{
					...scene,
					elements: allElements.map((el) =>
						el.id === elementId ? { ...el, throwable: !el.throwable } : el,
					),
				},
				false,
			)
			setAddedElements([])
			addedElementIdsRef.current.clear()
		},
		[scene, onSceneChange, addedElements],
	)

	const saveCandidates = useMemo(() => {
		return effectiveElements
			.filter(
				(el) =>
					el.type !== "divider" &&
					!(el.type === "paragraph" && !el.throwable) &&
					!(el.type === "heading" && !el.throwable),
			)
			.map((el) => {
				const pos = bodyPositions.get(el.id)
				return {
					id: el.id,
					element: el,
					x: pos?.x ?? el.rect.x,
					y: pos?.y ?? el.rect.y,
					width: pos?.w ?? el.rect.width,
					height: pos?.h ?? el.rect.height,
					borderRadius: el.borderRadius,
					saved: savedIds.has(el.sourceSavedId ?? el.id),
				}
			})
	}, [effectiveElements, bodyPositions, savedIds])

	const pickerElements = useMemo(
		() =>
			effectiveElements.map((el) => {
				const pos = bodyPositions.get(el.id)
				return pos ? { ...el, rect: { ...el.rect, x: pos.x, y: pos.y } } : el
			}),
		[effectiveElements, bodyPositions],
	)

	const handleDeletePickerElement = useCallback(
		(id: string) => {
			// If it's an added element, just remove from local state
			if (addedElementIdsRef.current.has(id)) {
				physicsRef.current?.removeBody(id)
				addedElementIdsRef.current.delete(id)
				setAddedElements((prev) => prev.filter((el) => el.id !== id))
				return
			}
			if (!onSceneChange) return
			const allElements = [...scene.elements, ...addedElements]
			onSceneChange({ ...scene, elements: allElements.filter((el) => el.id !== id) }, false)
			setAddedElements([])
			addedElementIdsRef.current.clear()
		},
		[onSceneChange, scene, addedElements],
	)

	const lineCountRef = useRef(0)
	const reportLines = useCallback((count: number) => {
		lineCountRef.current += count
	}, [])
	useEffect(() => {
		lineCountRef.current = 0
		const t = setTimeout(() => setTotalLineCount(lineCountRef.current), 50)
		return () => clearTimeout(t)
	}, [])

	// Sync glyph bodies into physics engine incrementally.
	useEffect(() => {
		const engine = physicsRef.current
		if (!engine) return
		const desiredIds = new Set(textBodyElements.map((el) => el.id))
		for (const id of [...engine.bodies.keys()]) {
			if (id.includes("-text-body-") && !desiredIds.has(id)) engine.removeBody(id)
		}
		for (const el of textBodyElements) {
			if (!engine.bodies.has(el.id)) engine.addBody(el)
		}
	}, [textBodyElements])

	// Sync added element bodies into physics engine (e.g. after engine recreation).
	useEffect(() => {
		const engine = physicsRef.current
		if (!engine) return
		for (const el of addedElements) {
			if (!engine.bodies.has(el.id)) engine.addBody(el)
		}
	}, [addedElements])

	const handleDropSavedOnScene = useCallback(
		(saved: SavedElement, dropX?: number, dropY?: number) => {
			const el: SceneElement = {
				...saved.element,
				id: `dropped-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
				throwable: true,
				pinned: false,
				rect: {
					...saved.element.rect,
					x:
						dropX != null
							? dropX - saved.element.rect.width / 2
							: (scene.width - saved.element.rect.width) / 2 + (Math.random() - 0.5) * 120,
					y:
						dropY != null
							? dropY - saved.element.rect.height / 2
							: window.scrollY +
								window.innerHeight / 2 -
								saved.element.rect.height / 2 +
								(Math.random() - 0.5) * 60,
				},
			}
			addedElementIdsRef.current.add(el.id)
			setAddedElements((prev) => [...prev, el])
			physicsRef.current?.addBody(el)
		},
		[scene.width, scene.height],
	)

	const handleDropImageFilesOnScene = useCallback(
		(files: File[], dropX: number, dropY: number) => {
			saveStashImageFiles(files)
			void (async () => {
				const newElements: SceneElement[] = []
				for (const file of files) {
					const saved = await savedElementFromImageFile(file, scene.name)
					if (!saved) continue
					const el: SceneElement = {
						...saved.element,
						id: `dropped-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
						throwable: true,
						pinned: false,
						rect: {
							...saved.element.rect,
							x: dropX - saved.element.rect.width / 2,
							y: dropY - saved.element.rect.height / 2,
						},
					}
					newElements.push(el)
				}
				if (!newElements.length) return
				for (const el of newElements) {
					addedElementIdsRef.current.add(el.id)
				}
				setAddedElements((prev) => [...prev, ...newElements])
				for (const el of newElements) {
					physicsRef.current?.addBody(el)
				}
			})()
		},
		[saveStashImageFiles, scene.name],
	)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = "copy"
	}, [])
	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			try {
				const data = JSON.parse(e.dataTransfer.getData("application/domino-saved"))
				if (data) {
					const rect = e.currentTarget.getBoundingClientRect()
					handleDropSavedOnScene(data as SavedElement, e.clientX - rect.left, e.clientY - rect.top)
					return
				}
			} catch {
				/* not a valid stash drop */
			}
			const imageFiles = Array.from(e.dataTransfer.files).filter(isAcceptableStashImageFile)
			if (imageFiles.length > 0) {
				const rect = e.currentTarget.getBoundingClientRect()
				handleDropImageFilesOnScene(imageFiles, e.clientX - rect.left, e.clientY - rect.top)
			}
		},
		[handleDropSavedOnScene, handleDropImageFilesOnScene],
	)

	return (
		<div
			style={{
				position: "relative",
				width: scene.width,
				height: scene.height,
				...getBackgroundStyle(scene.backgroundColor),
				overflow: "hidden",
				cursor: "grab",
			}}
		>
			<div
				ref={containerRef}
				style={{
					position: "absolute",
					inset: 0,
					width: scene.width,
					height: scene.height,
					cursor: "grab",
					userSelect: "none",
					WebkitUserSelect: "none",
					touchAction: "none",
				}}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				{staticElements.map((el) => (
					<PhysicsDomItem
						key={el.id}
						element={el}
						x={el.rect.x}
						y={el.rect.y}
						angle={0}
						isPhysicsEnabled={false}
						showDebug={false}
					/>
				))}

				<SceneTextLayer
					settings={settings}
					textElements={textElements}
					textBodyElements={textBodyElements}
					bodyPositions={bodyPositions}
					obstacles={obstacles}
					textMaxHeights={textMaxHeights}
					continuationCursors={continuationCursors}
					textMeasureRefs={textMeasureRefs}
					onLineCount={reportLines}
				/>

				{throwableElements.map((el) => {
					const pos = bodyPositions.get(el.id)
					const alphaEntry = animatedAlpha[el.id]
					return (
						<PhysicsDomItem
							key={el.id}
							element={el}
							x={pos?.x ?? el.rect.x}
							y={pos?.y ?? el.rect.y}
							angle={pos?.angle ?? 0}
							isPhysicsEnabled={settings.physicsEnabled}
							showDebug={settings.showObstacleBounds}
							alphaBounds={alphaEntry?.bounds}
							alphaRows={alphaEntry?.rows ?? el.alphaRows}
							animatedGifController={alphaEntry?.controller}
							isAnimationPaused={gifPlaybackPaused}
						/>
					)
				})}

				{settings.showObstacleBounds &&
					obstacles.map((obs) => {
						const aabb = getObstacleAABB(obs)
						return (
							<div
								key={`aabb-${obs.id}`}
								style={{
									position: "absolute",
									left: aabb.left,
									top: aabb.top,
									width: aabb.right - aabb.left,
									height: aabb.bottom - aabb.top,
									border: "1px dashed rgba(231,76,60,0.35)",
									backgroundColor: "rgba(231,76,60,0.04)",
									pointerEvents: "none",
									zIndex: 99,
									boxSizing: "border-box",
								}}
							/>
						)
					})}

				{pickerMode === "throwable" && (
					<ThrowablePicker
						elements={pickerElements}
						savedElements={savedElements}
						onToggle={handleToggleThrowable}
						onSave={onSaveElement}
						onUnsave={onUnsaveElement}
						onDelete={handleDeletePickerElement}
						onClose={handleClosePicker}
					/>
				)}

				{pickerMode === "save" && (
					<QuickSavePicker
						candidates={saveCandidates}
						onSave={onSaveElement}
						onUnsave={onUnsaveElement}
						onClose={handleClosePicker}
					/>
				)}
			</div>

			<SettingsContext
				value={{
					settings,
					setSettings,
					fps,
					bodyCount: throwableElements.length + textBodyElements.length,
					lineCount: settings.textBodiesEnabled ? 0 : totalLineCount,
					onResetAll: onResetAll ?? NOOP,
				}}
			>
				<Toolbar
					onExplode={handleExplode}
					onReset={handleReset}
					onTogglePicker={handleTogglePicker}
					pickerMode={pickerMode}
					onToggleSavePicker={handleToggleSavePicker}
					onDropSaved={handleDropSavedOnScene}
				/>
			</SettingsContext>
		</div>
	)
}
