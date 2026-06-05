import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DominoScene } from "./components/DominoScene"
import { FetchOverlay, Hint, PageReloadOverlay } from "./components/Overlays"
import { SnapshotPageView } from "./components/SnapshotPageView"
import { WelcomeDialog } from "./components/WelcomeDialog"
import { NavigationContext } from "./contexts/NavigationContext"
import { SavedElementsContext } from "./contexts/SavedElementsContext"
import { usePageNavigation } from "./hooks/usePageNavigation"
import type { PresetKey } from "./scene/presets"
import { DEFAULT_PRESET } from "./scene/presets"
import type { SavedElement, SceneElement } from "./scene/types"
import { clearPersistedState, loadState, saveState } from "./utils/persistence"
import {
	getStashMediaValidationError,
	isAcceptableStashImageFile,
	isAcceptableStashImageUrl,
	STASH_DROP_IMAGE_MAX_FILE_BYTES,
	savedElementFromImageFile,
	savedElementFromImageUrl,
} from "./utils/stashImageFromFile"

function DropToast({
	message,
	isError,
	bottom = 76,
}: {
	message: string
	isError?: boolean
	bottom?: number
}) {
	return (
		<div
			style={{
				position: "fixed",
				bottom,
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
				whiteSpace: "normal",
				maxWidth: "min(560px, calc(100vw - 32px))",
				textAlign: "center",
			}}
		>
			{message}
		</div>
	)
}

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
	return `${bytes} B`
}

function fileLabel(file: File): string {
	const dot = file.name.lastIndexOf(".")
	return dot >= 0 ? file.name.slice(dot) : file.name
}

interface AppProps {
	initialFetchUrl?: string | null
	initialPreset?: PresetKey | null
}

export default function App({ initialFetchUrl = null, initialPreset = null }: AppProps) {
	// ─── First-visit welcome dialog ───
	const [showWelcome, setShowWelcome] = useState(() => {
		try {
			return !localStorage.getItem("domino-welcome-seen")
		} catch {
			return false
		}
	})
	const dismissWelcome = useCallback(() => {
		try {
			localStorage.setItem("domino-welcome-seen", "1")
		} catch {
			/* ignore storage errors */
		}
		setShowWelcome(false)
	}, [])

	// ─── Invalid file drop toast ───
	const [dropError, setDropError] = useState<string | null>(null)
	const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null)
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
				const tooLarge = allFiles.filter((f) => getStashMediaValidationError(f) === "too_large")
				if (tooLarge.length > 0) {
					const names = tooLarge.map(fileLabel).join(", ")
					showDropError(
						`File too large (${names}) — max ${formatBytes(STASH_DROP_IMAGE_MAX_FILE_BYTES)} because stash media is stored locally`,
					)
					return
				}

				const ext = allFiles.map(fileLabel).join(", ")
				showDropError(`Unsupported file type (${ext}) — drop an image or mp4`)
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
		const result = saveState({
			currentPreset: nav.currentPreset,
			activeCustomId: nav.activeCustomId,
			savedElements,
			customPages: nav.customPages,
		})
		if (result.ok) {
			setPersistenceWarning(null)
			return
		}
		if (result.reason === "quota_exceeded") {
			setPersistenceWarning(
				savedElements.length > 0
					? "Browser storage is full. Recent stash changes will not persist after reload. Delete some saved components from the stash or use smaller media."
					: "Browser storage is full. Recent changes will not persist after reload until some local data is removed.",
			)
			return
		}
		setPersistenceWarning(
			"Could not save local app state. Recent changes may not persist after reload.",
		)
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
				const sourceName = nav.activeCustomPage?.name ?? nav.scene?.name ?? "Dropped media"
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

	const handleSaveStashImageUrl = useCallback(
		async (url: string): Promise<"ok" | "load_error" | "invalid_url"> => {
			if (!isAcceptableStashImageUrl(url)) return "invalid_url"
			const sourceName = nav.activeCustomPage?.name ?? nav.scene?.name ?? "Linked media"
			const saved = await savedElementFromImageUrl(url, sourceName)
			if (!saved) return "load_error"
			setSavedElements((prev) => [...prev, saved])
			return "ok"
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
			saveStashImageUrl: handleSaveStashImageUrl,
		}),
		[
			savedElements,
			handleSaveElement,
			handleUnsaveElement,
			handleRemoveSaved,
			handleSaveStashImageFiles,
			handleSaveStashImageUrl,
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
				{nav.showHint && !showWelcome && <Hint />}
				{persistenceWarning && <DropToast message={persistenceWarning} isError bottom={120} />}
				{dropError && <DropToast message={dropError} isError />}
				{showWelcome && <WelcomeDialog onClose={dismissWelcome} />}
			</SavedElementsContext>
		</NavigationContext>
	)
}
