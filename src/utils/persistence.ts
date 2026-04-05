import type { SceneSettings } from "../contexts/SettingsContext"
import type { PresetKey } from "../scene/presets"
import { isPresetKey } from "../scene/presets"
import type { CustomPage, SavedElement, SceneDescription } from "../scene/types"

const LS_KEY = "domino-state"
const LS_SETTINGS_KEY = "domino-settings"

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

/** Loads persisted app state from localStorage with validation and back-compat normalization. */
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

/** Persists app state to localStorage, stripping heavy snapshot HTML to avoid quota issues. */
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

/** Removes all persisted state from localStorage. */
export function clearPersistedState() {
	localStorage.removeItem(LS_KEY)
	localStorage.removeItem(LS_SETTINGS_KEY)
}

const DEFAULT_SETTINGS: SceneSettings = {
	physicsEnabled: true,
	showObstacleBounds: false,
	showLineBounds: false,
	gravityX: 0,
	gravityY: 0,
	paused: false,
	pretextEnabled: true,
	textBodiesEnabled: false,
	maxAutoSelectComponents: 500,
	allowWordBreaks: true,
	restitution: 0.3,
	allowRotation: true,
}

/** Keys from SceneSettings that are persisted (excludes transient state like `paused`). */
const PERSISTED_KEYS = [
	"physicsEnabled",
	"showObstacleBounds",
	"showLineBounds",
	"gravityX",
	"gravityY",
	"pretextEnabled",
	"textBodiesEnabled",
	"maxAutoSelectComponents",
	"allowWordBreaks",
	"restitution",
	"allowRotation",
] as const satisfies readonly (keyof SceneSettings)[]

/** Loads persisted scene settings from localStorage, merged with defaults. */
export function loadSettings(): SceneSettings {
	try {
		const raw = localStorage.getItem(LS_SETTINGS_KEY)
		if (raw) {
			const parsed = JSON.parse(raw)
			if (parsed && typeof parsed === "object") {
				const result = { ...DEFAULT_SETTINGS }
				for (const key of PERSISTED_KEYS) {
					if (key in parsed && typeof parsed[key] === typeof DEFAULT_SETTINGS[key]) {
						;(result as Record<string, unknown>)[key] = parsed[key]
					}
				}
				return result
			}
		}
	} catch (e) {
		console.warn("[DOMino] Failed to load persisted settings:", e)
	}
	return { ...DEFAULT_SETTINGS }
}

/** Persists scene settings to localStorage (only non-transient keys). */
export function saveSettings(s: SceneSettings) {
	try {
		const toSave: Record<string, unknown> = {}
		for (const key of PERSISTED_KEYS) {
			toSave[key] = s[key]
		}
		localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(toSave))
	} catch (e) {
		console.warn("[DOMino] Failed to save settings:", e)
	}
}
