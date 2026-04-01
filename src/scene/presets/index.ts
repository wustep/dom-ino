import type { SceneDescription } from "../types";
import { createArticleScene } from "./article";
import { createDashboardScene } from "./dashboard";
import { createLandingScene } from "./landing";
import { createEditorialScene } from "./editorial";
import { createEngineScene } from "./engine";
import { createPlaygroundScene } from "./playground";
import { createStormScene } from "./storm";

export type PresetKey = "article" | "dashboard" | "landing" | "editorial" | "engine" | "storm" | "playground";

export const PRESET_LIST: { key: PresetKey; label: string }[] = [
  { key: "article", label: "Article" },
  { key: "dashboard", label: "Dashboard" },
  { key: "landing", label: "Landing" },
  { key: "editorial", label: "Editorial" },
  { key: "engine", label: "Engine" },
  { key: "storm", label: "Storm Desk" },
  { key: "playground", label: "Playground" },
];

export function isPresetKey(value: unknown): value is PresetKey {
  return PRESET_LIST.some((preset) => preset.key === value);
}

export function getPresetScene(key: PresetKey, vw: number, vh: number): SceneDescription {
  switch (key) {
    case "article": return createArticleScene(vw, vh);
    case "dashboard": return createDashboardScene(vw, vh);
    case "landing": return createLandingScene(vw, vh);
    case "editorial": return createEditorialScene(vw, vh);
    case "engine": return createEngineScene(vw, vh);
    case "storm": return createStormScene(vw, vh);
    case "playground": return createPlaygroundScene(vw, vh);
  }
}
