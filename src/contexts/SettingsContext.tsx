import { createContext, use } from "react"

/** Runtime scene configuration: physics, reflow, debug, and gravity settings. */
export interface SceneSettings {
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
	allowRotation: boolean
}

/** Scene settings + stats provided to SettingsPanel via context. */
export interface SettingsContextValue {
	settings: SceneSettings
	setSettings: (s: SceneSettings) => void
	fps: number
	bodyCount: number
	lineCount: number
	onResetAll: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Accesses scene settings and stats from SettingsContext. */
export function useSettingsContext(): SettingsContextValue {
	const ctx = use(SettingsContext)
	if (!ctx) throw new Error("useSettingsContext must be used within a SettingsContext provider")
	return ctx
}
