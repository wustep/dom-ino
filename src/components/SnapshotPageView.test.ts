import { describe, expect, it } from "vitest";
import type { SceneElement } from "../scene/types";
import {
  hasMovedImportedElement,
  hasRenderableImportedText,
  toStageRect,
} from "./snapshotViewUtils";

function makeTextElement(type: SceneElement["type"] = "paragraph"): SceneElement {
  return {
    id: "text-1",
    type,
    rect: { x: 0, y: 0, width: 300, height: 40 },
    throwable: false,
    pinned: true,
    text: "Example text",
  };
}

describe("toStageRect", () => {
  it("keeps iframe viewport coordinates in stage space", () => {
    const rect = {
      left: 48,
      top: 1260,
      width: 320,
      height: 180,
    };

    expect(toStageRect(rect)).toEqual({
      x: 48,
      y: 1260,
      width: 320,
      height: 180,
    });
  });

  it("does not drift when the parent page scrolls", () => {
    const rect = {
      left: 24,
      top: 1820,
      width: 240,
      height: 120,
    };

    // The iframe's own viewport coordinates should remain stable even if the
    // parent page has scrolled and the iframe's bounding rect is off-screen.
    expect(toStageRect(rect)).toEqual({
      x: 24,
      y: 1820,
      width: 240,
      height: 120,
    });
  });
});

describe("hasMovedImportedElement", () => {
  it("stays inactive when the physics body is still at the original rect", () => {
    const element = makeTextElement("image");

    expect(
      hasMovedImportedElement(element, {
        x: element.rect.x,
        y: element.rect.y,
        angle: 0,
        w: element.rect.width,
        h: element.rect.height,
      })
    ).toBe(false);
  });

  it("activates once the imported body shifts away from its source rect", () => {
    const element = makeTextElement("image");

    expect(
      hasMovedImportedElement(element, {
        x: element.rect.x + 6,
        y: element.rect.y,
        angle: 0,
        w: element.rect.width,
        h: element.rect.height,
      })
    ).toBe(true);
  });
});

describe("hasRenderableImportedText", () => {
  it("stays false when a text block cannot produce replacement lines", () => {
    expect(
      hasRenderableImportedText({
        lines: [],
      })
    ).toBe(false);
  });

  it("activates once imported text flow has at least one line to render", () => {
    expect(
      hasRenderableImportedText({
        lines: [{
          text: "This article may be too long to read.",
          x: 0,
          y: 0,
          width: 120,
          maxWidth: 180,
          charOffset: 0,
        }],
      })
    ).toBe(true);
  });
});
