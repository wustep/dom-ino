import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useSavedElements } from "../contexts/SavedElementsContext"
import { type SceneSettings, SettingsContext } from "../contexts/SettingsContext"
import { useImportedTextLayouts } from "../hooks/useImportedTextLayouts"
import { useScenePhysics } from "../hooks/useScenePhysics"
import { useSnapshotScanner } from "../hooks/useSnapshotScanner"
import type { PhysicsEngine } from "../physics/engine"
import { createPhysicsEngine } from "../physics/engine"
import {
	isStaticTextFlowObstacleCandidate,
	restoreHiddenNodes,
	restoreRevealedAncestors,
	revealHiddenAncestors,
	type SnapshotCandidate,
	type SnapshotTextBlock,
	syncHiddenNodes,
} from "../scene/snapshotHelpers"
import { hasMovedImportedElement, hasRenderableImportedText } from "../scene/snapshotViewUtils"
import type { ObstacleRect, SavedElement, SceneElement, SnapshotCustomPage } from "../scene/types"
import { measureGlyphBodiesFromDomNode } from "../textflow/glyphBodies"
import { isAcceptableStashImageFile, savedElementFromImageFile } from "../utils/stashImageFromFile"
import { QuickSavePicker } from "./picker/QuickSavePicker"
import {
	SnapshotPickerOverlay,
	type SnapshotPickerOverlayItem,
} from "./picker/SnapshotPickerOverlay"
import { SnapshotPhysicsOverlay } from "./SnapshotPhysicsOverlay"
import { SnapshotTextLayer } from "./SnapshotTextLayer"
import { Toolbar } from "./Toolbar"

interface SnapshotPageViewProps {
	page: SnapshotCustomPage
	onResetAll: () => void
}

function compareTextBlockPosition(a: SnapshotTextBlock, b: SnapshotTextBlock) {
	const ay = a.sceneElement.rect.y
	const by = b.sceneElement.rect.y
	if (Math.abs(ay - by) > 1) return ay - by
	return a.sceneElement.rect.x - b.sceneElement.rect.x
}

