import {
	memo,
	useCallback,
	useEffect,
	useEffectEvent,
	useLayoutEffect,
	useRef,
	useState,
} from "react"
import type { CustomPage } from "../App"
import type { PresetKey } from "../scene/presets"
import type { SavedElement } from "../scene/types"
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

export interface DebugSettings {
	physicsEnabled: boolean
	showObstacleBounds: boolean
	showLineBounds: boolean
	gravityX: number
	gravityY: number
	paused: boolean
	pretextEnabled: boolean
	textBodiesEnabled: boolean
	maxAutoSelectComponents: number
	allowWordBreaks: boolean
	restitution: number
}

interface ToolbarProps {
	settings: DebugSettings
	onSettingsChange: (s: DebugSettings) => void
	onExplode: () => void
	onReset: () => void
	onTogglePicker: () => void
	pickerMode: boolean
	savePickerMode: boolean
	onToggleSavePicker: () => void
	fps: number
	bodyCount: number
	lineCount: number
	currentPreset: PresetKey | "custom"
	onSelectPreset: (key: PresetKey) => void
	onImportHtml: (html: string, name: string) => void
	onFetchUrl: (url: string) => Promise<void>
	savedElements: SavedElement[]
	onDropSaved: (saved: SavedElement, x?: number, y?: number) => void
	onSaveStashImageFiles?: (files: File[]) => void
	onClearSaved: () => void
	onRemoveSaved: (index: number) => void
	customPages: CustomPage[]
	activeCustomId: string | null
	onSelectCustomPage: (id: string) => void
	onResetAll: () => void
}

type FlyoutPanel = "pages" | "settings" | "stash" | null
type TooltipAnchor = {
	label: string
	left: number
	top: number
	width: number
}

// Survives component remounts (scene key changes)
let _pendingPanel: FlyoutPanel = null
const COLLAPSED_REVEAL_PROXIMITY_PX = 128

