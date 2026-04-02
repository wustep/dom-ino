import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { DominoScene } from "./components/DominoScene"
import { SnapshotPageView } from "./components/SnapshotPageView"
import type {
	SceneDescription,
	SceneElement,
	SavedElement,
} from "./scene/types"
import type { PresetKey } from "./scene/presets"
import { DEFAULT_PRESET, getPresetScene, isPresetKey } from "./scene/presets"
import { fetchPageHtml, prepareHtmlForViewer } from "./scene/domSnapshot"

export interface SceneCustomPage {
	id: string
	name: string
	kind: "scene"
	scene: SceneDescription
}

export interface SnapshotCustomPage {
	id: string
	name: string
	kind: "snapshot"
	preparedHtml: string
	sourceUrl?: string
}

export type CustomPage = SceneCustomPage | SnapshotCustomPage

const LS_KEY = "domino-state"

interface PersistedState {
	currentPreset: PresetKey | "custom"
	activeCustomId: string | null
	savedElements: SavedElement[]
	customPages: CustomPage[]
}

interface AppProps {
	initialFetchUrl?: string | null
	/** Deep-link for demos (e.g. `?preset=landing`); does not persist by itself */
	initialPreset?: PresetKey | null
}

let consumedInitialFetchUrl: string | null = null

function normalizeCustomPages(pages: unknown): CustomPage[] {
	if (!Array.isArray(pages)) return []
	return pages.reduce<CustomPage[]>((acc, page) => {
		if (!page || typeof page !== "object") return acc
		const p = page as Record<string, unknown>
		if (typeof p.id !== "string" || typeof p.name !== "string") return acc
		if (p.kind === "snapshot" && typeof p.preparedHtml === "string") {
			acc.push({
				id: p.id,
				name: p.name,
				kind: "snapshot" as const,
				preparedHtml: p.preparedHtml,
				sourceUrl: typeof p.sourceUrl === "string" ? p.sourceUrl : undefined,
			})
			return acc
		}
		if (p.kind === "scene" && p.scene && typeof p.scene === "object") {
			acc.push({
				id: p.id,
				name: p.name,
				kind: "scene" as const,
				scene: p.scene as SceneDescription,
			})
			return acc
		}
		// Back-compat for older persisted shape
		if (p.scene && typeof p.scene === "object") {
			acc.push({
				id: p.id,
				name: p.name,
				kind: "scene" as const,
				scene: p.scene as SceneDescription,
			})
			return acc
		}
		return acc
	}, [])
}

function loadState(): Partial<PersistedState> {
	try {
		const raw = localStorage.getItem(LS_KEY)
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<PersistedState> & {
				customPages?: unknown
			}
			const customPages = normalizeCustomPages(parsed.customPages).filter(
				(page) => page.kind !== "scene" || page.scene.id !== "breakout"
			)
			const activeCustomId =
				typeof parsed.activeCustomId === "string" &&
				customPages.some((page) => page.id === parsed.activeCustomId)
					? parsed.activeCustomId
					: null
			let currentPreset: PresetKey | "custom" | undefined =
				parsed.currentPreset === "custom"
					? "custom"
					: isPresetKey(parsed.currentPreset)
						? parsed.currentPreset
						: undefined
			if (currentPreset === "custom" && !activeCustomId) {
				currentPreset = undefined
			}
			return {
				...parsed,
				activeCustomId,
				currentPreset,
				customPages,
			}
		}
	} catch (e) {
		console.warn("[DOMino] Failed to load persisted state:", e)
	}
	return {}
}

function saveState(s: PersistedState) {
	try {
		// Strip preparedHtml from snapshot pages to avoid localStorage quota issues.
		// Pages with a sourceUrl will be re-fetched on reload.
		const toSave: PersistedState = {
			...s,
			customPages: s.customPages.flatMap<CustomPage>((page) => {
				if (page.kind !== "snapshot") return [page]
				if (!page.sourceUrl) return [] // can't recover imported HTML, drop it
				return [{ ...page, preparedHtml: "" }]
			}),
		}
		localStorage.setItem(LS_KEY, JSON.stringify(toSave))
	} catch (e) {
		console.warn("[DOMino] Failed to save state:", e)
	}
}