/** Renders a fetched/imported web page in an iframe with physics-enabled element clones and text reflow overlay. */
export function SnapshotPageView({ page, onResetAll }: SnapshotPageViewProps) {
	const {
		savedElements,
		saveElement: onSaveElement,
		unsaveElement: onUnsaveElement,
	} = useSavedElements()
	const iframeRef = useRef<HTMLIFrameElement | null>(null)
	const stageRef = useRef<HTMLDivElement | null>(null)
	const physicsRef = useRef<PhysicsEngine | null>(null)
	const hiddenSelectedNodesRef = useRef<Map<HTMLElement, string>>(new Map())
	const hiddenTextNodesRef = useRef<Map<HTMLElement, string>>(new Map())
	const [droppedElements, setDroppedElements] = useState<SceneElement[]>([])
	const [importedTextBodyElements, setImportedTextBodyElements] = useState<SceneElement[]>([])
	const [importedTextBodyBlockIds, setImportedTextBodyBlockIds] = useState<Set<string>>(new Set())
	const [settings, setSettings] = useState<SceneSettings>({
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
		handleTogglePicker,
		handleToggleSavePicker,
		handleClosePicker,
		bodyPositions,
		fps,
		animatedAlpha,
		gifPlaybackPaused,
	} = useScenePhysics({ physicsRef, settings, animatedElements: droppedElements })

	const {
		candidates,
		textBlocks,
		textBodyBlocks,
		selectableCandidates,
		selectedIds,
		iframeHeight,
		iframeLoaded,
		nodesRef,
		textNodesRef,
		handleIframeLoad,
		requestRescan,
		toggleSelected,
		saveNode,
		unsaveNode,
	} = useSnapshotScanner({
		iframeRef,
		stageRef,
		pageId: page.id,
		sourceUrl: page.sourceUrl,
		preparedHtml: page.preparedHtml,
		maxAutoSelectComponents: settings.maxAutoSelectComponents,
		savedElements,
		onSaveElement,
		onUnsaveElement,
	})

	// Filter out selected elements whose DOM nodes are descendants of another
	// selected element — the parent clone already includes them visually.
	const selectedCandidates = useMemo(() => {
		const selected = selectableCandidates.filter((c) => selectedIds.has(c.id) && c.sceneElement)
		return selected.filter(
			(c) => !selected.some((other) => other.id !== c.id && other.node.contains(c.node)),
		)
	}, [selectableCandidates, selectedIds])

	const activeSelectedIds = useMemo(
		() => new Set(selectedCandidates.map((candidate) => candidate.id)),
		[selectedCandidates],
	)

	const selectableCandidateMap = useMemo(
		() => new Map(selectableCandidates.map((candidate) => [candidate.id, candidate])),
		[selectableCandidates],
	)

	const savedElementIds = useMemo(
		() => new Set(savedElements.map((saved) => saved.element.id)),
		[savedElements],
	)

	useLayoutEffect(() => {
		const desiredNodes = pickerMode
			? []
			: Array.from(activeSelectedIds)
					.map((id) => nodesRef.current.get(id))
					.filter((node): node is HTMLElement => Boolean(node))
		syncHiddenNodes(hiddenSelectedNodesRef.current, desiredNodes)
	}, [activeSelectedIds, nodesRef, pickerMode])

	useEffect(() => {
		const hiddenSelectedNodes = hiddenSelectedNodesRef.current
		return () => restoreHiddenNodes(hiddenSelectedNodes)
	}, [])

	const selectedElements = useMemo(() => {
		return selectedCandidates.map((c) => ({
			...c.sceneElement!,
			id: c.id,
			throwable: true,
			pinned: false,
		}))
	}, [selectedCandidates])

	const staticObstacleCandidates = useMemo(() => {
		const sourceWindow = iframeRef.current?.contentWindow ?? null
		const obstacleCandidates: SnapshotCandidate[] = []

		for (const candidate of candidates) {
			if (!isStaticTextFlowObstacleCandidate(candidate, sourceWindow)) continue
			if (selectedCandidates.some((selected) => selected.node.contains(candidate.node))) {
				continue
			}
			if (obstacleCandidates.some((existing) => existing.node.contains(candidate.node))) {
				continue
			}
			obstacleCandidates.push(candidate)
		}

		return obstacleCandidates
	}, [candidates, selectedCandidates])

	const hasMovedSelectedElements = useMemo(
		() => selectedElements.some((el) => hasMovedImportedElement(el, bodyPositions.get(el.id))),
		[bodyPositions, selectedElements],
	)

	const importedTextFlowActive =
		!settings.textBodiesEnabled &&
		settings.pretextEnabled &&
		textBlocks.length > 0 &&
		(hasMovedSelectedElements || droppedElements.length > 0)

	const importedTextBodiesActive = settings.textBodiesEnabled && textBodyBlocks.length > 0

	const sortedTextBlocks = useMemo(
		() => [...textBlocks].sort(compareTextBlockPosition),
		[textBlocks],
	)

	// When letter-body mode is active, measure each text block's glyphs from
	// the live iframe DOM and create throwable SceneElements for them.
	useLayoutEffect(() => {
		if (!importedTextBodiesActive || !iframeLoaded) {
			setImportedTextBodyElements([])
			setImportedTextBodyBlockIds(new Set())
			return
		}
		const nextBodies: SceneElement[] = []
		const nextBlockIds = new Set<string>()
		const zeroRect = new DOMRect(0, 0, 0, 0)
		const orderedBlocks = [...textBodyBlocks].sort(compareTextBlockPosition)
		for (const block of orderedBlocks) {
			const revealedNodes = revealHiddenAncestors(block.node)
			try {
				const blockBodies = measureGlyphBodiesFromDomNode(block.node, {
					idPrefix: `${block.id}-imported-text-body`,
					rootRect: zeroRect,
					zIndex: 7,
				})
				if (blockBodies.length === 0) continue
				nextBodies.push(...blockBodies)
				nextBlockIds.add(block.id)
			} finally {
				restoreRevealedAncestors(revealedNodes)
			}
		}
		setImportedTextBodyElements(nextBodies)
		setImportedTextBodyBlockIds(nextBlockIds)
	}, [iframeLoaded, importedTextBodiesActive, textBodyBlocks])

	useEffect(() => {
		const hiddenTextNodes = hiddenTextNodesRef.current
		return () => restoreHiddenNodes(hiddenTextNodes)
	}, [])

	const importedObstacles: ObstacleRect[] = useMemo(() => {
		// When the Pretext text overlay is active (original text hidden), ALL
		// selected elements must be obstacles — even at rest — so text wraps
		// around them. Without this, text renders underneath elements that
		// haven't been moved yet (e.g. floated images, infoboxes).
		const obstacles: ObstacleRect[] = []

		for (const el of [...selectedElements, ...droppedElements]) {
			if (obstacles.some((o) => o.id === el.id)) continue
			// During picker mode, originals are restored at their initial positions,
			// so use el.rect instead of physics bodyPositions for correct reflow.
			const pos = pickerMode ? undefined : bodyPositions.get(el.id)
			// For animated images, use live alpha rows from the hook if available
			const liveAlphaEntry = animatedAlpha[el.id]
			const alphaRows =
				liveAlphaEntry?.rows !== undefined ? (liveAlphaEntry.rows ?? undefined) : el.alphaRows
			obstacles.push({
				id: el.id,
				x: pos?.x ?? el.rect.x,
				y: pos?.y ?? el.rect.y,
				width: pos?.w ?? el.rect.width,
				height: pos?.h ?? el.rect.height,
				angle: pos?.angle ?? 0,
				borderRadius: el.borderRadius,
				alphaRows,
			})
		}

		for (const candidate of staticObstacleCandidates) {
			const el = candidate.sceneElement
			if (!el || obstacles.some((o) => o.id === candidate.id)) continue
			obstacles.push({
				id: candidate.id,
				x: el.rect.x,
				y: el.rect.y,
				width: el.rect.width,
				height: el.rect.height,
				angle: 0,
				borderRadius: el.borderRadius,
				alphaRows: el.alphaRows,
			})
		}

		return obstacles
	}, [
		selectedElements,
		droppedElements,
		staticObstacleCandidates,
		bodyPositions,
		pickerMode,
		animatedAlpha,
	])

	const importedTextLayouts = useImportedTextLayouts(
		importedTextFlowActive,
		sortedTextBlocks,
		importedObstacles,
		iframeHeight,
		iframeRef,
	)

	const savePickerCandidates = useMemo(
		() =>
			selectableCandidates
				.filter((candidate) => candidate.sceneElement)
				.map((candidate) => ({
					id: candidate.id,
					element: candidate.sceneElement!,
					x: candidate.x,
					y: candidate.y,
					width: candidate.width,
					height: candidate.height,
					borderRadius: candidate.borderRadius,
					saved: candidate.saved,
				})),
		[selectableCandidates],
	)

	const handleRemoveDropped = useCallback(
		(id: string) => {
			setDroppedElements((prev) => prev.filter((el) => el.id !== id))
			requestRescan()
		},
		[requestRescan],
	)

	const appendDroppedElements = useCallback(
		(elements: SceneElement[]) => {
			if (elements.length === 0) return
			setDroppedElements((prev) => [...prev, ...elements])
			requestRescan()
		},
		[requestRescan],
	)

	const createDroppedElement = useCallback(
		(saved: SavedElement, x?: number, y?: number): SceneElement => ({
			...saved.element,
			id: `snapshot-drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			sourceSavedId: saved.element.id,
			throwable: true,
			pinned: false,
			rect: {
				...saved.element.rect,
				x:
					x != null
						? x - saved.element.rect.width / 2
						: (stageRef.current?.clientWidth || 1000) / 2 -
							saved.element.rect.width / 2 +
							(Math.random() - 0.5) * 120,
				y:
					y != null
						? y - saved.element.rect.height / 2
						: window.scrollY +
							window.innerHeight / 2 -
							saved.element.rect.height / 2 +
							(Math.random() - 0.5) * 60,
			},
		}),
		[],
	)

	const pickerItems = useMemo<SnapshotPickerOverlayItem[]>(
		() => [
			...selectableCandidates
				.filter((candidate) => candidate.sceneElement)
				.map((candidate) => ({
					id: candidate.id,
					x: candidate.x,
					y: candidate.y,
					width: candidate.width,
					height: candidate.height,
					borderRadius: candidate.borderRadius,
					saved: candidate.saved,
					active: selectedIds.has(candidate.id),
					label: candidate.node.textContent?.trim().slice(0, 20) || "Component",
					onToggle: () => toggleSelected(candidate.id),
					onSave: () => saveNode(candidate.id),
					onUnsave: () => unsaveNode(candidate.id),
				})),
			...droppedElements.map((element) => ({
				id: element.id,
				x: bodyPositions.get(element.id)?.x ?? element.rect.x,
				y: bodyPositions.get(element.id)?.y ?? element.rect.y,
				width: bodyPositions.get(element.id)?.w ?? element.rect.width,
				height: bodyPositions.get(element.id)?.h ?? element.rect.height,
				borderRadius: element.borderRadius,
				saved: savedElementIds.has(element.sourceSavedId ?? element.id),
				active: true,
				label: element.imageAlt || element.text?.trim().slice(0, 20) || element.type,
				onToggle: () => handleRemoveDropped(element.id),
				onSave: () => onSaveElement(element),
				onUnsave: () => onUnsaveElement(element.sourceSavedId ?? element.id),
			})),
		],
		[
			droppedElements,
			handleRemoveDropped,
			onSaveElement,
			onUnsaveElement,
			bodyPositions,
			saveNode,
			savedElementIds,
			selectedIds,
			selectableCandidates,
			toggleSelected,
			unsaveNode,
		],
	)

	const handleExplode = useCallback(() => {
		physicsRef.current?.explode()
	}, [])

	const handleReset = useCallback(() => {
		physicsRef.current?.reset()
	}, [])

	const handleDropSaved = useCallback(
		(saved: SavedElement, x?: number, y?: number) => {
			appendDroppedElements([createDroppedElement(saved, x, y)])
		},
		[appendDroppedElements, createDroppedElement],
	)

	useLayoutEffect(() => {
		const desiredNodes = importedTextFlowActive
			? importedTextLayouts
					.filter((layout) => hasRenderableImportedText(layout.flow))
					.map((layout) => textNodesRef.current.get(layout.id))
					.filter((node): node is HTMLElement => Boolean(node))
			: importedTextBodiesActive
				? Array.from(importedTextBodyBlockIds)
						.map((id) => textNodesRef.current.get(id))
						.filter((node): node is HTMLElement => Boolean(node))
				: []
		syncHiddenNodes(hiddenTextNodesRef.current, desiredNodes)
	}, [
		importedTextBodiesActive,
		importedTextBodyBlockIds,
		importedTextFlowActive,
		importedTextLayouts,
		textNodesRef,
	])

	// Only include dynamic (throwable) elements in the physics scene to avoid
	// recreating the engine when static obstacle lists change. Static obstacles
	// are still tracked for Pretext reflow but don't need physics bodies.
	const physicsElements = useMemo(
		() =>
			iframeLoaded ? [...selectedElements, ...droppedElements, ...importedTextBodyElements] : [],
		[iframeLoaded, selectedElements, droppedElements, importedTextBodyElements],
	)

	const baseOverlayScene = useMemo(
		() => ({
			id: `snapshot-overlay-${page.id}`,
			name: page.name,
			width: stageRef.current?.clientWidth || window.innerWidth,
			height: 1600,
			backgroundColor: "transparent",
			elements: [] as SceneElement[],
		}),
		[page.id, page.name],
	)

	useEffect(() => {
		const stage = stageRef.current
		if (!stage) return
		const engine = createPhysicsEngine(baseOverlayScene, stage)
		physicsRef.current = engine
		return () => {
			engine.destroy()
			physicsRef.current = null
		}
	}, [baseOverlayScene])

	// Sync physics bodies incrementally so adding/removing elements doesn't
	// destroy the engine and reset existing body positions.
	useEffect(() => {
		const engine = physicsRef.current
		if (!engine) return

		engine.resize(stageRef.current?.clientWidth || window.innerWidth, iframeHeight)
	}, [iframeHeight])

	useEffect(() => {
		const engine = physicsRef.current
		if (!engine) return

		const desiredIds = new Set(physicsElements.map((el) => el.id))

		for (const id of engine.bodies.keys()) {
			if (!desiredIds.has(id)) {
				engine.removeBody(id)
			}
		}

		for (const el of physicsElements) {
			if (!engine.bodies.has(el.id)) {
				engine.addBody(el)
			}
		}
	}, [physicsElements])

	useEffect(() => {
		const engine = physicsRef.current
		if (!engine) return
		if (!settings.physicsEnabled || settings.paused || pickerMode !== null) {
			engine.pause()
		} else {
			engine.resume()
		}
	}, [settings.physicsEnabled, settings.paused, pickerMode])

	return (
		<div
			style={{ position: "relative", width: "100%", minHeight: iframeHeight, background: "#fff" }}
		>
			<div
				ref={stageRef}
				style={{
					position: "relative",
					width: "100%",
					minHeight: iframeHeight,
					cursor: settings.physicsEnabled ? "grab" : "default",
					userSelect: "none",
					WebkitUserSelect: "none",
					touchAction: "none",
				}}
				onDragOver={(e) => {
					e.preventDefault()
					e.dataTransfer.dropEffect = "copy"
				}}
				onDrop={(e) => {
					e.preventDefault()
					try {
						const data = JSON.parse(
							e.dataTransfer.getData("application/domino-saved"),
						) as SavedElement
						const rect = e.currentTarget.getBoundingClientRect()
						const x = e.clientX - rect.left
						const y = e.clientY - rect.top
						appendDroppedElements([createDroppedElement(data, x, y)])
						return
					} catch {
						/* ignore */
					}
					const imageFiles = Array.from(e.dataTransfer.files).filter(isAcceptableStashImageFile)
					if (imageFiles.length > 0) {
						const rect = e.currentTarget.getBoundingClientRect()
						const dropX = e.clientX - rect.left
						const dropY = e.clientY - rect.top
						void (async () => {
							const newDropped: SceneElement[] = []
							for (const file of imageFiles) {
								const saved = await savedElementFromImageFile(file, page.name)
								if (saved) {
									onSaveElement(saved.element)
									newDropped.push(createDroppedElement(saved, dropX, dropY))
								}
							}
							appendDroppedElements(newDropped)
						})()
					}
				}}
			>
				<iframe
					ref={iframeRef}
					srcDoc={page.preparedHtml}
					sandbox="allow-same-origin"
					style={{
						width: "100%",
						height: iframeHeight,
						border: "none",
						display: "block",
						background: "#fff",
						pointerEvents: pickerMode !== null || settings.physicsEnabled ? "none" : "auto",
					}}
					onLoad={handleIframeLoad}
				/>

				{pickerMode === "throwable" && (
					<SnapshotPickerOverlay items={pickerItems} onClose={handleClosePicker} />
				)}

				{pickerMode === "save" && (
					<QuickSavePicker
						candidates={savePickerCandidates}
						onSave={onSaveElement}
						onUnsave={onUnsaveElement}
						onClose={handleClosePicker}
					/>
				)}

				<SnapshotTextLayer
					importedTextFlowActive={importedTextFlowActive}
					importedTextLayouts={importedTextLayouts}
					importedObstacles={importedObstacles}
					showLineBounds={settings.showLineBounds}
					importedTextBodiesActive={importedTextBodiesActive}
					importedTextBodyElements={importedTextBodyElements}
					bodyPositions={bodyPositions}
					physicsEnabled={settings.physicsEnabled}
					showObstacleBounds={settings.showObstacleBounds}
					hidden={!!pickerMode}
				/>

				<SnapshotPhysicsOverlay
					selectedElements={selectedElements}
					droppedElements={droppedElements}
					selectableCandidateMap={selectableCandidateMap}
					bodyPositions={bodyPositions}
					animatedAlpha={animatedAlpha}
					gifPlaybackPaused={gifPlaybackPaused}
					iframeWindow={iframeRef.current?.contentWindow ?? window}
					showDebug={settings.showObstacleBounds}
					hidden={!!pickerMode}
				/>
			</div>

			<SettingsContext
				value={{
					settings,
					setSettings,
					fps,
					bodyCount:
						selectedElements.length + droppedElements.length + importedTextBodyElements.length,
					lineCount: 0,
					onResetAll,
				}}
			>
				<Toolbar
					onExplode={handleExplode}
					onReset={handleReset}
					onTogglePicker={handleTogglePicker}
					pickerMode={pickerMode}
					onToggleSavePicker={handleToggleSavePicker}
					onDropSaved={handleDropSaved}
				/>
			</SettingsContext>
		</div>
	)
}
