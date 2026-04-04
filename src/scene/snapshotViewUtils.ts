import type { SceneElement } from "../scene/types"
import type { TextFlowResult } from "../textflow/useTextFlow"
import type { BodyPos } from "../utils/physics"

export type ViewportRectLike = Pick<DOMRect, "left" | "top" | "width" | "height">

/** Converts a DOMRect to stage-relative coordinates (zero-based from viewport top-left). */
export function toStageRect(rect: ViewportRectLike) {
	return {
		x: rect.left,
		y: rect.top,
		width: rect.width,
		height: rect.height,
	}
}

/** Returns true if a physics body has moved from its original imported position. */
export function hasMovedImportedElement(
	sceneElement: SceneElement,
	bodyPosition?: BodyPos,
): boolean {
	if (!bodyPosition) return false

	return (
		Math.abs(bodyPosition.x - sceneElement.rect.x) > 0.5 ||
		Math.abs(bodyPosition.y - sceneElement.rect.y) > 0.5 ||
		Math.abs(bodyPosition.angle) > 0.01 ||
		bodyPosition.w !== sceneElement.rect.width ||
		bodyPosition.h !== sceneElement.rect.height
	)
}

/** Returns true if a text flow result produced any visible lines. */
export function hasRenderableImportedText(flow?: Pick<TextFlowResult, "lines">): boolean {
	return Boolean(flow && flow.lines.length > 0)
}

export function shouldActivateImportedTextFlow({
	pretextEnabled,
	textBodiesEnabled,
	textBlockCount,
	selectedObstacleCount,
	staticObstacleCount,
	droppedElementCount,
}: {
	pretextEnabled: boolean
	textBodiesEnabled: boolean
	textBlockCount: number
	selectedObstacleCount: number
	staticObstacleCount: number
	droppedElementCount: number
}): boolean {
	if (!pretextEnabled || textBodiesEnabled || textBlockCount === 0) return false

	return selectedObstacleCount > 0 || staticObstacleCount > 0 || droppedElementCount > 0
}
