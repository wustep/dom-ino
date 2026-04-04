import { useCallback } from "react"
import type { DebugSettings } from "../Toolbar"

interface SettingsPanelProps {
	settings: DebugSettings
	onSettingsChange: (s: DebugSettings) => void
	fps: number
	bodyCount: number
	lineCount: number
	onResetAll: () => void
	onClose: () => void
}

export function SettingsPanel({
	settings,
	onSettingsChange,
	fps,
	bodyCount,
	lineCount,
	onResetAll,
	onClose,
}: SettingsPanelProps) {
	const update = useCallback(
		(partial: Partial<DebugSettings>) => onSettingsChange({ ...settings, ...partial }),
		[settings, onSettingsChange],
	)

	const showDebugBounds = settings.showObstacleBounds || settings.showLineBounds

	return (
		<div
			data-domino-toolbar-root="true"
			style={{ ...flyoutBase, bottom: 56, right: 16, width: 240 }}
		>
			<div
				style={{
					padding: "8px 12px",
					display: "flex",
					gap: 10,
					borderBottom: "1px solid rgba(255,255,255,0.05)",
					fontSize: 9,
					color: "#888",
					fontFamily: '"JetBrains Mono", monospace',
				}}
			>
				<span>
					<span
						style={{
							color: fps > 50 ? "#4ade80" : fps > 30 ? "#fbbf24" : "#f87171",
						}}
					>
						{fps}
					</span>{" "}
					fps
				</span>
				<span>{bodyCount} bodies</span>
				<span>{lineCount} lines</span>
			</div>
			<div
				style={{
					padding: "8px 12px",
					display: "flex",
					flexDirection: "column",
					gap: 6,
					fontFamily: '"JetBrains Mono", monospace',
					fontSize: 10,
				}}
			>
				<Toggle
					label="Physics"
					checked={settings.physicsEnabled}
					onChange={(v) => update({ physicsEnabled: v })}
				/>
				<Toggle
					label="Letter bodies"
					checked={settings.textBodiesEnabled}
					onChange={(v) => update({ textBodiesEnabled: v })}
				/>
				<Toggle
					label="Pretext reflow"
					checked={settings.pretextEnabled}
					disabled={settings.textBodiesEnabled}
					onChange={(v) => update({ pretextEnabled: v })}
				/>
				<Toggle
					label="Break words"
					checked={settings.allowWordBreaks}
					disabled={settings.textBodiesEnabled || !settings.pretextEnabled}
					onChange={(v) => update({ allowWordBreaks: v })}
				/>
				{settings.textBodiesEnabled && (
					<div style={settingHintStyle}>
						Live text is replaced by individual glyph bodies. Reflow pauses while this is on.
					</div>
				)}
				<Lbl text="Gravity" />
				<Slider
					label="X"
					value={settings.gravityX}
					min={-3}
					max={3}
					onValue={(v) => update({ gravityX: v })}
					onReset={() => update({ gravityX: 0 })}
				/>
				<Slider
					label="Y"
					value={settings.gravityY}
					min={-3}
					max={3}
					onValue={(v) => update({ gravityY: v })}
					onReset={() => update({ gravityY: 0 })}
				/>
				<Lbl text="Bodies" />
				<Slider
					label="Bounce"
					value={settings.restitution}
					min={0}
					max={1}
					onValue={(v) => update({ restitution: v })}
					onReset={() => update({ restitution: 0.3 })}
					step={0.05}
					resetLabel="0.3"
				/>
				<Lbl text="Debug" />
				<Toggle
					label="Bounds"
					checked={showDebugBounds}
					onChange={(v) => update({ showObstacleBounds: v, showLineBounds: v })}
				/>
				<div
					style={{
						marginTop: 6,
						paddingTop: 6,
						borderTop: "1px solid rgba(255,255,255,0.06)",
					}}
				>
					<button
						onClick={() => {
							onResetAll()
							onClose()
						}}
						style={{
							width: "100%",
							padding: "5px 0",
							borderRadius: 5,
							border: "1px solid rgba(248,113,113,0.2)",
							backgroundColor: "transparent",
							color: "#f87171",
							fontSize: 9,
							fontWeight: 600,
							fontFamily: '"DM Sans", sans-serif',
							cursor: "pointer",
						}}
					>
						Reset all state
					</button>
				</div>
			</div>
			<div style={{ height: 3 }} />
		</div>
	)
}

// ─── Sub-components ───
function Lbl({ text }: { text: string }) {
	return (
		<div
			style={{
				fontSize: 8,
				fontWeight: 700,
				color: "#555",
				textTransform: "uppercase",
				letterSpacing: "0.1em",
				marginTop: 4,
				marginBottom: -2,
			}}
		>
			{text}
		</div>
	)
}

function Toggle({
	label,
	checked,
	onChange,
	disabled = false,
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
	disabled?: boolean
}) {
	return (
		<label
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 10,
				cursor: disabled ? "not-allowed" : "pointer",
				opacity: disabled ? 0.42 : 1,
			}}
		>
			<span>{label}</span>
			<button
				type="button"
				role="switch"
				aria-label={label}
				aria-checked={checked}
				disabled={disabled}
				onClick={() => onChange(!checked)}
				style={{
					width: 28,
					height: 16,
					padding: 0,
					border: "none",
					borderRadius: 8,
					backgroundColor: checked ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)",
					position: "relative",
					cursor: disabled ? "not-allowed" : "pointer",
					flexShrink: 0,
				}}
			>
				<div
					style={{
						position: "absolute",
						top: 2,
						left: checked ? 14 : 2,
						width: 12,
						height: 12,
						borderRadius: "50%",
						backgroundColor: checked ? "#4ade80" : "#555",
						transition: "left 0.2s",
					}}
				/>
			</button>
		</label>
	)
}

function Slider({
	label,
	value,
	min,
	max,
	onValue,
	onReset,
	step = 0.1,
	resetLabel,
}: {
	label: string
	value: number
	min: number
	max: number
	onValue: (v: number) => void
	onReset: () => void
	step?: number
	resetLabel?: string
}) {
	return (
		<div>
			<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
				<span style={{ fontSize: 9, color: "#888" }}>
					{label}: {value.toFixed(2)}
				</span>
				<button
					onClick={onReset}
					style={{
						background: "none",
						border: "none",
						color: "#555",
						fontSize: 8,
						cursor: "pointer",
						padding: 0,
						textDecoration: "underline",
						fontFamily: '"JetBrains Mono", monospace',
					}}
				>
					{resetLabel ?? "0"}
				</button>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onValue(Number.parseFloat(e.target.value))}
				style={{ width: "100%", accentColor: "#555", height: 4 }}
			/>
		</div>
	)
}

// ─── Styles ───
const flyoutBase: React.CSSProperties = {
	position: "fixed",
	zIndex: 9998,
	maxHeight: "calc(100vh - 80px)",
	overflowY: "auto",
	borderRadius: 12,
	border: "1px solid rgba(255,255,255,0.08)",
	backgroundColor: "rgba(20,20,24,0.95)",
	backdropFilter: "blur(20px)",
	boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
	fontFamily: '"DM Sans", sans-serif',
	color: "#ccc",
	animation: "flyUp 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
}
const settingHintStyle: React.CSSProperties = {
	marginTop: -1,
	color: "#666",
	fontSize: 9,
	lineHeight: 1.45,
}