export const Toolbar = memo(function Toolbar(props: ToolbarProps) {
	const {
		settings,
		onSettingsChange,
		onExplode,
		onReset,
		onTogglePicker,
		pickerMode,
		savePickerMode,
		onToggleSavePicker,
		fps,
		bodyCount,
		lineCount,
		currentPreset,
		onSelectPreset,
		onImportHtml,
		onFetchUrl,
		savedElements,
		onDropSaved,
		onSaveStashImageFiles,
		onRemoveSaved,
		customPages,
		activeCustomId,
		onSelectCustomPage,
		onResetAll,
	} = props

	const [openPanel, setOpenPanel] = useState<FlyoutPanel>(_pendingPanel)
	const [collapsed, setCollapsed] = useState(false)
	const [activeTooltip, setActiveTooltip] = useState<TooltipAnchor | null>(null)
	const [tooltipPosition, setTooltipPosition] = useState<{ left: number; bottom: number } | null>(
		null,
	)
	const tooltipRef = useRef<HTMLDivElement | null>(null)
	const toolbarDockRef = useRef<HTMLDivElement | null>(null)
	const [showCollapsedReveal, setShowCollapsedReveal] = useState(true)
	const showCollapsedRevealRef = useRef(true)

	useLayoutEffect(() => {
		if (!_pendingPanel) return
		_pendingPanel = null
	}, [])

	const toggle = (panel: FlyoutPanel) => setOpenPanel((p) => (p === panel ? null : panel))
	const closePanel = useCallback(() => setOpenPanel(null), [])

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
			{openPanel === "pages" && (
				<PagesPanel
					currentPreset={currentPreset}
					activeCustomId={activeCustomId}
					onSelectPreset={onSelectPreset}
					onFetchUrl={onFetchUrl}
					onImportHtml={onImportHtml}
					customPages={customPages}
					onSelectCustomPage={onSelectCustomPage}
					onClose={closePanel}
				/>
			)}

			{openPanel === "stash" && (
				<StashPanel
					savedElements={savedElements}
					onDropSaved={onDropSaved}
					onRemoveSaved={onRemoveSaved}
					onSaveStashImageFiles={onSaveStashImageFiles}
					savePickerMode={savePickerMode}
					onToggleSavePicker={onToggleSavePicker}
					onClose={closePanel}
				/>
			)}

			{openPanel === "settings" && (
				<SettingsPanel
					settings={settings}
					onSettingsChange={onSettingsChange}
					fps={fps}
					bodyCount={bodyCount}
					lineCount={lineCount}
					onResetAll={onResetAll}
					onClose={closePanel}
				/>
			)}

			<div
				data-domino-toolbar-root="true"
				data-domino-toolbar-dock="true"
				ref={toolbarDockRef}
				style={toolbarDockStyle}
			>
				<div
					className="domino-toolbar-tooltip-wrap"
					style={{
						...toolbarOverlayItemStyle,
						pointerEvents: collapsed && showCollapsedReveal ? "auto" : "none",
					}}
				>
					<button
						className="domino-toolbar-reveal"
						type="button"
						onClick={handleExpandToolbar}
						aria-label="Show toolbar"
						onMouseEnter={(e) => showTooltip("Show toolbar", e.currentTarget)}
						onMouseLeave={clearTooltip}
						onFocus={(e) => {
							setCollapsedRevealVisible(true)
							showTooltip("Show toolbar", e.currentTarget)
						}}
						onBlur={clearTooltip}
						style={{
							...collapsedBtnStyle,
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
					style={{
						...toolbarPillStyle,
						opacity: collapsed ? 0 : 1,
						transform: collapsed ? "translateY(16px) scale(0.96)" : "translateY(0) scale(1)",
						pointerEvents: collapsed ? "none" : "auto",
					}}
				>
					<Btn
						active={openPanel === "pages"}
						onClick={() => toggle("pages")}
						tip="Pages"
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<PageIcon />
					</Btn>
					<Sep />
					<Btn
						onClick={onExplode}
						tip="Explode scene"
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<ExplodeIcon />
					</Btn>
					<Btn
						onClick={onReset}
						tip="Reset scene"
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<ResetIcon />
					</Btn>
					<Sep />
					<Btn
						active={pickerMode}
						onClick={onTogglePicker}
						tip={pickerMode ? "Exit component picker" : "Enter component picker"}
						accent={pickerMode ? "#3b82f6" : undefined}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<PickerIcon />
					</Btn>
					<Btn
						active={openPanel === "stash" || savePickerMode}
						onClick={() => toggle("stash")}
						tip="Saved components"
						accent={savePickerMode ? "#c4b5fd" : savedElements.length > 0 ? "#a78bfa" : undefined}
						dataAttrs={{ "data-domino-stash-trigger": "true" }}
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<StashIcon />
						{savedElements.length > 0 && (
							<span
								style={{
									fontSize: 8,
									fontWeight: 700,
									color: "#a78bfa",
									marginLeft: -2,
								}}
							>
								{savedElements.length}
							</span>
						)}
					</Btn>
					<Sep />
					<Btn
						active={openPanel === "settings"}
						onClick={() => toggle("settings")}
						tip="Settings"
						onShowTooltip={showTooltip}
						onHideTooltip={clearTooltip}
					>
						<SettingsIcon />
					</Btn>
					<Btn
						onClick={handleCollapseToolbar}
						tip="Hide toolbar"
						compact
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
					style={{
						...toolbarTooltipStyle,
						left: tooltipPosition?.left ?? -9999,
						bottom: tooltipPosition?.bottom ?? 0,
						opacity: tooltipPosition ? 1 : 0,
					}}
				>
					{activeTooltip.label}
				</div>
			)}

			<style>{`
        @keyframes flyUp { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .domino-toolbar-reveal:hover,
        .domino-toolbar-reveal:focus-visible {
          opacity: 1 !important;
          transform: translateY(-2px) scale(1.03) !important;
          color: #f3f4f6;
          border-color: rgba(255,255,255,0.22);
        }
      `}</style>
		</>
	)
})