export default function App({
	initialFetchUrl = null,
	initialPreset = null,
}: AppProps) {
	const persisted = useMemo(() => loadState(), [])

	const [windowSize, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	})
	const [currentPreset, setCurrentPreset] = useState<PresetKey | "custom">(
		initialPreset ?? persisted.currentPreset ?? DEFAULT_PRESET
	)
	const [customPages, setCustomPages] = useState<CustomPage[]>(
		persisted.customPages ?? []
	)
	const [activeCustomId, setActiveCustomId] = useState<string | null>(
		persisted.activeCustomId ?? null
	)
	const [showHint, setShowHint] = useState(
		() => !localStorage.getItem("domino-hint-seen")
	)
	const [sceneKey, setSceneKey] = useState(0)
	const [savedElements, setSavedElements] = useState<SavedElement[]>(
		persisted.savedElements ?? []
	)

	// Persist state on changes
	useEffect(() => {
		saveState({ currentPreset, activeCustomId, savedElements, customPages })
	}, [currentPreset, activeCustomId, savedElements, customPages])

	useEffect(() => {
		const h = () =>
			setWindowSize({ width: window.innerWidth, height: window.innerHeight })
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
		[currentPreset, activeCustomId, customPages]
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

	const handleImportHtml = useCallback(
		async (html: string, name: string, sourceUrl?: string) => {
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
		},
		[]
	)

	const handleFetchUrl = useCallback(
		async (url: string) => {
			const result = await fetchPageHtml(url)
			let name = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
			// For long URLs, use the last path segment for a shorter, distinguishable name
			if (name.length > 25) {
				const parts = name.split("/")
				const last = parts[parts.length - 1]
				if (last && parts.length > 1) {
					name = decodeURIComponent(last).replace(/_/g, " ")
				}
			}
			if (name.length > 25) name = name.slice(0, 25) + "..."
			await handleImportHtml(result.html, name, result.url)
		},
		[handleImportHtml]
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

	// Re-fetch snapshot pages that were persisted without preparedHtml
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
				try {
					const result = await fetchPageHtml(activeCustomPage.sourceUrl!)
					const preparedHtml = await prepareHtmlForViewer(result.html, result.url)
					setCustomPages((prev) =>
						prev.map((p) =>
							p.id === pageId && p.kind === "snapshot"
								? { ...p, preparedHtml }
								: p
						)
					)
					setSceneKey((k) => k + 1)
				} catch {
					setRefetchError("Could not reload this page.")
				}
			})()
		})
	}, [activeCustomPage])

	// Ensures modifying a preset creates exactly one scene-backed custom page fork
	const ensureCustomScenePage = useCallback(
		(newScene: SceneDescription): string => {
			if (activeCustomPage?.kind === "scene") {
				setCustomPages((prev) =>
					prev.map((p) =>
						p.id === activeCustomPage.id ? { ...p, scene: newScene } : p
					)
				)
				return activeCustomPage.id
			}
			const id = `custom-${Date.now()}`
			const page: SceneCustomPage = {
				id,
				name: newScene.name || "Modified",
				kind: "scene",
				scene: newScene,
			}
			setCustomPages((prev) => [...prev, page])
			setActiveCustomId(id)
			setCurrentPreset("custom")
			return id
		},
		[activeCustomPage]
	)

	const handleSceneChange = useCallback(
		(newScene: SceneDescription, remount = true) => {
			ensureCustomScenePage(newScene)
			if (remount) setSceneKey((k) => k + 1)
		},
		[ensureCustomScenePage]
	)

	const handleSaveElement = useCallback(
		(el: SceneElement) => {
			setSavedElements((prev) => {
				const sourceName =
					activeCustomPage?.name ?? scene?.name ?? "Imported Page"
				if (
					prev.some(
						(s) => s.element.id === el.id && s.sourceScene === sourceName
					)
				)
					return prev
				return [
					...prev,
					{ element: { ...el }, savedAt: Date.now(), sourceScene: sourceName },
				]
			})
		},
		[activeCustomPage, scene?.name]
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
						: (windowSize.width - el.rect.width) / 2 +
							(Math.random() - 0.5) * 120,
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
			setSceneKey((k) => k + 1)
		},
		[scene, ensureCustomScenePage, windowSize]
	)

	const handleClearSaved = useCallback(() => setSavedElements([]), [])
	const handleRemoveSaved = useCallback((index: number) => {
		setSavedElements((prev) => prev.filter((_, i) => i !== index))
	}, [])

	const handleResetAll = useCallback(() => {
		localStorage.removeItem(LS_KEY)
		setCurrentPreset(DEFAULT_PRESET)
		setCustomPages([])
		setActiveCustomId(null)
		setSavedElements([])
		setSceneKey((k) => k + 1)
	}, [])

	return (
		<>
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
					savedElements={savedElements}
					onSaveElement={handleSaveElement}
					onUnsaveElement={handleUnsaveElement}
					onClearSaved={handleClearSaved}
					onRemoveSaved={handleRemoveSaved}
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
					savedElements={savedElements}
					onSaveElement={handleSaveElement}
					onUnsaveElement={handleUnsaveElement}
					onDropSaved={handleDropSaved}
					onClearSaved={handleClearSaved}
					onRemoveSaved={handleRemoveSaved}
					customPages={customPages}
					activeCustomId={activeCustomId}
					onSelectCustomPage={handleSelectCustomPage}
					onResetAll={handleResetAll}
				/>
			) : null}
			{showHint && <Hint />}
		</>
	)
}

