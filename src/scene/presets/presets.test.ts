import { describe, expect, it, vi } from "vitest"

// Mock @chenglou/pretext — some presets (alice, engine) call prepare()/layout()
// at scene creation time for dynamic text measurement, which requires canvas
// (unavailable in jsdom).
vi.mock("@chenglou/pretext", () => ({
	prepare: vi.fn(() => ({ __mock: true })),
	layout: vi.fn(() => ({ height: 80, lineCount: 3 })),
	prepareWithSegments: vi.fn(() => ({ __mock: true })),
	layoutNextLine: vi.fn(() => null),
}))

import type { PresetKey } from "../presets"
import { DEFAULT_PRESET, getPresetScene, isPresetKey, PRESET_LIST } from "../presets"

describe("presets", () => {
	it("has editorial as default preset", () => {
		expect(DEFAULT_PRESET).toBe("editorial")
	})

	it("PRESET_LIST contains all expected presets", () => {
		const keys = PRESET_LIST.map((p) => p.key)
		expect(keys).toContain("editorial")
		expect(keys).toContain("landing")
		expect(keys).toContain("engine")
		expect(keys).toContain("alice")
	})

	it("PRESET_LIST entries have labels", () => {
		for (const preset of PRESET_LIST) {
			expect(preset.label).toBeTruthy()
			expect(typeof preset.label).toBe("string")
		}
	})

	describe("isPresetKey", () => {
		it("returns true for valid preset keys", () => {
			expect(isPresetKey("editorial")).toBe(true)
			expect(isPresetKey("landing")).toBe(true)
			expect(isPresetKey("engine")).toBe(true)
			expect(isPresetKey("alice")).toBe(true)
		})

		it("returns false for invalid values", () => {
			expect(isPresetKey("invalid")).toBe(false)
			expect(isPresetKey("custom")).toBe(false)
			expect(isPresetKey("")).toBe(false)
			expect(isPresetKey(null)).toBe(false)
			expect(isPresetKey(undefined)).toBe(false)
			expect(isPresetKey(42)).toBe(false)
		})
	})

	describe("getPresetScene", () => {
		const presets: PresetKey[] = ["editorial", "landing", "engine", "alice"]

		for (const key of presets) {
			it(`generates valid scene for "${key}" preset`, () => {
				const scene = getPresetScene(key, 1200, 800)
				expect(scene.id).toBeTruthy()
				expect(scene.name).toBeTruthy()
				expect(scene.width).toBeGreaterThan(0)
				expect(scene.height).toBeGreaterThan(0)
				expect(scene.backgroundColor).toBeTruthy()
				expect(scene.elements).toBeInstanceOf(Array)
				expect(scene.elements.length).toBeGreaterThan(0)
			})

			it(`"${key}" scene elements have valid structure`, () => {
				const scene = getPresetScene(key, 1200, 800)
				for (const el of scene.elements) {
					expect(el.id).toBeTruthy()
					expect(el.type).toBeTruthy()
					expect(el.rect).toBeDefined()
					expect(el.rect.width).toBeGreaterThan(0)
					expect(el.rect.height).toBeGreaterThan(0)
					expect(typeof el.throwable).toBe("boolean")
					expect(typeof el.pinned).toBe("boolean")
				}
			})

			it(`"${key}" scene has at least one throwable element`, () => {
				const scene = getPresetScene(key, 1200, 800)
				const throwables = scene.elements.filter((el) => el.throwable)
				expect(throwables.length).toBeGreaterThan(0)
			})
		}

		it("uses viewport dimensions for layout", () => {
			const small = getPresetScene("editorial", 600, 400)
			const large = getPresetScene("editorial", 1920, 1080)
			// Larger viewport should produce different layout
			expect(large.width).not.toBe(small.width)
		})
	})
})
