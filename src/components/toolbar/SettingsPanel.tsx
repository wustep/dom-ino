import { useCallback } from "react"
import { type SceneSettings, useSettingsContext } from "../../contexts/SettingsContext"

interface SettingsPanelProps {
	onClose: () => void
}

/** Flyout panel for physics, reflow, gravity, and debug settings. */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
	const {
		settings,
		setSettings: onSettingsChange,
		fps,
		bodyCount,
		lineCount,
		onResetAll,
	} = useSettingsContext()

	const update = useCallback(
		(partial: Partial<SceneSettings>) => onSettingsChange({ ...settings, ...partial }),
		[settings, onSettingsChange],
	)

	const showDebugBounds = settings.showObstacleBounds || settings.showLineBounds

	return (
		<div data-domino-toolbar-root="true" className="dt-flyout" style={{ width: 240 }}>
			<div className="dt-stats">
				<span>
					<span
						style={{
							color:
								fps > 50
									? "var(--dt-success)"
									: fps > 30
										? "var(--dt-warning)"
										: "var(--dt-danger)",
						}}
					>
						{fps}
					</span>{" "}
					fps
				</span>
				<span>
					<span style={{ color: "#60a5fa" }}>{bodyCount}</span> bodies
				</span>
				<span>
					<span style={{ color: "#60a5fa" }}>{lineCount}</span> lines
				</span>
			</div>
			<div className="dt-settings-body">
				<div className="dt-label">Simulation</div>
				<Toggle
					label="Physics"
					checked={settings.physicsEnabled}
					onChange={(v) => update({ physicsEnabled: v })}
				/>
				<Slider
					label="Gravity X"
					value={settings.gravityX}
					min={-3}
					max={3}
					onValue={(v) => update({ gravityX: v })}
					onReset={() => update({ gravityX: 0 })}
				/>
				<Slider
					label="Gravity Y"
					value={settings.gravityY}
					min={-3}
					max={3}
					onValue={(v) => update({ gravityY: v })}
					onReset={() => update({ gravityY: 0 })}
				/>
				<div className="dt-label">Bodies</div>
				<Toggle
					label="Letter bodies"
					checked={settings.textBodiesEnabled}
					onChange={(v) => update({ textBodiesEnabled: v })}
				/>
				<Toggle
					label="Rotation"
					checked={settings.allowRotation}
					onChange={(v) => update({ allowRotation: v })}
				/>
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
				<div className="dt-label">Text</div>
				<Toggle
					label="Pretext reflow"
					checked={settings.pretextEnabled}
					disabled={settings.textBodiesEnabled}
					title={settings.textBodiesEnabled ? "Disabled while letter bodies is on" : undefined}
					onChange={(v) => update({ pretextEnabled: v })}
				/>
				<Toggle
					label="Break words"
					checked={settings.allowWordBreaks}
					disabled={settings.textBodiesEnabled || !settings.pretextEnabled}
					title={
						settings.textBodiesEnabled
							? "Disabled while letter bodies is on"
							: !settings.pretextEnabled
								? "Disabled while pretext reflow is off"
								: undefined
					}
					onChange={(v) => update({ allowWordBreaks: v })}
				/>
				<div className="dt-label">Debug</div>
				<Toggle
					label="Bounds"
					checked={showDebugBounds}
					onChange={(v) => update({ showObstacleBounds: v, showLineBounds: v })}
				/>
				<div
					style={{
						marginTop: 2,
					}}
				>
					<button
						onClick={() => {
							onResetAll()
							onClose()
						}}
						className="dt-reset-all"
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
function Toggle({
	label,
	checked,
	onChange,
	disabled = false,
	title,
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
	disabled?: boolean
	title?: string
}) {
	return (
		<label className={`dt-toggle${disabled ? " dt-toggle--disabled" : ""}`} title={title}>
			<span>{label}</span>
			<button
				type="button"
				role="switch"
				aria-label={label}
				aria-checked={checked}
				disabled={disabled}
				onClick={() => onChange(!checked)}
				className={`dt-toggle-track${checked ? " dt-toggle-track--checked" : ""}`}
			>
				<div className={`dt-toggle-thumb${checked ? " dt-toggle-thumb--checked" : ""}`} />
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
			<div className="dt-slider-header">
				<span className="dt-slider-label">
					{label}: {value.toFixed(2)}
				</span>
				<button onClick={onReset} className="dt-slider-reset">
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
				className="dt-slider-input"
			/>
		</div>
	)
}
