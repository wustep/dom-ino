import { describe, it, expect } from "vitest";
import {
  getBlockedIntervalsForRow,
  getAvailableSegments,
  getObstacleAABB,
} from "./obstacles";
import type { ObstacleRect, BlockedInterval } from "../scene/types";

function rect(x: number, y: number, w: number, h: number, extra?: Partial<ObstacleRect>): ObstacleRect {
  return { id: "o", x, y, width: w, height: h, angle: 0, ...extra };
}

// ── getBlockedIntervalsForRow ──

describe("getBlockedIntervalsForRow", () => {
  it("returns empty when no obstacles", () => {
    expect(getBlockedIntervalsForRow([], 0, 20, 0, 800)).toEqual([]);
  });

  it("returns empty when obstacle is above the row", () => {
    const obs = [rect(100, 0, 50, 10)];
    expect(getBlockedIntervalsForRow(obs, 20, 20, 0, 800)).toEqual([]);
  });

  it("returns empty when obstacle is below the row", () => {
    const obs = [rect(100, 50, 50, 10)];
    expect(getBlockedIntervalsForRow(obs, 20, 20, 0, 800)).toEqual([]);
  });

  it("returns blocked interval for overlapping obstacle", () => {
    const obs = [rect(100, 10, 50, 30)];
    const result = getBlockedIntervalsForRow(obs, 20, 20, 0, 800);
    expect(result).toHaveLength(1);
    expect(result[0].left).toBe(100);
    expect(result[0].right).toBe(150);
  });

  it("merges overlapping blocked intervals", () => {
    const obs = [rect(100, 10, 60, 30), rect(140, 10, 60, 30)];
    const result = getBlockedIntervalsForRow(obs, 20, 20, 0, 800);
    expect(result).toHaveLength(1);
    expect(result[0].left).toBe(100);
    expect(result[0].right).toBe(200);
  });

  it("keeps separate non-overlapping intervals", () => {
    const obs = [rect(100, 10, 50, 30), rect(300, 10, 50, 30)];
    const result = getBlockedIntervalsForRow(obs, 20, 20, 0, 800);
    expect(result).toHaveLength(2);
  });

  it("clips intervals to container bounds", () => {
    const obs = [rect(-20, 10, 50, 30)];
    const result = getBlockedIntervalsForRow(obs, 20, 20, 0, 800);
    expect(result).toHaveLength(1);
    expect(result[0].left).toBe(0);
    expect(result[0].right).toBe(30);
  });

  it("handles circular obstacle with tighter chord", () => {
    // Circle: center at (150, 150), radius 50
    const obs = [rect(100, 100, 100, 100, { borderRadius: 50 })];
    // Row at very top of circle — chord should be narrower than full width
    const result = getBlockedIntervalsForRow(obs, 100, 10, 0, 800);
    expect(result).toHaveLength(1);
    // Chord at top of circle should be narrower than 100px
    expect(result[0].right - result[0].left).toBeLessThan(100);
  });

  it("handles rotated rectangle", () => {
    // 200x50 rectangle at (100, 100) rotated 45 degrees
    const obs = [rect(100, 100, 200, 50, { angle: Math.PI / 4 })];
    const result = getBlockedIntervalsForRow(obs, 100, 60, 0, 800);
    expect(result).toHaveLength(1);
    // The rotated interval should differ from the unrotated [100, 300]
    // Clipping the rotated polygon to the band produces a narrower, shifted interval
    expect(result[0].left).toBeGreaterThan(100);
    expect(result[0].right).toBeLessThan(300);
    expect(result[0].right - result[0].left).toBeGreaterThan(0);
  });
});

// ── getAvailableSegments ──

describe("getAvailableSegments", () => {
  it("returns full width when no blocked intervals", () => {
    const segments = getAvailableSegments([], 0, 800, 40);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ left: 0, width: 800 });
  });

  it("returns segments on both sides of a blocked interval", () => {
    const blocked: BlockedInterval[] = [{ left: 300, right: 500 }];
    const segments = getAvailableSegments(blocked, 0, 800, 40);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({ left: 0, width: 300 });
    expect(segments[1]).toEqual({ left: 500, width: 300 });
  });

  it("filters out segments narrower than minSegmentWidth", () => {
    const blocked: BlockedInterval[] = [{ left: 10, right: 790 }];
    const segments = getAvailableSegments(blocked, 0, 800, 40);
    expect(segments).toHaveLength(0); // both sides too narrow
  });

  it("handles blocked interval at left edge", () => {
    const blocked: BlockedInterval[] = [{ left: 0, right: 200 }];
    const segments = getAvailableSegments(blocked, 0, 800, 40);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ left: 200, width: 600 });
  });

  it("handles blocked interval at right edge", () => {
    const blocked: BlockedInterval[] = [{ left: 600, right: 800 }];
    const segments = getAvailableSegments(blocked, 0, 800, 40);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ left: 0, width: 600 });
  });

  it("handles multiple blocked intervals", () => {
    const blocked: BlockedInterval[] = [
      { left: 100, right: 200 },
      { left: 400, right: 500 },
    ];
    const segments = getAvailableSegments(blocked, 0, 800, 40);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ left: 0, width: 100 });
    expect(segments[1]).toEqual({ left: 200, width: 200 });
    expect(segments[2]).toEqual({ left: 500, width: 300 });
  });

  it("returns empty when container fully blocked", () => {
    const blocked: BlockedInterval[] = [{ left: 0, right: 800 }];
    const segments = getAvailableSegments(blocked, 0, 800, 40);
    expect(segments).toHaveLength(0);
  });
});

// ── getObstacleAABB ──

describe("getObstacleAABB", () => {
  it("returns exact bounds for unrotated rectangle", () => {
    const obs = rect(100, 200, 50, 30);
    const aabb = getObstacleAABB(obs);
    expect(aabb).toEqual({ left: 100, top: 200, right: 150, bottom: 230 });
  });

  it("returns expanded bounds for rotated rectangle", () => {
    // 200x50 rect at (100, 100) rotated 45 degrees. Center is (200, 125).
    const obs = rect(100, 100, 200, 50, { angle: Math.PI / 4 });
    const aabb = getObstacleAABB(obs);
    // Rotation should expand the y-range significantly (50px height → ~177px AABB height)
    expect(aabb.top).toBeLessThan(100);
    expect(aabb.bottom).toBeGreaterThan(150);
    // x-range narrows after 45deg rotation but AABB still covers a significant range
    expect(aabb.right - aabb.left).toBeGreaterThan(100);
    // Verify it differs from unrotated bounds (100, 100, 300, 150)
    expect(aabb.top).not.toBeCloseTo(100, 0);
    expect(aabb.bottom).not.toBeCloseTo(150, 0);
  });

  it("returns symmetric AABB for 90-degree rotation", () => {
    const obs = rect(100, 100, 200, 50, { angle: Math.PI / 2 });
    const aabb = getObstacleAABB(obs);
    // 200x50 rotated 90deg becomes roughly 50x200
    const w = aabb.right - aabb.left;
    const h = aabb.bottom - aabb.top;
    expect(h).toBeGreaterThan(w);
  });
});
