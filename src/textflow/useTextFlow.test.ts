import type { LayoutCursor, LayoutLine, PreparedTextWithSegments } from "@chenglou/pretext"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ObstacleRect } from "../scene/types"

// Mock @chenglou/pretext — canvas is unavailable in jsdom so we mock the
// measurement layer and test the flow algorithm in isolation.
vi.mock("@chenglou/pretext", () => {
	return {
		prepareWithSegments: vi.fn(),
		layoutNextLine: vi.fn(),
	}
})

import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext"
import { computeTextFlow } from "./useTextFlow"

const mockPrepare = vi.mocked(prepareWithSegments)
const mockLayout = vi.mocked(layoutNextLine)

const FONT = "16px serif"
const PREPARED = { __mock: true } as unknown as PreparedTextWithSegments

function cursor(seg: number, g: number): LayoutCursor {
	return { segmentIndex: seg, graphemeIndex: g }
}

function makeLine(
	text: string,
	width: number,
	start: LayoutCursor,
	endGrapheme: number,
): LayoutLine {
	return {
		text,
		width,
		start,
		end: cursor(start.segmentIndex, endGrapheme),
	}
}

function obstacle(x: number, y: number, w: number, h: number): ObstacleRect {
	return { id: "obs", x, y, width: w, height: h, angle: 0 }
}

beforeEach(() => {
	vi.clearAllMocks()
	mockPrepare.mockReturnValue(PREPARED)
})

// ── Basic flow behavior ──

