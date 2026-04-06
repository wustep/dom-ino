import {
	memo,
	useCallback,
	useEffect,
	useEffectEvent,
	useLayoutEffect,
	useRef,
	useState,
} from "react"
import { useSavedElements } from "../contexts/SavedElementsContext"
import { useSettingsContext } from "../contexts/SettingsContext"
import type { PickerMode } from "../hooks/usePickerPause"
import type { SavedElement } from "../scene/types"
import "./toolbar/Toolbar.css"
import {
	ChevronDownIcon,
	ChevronUpIcon,
	ExplodeIcon,
	PageIcon,
	PickerIcon,
	ResetIcon,
	SettingsIcon,
	StashIcon,
} from "./toolbar/icons"
import { PagesPanel } from "./toolbar/PagesPanel"
import { SettingsPanel } from "./toolbar/SettingsPanel"
import { StashPanel } from "./toolbar/StashPanel"

interface ToolbarProps {
	onExplode: () => void
	onReset: () => void
	onTogglePicker: () => void
	pickerMode: PickerMode
	onDropSaved: (saved: SavedElement, x?: number, y?: number) => void
}

type FlyoutPanel = "pages" | "settings" | "stash" | null
type TooltipAnchor = {
	label: string
	left: number
	top: number
	width: number
}

const COLLAPSED_REVEAL_PROXIMITY_PX = 128

