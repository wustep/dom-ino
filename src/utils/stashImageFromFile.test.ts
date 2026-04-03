import { describe, it, expect } from "vitest";
import {
  cappedSizeForStashImage,
  isAcceptableStashImageFile,
  STASH_DROP_IMAGE_MAX_FILE_BYTES,
  STASH_DROP_IMAGE_MAX_SIDE_PX,
} from "./stashImageFromFile";

describe("stashImageFromFile", () => {
  describe("isAcceptableStashImageFile", () => {
    it("accepts image/* MIME types under the size cap", () => {
      const f = new File([new Uint8Array([0])], "x.png", { type: "image/png" });
      expect(isAcceptableStashImageFile(f)).toBe(true);
    });

    it("accepts known extensions when type is empty", () => {
      const f = new File([new Uint8Array([0])], "photo.JPEG", { type: "" });
      expect(isAcceptableStashImageFile(f)).toBe(true);
    });

    it("rejects oversized files", () => {
      const big = new Uint8Array(STASH_DROP_IMAGE_MAX_FILE_BYTES + 1);
      const f = new File([big], "x.png", { type: "image/png" });
      expect(isAcceptableStashImageFile(f)).toBe(false);
    });

    it("rejects non-images without unknown extension", () => {
      const f = new File([new Uint8Array([0])], "readme.txt", { type: "text/plain" });
      expect(isAcceptableStashImageFile(f)).toBe(false);
    });
  });

  describe("cappedSizeForStashImage", () => {
    it("preserves small sizes", () => {
      expect(cappedSizeForStashImage(100, 50, STASH_DROP_IMAGE_MAX_SIDE_PX)).toEqual({
        width: 100,
        height: 50,
      });
    });

    it("scales down when the long side exceeds max", () => {
      expect(cappedSizeForStashImage(800, 400, 400)).toEqual({ width: 400, height: 200 });
    });

    it("does not inflate degenerate dimensions", () => {
      expect(cappedSizeForStashImage(0, 0, 100)).toEqual({ width: 1, height: 1 });
    });
  });
});
