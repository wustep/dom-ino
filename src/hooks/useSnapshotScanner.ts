import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { isAutoSelectEligible, isForceAutoSelectNode } from "../scene/siteStyles"
import type { SnapshotCandidate, SnapshotTextBlock } from "../scene/snapshotHelpers"
import { scanIframeDom } from "../scene/snapshotWalker"
import type { SavedElement, SceneElement } from "../scene/types"

interface UseSnapshotScannerOptions {
	iframeRef: React.RefObject<HTMLIFrameElement | null>
	stageRef: React.RefObject<HTMLDivElement | null>
	pageId: string
	sourceUrl?: string
	preparedHtml: string
	maxAutoSelectComponents: number
	savedElements: SavedElement[]
	onSaveElement: (el: SceneElement) => void
	onUnsaveElement: (id: string) => void
}

interface UseSnapshotScannerResult {
	candidates: SnapshotCandidate[]
	/** Pretext-eligible text blocks (for reflow mode). */
	textBlocks: SnapshotTextBlock[]
	/** All text-bearing blocks including non-pretext (for letter-body mode). */
	textBodyBlocks: SnapshotTextBlock[]
	selectableCandidates: SnapshotCandidate[]
	selectedIds: Set<string>
	iframeHeight: number
	iframeLoaded: boolean
	nodesRef: React.RefObject<Map<string, HTMLElement>>
	textNodesRef: React.RefObject<Map<string, HTMLElement>>
	handleIframeLoad: () => void
	toggleSelected: (id: string) => void
	saveNode: (id: string) => void
	unsaveNode: (id: string) => void
}