/** Bottom-right floating toolbar with scene controls, page navigation, stash, and settings flyout panels. */
export const Toolbar = memo(function Toolbar(props: ToolbarProps) {
	const { onExplode, onReset, onTogglePicker, pickerMode, onDropSaved } = props

	const { savedElements } = useSavedElements()
	const { settings, setSettings } = useSettingsContext()
	const [resetSpinKey, setResetSpinKey] = useState(0)
	const [openPanel, setOpenPanel] = useState<FlyoutPanel>(null)
	const [collapsed, setCollapsed] = useState(false)
	const [focusedBtnIdx, setFocusedBtnIdx] = useState(0)
	const [activeTooltip, setActiveTooltip] = useState<TooltipAnchor | null>(null)
	const [tooltipPosition, setTooltipPosition] = useState<{ left: number; bottom: number } | null>(
		null,
	)
	const tooltipRef = useRef<HTMLDivElement | null>(null)
	const toolbarDockRef = useRef<HTMLDivElement | null>(null)
	const [showCollapsedReveal, setShowCollapsedReveal] = useState(true)
	const showCollapsedRevealRef = useRef(true)

	const toggle = useCallback(
		(panel: FlyoutPanel) => setOpenPanel((p) => (p === panel ? null : panel)),
		[],
	)
	const closePanel = useCallback(() => setOpenPanel(null), [])

	const handleToolbarKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"))
		const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
		if (current === -1) return

		let next: number
		switch (e.key) {
			case "ArrowRight":
				next = (current + 1) % buttons.length
				break
			case "ArrowLeft":
				next = (current - 1 + buttons.length) % buttons.length
				break
			case "Home":
				next = 0
				break
			case "End":
				next = buttons.length - 1
				break
			default:
				return
		}
		e.preventDefault()
		setFocusedBtnIdx(next)
		buttons[next]?.focus()
	}, [])

	const clearTooltip = useCallback(() => {
		setActiveTooltip(null)
		setTooltipPosition(null)
	}, [])
	const showTooltip = useCallback((label: string | undefined, target: HTMLButtonElement) => {
		if (!label) return
		const rect = target.getBoundingClientRect()
		setTooltipPosition(null)
		setActiveTooltip({
			label,
			left: rect.left,
			top: rect.top,
			width: rect.width,
		})
	}, [])
	const setCollapsedRevealVisible = useCallback((next: boolean) => {
		if (showCollapsedRevealRef.current === next) return
		showCollapsedRevealRef.current = next
		setShowCollapsedReveal(next)
	}, [])
	const updateCollapsedRevealVisibility = useEffectEvent((clientX: number, clientY: number) => {
		const rect = toolbarDockRef.current?.getBoundingClientRect()
		if (!rect) {
			setCollapsedRevealVisible(false)
			return
		}

		const next =
			clientX >= rect.left - COLLAPSED_REVEAL_PROXIMITY_PX &&
			clientX <= rect.right + COLLAPSED_REVEAL_PROXIMITY_PX &&
			clientY >= rect.top - COLLAPSED_REVEAL_PROXIMITY_PX &&
			clientY <= rect.bottom + COLLAPSED_REVEAL_PROXIMITY_PX

		setCollapsedRevealVisible(next)
	})
	const handleExpandToolbar = useCallback(() => {
		clearTooltip()
		setCollapsed(false)
		setCollapsedRevealVisible(true)
	}, [clearTooltip, setCollapsedRevealVisible])

	const handleCollapseToolbar = useCallback(() => {
		clearTooltip()
		setOpenPanel(null)
		setCollapsed(true)
		setCollapsedRevealVisible(true)
	}, [clearTooltip, setCollapsedRevealVisible])

	useLayoutEffect(() => {
		if (!activeTooltip || !tooltipRef.current) return

		const tooltipWidth = tooltipRef.current.offsetWidth
		const viewportPadding = 12
		const anchorCenter = activeTooltip.left + activeTooltip.width / 2
		const clampedLeft = Math.min(
			Math.max(anchorCenter - tooltipWidth / 2, viewportPadding),
			window.innerWidth - viewportPadding - tooltipWidth,
		)
		const bottom = window.innerHeight - activeTooltip.top + 8

		setTooltipPosition({ left: clampedLeft, bottom })
	}, [activeTooltip])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
				return
			if (event.metaKey || event.ctrlKey || event.altKey) return
			switch (event.key) {
				case "e":
					onExplode()
					break
				case "r":
					onReset()
					setResetSpinKey((k) => k + 1)
					break
				case "p":
					if (collapsed) return
					event.preventDefault()
					toggle("pages")
					break
				case "c":
					if (collapsed) return
					event.preventDefault()
					onTogglePicker()
					break
				case "s":
					if (collapsed) return
					event.preventDefault()
					toggle("stash")
					break
				case ",":
					if (collapsed) return
					event.preventDefault()
					toggle("settings")
					break
				case "b": {
					const next = !(settings.showObstacleBounds || settings.showLineBounds)
					setSettings({ ...settings, showObstacleBounds: next, showLineBounds: next })
					break
				}
				case "t":
					event.preventDefault()
					if (collapsed) {
						handleExpandToolbar()
					} else {
						handleCollapseToolbar()
					}
					break
				default:
					return
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [
		onExplode,
		onReset,
		onTogglePicker,
		collapsed,
		handleExpandToolbar,
		handleCollapseToolbar,
		settings,
		setSettings,
	])

	useEffect(() => {
		if (!openPanel || collapsed) return

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target
			if (target instanceof Element && target.closest('[data-domino-toolbar-root="true"]')) {
				return
			}
			setOpenPanel(null)
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpenPanel(null)
			}
		}

		window.addEventListener("pointerdown", handlePointerDown)
		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("pointerdown", handlePointerDown)
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [openPanel, collapsed])

	useEffect(() => {
		if (!collapsed) return

		const handlePointerMove = (event: PointerEvent) => {
			updateCollapsedRevealVisibility(event.clientX, event.clientY)
		}

		window.addEventListener("pointermove", handlePointerMove, { passive: true })
		return () => {
			window.removeEventListener("pointermove", handlePointerMove)
		}
	}, [collapsed])

	return (
		<>
			{openPanel === "pages" && <PagesPanel onClose={closePanel} />}

			{openPanel === "stash" && (
				<StashPanel
					onDropSaved={onDropSaved}
					pickerMode={pickerMode}
					onTogglePicker={onTogglePicker}
					onClose={closePanel}
				/>
			)}

			{openPanel === "settings" && <SettingsPanel onClose={closePanel} />}

			<div
				data-domino-toolbar-root="true"
				data-domino-toolbar-dock="true"
				ref={toolbarDockRef}
				className="dt-dock"
			>
				<div
					className="dt-overlay-item"
					style={{ pointerEvents: collapsed && showCollapsedReveal ? "auto" : "none" }}
				>
					<button
						className="dt-reveal"
						type="button"
						onClick={handleExpandToolbar}
						aria-label="Show toolbar (T)"
						onMouseEnter={(e) => showTooltip("Show toolbar (T)", e.currentTarget)}
						onMouseLeave={clearTooltip}
						onFocus={(e) => {
							setCollapsedRevealVisible(true)
							showTooltip("Show toolbar (T)", e.currentTarget)
						}}
						onBlur={clearTooltip}
						style={{
							opacity: collapsed && showCollapsedReveal ? 0.86 : 0,
							transform:
								collapsed && showCollapsedReveal
									? "translateY(0) scale(1)"
									: "translateY(10px) scale(0.92)",
						}}
					>
						<ChevronUpIcon />
					</button>
				</div>

				{/* ─── Compact pill ─── */}
				<div
					className="dt-pill"
					role="toolbar"
					aria-label="Scene tools"
					onKeyDown={handleToolbarKeyDown}
					style={{
						opacity: collapsed ? 0 : 1,
						transform: collapsed ? "translateY(16px) scale(0.96)" : "translateY(0) scale(1)",
						pointerEvents: collapsed ? "none" : "auto",
					}}
				>
					<Btn
						active={openPanel === "pages"}
						onClick={() => toggle("pages")}
						tip="Pages (P)"
						btnIndex={0}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<PageIcon />
					</Btn>
					<Sep />
					<Btn
						onClick={onExplode}
						tip="Explode scene (E)"
						btnIndex={1}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<ExplodeIcon />
					</Btn>
					<Btn
						onClick={() => {
							onReset()
							setResetSpinKey((k) => k + 1)
						}}
						tip="Reset scene (R)"
						btnIndex={2}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<span
							key={resetSpinKey}
							style={{
								display: "inline-flex",
								animation: resetSpinKey > 0 ? "dt-spin-once 0.4s ease-out" : undefined,
							}}
						>
							<ResetIcon />
						</span>
					</Btn>
					<Sep />
					<Btn
						active={pickerMode === "throwable"}
						onClick={onTogglePicker}
						tip={pickerMode === "throwable" ? "Exit component picker (C)" : "Component picker (C)"}
						accent={pickerMode === "throwable" ? "var(--dt-accent-blue, #3b82f6)" : undefined}
						btnIndex={3}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<PickerIcon />
					</Btn>
					<Btn
						active={openPanel === "stash" || pickerMode === "save"}
						onClick={() => toggle("stash")}
						tip="Saved components (S)"
						accent={
							pickerMode === "save"
								? "var(--dt-accent-light, #c4b5fd)"
								: savedElements.length > 0
									? "var(--dt-accent, #a78bfa)"
									: undefined
						}
						dataAttrs={{ "data-domino-stash-trigger": "true" }}
						btnIndex={4}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<StashIcon />
						{savedElements.length > 0 && <span className="dt-badge">{savedElements.length}</span>}
					</Btn>
					<Sep />
					<Btn
						active={openPanel === "settings"}
						onClick={() => toggle("settings")}
						tip="Settings (,)"
						btnIndex={5}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<SettingsIcon />
					</Btn>
					<Btn
						onClick={handleCollapseToolbar}
						tip="Hide toolbar (T)"
						compact
						btnIndex={6}
						focusedBtnIdx={focusedBtnIdx}
						onBtnFocused={setFocusedBtnIdx}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<ChevronDownIcon />
					</Btn>
				</div>
			</div>

			{activeTooltip && (
				<div
					ref={tooltipRef}
					className="dt-tooltip"
					style={{
						left: tooltipPosition?.left ?? -9999,
						bottom: tooltipPosition?.bottom ?? 0,
						opacity: tooltipPosition ? 1 : 0,
					}}
				>
					{activeTooltip.label}
				</div>
			)}
		</>
	)
})

