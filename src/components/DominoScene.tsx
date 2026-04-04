import type { LayoutCursor } from "@chenglou/pretext"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CustomPage } from "../App"
import { useAnimatedAlpha } from "../hooks/useAnimatedAlpha"
import { usePhysicsLoop } from "../hooks/usePhysicsLoop"
import { usePickerPause } from "../hooks/usePickerPause"
import type { PhysicsEngine } from "../physics/engine"
import { createPhysicsEngine } from "../physics/engine"
import type { PresetKey } from "../scene/presets"
import type { ObstacleRect, SavedElement, SceneDescription, SceneElement } from "../scene/types"
import { measureGlyphBodiesFromDomNode } from "../textflow/glyphBodies"
import { getObstacleAABB } from "../textflow/obstacles"
import { computeTextFlow } from "../textflow/useTextFlow"
import { buildFontString } from "../utils/fonts"
import { isAcceptableStashImageFile } from "../utils/stashImageFromFile"
import { getBackgroundStyle } from "../utils/styles"
import { PhysicsDomItem } from "./PhysicsDomItem"
import { QuickSavePicker } from "./QuickSavePicker"
import { TextFlowRegion } from "./TextFlowRegion"
import { ThrowablePicker } from "./ThrowablePicker"
import type { DebugSettings } from "./Toolbar"
import { Toolbar } from "./Toolbar"

const NOOP_SELECT_CUSTOM_PAGE: (id: string) => void = () => {}
const NOOP_RESET_ALL = () => {}

