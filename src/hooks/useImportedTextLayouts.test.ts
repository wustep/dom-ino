import type { LayoutCursor, PreparedTextWithSegments } from "@chenglou/pretext"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SnapshotTextBlock } from "../scene/snapshotHelpers"
import type { ObstacleRect, SceneElement } from "../scene/types"

// Canvas measurement is unavailable in jsdom; fake one line per call.
vi.mock("@chenglou/pretext", () => ({
	prepareWithSegments: vi.fn(),
	layoutNextLine: vi.fn(),
}))

import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext"
import { useImportedTextLayouts } from "./useImportedTextLayouts"

const mockLayout = vi.mocked(layoutNextLine)

function block(id: string, y: number): SnapshotTextBlock {
	const sceneElement: SceneElement = {
		id,
		type: "paragraph",
		rect: { x: 0, y, width: 300, height: 40 },
		throwable: false,
		pinned: true,
		text: `text of ${id}`,
		fontSize: 16,
		lineHeight: 20,
	}
	return { id, sceneElement, node: document.createElement("p") }
}

function obstacle(id: string, x: number, y: number): ObstacleRect {
	return { id, x, y, width: 50, height: 50, angle: 0 }
}

describe("useImportedTextLayouts caching", () => {
	beforeEach(() => {
		vi.mocked(prepareWithSegments).mockReturnValue({
			segments: ["word"],
			kinds: ["text"],
		} as unknown as PreparedTextWithSegments)
		mockLayout.mockReset()
		mockLayout.mockImplementation((_p, start: LayoutCursor, width: number) =>
			start.segmentIndex >= 1
				? null
				: {
						text: "word",
						width: Math.min(40, width),
						start,
						end: { segmentIndex: 1, graphemeIndex: 0 },
					},
		)
	})

	const blocks = [block("top", 0), block("bottom", 600)]
	const iframeRef = { current: null }

	it("only re-lays out blocks whose rows an obstacle touches", () => {
		const { result, rerender } = renderHook(
			({ obstacles }) => useImportedTextLayouts(true, blocks, obstacles, 1200, iframeRef),
			{ initialProps: { obstacles: [obstacle("o", 400, 300)] } },
		)
		const [top1, bottom1] = result.current
		const callsAfterFirst = mockLayout.mock.calls.length

		// Obstacle moves in empty space: nothing re-laid out, same objects reused.
		rerender({ obstacles: [obstacle("o", 420, 320)] })
		expect(result.current[0]).toBe(top1)
		expect(result.current[1]).toBe(bottom1)
		expect(mockLayout.mock.calls.length).toBe(callsAfterFirst)

		// Sub-pixel drift is quantized away.
		rerender({ obstacles: [obstacle("o", 420.3, 320.2)] })
		expect(result.current[0]).toBe(top1)

		// Obstacle moves onto the top block: only that block is recomputed.
		rerender({ obstacles: [obstacle("o", 100, 0)] })
		expect(result.current[0]).not.toBe(top1)
		expect(result.current[1]).toBe(bottom1)
		expect(mockLayout.mock.calls.length).toBeGreaterThan(callsAfterFirst)
		// Text now wraps around the obstacle (8px padding on each side).
		expect(result.current[0].flow.lines[0].maxWidth).toBe(92)
	})

	it("returns nothing and drops the cache when inactive", () => {
		const { result, rerender } = renderHook(
			({ active }) => useImportedTextLayouts(active, blocks, [], 1200, iframeRef),
			{ initialProps: { active: true } },
		)
		expect(result.current).toHaveLength(2)
		rerender({ active: false })
		expect(result.current).toEqual([])
	})
})
