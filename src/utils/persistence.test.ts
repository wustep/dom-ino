import { afterEach, describe, expect, it, vi } from "vitest"
import type { PersistedState } from "./persistence"
import { saveState } from "./persistence"

const BASE_STATE: PersistedState = {
	currentPreset: "custom",
	activeCustomId: null,
	savedElements: [],
	customPages: [],
}

describe("saveState", () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("reports quota exceeded errors", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new DOMException("storage full", "QuotaExceededError")
		})

		expect(saveState(BASE_STATE)).toEqual({ ok: false, reason: "quota_exceeded" })
	})

	it("reports unknown storage errors separately", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("boom")
		})

		expect(saveState(BASE_STATE)).toEqual({ ok: false, reason: "unknown_error" })
	})

	it("returns ok on successful save", () => {
		const setItem = vi.spyOn(Storage.prototype, "setItem")

		expect(saveState(BASE_STATE)).toEqual({ ok: true })
		expect(setItem).toHaveBeenCalledOnce()
	})
})
