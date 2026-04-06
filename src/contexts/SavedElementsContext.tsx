import { createContext, use } from "react"
import type { SavedElement, SceneElement } from "../scene/types"

/** Shared saved element state consumed by Toolbar, StashPanel, and picker components. */
export interface SavedElementsContextValue {
	savedElements: SavedElement[]
	saveElement: (el: SceneElement) => void
	unsaveElement: (id: string) => void
	removeSaved: (index: number) => void
	saveStashImageFiles: (files: File[]) => void
	saveStashImageUrl: (url: string) => Promise<"ok" | "load_error" | "invalid_url">
}

export const SavedElementsContext = createContext<SavedElementsContextValue | null>(null)

/** Accesses saved element state from SavedElementsContext. */
export function useSavedElements(): SavedElementsContextValue {
	const ctx = use(SavedElementsContext)
	if (!ctx) throw new Error("useSavedElements must be used within a SavedElementsContext provider")
	return ctx
}
