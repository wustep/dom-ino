import { useCallback } from "react"
import { type DebugSettings, useSettingsContext } from "../../contexts/SettingsContext"

interface SettingsPanelProps {
	onClose: () => void
}

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
		(partial: Partial<DebugSettings>) => onSettingsChange({ ...settings, ...partial }),
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
				<span>{bodyCount} bodies</span>
				<span>{lineCount} lines</span>
			</div>
			<div className="dt-settings-body">
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
					<div className="dt-hint">
						Live text is replaced by individual glyph bodies. Reflow pauses while this is on.
					</div>
				)}
				<div className="dt-label">Gravity</div>
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
				<div className="dt-label">Bodies</div>
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
				<div className="dt-label">Debug</div>
				<Toggle
					label="Bounds"
					checked={showDebugBounds}
					onChange={(v) => update({ showObstacleBounds: v, showLineBounds: v })}
				/>
				<div
					style={{
						marginTop: 6,
						paddingTop: 6,
						borderTop: "1px solid var(--dt-border-divider)",
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
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
	disabled?: boolean
}) {
	return (
		<label className={`dt-toggle${disabled ? " dt-toggle--disabled" : ""}`}>
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
