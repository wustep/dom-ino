import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DominoScene } from "./components/DominoScene"
import { FetchOverlay, Hint, PageReloadOverlay } from "./components/Overlays"
import { SnapshotPageView } from "./components/SnapshotPageView"
import { SavedElementsContext } from "./contexts/SavedElementsContext"
import { fetchPageHtml, prepareHtmlForViewer } from "./scene/domSnapshot"
import type { PresetKey } from "./scene/presets"
import { DEFAULT_PRESET, getPresetScene } from "./scene/presets"
import type {
	CustomPage,
	SavedElement,
	SceneCustomPage,
	SceneDescription,
	SceneElement,
	SnapshotCustomPage,
} from "./scene/types"
import { clearPersistedState, loadState, saveState } from "./utils/persistence"
import { savedElementFromImageFile } from "./utils/stashImageFromFile"

interface AppProps {
	initialFetchUrl?: string | null
	/** Deep-link for demos (e.g. `?preset=landing`); does not persist by itself */
	initialPreset?: PresetKey | null
}

let consumedInitialFetchUrl: string | null = null

export default function App({ initialFetchUrl = null, initialPreset = null }: AppProps) {
	const persisted = useMemo(() => loadState(), [])

	const [windowSize, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	})
	const [currentPreset, setCurrentPreset] = useState<PresetKey | "custom">(
		initialPreset ?? persisted.currentPreset ?? DEFAULT_PRESET,
	)
	const [customPages, setCustomPages] = useState<CustomPage[]>(persisted.customPages ?? [])
	const [activeCustomId, setActiveCustomId] = useState<string | null>(
		persisted.activeCustomId ?? null,
	)
	const [showHint, setShowHint] = useState(() => !localStorage.getItem("domino-hint-seen"))
	const [sceneKey, setSceneKey] = useState(0)
	const [fetchingUrl, setFetchingUrl] = useState<string | null>(null)
	const [savedElements, setSavedElements] = useState<SavedElement[]>(persisted.savedElements ?? [])

	// Persist state on changes
	useEffect(() => {
		saveState({ currentPreset, activeCustomId, savedElements, customPages })
	}, [currentPreset, activeCustomId, savedElements, customPages])

	useEffect(() => {
		const h = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
		window.addEventListener("resize", h)
		return () => window.removeEventListener("resize", h)
	}, [])

	useEffect(() => {
		if (!showHint) return
		const dismiss = () => {
			setShowHint(false)
			localStorage.setItem("domino-hint-seen", "1")
		}
		window.addEventListener("mousedown", dismiss, { once: true })
		const timer = setTimeout(dismiss, 8000)
		return () => {
			window.removeEventListener("mousedown", dismiss)
			clearTimeout(timer)
		}
	}, [showHint])

	const activeCustomPage = useMemo(
		() =>
			currentPreset === "custom" && activeCustomId
				? (customPages.find((p) => p.id === activeCustomId) ?? null)
				: null,
		[currentPreset, activeCustomId, customPages],
	)

	const scene = useMemo(() => {
		if (activeCustomPage?.kind === "scene") {
			return { ...activeCustomPage.scene, width: windowSize.width }
		}
		if (currentPreset !== "custom") {
			return getPresetScene(currentPreset, windowSize.width, windowSize.height)
		}
		return null
	}, [activeCustomPage, currentPreset, windowSize.width, windowSize.height])

	// ─── Navigation handlers ───

	const handleSelectPreset = useCallback((key: PresetKey) => {
		setCurrentPreset(key)
		setActiveCustomId(null)
		setSceneKey((k) => k + 1)
		setShowHint(false)
	}, [])

	const handleSelectCustomPage = useCallback((id: string) => {
		setCurrentPreset("custom")
		setActiveCustomId(id)
		setSceneKey((k) => k + 1)
		setShowHint(false)
	}, [])

	const handleImportHtml = useCallback(async (html: string, name: string, sourceUrl?: string) => {
		const preparedHtml = await prepareHtmlForViewer(html, sourceUrl)
		const page: SnapshotCustomPage = {
			id: `custom-${Date.now()}`,
			name,
			kind: "snapshot",
			preparedHtml,
			sourceUrl,
		}
		setCustomPages((prev) => [...prev, page])
		setActiveCustomId(page.id)
		setCurrentPreset("custom")
		setSceneKey((k) => k + 1)
		setShowHint(false)
	}, [])

	const handleFetchUrl = useCallback(
		async (url: string) => {
			setFetchingUrl(url)
			const start = Date.now()
			try {
				const result = await fetchPageHtml(url)
				let name = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
				if (name.length > 25) {
					const parts = name.split("/")
					const last = parts[parts.length - 1]
					if (last && parts.length > 1) {
						name = decodeURIComponent(last).replace(/_/g, " ")
					}
				}
				if (name.length > 25) name = `${name.slice(0, 25)}...`
				const elapsed = Date.now() - start
				if (elapsed < 500) await new Promise((r) => setTimeout(r, 500 - elapsed))
				await handleImportHtml(result.html, name, result.url)
			} finally {
				setFetchingUrl(null)
			}
		},
		[handleImportHtml],
	)

	useEffect(() => {
		if (!initialFetchUrl || consumedInitialFetchUrl === initialFetchUrl) return
		consumedInitialFetchUrl = initialFetchUrl
		queueMicrotask(() => {
			void handleFetchUrl(initialFetchUrl).catch((error) => {
				console.error("Failed to import bootstrap fetch URL.", error)
			})
		})
	}, [initialFetchUrl, handleFetchUrl])

	// ─── Re-fetch persisted snapshot pages ───

	const refetchedRef = useRef<Set<string>>(new Set())
	const [refetchError, setRefetchError] = useState<string | null>(null)
	useEffect(() => {
		if (!activeCustomPage) return
		if (activeCustomPage.kind !== "snapshot") return
		if (activeCustomPage.preparedHtml) return
		if (!activeCustomPage.sourceUrl) return
		if (refetchedRef.current.has(activeCustomPage.id)) return
		refetchedRef.current.add(activeCustomPage.id)
		const pageId = activeCustomPage.id
		queueMicrotask(() => {
			setRefetchError(null)
			void (async () => {
				const start = Date.now()
				try {
					const result = await fetchPageHtml(activeCustomPage.sourceUrl!)
					const preparedHtml = await prepareHtmlForViewer(result.html, result.url)
					const elapsed = Date.now() - start
					if (elapsed < 500) await new Promise((r) => setTimeout(r, 500 - elapsed))
					setCustomPages((prev) =>
						prev.map((p) =>
							p.id === pageId && p.kind === "snapshot" ? { ...p, preparedHtml } : p,
						),
					)
					setSceneKey((k) => k + 1)
				} catch {
					setRefetchError("Could not reload this page.")
				}
			})()
		})
	}, [activeCustomPage])

	// ─── Scene forking ───

	const pendingForkIdRef = useRef<string | null>(null)
	if (activeCustomPage?.kind === "scene") {
		pendingForkIdRef.current = null
	}
	const ensureCustomScenePage = useCallback(
		(newScene: SceneDescription): string => {
			if (activeCustomPage?.kind === "scene") {
				setCustomPages((prev) =>
					prev.map((p) => (p.id === activeCustomPage.id ? { ...p, scene: newScene } : p)),
				)
				return activeCustomPage.id
			}
			if (pendingForkIdRef.current) {
				const forkId = pendingForkIdRef.current
				setCustomPages((prev) => prev.map((p) => (p.id === forkId ? { ...p, scene: newScene } : p)))
				return forkId
			}
			const id = `custom-${Date.now()}`
			const page: SceneCustomPage = {
				id,
				name: newScene.name || "Modified",
				kind: "scene",
				scene: newScene,
			}
			pendingForkIdRef.current = id
			setCustomPages((prev) => [...prev, page])
			setActiveCustomId(id)
			setCurrentPreset("custom")
			return id
		},
		[activeCustomPage],
	)

	const handleSceneChange = useCallback(
		(newScene: SceneDescription, remount = true) => {
			ensureCustomScenePage(newScene)
			if (remount) setSceneKey((k) => k + 1)
		},
		[ensureCustomScenePage],
	)

	// ─── Saved element handlers ───

	const handleSaveElement = useCallback(
		(el: SceneElement) => {
			setSavedElements((prev) => {
				const sourceName = activeCustomPage?.name ?? scene?.name ?? "Imported Page"
				if (prev.some((s) => s.element.id === el.id && s.sourceScene === sourceName)) return prev
				return [...prev, { element: { ...el }, savedAt: Date.now(), sourceScene: sourceName }]
			})
		},
		[activeCustomPage, scene?.name],
	)

	const handleUnsaveElement = useCallback((id: string) => {
		setSavedElements((prev) => prev.filter((s) => s.element.id !== id))
	}, [])

	const handleDropSaved = useCallback(
		(saved: SavedElement, dropX?: number, dropY?: number) => {
			if (!scene) return
			const el = { ...saved.element }
			el.id = `dropped-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
			el.throwable = true
			el.pinned = false
			el.rect = {
				...el.rect,
				x:
					dropX != null
						? dropX - el.rect.width / 2
						: (windowSize.width - el.rect.width) / 2 + (Math.random() - 0.5) * 120,
				y:
					dropY != null
						? dropY - el.rect.height / 2
						: window.scrollY +
							windowSize.height / 2 -
							el.rect.height / 2 +
							(Math.random() - 0.5) * 60,
			}
			const newScene = { ...scene, elements: [...scene.elements, el] }
			ensureCustomScenePage(newScene)
		},
		[scene, ensureCustomScenePage, windowSize],
	)

	const handleRemoveSaved = useCallback((index: number) => {
		setSavedElements((prev) => prev.filter((_, i) => i !== index))
	}, [])

	const handleSaveStashImageFiles = useCallback(
		(files: File[]) => {
			void (async () => {
				const sourceName = activeCustomPage?.name ?? scene?.name ?? "Dropped image"
				const next: SavedElement[] = []
				for (const file of files) {
					const saved = await savedElementFromImageFile(file, sourceName)
					if (saved) next.push(saved)
				}
				if (next.length) setSavedElements((prev) => [...prev, ...next])
			})()
		},
		[activeCustomPage?.name, scene?.name],
	)

	const handleDropImageFilesOnScene = useCallback(
		(files: File[], dropX: number, dropY: number) => {
			void (async () => {
				const sourceName = scene?.name ?? "Dropped image"
				const newSaved: SavedElement[] = []
				for (const file of files) {
					const saved = await savedElementFromImageFile(file, sourceName)
					if (saved) newSaved.push(saved)
				}
				if (!newSaved.length) return
				setSavedElements((prev) => [...prev, ...newSaved])
				if (!scene) return
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
				const newScene = { ...scene, elements: [...scene.elements, ...newElements] }
				ensureCustomScenePage(newScene)
			})()
		},
		[scene, ensureCustomScenePage],
	)

	const handleResetAll = useCallback(() => {
		clearPersistedState()
		setCurrentPreset(DEFAULT_PRESET)
		setCustomPages([])
		setActiveCustomId(null)
		setSavedElements([])
		setSceneKey((k) => k + 1)
	}, [])

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

	// ─── Render ───

	return (
		<SavedElementsContext value={savedElementsCtx}>
			{activeCustomPage?.kind === "snapshot" && !activeCustomPage.preparedHtml ? (
				<PageReloadOverlay
					url={activeCustomPage.sourceUrl}
					error={refetchError}
					onRetry={() => {
						refetchedRef.current.delete(activeCustomPage.id)
						setRefetchError(null)
						setSceneKey((k) => k + 1)
					}}
					onBack={() => {
						setCustomPages((prev) => prev.filter((p) => p.id !== activeCustomPage.id))
						setActiveCustomId(null)
						setCurrentPreset(DEFAULT_PRESET)
					}}
				/>
			) : activeCustomPage?.kind === "snapshot" ? (
				<SnapshotPageView
					key={sceneKey}
					page={activeCustomPage}
					currentPreset={currentPreset}
					onSelectPreset={handleSelectPreset}
					onImportHtml={handleImportHtml}
					onFetchUrl={handleFetchUrl}
					customPages={customPages}
					activeCustomId={activeCustomId}
					onSelectCustomPage={handleSelectCustomPage}
					onResetAll={handleResetAll}
				/>
			) : scene ? (
				<DominoScene
					key={sceneKey}
					scene={scene}
					onSceneChange={handleSceneChange}
					currentPreset={currentPreset}
					onSelectPreset={handleSelectPreset}
					onImportHtml={handleImportHtml}
					onFetchUrl={handleFetchUrl}
					onDropSaved={handleDropSaved}
					onDropImageFiles={handleDropImageFilesOnScene}
					customPages={customPages}
					activeCustomId={activeCustomId}
					onSelectCustomPage={handleSelectCustomPage}
					onResetAll={handleResetAll}
				/>
			) : null}
			{fetchingUrl && <FetchOverlay url={fetchingUrl} />}
			{showHint && <Hint />}
		</SavedElementsContext>
	)
}
