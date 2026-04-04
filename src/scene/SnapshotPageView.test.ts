import { describe, expect, it } from "vitest"
import type { SceneElement } from "../scene/types"
import {
	hasMovedImportedElement,
	hasRenderableImportedText,
	shouldActivateImportedTextFlow,
	toStageRect,
} from "./snapshotViewUtils"

function makeTextElement(type: SceneElement["type"] = "paragraph"): SceneElement {
	return {
		id: "text-1",
		type,
		rect: { x: 0, y: 0, width: 300, height: 40 },
		throwable: false,
		pinned: true,
		text: "Example text",
	}
}

describe("toStageRect", () => {
	it("keeps iframe viewport coordinates in stage space", () => {
		const rect = {
			left: 48,
			top: 1260,
			width: 320,
			height: 180,
		}

		expect(toStageRect(rect)).toEqual({
			x: 48,
			y: 1260,
			width: 320,
			height: 180,
		})
	})

	it("does not drift when the parent page scrolls", () => {
		const rect = {
			left: 24,
			top: 1820,
			width: 240,
			height: 120,
		}

		// The iframe's own viewport coordinates should remain stable even if the
		// parent page has scrolled and the iframe's bounding rect is off-screen.
		expect(toStageRect(rect)).toEqual({
			x: 24,
			y: 1820,
			width: 240,
			height: 120,
		})
	})
})

describe("hasMovedImportedElement", () => {
	it("stays inactive when the physics body is still at the original rect", () => {
		const element = makeTextElement("image")

		expect(
			hasMovedImportedElement(element, {
				x: element.rect.x,
				y: element.rect.y,
				angle: 0,
				w: element.rect.width,
				h: element.rect.height,
			}),
		).toBe(false)
	})

	it("activates once the imported body shifts away from its source rect", () => {
		const element = makeTextElement("image")

		expect(
			hasMovedImportedElement(element, {
				x: element.rect.x + 6,
				y: element.rect.y,
				angle: 0,
				w: element.rect.width,
				h: element.rect.height,
			}),
		).toBe(true)
	})
})

describe("hasRenderableImportedText", () => {
	it("stays false when a text block cannot produce replacement lines", () => {
		expect(
			hasRenderableImportedText({
				lines: [],
			}),
		).toBe(false)
	})

	it("activates once imported text flow has at least one line to render", () => {
		expect(
			hasRenderableImportedText({
				lines: [
					{
						text: "This article may be too long to read.",
						x: 0,
						y: 0,
						width: 120,
						maxWidth: 180,
						charOffset: 0,
					},
				],
			}),
		).toBe(true)
	})
})

describe("shouldActivateImportedTextFlow", () => {
	it("stays off when there are no imported text blocks", () => {
		expect(
			shouldActivateImportedTextFlow({
				pretextEnabled: true,
				textBodiesEnabled: false,
				textBlockCount: 0,
				selectedObstacleCount: 1,
				staticObstacleCount: 1,
				droppedElementCount: 0,
			}),
		).toBe(false)
	})

	it("activates on initial load when static imported obstacles exist", () => {
		expect(
			shouldActivateImportedTextFlow({
				pretextEnabled: true,
				textBodiesEnabled: false,
				textBlockCount: 8,
				selectedObstacleCount: 0,
				staticObstacleCount: 3,
				droppedElementCount: 0,
			}),
		).toBe(true)
	})

	it("activates when dropped elements exist even without imported obstacles", () => {
		expect(
			shouldActivateImportedTextFlow({
				pretextEnabled: true,
				textBodiesEnabled: false,
				textBlockCount: 8,
				selectedObstacleCount: 0,
				staticObstacleCount: 0,
				droppedElementCount: 1,
			}),
		).toBe(true)
	})

	it("stays off when text-body mode is enabled", () => {
		expect(
			shouldActivateImportedTextFlow({
				pretextEnabled: true,
				textBodiesEnabled: true,
				textBlockCount: 8,
				selectedObstacleCount: 1,
				staticObstacleCount: 3,
				droppedElementCount: 1,
			}),
		).toBe(false)
	})
})