interface DominoSceneProps {
	scene: SceneDescription
	onSceneChange?: (scene: SceneDescription, remount?: boolean) => void
	currentPreset: PresetKey | "custom"
	onSelectPreset: (key: PresetKey) => void
	onImportHtml: (html: string, name: string) => void
	onFetchUrl: (url: string) => Promise<void>
	savedElements: SavedElement[]
	onSaveElement: (el: SceneElement) => void
	onUnsaveElement: (id: string) => void
	onDropSaved: (saved: SavedElement, x?: number, y?: number) => void
	onClearSaved: () => void
	onRemoveSaved: (index: number) => void
	onSaveStashImageFiles?: (files: File[]) => void
	onDropImageFiles?: (files: File[], x: number, y: number) => void
	customPages?: CustomPage[]
	activeCustomId?: string | null
	onSelectCustomPage?: (id: string) => void
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

export function DominoScene({
	scene,
	onSceneChange,
	currentPreset,
	onSelectPreset,
	onImportHtml,
	onFetchUrl,
	savedElements,
	onSaveElement,
	onUnsaveElement,
	onDropSaved,
	onClearSaved,
	onRemoveSaved,
	onSaveStashImageFiles,
	onDropImageFiles,
	customPages,
	activeCustomId,
	onSelectCustomPage,
	onResetAll,
}: DominoSceneProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const physicsRef = useRef<PhysicsEngine | null>(null)

	const [generation, setGeneration] = useState(0)
	const [totalLineCount, setTotalLineCount] = useState(0)
	const [textBodyElements, setTextBodyElements] = useState<SceneElement[]>([])
	const textMeasureRefs = useRef<Map<string, HTMLDivElement>>(new Map())
	const effectiveElements = scene.elements

	const animatedAlpha = useAnimatedAlpha(effectiveElements)

	// Compute a generation counter that changes when animated alpha changes
	const animatedAlphaGeneration = useMemo(() => {
		let gen = 0
		for (const entry of Object.values(animatedAlpha)) {
			if (entry.rows) gen += entry.rows.length
			if (entry.bounds) gen += Math.round(entry.bounds.left * 1000 + entry.bounds.right * 1000)
		}
		return gen
	}, [animatedAlpha])

	// Update physics body bounds when alpha changes for animated images
	useEffect(() => {
		const physics = physicsRef.current
		if (!physics) return

		for (const [id, entry] of Object.entries(animatedAlpha)) {
			physics.updateAlphaBounds(id, entry.bounds)
		}
	}, [animatedAlpha])

	const [settings, setSettings] = useState<DebugSettings>({
		physicsEnabled: true,
		showObstacleBounds: false,
		showLineBounds: false,
		gravityX: 0,
		gravityY: 0,
		paused: false,
		pretextEnabled: true,
		textBodiesEnabled: false,
		maxAutoSelectComponents: 500,
		allowWordBreaks: true,
		restitution: 0.3,
	})

	const {
		pickerMode,
		savePickerMode,
		handleTogglePicker,
		handleToggleSavePicker,
		handleClosePicker,
		handleCloseSavePicker,
	} = usePickerPause({ physicsRef, isPaused: settings.paused })

	const bumpGeneration = useCallback(() => setGeneration((g) => g + 1), [])
	const { bodyPositions, fps } = usePhysicsLoop({
		physicsRef,
		physicsEnabled: settings.physicsEnabled,
		gravityX: settings.gravityX,
		gravityY: settings.gravityY,
		restitution: settings.restitution,
		onPositionsChanged: bumpGeneration,
	})

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

	useEffect(() => {
		const container = containerRef.current
		if (!container) return
		const engine = createPhysicsEngine(scene, container)
		physicsRef.current = engine
		return () => {
			engine.destroy()
			physicsRef.current = null
		}
	}, [scene])

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
	const handleReset = useCallback(() => {
		physicsRef.current?.reset()
	}, [])
	const handleToggleThrowable = useCallback(
		(elementId: string) => {
			if (!onSceneChange) return
			onSceneChange(
				{
					...scene,
					elements: scene.elements.map((el) =>
						el.id === elementId ? { ...el, throwable: !el.throwable } : el,
					),
				},
				false,
			)
		},
		[scene, onSceneChange],
	)

	const handleSaveElement = useCallback((el: SceneElement) => onSaveElement(el), [onSaveElement])

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
					saved: savedIds.has(el.id),
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
			if (!onSceneChange) return
			onSceneChange({ ...scene, elements: scene.elements.filter((el) => el.id !== id) }, false)
		},
		[onSceneChange, scene],
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
					onDropSaved(data as SavedElement, e.clientX - rect.left, e.clientY - rect.top)
					return
				}
			} catch {
				/* not a valid stash drop */
			}
			const imageFiles = Array.from(e.dataTransfer.files).filter(isAcceptableStashImageFile)
			if (imageFiles.length > 0) {
				const rect = e.currentTarget.getBoundingClientRect()
				onDropImageFiles?.(imageFiles, e.clientX - rect.left, e.clientY - rect.top)
			}
		},
		[onDropSaved, onDropImageFiles],
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

				{/* Invisible measurement layer — renders text at its natural position so we can
            use Range.getClientRects() on each grapheme to place glyph bodies. */}
				{settings.textBodiesEnabled && (
					<div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
						{textElements.map((el) => {
							const pad = el.padding ?? 0
							return (
								<div
									key={`measure-${el.id}`}
									ref={(node) => {
										if (node) textMeasureRefs.current.set(el.id, node)
										else textMeasureRefs.current.delete(el.id)
									}}
									style={{
										position: "absolute",
										left: el.rect.x + pad,
										top: el.rect.y + pad,
										width: el.rect.width - pad * 2,
										fontSize: el.fontSize ?? 16,
										fontWeight: el.fontWeight ?? 400,
										fontStyle: el.fontStyle ?? "normal",
										fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif',
										lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6",
										color: "transparent",
										letterSpacing: el.letterSpacing,
										textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined,
										whiteSpace: "pre-wrap",
										overflowWrap: "break-word",
									}}
								>
									{el.text}
								</div>
							)
						})}
					</div>
				)}

				{/* Letter bodies — one PhysicsDomItem per glyph */}
				{settings.textBodiesEnabled &&
					textBodyElements.map((el) => {
						const pos = bodyPositions.get(el.id)
						return (
							<PhysicsDomItem
								key={el.id}
								element={el}
								x={pos?.x ?? el.rect.x}
								y={pos?.y ?? el.rect.y}
								angle={pos?.angle ?? 0}
								isPhysicsEnabled={settings.physicsEnabled}
								showDebug={settings.showObstacleBounds}
							/>
						)
					})}

				{/* Live reflow text — hidden when letter-body mode is on */}
				{!settings.textBodiesEnabled &&
					(settings.pretextEnabled
						? textElements.map((el) => {
								const fs = el.fontSize ?? 16
								const font = buildFontString(fs, el.fontWeight, el.fontFamily, el.fontStyle)
								const pad = el.padding ?? 0
								const flowMinSegmentWidth = el.minSegmentWidth ?? (el.type === "heading" ? 80 : 8)
								const allowWordBreaks =
									el.allowWordBreaks ?? (el.type === "heading" ? false : settings.allowWordBreaks)
								const startCursor = continuationCursors.get(el.id)
								return (
									<TextFlowRegion
										key={el.id}
										text={el.text!}
										font={font}
										fontSize={fs}
										lineHeight={el.lineHeight ?? 28}
										color={el.color ?? "#333"}
										opacity={el.opacity}
										letterSpacing={el.letterSpacing}
										textAlign={el.textAlign}
										containerX={el.rect.x + pad}
										containerY={el.rect.y + pad}
										containerWidth={el.rect.width - pad * 2}
										containerMaxHeight={(textMaxHeights.get(el.id) ?? el.rect.height) - pad * 2}
										obstacles={obstacles}
										showDebug={settings.showLineBounds}
										generation={generation + animatedAlphaGeneration}
										onLineCount={reportLines}
										minSegmentWidth={flowMinSegmentWidth}
										allowWordBreaks={allowWordBreaks}
										startCursor={startCursor}
									/>
								)
							})
						: textElements.map((el) => {
								const pad = el.padding ?? 0
								return (
									<div
										key={el.id}
										style={{
											position: "absolute",
											left: el.rect.x + pad,
											top: el.rect.y + pad,
											width: el.rect.width - pad * 2,
											fontSize: el.fontSize ?? 16,
											fontWeight: el.fontWeight ?? 400,
											fontStyle: el.fontStyle ?? "normal",
											fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif',
											lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6",
											color: el.color ?? "#333",
											opacity: el.opacity,
											letterSpacing: el.letterSpacing,
											textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined,
											pointerEvents: "none",
											zIndex: 2,
										}}
									>
										{el.text}
									</div>
								)
							}))}

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

				{pickerMode && (
					<ThrowablePicker
						elements={pickerElements}
						savedElements={savedElements}
						onToggle={handleToggleThrowable}
						onSave={handleSaveElement}
						onUnsave={onUnsaveElement}
						onDelete={handleDeletePickerElement}
						onClose={handleClosePicker}
					/>
				)}

				{savePickerMode && (
					<QuickSavePicker
						candidates={saveCandidates}
						onSave={handleSaveElement}
						onUnsave={onUnsaveElement}
						onClose={handleCloseSavePicker}
					/>
				)}
			</div>

			<Toolbar
				settings={settings}
				onSettingsChange={setSettings}
				onExplode={handleExplode}
				onReset={handleReset}
				onTogglePicker={handleTogglePicker}
				pickerMode={pickerMode}
				savePickerMode={savePickerMode}
				onToggleSavePicker={handleToggleSavePicker}
				fps={fps}
				bodyCount={throwableElements.length + textBodyElements.length}
				lineCount={settings.textBodiesEnabled ? 0 : totalLineCount}
				currentPreset={currentPreset}
				onSelectPreset={onSelectPreset}
				onImportHtml={onImportHtml}
				onFetchUrl={onFetchUrl}
				savedElements={savedElements}
				onDropSaved={onDropSaved}
				onSaveStashImageFiles={onSaveStashImageFiles}
				onClearSaved={onClearSaved}
				onRemoveSaved={onRemoveSaved}
				customPages={customPages ?? []}
				activeCustomId={activeCustomId ?? null}
				onSelectCustomPage={onSelectCustomPage ?? NOOP_SELECT_CUSTOM_PAGE}
				onResetAll={onResetAll ?? NOOP_RESET_ALL}
			/>
		</div>
	)
}