function PageReloadOverlay({ url, error, onRetry, onBack }: {
	url?: string
	error: string | null
	onRetry: () => void
	onBack: () => void
}) {
	const displayUrl = url
		? url.replace(/^https?:\/\//, "").replace(/\/$/, "")
		: "page"
	return (
		<div style={{
			display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
			height: "100vh", fontFamily: '"DM Sans", sans-serif',
			animation: "reloadFadeIn 0.3s ease both",
		}}>
			{!error ? (
				<>
					<svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: "reloadSpin 0.9s linear infinite", marginBottom: 14 }}>
						<circle cx="12" cy="12" r="10" fill="none" stroke="#e0deda" strokeWidth="2.5" />
						<circle cx="12" cy="12" r="10" fill="none" stroke="#999" strokeWidth="2.5"
							strokeDasharray="20 43" strokeLinecap="round" />
					</svg>
					<div style={{ color: "#999", fontSize: 13, fontWeight: 500 }}>
						Reloading {displayUrl}
					</div>
				</>
			) : (
				<>
					<div style={{ color: "#999", fontSize: 13, marginBottom: 12 }}>
						{error}
					</div>
					<div style={{ display: "flex", gap: 8 }}>
						<button onClick={onRetry} style={{
							padding: "5px 14px", borderRadius: 6, border: "1px solid #ddd",
							backgroundColor: "#fff", color: "#333",
							fontSize: 12, fontWeight: 500, fontFamily: '"DM Sans", sans-serif',
							cursor: "pointer",
						}}>Retry</button>
						<button onClick={onBack} style={{
							padding: "5px 14px", borderRadius: 6, border: "1px solid #ddd",
							backgroundColor: "#fff", color: "#999",
							fontSize: 12, fontWeight: 500, fontFamily: '"DM Sans", sans-serif',
							cursor: "pointer",
						}}>Go back</button>
					</div>
				</>
			)}
			<style>{`
				@keyframes reloadSpin { to { transform: rotate(360deg); } }
				@keyframes reloadFadeIn { from { opacity: 0; } to { opacity: 1; } }
			`}</style>
		</div>
	)
}

function Hint() {
	return (
		<div
			style={{
				position: "fixed",
				bottom: 76,
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 10000,
				padding: "10px 20px",
				borderRadius: 10,
				backgroundColor: "rgba(20,20,24,0.88)",
				backdropFilter: "blur(12px)",
				color: "#ddd",
				fontSize: 13,
				fontFamily: '"DM Sans", sans-serif',
				fontWeight: 500,
				boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
				pointerEvents: "none",
				animation: "hintFade 0.5s ease both",
				display: "flex",
				alignItems: "center",
				gap: 8,
				whiteSpace: "nowrap",
			}}
		>
			<span style={{ fontSize: 15, opacity: 0.6 }}>&#8597;</span>
			Grab any card, badge, or button and throw it
			<style>{`@keyframes hintFade { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
		</div>
	)
}