// ─── Sub-components ───
function Sep() {
	return <div className="dt-sep" />
}

function Btn({
	children,
	onClick,
	active,
	tip,
	accent,
	compact,
	dataAttrs,
	btnIndex,
	focusedBtnIdx,
	onBtnFocused,
	onShowTooltip,
	onHideTooltip,
}: {
	children: React.ReactNode
	onClick: (e: React.MouseEvent) => void
	active?: boolean
	tip?: string
	accent?: string
	compact?: boolean
	dataAttrs?: Record<string, string>
	btnIndex: number
	focusedBtnIdx: number
	onBtnFocused: (index: number) => void
	onShowTooltip: (label: string | undefined, target: HTMLButtonElement) => void
	onHideTooltip: () => void
}) {
	const className = ["dt-btn", active && "dt-btn--active", compact && "dt-btn--compact"]
		.filter(Boolean)
		.join(" ")

	return (
		<div>
			<button
				{...dataAttrs}
				type="button"
				className={className}
				tabIndex={btnIndex === focusedBtnIdx ? 0 : -1}
				onClick={(e) => {
					onHideTooltip()
					onClick(e)
				}}
				onMouseEnter={(e) => onShowTooltip(tip, e.currentTarget)}
				onMouseLeave={onHideTooltip}
				onFocus={(e) => {
					onBtnFocused(btnIndex)
					onShowTooltip(tip, e.currentTarget)
				}}
				onBlur={onHideTooltip}
				aria-label={tip}
				style={accent ? { color: accent } : undefined}
			>
				{children}
			</button>
		</div>
	)
}
