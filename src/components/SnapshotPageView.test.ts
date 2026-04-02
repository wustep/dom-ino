import { describe, expect, it } from "vitest";
import { toStageRect } from "./SnapshotPageView";

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