// ─── Styles ───
const toolbarDockStyle: React.CSSProperties = {
	position: "fixed",
	bottom: 16,
	right: 16,
	zIndex: 9999,
	display: "grid",
	alignItems: "end",
	justifyItems: "end",
}
const toolbarOverlayItemStyle: React.CSSProperties = {
	gridArea: "1 / 1",
	position: "relative",
	display: "flex",
	alignItems: "center",
}
const toolbarPillStyle: React.CSSProperties = {
	gridArea: "1 / 1",
	display: "flex",
	alignItems: "center",
	gap: 1,
	height: 36,
	padding: "0 2px",
	borderRadius: 10,
	backgroundColor: "rgba(20,20,24,0.92)",
	backdropFilter: "blur(20px)",
	border: "1px solid rgba(255,255,255,0.08)",
	boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
	transformOrigin: "bottom right",
	willChange: "opacity, transform",
	transition:
		"opacity 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
}
const collapsedBtnStyle: React.CSSProperties = {
	width: 34,
	height: 34,
	borderRadius: 10,
	border: "1px solid rgba(255,255,255,0.12)",
	backgroundColor: "rgba(20,20,24,0.88)",
	backdropFilter: "blur(16px)",
	color: "#9ca3af",
	cursor: "pointer",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
	transformOrigin: "bottom right",
	willChange: "opacity, transform",
	transition:
		"opacity 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1), color 160ms ease, border-color 160ms ease",
}
const toolbarTooltipStyle: React.CSSProperties = {
	position: "fixed",
	zIndex: 10001,
	pointerEvents: "none",
	whiteSpace: "nowrap",
	maxWidth: "calc(100vw - 24px)",
	overflow: "hidden",
	textOverflow: "ellipsis",
	padding: "5px 8px",
	borderRadius: 6,
	border: "1px solid rgba(255,255,255,0.08)",
	background: "rgba(10,10,14,0.94)",
	color: "#f3f4f6",
	boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
	fontFamily: '"DM Sans", sans-serif',
	fontSize: 10,
	lineHeight: 1,
	letterSpacing: "0.01em",
	transition: "opacity 0.12s ease",
}

// ─── Sub-components ───
function Sep() {
	return (
		<div
			style={{
				width: 1,
				height: 16,
				backgroundColor: "rgba(255,255,255,0.06)",
				margin: "0 1px",
			}}
		/>
	)
}

function Btn({
	children,
	onClick,
	active,
	tip,
	accent,
	compact,
	dataAttrs,
	onShowTooltip,
	onHideTooltip,
}: {
	children: React.ReactNode
	onClick: () => void
	active?: boolean
	tip?: string
	accent?: string
	compact?: boolean
	dataAttrs?: Record<string, string>
	onShowTooltip: (label: string | undefined, target: HTMLButtonElement) => void
	onHideTooltip: () => void
}) {
	return (
		<div className="domino-toolbar-tooltip-wrap">
			<button
				{...dataAttrs}
				type="button"
				onClick={() => {
					onHideTooltip()
					onClick()
				}}
				onMouseEnter={(e) => onShowTooltip(tip, e.currentTarget)}
				onMouseLeave={onHideTooltip}
				onFocus={(e) => onShowTooltip(tip, e.currentTarget)}
				onBlur={onHideTooltip}
				aria-label={tip}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 2,
					padding: compact ? "0 4px" : "0 7px",
					borderRadius: 7,
					border: "none",
					backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
					color: accent ?? (active ? "#fff" : "#777"),
					cursor: "pointer",
					transition: "all 0.12s",
					height: 30,
					minWidth: compact ? 24 : 30,
				}}
			>
				{children}
			</button>
		</div>
	)
}
