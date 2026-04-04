import type { SceneDescription } from "../types"
import { createAliceScene } from "./alice"
import { createEditorialScene } from "./editorial"
import { createEngineScene } from "./engine"
import { createLandingScene } from "./landing"

export type PresetKey = "editorial" | "landing" | "engine" | "alice"

export const DEFAULT_PRESET: PresetKey = "editorial"

export const PRESET_LIST: { key: PresetKey; label: string }[] = [
	{ key: "editorial", label: "Editorial" },
	{ key: "landing", label: "Landing" },
	{ key: "engine", label: "Engine" },
	{ key: "alice", label: "Alice" },
]

export function isPresetKey(value: unknown): value is PresetKey {
	return PRESET_LIST.some((preset) => preset.key === value)
}

export function getPresetScene(key: PresetKey, vw: number, vh: number): SceneDescription {
	switch (key) {
		case "editorial":
			return createEditorialScene(vw, vh)
		case "landing":
			return createLandingScene(vw, vh)
		case "engine":
			return createEngineScene(vw, vh)
		case "alice":
			return createAliceScene(vw, vh)
	}
}
