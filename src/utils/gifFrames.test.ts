import { afterEach, describe, expect, it, vi } from "vitest"
import { GifAlphaController, type ParsedGif } from "./gifFrames"

function makeImageData(alphaValues: number[]): ImageData {
	const data = new Uint8ClampedArray(alphaValues.length * 4)
	for (let i = 0; i < alphaValues.length; i++) {
		const base = i * 4
		data[base] = 255
		data[base + 1] = 255
		data[base + 2] = 255
		data[base + 3] = alphaValues[i]
	}
	return { width: alphaValues.length, height: 1, data } as ImageData
}

function makeGif(delays: number[] = [100, 100, 100]): ParsedGif {
	const frames = [
		makeImageData([255, 0, 0]),
		makeImageData([0, 255, 0]),
		makeImageData([0, 0, 255]),
	].map((imageData, index) => ({
		imageData,
		delay: delays[index] ?? 100,
	}))

	return {
		width: 3,
		height: 1,
		frames,
		totalDuration: frames.reduce((total, frame) => total + frame.delay, 0),
	}
}

describe("GifAlphaController", () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("returns the same image data that corresponds to the active frame", () => {
		const controller = new GifAlphaController(makeGif(), 0)
		const nowSpy = vi.spyOn(performance, "now")

		nowSpy.mockReturnValue(150)
		const frame = controller.getCurrentFrameState()

		expect(frame.frameIndex).toBe(1)
		expect(Array.from(frame.imageData.data)).toEqual(Array.from(makeImageData([0, 255, 0]).data))
	})

	it("keeps image data and alpha rows locked to the same frame over time", () => {
		const controller = new GifAlphaController(makeGif(), 0)
		const nowSpy = vi.spyOn(performance, "now")

		nowSpy.mockReturnValue(250)
		const frame = controller.getCurrentFrameState()

		expect(controller.currentFrame).toBe(2)
		expect(frame.frameIndex).toBe(2)
		expect(frame.alphaRows).not.toBeNull()
		expect(Array.from(frame.imageData.data)).toEqual(Array.from(makeImageData([0, 0, 255]).data))
	})

	it("advances frames using per-frame delays and wraps at the loop boundary", () => {
		const controller = new GifAlphaController(makeGif([40, 80, 160]), 0)
		const nowSpy = vi.spyOn(performance, "now")

		nowSpy.mockReturnValue(0)
		expect(controller.getCurrentFrameState().frameIndex).toBe(0)

		nowSpy.mockReturnValue(39)
		expect(controller.getCurrentFrameState().frameIndex).toBe(0)

		nowSpy.mockReturnValue(40)
		expect(controller.getCurrentFrameState().frameIndex).toBe(1)

		nowSpy.mockReturnValue(119)
		expect(controller.getCurrentFrameState().frameIndex).toBe(1)

		nowSpy.mockReturnValue(120)
		expect(controller.getCurrentFrameState().frameIndex).toBe(2)

		nowSpy.mockReturnValue(279)
		expect(controller.getCurrentFrameState().frameIndex).toBe(2)

		nowSpy.mockReturnValue(280)
		expect(controller.getCurrentFrameState().frameIndex).toBe(0)
	})

	it("memoizes render surfaces so each frame is uploaded once", () => {
		const originalCreateElement = document.createElement.bind(document)
		const putImageData = vi.fn()
		const createdCanvases: HTMLCanvasElement[] = []
		const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName) => {
			if (tagName === "canvas") {
				const fakeCanvas = {
					width: 0,
					height: 0,
					getContext: vi.fn(() => ({ putImageData })),
				} as unknown as HTMLCanvasElement
				createdCanvases.push(fakeCanvas)
				return fakeCanvas
			}
			return originalCreateElement(tagName)
		})
		const controller = new GifAlphaController(makeGif(), 0)

		const firstSurface = controller.getRenderSurface(1)
		const secondSurface = controller.getRenderSurface(1)
		const thirdSurface = controller.getRenderSurface(2)

		expect(firstSurface).toBe(createdCanvases[0])
		expect(secondSurface).toBe(createdCanvases[0])
		expect(thirdSurface).toBe(createdCanvases[1])
		expect(thirdSurface).not.toBe(firstSurface)
		expect(createElementSpy).toHaveBeenCalledTimes(2)
		expect(putImageData).toHaveBeenCalledTimes(2)
	})
})
