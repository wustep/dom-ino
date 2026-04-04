import { createContext, use } from "react"

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

export interface SettingsContextValue {
	settings: DebugSettings
	setSettings: (s: DebugSettings) => void
	fps: number
	bodyCount: number
	lineCount: number
	onResetAll: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettingsContext(): SettingsContextValue {
	const ctx = use(SettingsContext)
	if (!ctx) throw new Error("useSettingsContext must be used within a SettingsContext provider")
	return ctx
}