/** Scans an iframe's live DOM to discover selectable candidates, text blocks, and manages selection state (auto + manual overrides). */
export function useSnapshotScanner({
	iframeRef,
	stageRef,
	pageId,
	sourceUrl,
	preparedHtml,
	maxAutoSelectComponents,
	savedElements,
	onSaveElement,
	onUnsaveElement,
}: UseSnapshotScannerOptions): UseSnapshotScannerResult {
	const nodesRef = useRef<Map<string, HTMLElement>>(new Map())
	const textNodesRef = useRef<Map<string, HTMLElement>>(new Map())
	const [iframeHeight, setIframeHeight] = useState(1600)
	const [iframeLoaded, setIframeLoaded] = useState(false)
	const [candidates, setCandidates] = useState<SnapshotCandidate[]>([])
	const [textBlocks, setTextBlocks] = useState<SnapshotTextBlock[]>([])
	const [textBodyBlocks, setTextBodyBlocks] = useState<SnapshotTextBlock[]>([])

	// Auto-selected IDs from the scanner heuristic.
	const [autoSelectedIds, setAutoSelectedIds] = useState<Set<string>>(new Set())
	// IDs the user has explicitly toggled ON (not auto-selected).
	const [manualSelectedIds, setManualSelectedIds] = useState<Set<string>>(new Set())
	// IDs the user has explicitly toggled OFF (overrides auto-select).
	const [manualDeselectedIds, setManualDeselectedIds] = useState<Set<string>>(new Set())

	const savedIds = useMemo(() => new Set(savedElements.map((s) => s.element.id)), [savedElements])

	const scanCandidates = useCallback(() => {
		const iframe = iframeRef.current
		if (!iframe || !stageRef.current) return
		const doc = iframe.contentDocument
		const win = iframe.contentWindow
		if (!doc || !win || !doc.body) return

		const result = scanIframeDom(doc, win, iframe.clientHeight, sourceUrl, savedIds)
		nodesRef.current = result.nodes
		textNodesRef.current = result.textNodes
		setCandidates(result.candidates)
		setTextBlocks(result.textBlocks)
		setTextBodyBlocks(result.textBodyBlocks)
		setIframeHeight(result.bodyHeight)
	}, [iframeRef, stageRef, sourceUrl, savedIds])

	const scheduledScanRef = useRef<number | null>(null)
	const scheduleScanCandidates = useCallback(() => {
		if (scheduledScanRef.current !== null) return
		scheduledScanRef.current = requestAnimationFrame(() => {
			scheduledScanRef.current = null
			scanCandidates()
		})
	}, [scanCandidates])

	const selectableCandidates = useMemo(
		() =>
			candidates.filter(
				(c) =>
					c.sceneElement &&
					c.sceneElement.type !== "paragraph" &&
					c.sceneElement.type !== "heading" &&
					(c.sceneElement.type === "image" ||
						(c.display !== "inline" && c.display !== "contents")) &&
					c.width >= 40 &&
					c.height >= 20,
			),
		[candidates],
	)

	// Reset all selection state when the page changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset imported selection state when the page changes.
	useEffect(() => {
		setAutoSelectedIds(new Set())
		setManualSelectedIds(new Set())
		setManualDeselectedIds(new Set())
		setIframeLoaded(false)
	}, [pageId])

	// biome-ignore lint/correctness/useExhaustiveDependencies: rerun scan when the iframe markup changes.
	useEffect(() => {
		scanCandidates()
		const onResize = () => scheduleScanCandidates()
		window.addEventListener("resize", onResize)
		return () => window.removeEventListener("resize", onResize)
	}, [scanCandidates, scheduleScanCandidates, preparedHtml])

	useEffect(() => {
		return () => {
			if (scheduledScanRef.current !== null) {
				cancelAnimationFrame(scheduledScanRef.current)
				scheduledScanRef.current = null
			}
		}
	}, [])

	// Auto-selection — re-runs whenever the candidate list or the cap changes.
	useEffect(() => {
		if (selectableCandidates.length === 0) return

		const throwableTypes = new Set(["image", "badge", "button", "card", "link", "input"])
		const picked: SnapshotCandidate[] = []

		if (maxAutoSelectComponents > 0) {
			for (const c of selectableCandidates) {
				if (!c.sceneElement) continue
				const t = c.sceneElement.type
				const forceAutoSelect = isForceAutoSelectNode(c.node, sourceUrl)
				const throwable = throwableTypes.has(t) || (forceAutoSelect && t === "container")
				if (!throwable) continue
				if (!isAutoSelectEligible(c.node, sourceUrl)) continue
				if ((c.display === "inline" || c.display === "contents") && t !== "image") continue
				const maxW = forceAutoSelect ? 1400 : t === "image" ? 900 : 500
				const maxH = forceAutoSelect ? 240 : t === "image" ? 700 : 400
				if (c.width > maxW || c.height > maxH) continue
				if (c.width < 30 || c.height < 16) continue
				if (!forceAutoSelect && c.y < 40) continue

				const cls = (c.node.className || "").toString().toLowerCase()
				const id = (c.node.id || "").toLowerCase()
				const tag = c.node.tagName
				const isNoticeBox = cls.includes("ambox") || cls.includes("tmbox") || cls.includes("ombox")
				const isInfobox =
					cls.includes("infobox") || cls.includes("sidebar") || cls.includes("navbox")
				const isGallery = cls.includes("gallery") || cls.includes("thumb") || cls.includes("trow")
				const isTable = tag === "TABLE" || tag === "TBODY" || tag === "THEAD"
				const isMediaWrapper = t === "image" && (tag === "FIGURE" || isGallery)
				const isFloatAnchor = (() => {
					try {
						const styles = (iframeRef.current?.contentWindow ?? window).getComputedStyle(c.node)
						return styles.float === "left" || styles.float === "right"
					} catch {
						return false
					}
				})()
				if (isInfobox || id.includes("infobox")) continue
				if ((isGallery || isTable) && !isMediaWrapper && !isNoticeBox) continue
				if (!forceAutoSelect && isFloatAnchor && t !== "image" && (c.width > 200 || c.height > 200))
					continue
				if (t === "card" && !isNoticeBox && (c.width > 400 || c.height > 300)) continue
				if (isNoticeBox && (c.width > 980 || c.height > 320)) continue
				if (picked.some((p) => p.node.contains(c.node))) continue
				picked.push(c)
				if (picked.length >= maxAutoSelectComponents) break
			}
		}

		setAutoSelectedIds(new Set(picked.map((c) => c.id)))
	}, [maxAutoSelectComponents, selectableCandidates, iframeRef, sourceUrl])

	// Keep manual override sets tidy when candidates change.
	useEffect(() => {
		const ids = new Set(selectableCandidates.map((c) => c.id))
		setManualSelectedIds((prev) => {
			const next = new Set(Array.from(prev).filter((id) => ids.has(id)))
			return next.size === prev.size ? prev : next
		})
		setManualDeselectedIds((prev) => {
			const next = new Set(Array.from(prev).filter((id) => ids.has(id)))
			return next.size === prev.size ? prev : next
		})
	}, [selectableCandidates])

	// Merge auto + manual overrides into a single stable selectedIds set.
	const selectedIds = useMemo(() => {
		const next = new Set(autoSelectedIds)
		for (const id of manualDeselectedIds) next.delete(id)
		for (const id of manualSelectedIds) next.add(id)
		return next
	}, [autoSelectedIds, manualDeselectedIds, manualSelectedIds])

	const handleIframeLoad = useCallback(() => {
		const iframe = iframeRef.current
		const doc = iframe?.contentDocument
		if (!doc?.body) return
		const h = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, 1200)
		setIframeHeight(h)
		scanCandidates()
		setIframeLoaded(true)

		// Copy @font-face rules from iframe to the parent document so the
		// Pretext text overlay can render with the same custom fonts.
		try {
			const fontRules: string[] = []
			for (const sheet of Array.from(doc.styleSheets)) {
				try {
					for (const rule of Array.from(sheet.cssRules)) {
						if (rule instanceof CSSFontFaceRule) {
							fontRules.push(rule.cssText)
						}
					}
				} catch {
					/* cross-origin sheet, skip */
				}
			}
			if (fontRules.length > 0) {
				const id = "domino-iframe-fonts"
				let fontStyle = document.getElementById(id) as HTMLStyleElement | null
				if (!fontStyle) {
					fontStyle = document.createElement("style")
					fontStyle.id = id
					document.head.appendChild(fontStyle)
				}
				fontStyle.textContent = fontRules.join("\n")
			}
		} catch {
			/* ignore font extraction errors */
		}

		// Wait for images to finish loading, then re-measure height and re-scan.
		const images = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[]
		const pending = images.filter((img) => img.src && !img.complete)
		if (pending.length > 0) {
			const settled = Promise.allSettled(
				pending.map(
					(img) =>
						new Promise<void>((resolve) => {
							if (img.complete) {
								resolve()
								return
							}
							img.onload = () => resolve()
							img.onerror = () => resolve()
						}),
				),
			)
			const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000))
			Promise.race([settled, timeout]).then(() => {
				if (!iframeRef.current?.contentDocument?.body) return
				const newH = Math.max(
					iframeRef.current.contentDocument.body.scrollHeight,
					iframeRef.current.contentDocument.documentElement?.scrollHeight || 0,
					1200,
				)
				setIframeHeight(newH)
				scheduleScanCandidates()
			})
		}
	}, [iframeRef, scanCandidates, scheduleScanCandidates])

	const saveNode = useCallback(
		(id: string) => {
			const candidate = candidates.find((c) => c.id === id)
			const sceneEl = candidate?.sceneElement
			if (sceneEl) onSaveElement(sceneEl)
		},
		[candidates, onSaveElement],
	)

	const unsaveNode = useCallback(
		(id: string) => {
			onUnsaveElement(id)
		},
		[onUnsaveElement],
	)

	// Toggle: if currently selected → mark as manually deselected; if not → mark as manually selected.
	const toggleSelected = useCallback(
		(id: string) => {
			if (selectedIds.has(id)) {
				setManualSelectedIds((prev) => {
					const n = new Set(prev)
					n.delete(id)
					return n
				})
				setManualDeselectedIds((prev) => new Set([...prev, id]))
			} else {
				setManualDeselectedIds((prev) => {
					const n = new Set(prev)
					n.delete(id)
					return n
				})
				setManualSelectedIds((prev) => new Set([...prev, id]))
			}
		},
		[selectedIds],
	)

	return {
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
		toggleSelected,
		saveNode,
		unsaveNode,
	}
}
