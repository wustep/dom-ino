import { describe, expect, it } from "vitest"
import { type BodyPos, bodyPositionsChanged } from "./physics"

function pos(x: number, y: number, angle = 0, w = 100, h = 50): BodyPos {
	return { x, y, angle, w, h }
}

function mapOf(entries: [string, BodyPos][]): Map<string, BodyPos> {
	return new Map(entries)
}

describe("bodyPositionsChanged", () => {
	it("returns false for two empty maps", () => {
		expect(bodyPositionsChanged(new Map(), new Map())).toBe(false)
	})

	it("returns true when sizes differ", () => {
		const prev = new Map()
		const next = mapOf([["a", pos(0, 0)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("returns true when a new id appears", () => {
		const prev = mapOf([["a", pos(0, 0)]])
		const next = mapOf([["b", pos(0, 0)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("returns false when positions are identical", () => {
		const prev = mapOf([["a", pos(10, 20, 0.5)]])
		const next = mapOf([["a", pos(10, 20, 0.5)]])
		expect(bodyPositionsChanged(prev, next)).toBe(false)
	})

	it("returns false for position changes below threshold", () => {
		const prev = mapOf([["a", pos(10, 20, 0.5)]])
		const next = mapOf([["a", pos(10.04, 20.04, 0.50004)]])
		expect(bodyPositionsChanged(prev, next)).toBe(false)
	})

	it("returns true for x change above threshold", () => {
		const prev = mapOf([["a", pos(10, 20)]])
		const next = mapOf([["a", pos(10.06, 20)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("returns true for y change above threshold", () => {
		const prev = mapOf([["a", pos(10, 20)]])
		const next = mapOf([["a", pos(10, 20.06)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("returns true for angle change above threshold", () => {
		const prev = mapOf([["a", pos(10, 20, 0.5)]])
		const next = mapOf([["a", pos(10, 20, 0.5006)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("returns true for width change", () => {
		const prev = mapOf([["a", pos(10, 20, 0, 100, 50)]])
		const next = mapOf([["a", pos(10, 20, 0, 101, 50)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("returns true for height change", () => {
		const prev = mapOf([["a", pos(10, 20, 0, 100, 50)]])
		const next = mapOf([["a", pos(10, 20, 0, 100, 51)]])
		expect(bodyPositionsChanged(prev, next)).toBe(true)
	})

	it("handles multiple bodies correctly", () => {
		const prev = mapOf([
			["a", pos(10, 20)],
			["b", pos(30, 40)],
		])
		const next = mapOf([
			["a", pos(10, 20)],
			["b", pos(30, 40)],
		])
		expect(bodyPositionsChanged(prev, next)).toBe(false)

		const moved = mapOf([
			["a", pos(10, 20)],
			["b", pos(31, 40)],
		])
		expect(bodyPositionsChanged(prev, moved)).toBe(true)
	})
})
