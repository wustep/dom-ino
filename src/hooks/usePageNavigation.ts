import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchPageHtml, prepareHtmlForViewer } from "../scene/domSnapshot"
import type { PresetKey } from "../scene/presets"
import { DEFAULT_PRESET, getPresetScene } from "../scene/presets"
import type { CustomPage, SceneCustomPage, SceneDescription } from "../scene/types"
import type { PersistedState } from "../utils/persistence"

let consumedInitialFetchUrl: string | null = null

interface UsePageNavigationOptions {
	persisted: Partial<PersistedState>
	initialFetchUrl?: string | null
	initialPreset?: PresetKey | null
}

/** Manages all page/scene navigation state: presets, custom pages, URL fetching, scene forking, and snapshot re-fetching. */
export function usePageNavigation({
	persisted,
	initialFetchUrl = null,
	initialPreset = null,
}: UsePageNavigationOptions) {
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
	const [sceneKey, setSceneKey] = useState(0)
	const [fetchingUrl, setFetchingUrl] = useState<string | null>(null)
	const [showHint, setShowHint] = useState(() => !localStorage.getItem("domino-hint-seen"))

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
		let pageId: string | null = null
		setCustomPages((prev) => {
			// Deduplicate: if a snapshot page with the same sourceUrl exists, update it
			if (sourceUrl) {
				const existing = prev.find((p) => p.kind === "snapshot" && p.sourceUrl === sourceUrl)
				if (existing) {
					pageId = existing.id
					return prev.map((p) => (p.id === existing.id ? { ...p, preparedHtml, name } : p))
				}
			}
			const id = `custom-${Date.now()}`
			pageId = id
			return [...prev, { id, name, kind: "snapshot" as const, preparedHtml, sourceUrl }]
		})
		setActiveCustomId(pageId!)
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

	const handleRetryRefetch = useCallback(() => {
		if (!activeCustomPage) return
		refetchedRef.current.delete(activeCustomPage.id)
		setRefetchError(null)
		setSceneKey((k) => k + 1)
	}, [activeCustomPage])

	const handleRemoveActivePage = useCallback(() => {
		if (!activeCustomPage) return
		setCustomPages((prev) => prev.filter((p) => p.id !== activeCustomPage.id))
		setActiveCustomId(null)
		setCurrentPreset(DEFAULT_PRESET)
	}, [activeCustomPage])

	return {
		// State
		windowSize,
		currentPreset,
		customPages,
		activeCustomId,
		activeCustomPage,
		scene,
		sceneKey,
		fetchingUrl,
		showHint,
		refetchError,
		// Navigation actions
		handleSelectPreset,
		handleSelectCustomPage,
		handleImportHtml,
		handleFetchUrl,
		// Scene actions
		ensureCustomScenePage,
		handleSceneChange,
		// Page management
		handleRetryRefetch,
		handleRemoveActivePage,
		// For persistence
		setCustomPages,
		setCurrentPreset,
		setActiveCustomId,
		setSceneKey,
	}
}
