import { createContext, use } from "react"
import type { PresetKey } from "../scene/presets"
import type { CustomPage } from "../scene/types"

export interface NavigationContextValue {
	currentPreset: PresetKey | "custom"
	customPages: CustomPage[]
	activeCustomId: string | null
	onSelectPreset: (key: PresetKey) => void
	onSelectCustomPage: (id: string) => void
	onImportHtml: (html: string, name: string) => void
	onFetchUrl: (url: string) => Promise<void>
}

export const NavigationContext = createContext<NavigationContextValue | null>(null)

export function useNavigation(): NavigationContextValue {
	const ctx = use(NavigationContext)
	if (!ctx) throw new Error("useNavigation must be used within a NavigationContext provider")
	return ctx
}
