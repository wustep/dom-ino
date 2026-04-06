import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { isAcceptableStashImageFile, savedElementFromImageFile } from "./utils/stashImageFromFile"

function DropToast({ message, isError }: { message: string; isError?: boolean }) {
	return (
		<div
			style={{
				position: "fixed",
				bottom: 76,
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 100000,
				padding: "10px 20px",
				borderRadius: 10,
				backgroundColor: isError ? "rgba(180, 40, 40, 0.9)" : "rgba(20, 20, 24, 0.88)",
				backdropFilter: "blur(12px)",
				color: "#ddd",
				fontSize: 13,
				fontFamily: '"DM Sans", sans-serif',
				fontWeight: 500,
				boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
				pointerEvents: "none",
				animation: "hintFade 0.5s ease both",
				whiteSpace: "nowrap",
			}}
		>
			{message}
		</div>
	)
}

interface AppProps {
	initialFetchUrl?: string | null
	initialPreset?: PresetKey | null
}

export default function App({ initialFetchUrl = null, initialPreset = null }: AppProps) {
	// ─── Invalid file drop toast ───
	const [dropError, setDropError] = useState<string | null>(null)
	const dropErrorTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

	const showDropError = useCallback((msg: string) => {
		clearTimeout(dropErrorTimer.current)
		setDropError(msg)
		dropErrorTimer.current = setTimeout(() => setDropError(null), 3000)
	}, [])

	useEffect(() => {
		const prevent = (e: DragEvent) => e.preventDefault()

		const onDrop = (e: DragEvent) => {
			e.preventDefault()
			const files = e.dataTransfer?.files
			if (!files || files.length === 0) return
			const allFiles = Array.from(files)
			const hasValidImage = allFiles.some(isAcceptableStashImageFile)
			if (!hasValidImage) {
				const ext = allFiles
					.map((f) => {
						const dot = f.name.lastIndexOf(".")
						return dot >= 0 ? f.name.slice(dot) : f.name
					})
					.join(", ")
				showDropError(`Unsupported file type (${ext}) — drop an image instead`)
			}
		}

		window.addEventListener("dragover", prevent)
		window.addEventListener("drop", onDrop)
		return () => {
			window.removeEventListener("dragover", prevent)
			window.removeEventListener("drop", onDrop)
			clearTimeout(dropErrorTimer.current)
		}
	}, [showDropError])

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
						onResetAll={handleResetAll}
					/>
				) : null}
				{nav.fetchingUrl && <FetchOverlay url={nav.fetchingUrl} />}
				{nav.showHint && <Hint />}
				{dropError && <DropToast message={dropError} isError />}
				<div className="domino-narrow-gate">
					<div className="domino-narrow-gate-title">DOMino needs more room</div>
					<div className="domino-narrow-gate-body">
						This app uses physics simulation and text reflow that work best on a wider screen.
						Please use a desktop or tablet in landscape.
					</div>
				</div>
			</SavedElementsContext>
		</NavigationContext>
	)
}