describe("computeTextFlow", () => {
	it("returns empty lines for empty text", () => {
		const result = computeTextFlow("", FONT, 20, 0, 0, 400, 200, [])
		expect(result.lines).toEqual([])
		expect(result.totalHeight).toBe(0)
	})

	it("returns empty lines when container is too narrow", () => {
		const result = computeTextFlow("Hello", FONT, 20, 0, 0, 20, 200, [])
		expect(result.lines).toEqual([])
	})

	it("lays out a single line of text", () => {
		mockLayout
			.mockReturnValueOnce(makeLine("Hello world", 120, cursor(0, 0), 11))
			.mockReturnValueOnce(null) // text exhausted

		const result = computeTextFlow("Hello world", FONT, 20, 0, 0, 400, 200, [])

		expect(result.lines).toHaveLength(1)
		expect(result.lines[0]).toMatchObject({
			text: "Hello world",
			x: 0,
			y: 0,
			width: 120,
			maxWidth: 400,
		})
		expect(result.totalHeight).toBe(20)
	})

	it("lays out multiple lines until text is exhausted", () => {
		mockLayout
			.mockReturnValueOnce(makeLine("First line", 380, cursor(0, 0), 10))
			.mockReturnValueOnce(makeLine("Second line", 350, cursor(0, 10), 21))
			.mockReturnValueOnce(null)

		const result = computeTextFlow("First line Second line", FONT, 20, 0, 0, 400, 200, [])

		expect(result.lines).toHaveLength(2)
		expect(result.lines[0].y).toBe(0)
		expect(result.lines[1].y).toBe(20)
		expect(result.totalHeight).toBe(40)
	})

	it("respects containerMaxHeight and stops when out of space", () => {
		// Container only has room for 2 lines (height=40, lineHeight=20)
		mockLayout
			.mockReturnValueOnce(makeLine("Line 1", 300, cursor(0, 0), 6))
			.mockReturnValueOnce(makeLine("Line 2", 300, cursor(0, 6), 12))
		// 3rd line would start at y=40 but 40+20 > 40, so loop stops

		const result = computeTextFlow("Line 1 Line 2 Line 3", FONT, 20, 0, 0, 400, 40, [])

		expect(result.lines).toHaveLength(2)
		expect(result.totalHeight).toBe(40)
	})

	it("applies container offsets to line positions", () => {
		mockLayout
			.mockReturnValueOnce(makeLine("Hello", 100, cursor(0, 0), 5))
			.mockReturnValueOnce(null)

		const result = computeTextFlow("Hello", FONT, 20, 50, 100, 400, 200, [])

		expect(result.lines[0].x).toBe(50)
		expect(result.lines[0].y).toBe(100)
	})

	// ── Obstacle avoidance ──

	it("flows text around an obstacle (two segments on one row)", () => {
		// Obstacle at x=150..250 blocks middle of 400-wide container
		const obs = [obstacle(150, 0, 100, 40)]

		// Row 0: two segments — [0,142] and [258,400]
		// (after 8px padding: [0,142] gap [258,400])
		mockLayout
			.mockReturnValueOnce(makeLine("Left", 80, cursor(0, 0), 4)) // fits in left segment
			.mockReturnValueOnce(makeLine("Right", 70, cursor(0, 4), 9)) // fits in right segment
			.mockReturnValueOnce(makeLine("More", 60, cursor(0, 9), 13)) // row 1 (below obstacle at y=40)
			.mockReturnValueOnce(null)

		const result = computeTextFlow("Left Right More", FONT, 20, 0, 0, 400, 200, obs)

		expect(result.lines.length).toBeGreaterThanOrEqual(2)
		// First two lines should be at y=0 (same row, different segments)
		expect(result.lines[0].y).toBe(0)
		expect(result.lines[1].y).toBe(0)
	})

	it("skips fully blocked rows and continues below obstacle", () => {
		// Obstacle fills entire container width
		const obs = [obstacle(0, 0, 400, 40)]

		mockLayout
			.mockReturnValueOnce(makeLine("Below", 100, cursor(0, 0), 5))
			.mockReturnValueOnce(null)

		const result = computeTextFlow("Below", FONT, 20, 0, 0, 400, 200, obs)

		// Text should appear below the obstacle (y=40 or y=60 depending on padding)
		expect(result.lines).toHaveLength(1)
		expect(result.lines[0].y).toBeGreaterThanOrEqual(40)
	})

	it("bails after 5 consecutive fully blocked rows", () => {
		// Obstacle fills entire container for a tall stretch
		const obs = [obstacle(0, 0, 400, 200)]

		const result = computeTextFlow("Hello", FONT, 20, 0, 0, 400, 400, obs)

		// Should bail after trying 5+ blocked rows, producing no lines in the blocked zone
		expect(result.lines).toHaveLength(0)
	})

	// ── Word break control ──

	it("skips segments that break words when allowWordBreaks is false", () => {
		// When layoutNextLine returns a line with end.graphemeIndex > 0,
		// it means the word was broken mid-grapheme
		mockLayout
			// First segment: word break (graphemeIndex > 0 in end cursor)
			.mockReturnValueOnce(makeLine("Hel", 50, cursor(0, 0), 3))
			// Next row, full width: no break needed
			.mockReturnValueOnce(makeLine("Hello world", 200, cursor(0, 0), 11))
			.mockReturnValueOnce(null)

		const result = computeTextFlow(
			"Hello world",
			FONT,
			20,
			0,
			0,
			400,
			200,
			[],
			8,
			8,
			false, // allowWordBreaks = false
		)

		// The first fragment ("Hel") should be skipped because it breaks a word
		// and allowWordBreaks is false. The full line should appear on the next row.
		expect(result.lines.some((l) => l.text === "Hel")).toBe(false)
	})

	// ── Start cursor (continuation) ──

	it("starts layout from a provided startCursor", () => {
		const start = cursor(0, 10)
		mockLayout
			.mockReturnValueOnce(makeLine("continued text", 200, start, 24))
			.mockReturnValueOnce(null)

		const result = computeTextFlow(
			"Some text. continued text",
			FONT,
			20,
			0,
			0,
			400,
			200,
			[],
			8,
			8,
			true,
			start,
		)

		// layoutNextLine should have been called with the start cursor
		expect(mockLayout).toHaveBeenCalledWith(PREPARED, start, expect.any(Number))
		expect(result.lines).toHaveLength(1)
		expect(result.lines[0].text).toBe("continued text")
	})

	it("returns the end cursor from the last laid-out line", () => {
		mockLayout
			.mockReturnValueOnce(makeLine("Line 1", 300, cursor(0, 0), 6))
			.mockReturnValueOnce(makeLine("Line 2", 300, cursor(0, 6), 12))
			.mockReturnValueOnce(null)

		const result = computeTextFlow("Line 1 Line 2", FONT, 20, 0, 0, 400, 200, [])

		expect(result.endCursor).toEqual(cursor(0, 12))
	})

	it("tracks charOffset across prepared segments", () => {
		const segmentedPrepared = {
			__mock: true,
			segments: ["Hello", " ", "world"],
			kinds: ["word", "space", "word"],
		} as unknown as PreparedTextWithSegments
		mockPrepare.mockReturnValue(segmentedPrepared)
		mockLayout.mockReturnValueOnce(makeLine("world", 80, cursor(2, 0), 5)).mockReturnValueOnce(null)

		const result = computeTextFlow(
			"Hello world unique",
			`${FONT} segmented`,
			20,
			0,
			0,
			400,
			200,
			[],
		)

		expect(result.lines).toHaveLength(1)
		expect(result.lines[0].charOffset).toBe(6)
	})

	// ── Caching ──

	it("caches prepared text by text+font key", () => {
		mockLayout.mockReturnValue(null)

		computeTextFlow("Same text", FONT, 20, 0, 0, 400, 200, [])
		computeTextFlow("Same text", FONT, 20, 50, 50, 300, 100, [])

		// prepareWithSegments should only be called once for the same text+font
		expect(mockPrepare).toHaveBeenCalledTimes(1)
	})

	it("prepares separately for different fonts", () => {
		mockLayout.mockReturnValue(null)
		const text = "Unique text for font test " + Math.random()

		computeTextFlow(text, "16px serif", 20, 0, 0, 400, 200, [])
		computeTextFlow(text, "700 16px sans-serif", 20, 0, 0, 400, 200, [])

		expect(mockPrepare).toHaveBeenCalledTimes(2)
	})
})
