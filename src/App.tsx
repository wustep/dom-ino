import { useCallback, useEffect, useMemo, useState } from "react"
import { DominoScene } from "./components/DominoScene"
import { FetchOverlay, Hint, PageReloadOverlay } from "./components/Overlays"
import { SnapshotPageView } from "./components/SnapshotPageView"
import { NavigationContext } from "./contexts/NavigationContext"
import { SavedElementsContext } from "./contexts/SavedElementsContext"
import { usePageNavigation } from "./hooks/usePageNavigation"
import type { PresetKey } from "./scene/presets"
import { DEFAULT_PRESET } from "./scene/presets"
import type { SavedElement, SceneElement } from "./scene/types"
import { clearPersistedState, loadState, saveState } from "./utils/persistence"
import { savedElementFromImageFile } from "./utils/stashImageFromFile"

interface AppProps {
	initialFetchUrl?: string | null
	initialPreset?: PresetKey | null
}

export default function App({ initialFetchUrl = null, initialPreset = null }: AppProps) {
	// Prevent browser from navigating away when files are dropped outside the scene container
	useEffect(() => {
		const prevent = (e: DragEvent) => e.preventDefault()
		window.addEventListener("dragover", prevent)
		window.addEventListener("drop", prevent)
		return () => {
			window.removeEventListener("dragover", prevent)
			window.removeEventListener("drop", prevent)
		}
	}, [])

	const persisted = useMemo(() => loadState(), [])
	const [savedElements, setSavedElements] = useState<SavedElement[]>(persisted.savedElements ?? [])

	const nav = usePageNavigation({ persisted, initialFetchUrl, initialPreset })

	// Persist state on changes
	useEffect(() => {
		saveState({
			currentPreset: nav.currentPreset,
			activeCustomId: nav.activeCustomId,
			savedElements,
			customPages: nav.customPages,
		})
	}, [nav.currentPreset, nav.activeCustomId, savedElements, nav.customPages])

	// ─── Saved element handlers ───

	const handleSaveElement = useCallback(
		(el: SceneElement) => {
			setSavedElements((prev) => {
				const sourceName = nav.activeCustomPage?.name ?? nav.scene?.name ?? "Imported Page"
				if (prev.some((s) => s.element.id === el.id && s.sourceScene === sourceName)) return prev
				return [...prev, { element: { ...el }, savedAt: Date.now(), sourceScene: sourceName }]
			})
		},
		[nav.activeCustomPage, nav.scene?.name],
	)

	const handleUnsaveElement = useCallback((id: string) => {
		setSavedElements((prev) => prev.filter((s) => s.element.id !== id))
	}, [])

	const handleDropSaved = useCallback(
		(saved: SavedElement, dropX?: number, dropY?: number) => {
			if (!nav.scene) return
			const el = { ...saved.element }
			el.id = `dropped-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
			el.throwable = true
			el.pinned = false
			el.rect = {
				...el.rect,
				x:
					dropX != null
						? dropX - el.rect.width / 2
						: (nav.windowSize.width - el.rect.width) / 2 + (Math.random() - 0.5) * 120,
				y:
					dropY != null
						? dropY - el.rect.height / 2
						: window.scrollY +
							nav.windowSize.height / 2 -
							el.rect.height / 2 +
							(Math.random() - 0.5) * 60,
			}
			const newScene = { ...nav.scene, elements: [...nav.scene.elements, el] }
			nav.ensureCustomScenePage(newScene)
		},
		[nav.scene, nav.ensureCustomScenePage, nav.windowSize],
	)

	const handleRemoveSaved = useCallback((index: number) => {
		setSavedElements((prev) => prev.filter((_, i) => i !== index))
	}, [])

	const handleSaveStashImageFiles = useCallback(
		(files: File[]) => {
			void (async () => {
				const sourceName = nav.activeCustomPage?.name ?? nav.scene?.name ?? "Dropped image"
				const next: SavedElement[] = []
				for (const file of files) {
					const saved = await savedElementFromImageFile(file, sourceName)
					if (saved) next.push(saved)
				}
				if (next.length) setSavedElements((prev) => [...prev, ...next])
			})()
		},
		[nav.activeCustomPage?.name, nav.scene?.name],
	)

	const handleDropImageFilesOnScene = useCallback(
		(files: File[], dropX: number, dropY: number) => {
			void (async () => {
				const sourceName = nav.scene?.name ?? "Dropped image"
				const newSaved: SavedElement[] = []
				for (const file of files) {
					const saved = await savedElementFromImageFile(file, sourceName)
					if (saved) newSaved.push(saved)
				}
				if (!newSaved.length) return
				setSavedElements((prev) => [...prev, ...newSaved])
				if (!nav.scene) return
				const newElements: SceneElement[] = newSaved.map((saved) => ({
					...saved.element,
					id: `dropped-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
					throwable: true,
					pinned: false,
					rect: {
						...saved.element.rect,
						x: dropX - saved.element.rect.width / 2,
						y: dropY - saved.element.rect.height / 2,
					},
				}))
				const newScene = { ...nav.scene, elements: [...nav.scene.elements, ...newElements] }
				nav.ensureCustomScenePage(newScene)
			})()
		},
		[nav.scene, nav.ensureCustomScenePage],
	)

	const handleResetAll = useCallback(() => {
		clearPersistedState()
		nav.setCurrentPreset(DEFAULT_PRESET)
		nav.setCustomPages([])
		nav.setActiveCustomId(null)
		setSavedElements([])
		nav.setSceneKey((k) => k + 1)
	}, [nav])

	// ─── Context values ───

	const savedElementsCtx = useMemo(
		() => ({
			savedElements,
			saveElement: handleSaveElement,
			unsaveElement: handleUnsaveElement,
			removeSaved: handleRemoveSaved,
			saveStashImageFiles: handleSaveStashImageFiles,
		}),
		[
			savedElements,
			handleSaveElement,
			handleUnsaveElement,
			handleRemoveSaved,
			handleSaveStashImageFiles,
		],
	)

	const navigationCtx = useMemo(
		() => ({
			currentPreset: nav.currentPreset,
			customPages: nav.customPages,
			activeCustomId: nav.activeCustomId,
			onSelectPreset: nav.handleSelectPreset,
			onSelectCustomPage: nav.handleSelectCustomPage,
			onImportHtml: nav.handleImportHtml,
			onFetchUrl: nav.handleFetchUrl,
		}),
		[
			nav.currentPreset,
			nav.customPages,
			nav.activeCustomId,
			nav.handleSelectPreset,
			nav.handleSelectCustomPage,
			nav.handleImportHtml,
			nav.handleFetchUrl,
		],
	)

	// ─── Render ───

	return (
		<NavigationContext value={navigationCtx}>
			<SavedElementsContext value={savedElementsCtx}>
				{nav.activeCustomPage?.kind === "snapshot" && !nav.activeCustomPage.preparedHtml ? (
					<PageReloadOverlay
						url={nav.activeCustomPage.sourceUrl}
						error={nav.refetchError}
						onRetry={nav.handleRetryRefetch}
						onBack={nav.handleRemoveActivePage}
					/>
				) : nav.activeCustomPage?.kind === "snapshot" ? (
					<SnapshotPageView
						key={nav.sceneKey}
						page={nav.activeCustomPage}
						onResetAll={handleResetAll}
					/>
				) : nav.scene ? (
					<DominoScene
						key={nav.sceneKey}
						scene={nav.scene}
						onSceneChange={nav.handleSceneChange}
						onDropSaved={handleDropSaved}
						onDropImageFiles={handleDropImageFilesOnScene}
						onResetAll={handleResetAll}
					/>
				) : null}
				{nav.fetchingUrl && <FetchOverlay url={nav.fetchingUrl} />}
				{nav.showHint && <Hint />}
			</SavedElementsContext>
		</NavigationContext>
	)
}
