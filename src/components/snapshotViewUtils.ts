import type { SceneElement } from "../scene/types";
import type { TextFlowResult } from "../textflow/useTextFlow";

export type ViewportRectLike = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function toStageRect(rect: ViewportRectLike) {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

type BodyPos = { x: number; y: number; angle: number; w: number; h: number };

export function hasMovedImportedElement(
  sceneElement: SceneElement,
  bodyPosition?: BodyPos
): boolean {
  if (!bodyPosition) return false;

  return (
    Math.abs(bodyPosition.x - sceneElement.rect.x) > 0.5 ||
    Math.abs(bodyPosition.y - sceneElement.rect.y) > 0.5 ||
    Math.abs(bodyPosition.angle) > 0.01 ||
    bodyPosition.w !== sceneElement.rect.width ||
    bodyPosition.h !== sceneElement.rect.height
  );
}

export function hasRenderableImportedText(
  flow?: Pick<TextFlowResult, "lines">
): boolean {
  return Boolean(flow && flow.lines.length > 0);
}
