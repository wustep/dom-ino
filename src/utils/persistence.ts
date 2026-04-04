import type { PresetKey } from "../scene/presets"
import { isPresetKey } from "../scene/presets"
import type { CustomPage, SavedElement, SceneDescription } from "../scene/types"

const LS_KEY = "domino-state"

export interface PersistedState {
	currentPreset: PresetKey | "custom"
	activeCustomId: string | null
	savedElements: SavedElement[]
	customPages: CustomPage[]
}

function normalizeCustomPages(pages: unknown): CustomPage[] {
	if (!Array.isArray(pages)) return []
	return pages.reduce<CustomPage[]>((acc, page) => {
		if (!page || typeof page !== "object") return acc
		const p = page as Record<string, unknown>
		if (typeof p.id !== "string" || typeof p.name !== "string") return acc
		if (p.kind === "snapshot" && typeof p.preparedHtml === "string") {
			acc.push({
				id: p.id,
				name: p.name,
				kind: "snapshot" as const,
				preparedHtml: p.preparedHtml,
				sourceUrl: typeof p.sourceUrl === "string" ? p.sourceUrl : undefined,
			})
			return acc
		}
		if (p.kind === "scene" && p.scene && typeof p.scene === "object") {
			acc.push({
				id: p.id,
				name: p.name,
				kind: "scene" as const,
				scene: p.scene as SceneDescription,
			})
			return acc
		}
		// Back-compat for older persisted shape
		if (p.scene && typeof p.scene === "object") {
			acc.push({
				id: p.id,
				name: p.name,
				kind: "scene" as const,
				scene: p.scene as SceneDescription,
			})
			return acc
		}
		return acc
	}, [])
}

export function loadState(): Partial<PersistedState> {
	try {
		const raw = localStorage.getItem(LS_KEY)
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<PersistedState> & {
				customPages?: unknown
			}
			const customPages = normalizeCustomPages(parsed.customPages).filter(
				(page) => page.kind !== "scene" || page.scene.id !== "breakout",
			)
			const activeCustomId =
				typeof parsed.activeCustomId === "string" &&
				customPages.some((page) => page.id === parsed.activeCustomId)
					? parsed.activeCustomId
					: null
			let currentPreset: PresetKey | "custom" | undefined =
				parsed.currentPreset === "custom"
					? "custom"
					: isPresetKey(parsed.currentPreset)
						? parsed.currentPreset
						: undefined
			if (currentPreset === "custom" && !activeCustomId) {
				currentPreset = undefined
			}
			return {
				...parsed,
				activeCustomId,
				currentPreset,
				customPages,
			}
		}
	} catch (e) {
		console.warn("[DOMino] Failed to load persisted state:", e)
	}
	return {}
}

export function saveState(s: PersistedState) {
	try {
		// Strip preparedHtml from snapshot pages to avoid localStorage quota issues.
		// Pages with a sourceUrl will be re-fetched on reload.
		const toSave: PersistedState = {
			...s,
			customPages: s.customPages.flatMap<CustomPage>((page) => {
				if (page.kind !== "snapshot") return [page]
				if (!page.sourceUrl) return [] // can't recover imported HTML, drop it
				return [{ ...page, preparedHtml: "" }]
			}),
		}
		localStorage.setItem(LS_KEY, JSON.stringify(toSave))
	} catch (e) {
		console.warn("[DOMino] Failed to save state:", e)
	}
}

export function clearPersistedState() {
	localStorage.removeItem(LS_KEY)
}
