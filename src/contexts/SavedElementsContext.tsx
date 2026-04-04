import { createContext, use } from "react"
import type { SavedElement, SceneElement } from "../scene/types"

export interface SavedElementsContextValue {
	savedElements: SavedElement[]
	saveElement: (el: SceneElement) => void
	unsaveElement: (id: string) => void
	removeSaved: (index: number) => void
	saveStashImageFiles: (files: File[]) => void
}

export const SavedElementsContext = createContext<SavedElementsContextValue | null>(null)

export function useSavedElements(): SavedElementsContextValue {
	const ctx = use(SavedElementsContext)
	if (!ctx) throw new Error("useSavedElements must be used within a SavedElementsContext provider")
	return ctx
}
