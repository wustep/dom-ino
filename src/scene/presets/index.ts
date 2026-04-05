import type { SceneDescription } from "../types"
import { createAliceScene } from "./alice"
import { createEngineScene } from "./engine"
import { createLandingScene } from "./landing"

export type PresetKey = "landing" | "engine" | "alice"

export const DEFAULT_PRESET: PresetKey = "engine"

export const PRESET_LIST: { key: PresetKey; label: string }[] = [
	{ key: "engine", label: "Engine" },
	{ key: "landing", label: "Landing" },
	{ key: "alice", label: "Alice" },
]

export function isPresetKey(value: unknown): value is PresetKey {
	return PRESET_LIST.some((preset) => preset.key === value)
}

export function getPresetScene(key: PresetKey, vw: number, vh: number): SceneDescription {
	switch (key) {
		case "landing":
			return createLandingScene(vw, vh)
		case "engine":
			return createEngineScene(vw, vh)
		case "alice":
			return createAliceScene(vw, vh)
	}
}
