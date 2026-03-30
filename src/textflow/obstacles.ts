import type { ObstacleRect, BlockedInterval, AvailableSegment } from "../scene/types";

type Point = { x: number; y: number };
const EPSILON = 0.001;

/**
 * Obstacle → row exclusion algorithm:
 *
 * For each text row, check which obstacles overlap vertically.
 * For circular obstacles (borderRadius >= width/2 && width === height),
 * compute the exact horizontal chord intersection — much tighter than
 * the bounding box. For rotated rectangles, clip the polygon against the
 * current row band and use that slice's x-extent.
 */

function isCircular(obs: ObstacleRect): boolean {
  if (!obs.borderRadius) return false;
  const minDim = Math.min(obs.width, obs.height);
  return obs.borderRadius >= minDim / 2 - 1 && Math.abs(obs.width - obs.height) < 4;
}

/**
 * For a circle centered at (cx, cy) with radius r, compute the
 * horizontal interval blocked at a given row band [bandTop, bandBottom].
 * Returns the chord intersection — much narrower than the full width
 * near the top and bottom of the circle.
 */
function circleIntervalForBand(
  cx: number, cy: number, r: number,
  bandTop: number, bandBottom: number
): BlockedInterval | null {
  if (bandTop >= cy + r || bandBottom <= cy - r) return null;
  // Find the closest vertical distance from circle center to the band
  const minDy = (cy >= bandTop && cy <= bandBottom)
    ? 0
    : cy < bandTop ? bandTop - cy : cy - bandBottom;
  if (minDy >= r) return null;
  const halfChord = Math.sqrt(r * r - minDy * minDy);
  return { left: cx - halfChord, right: cx + halfChord };
}

function getRotatedRectPoints(obs: ObstacleRect): Point[] {
  if (Math.abs(obs.angle) < EPSILON) {
    return [
      { x: obs.x, y: obs.y },
      { x: obs.x + obs.width, y: obs.y },
      { x: obs.x + obs.width, y: obs.y + obs.height },
      { x: obs.x, y: obs.y + obs.height },
    ];
  }

  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height / 2;
  const hw = obs.width / 2;
  const hh = obs.height / 2;
  const cos = Math.cos(obs.angle);
  const sin = Math.sin(obs.angle);

  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
}

function intersectSegmentWithHorizontalLine(a: Point, b: Point, clipY: number): Point {
  const dy = b.y - a.y;
  if (Math.abs(dy) < EPSILON) return { x: b.x, y: clipY };
  const t = (clipY - a.y) / dy;
  return {
    x: a.x + (b.x - a.x) * t,
    y: clipY,
  };
}

function clipPolygon(
  points: Point[],
  isInside: (p: Point) => boolean,
  intersect: (a: Point, b: Point) => Point
): Point[] {
  if (points.length === 0) return [];

  const clipped: Point[] = [];
  let prev = points[points.length - 1];
  let prevInside = isInside(prev);

  for (const curr of points) {
    const currInside = isInside(curr);

    if (currInside) {
      if (!prevInside) clipped.push(intersect(prev, curr));
      clipped.push(curr);
    } else if (prevInside) {
      clipped.push(intersect(prev, curr));
    }

    prev = curr;
    prevInside = currInside;
  }

  return clipped;
}

function rectIntervalForBand(
  obs: ObstacleRect,
  bandTop: number,
  bandBottom: number
): BlockedInterval | null {
  if (Math.abs(obs.angle) < EPSILON) {
    if (obs.y >= bandBottom || obs.y + obs.height <= bandTop) return null;
    return { left: obs.x, right: obs.x + obs.width };
  }

  let clipped = getRotatedRectPoints(obs);
  clipped = clipPolygon(
    clipped,
    (p) => p.y >= bandTop - EPSILON,
    (a, b) => intersectSegmentWithHorizontalLine(a, b, bandTop)
  );
  clipped = clipPolygon(
    clipped,
    (p) => p.y <= bandBottom + EPSILON,
    (a, b) => intersectSegmentWithHorizontalLine(a, b, bandBottom)
  );

  if (clipped.length === 0) return null;

  let left = clipped[0].x;
  let right = clipped[0].x;
  for (let i = 1; i < clipped.length; i++) {
    left = Math.min(left, clipped[i].x);
    right = Math.max(right, clipped[i].x);
  }

  return left < right ? { left, right } : null;
}

export function getObstacleAABB(obs: ObstacleRect): {
  left: number; top: number; right: number; bottom: number;
} {
  if (Math.abs(obs.angle) < 0.001) {
    return { left: obs.x, top: obs.y, right: obs.x + obs.width, bottom: obs.y + obs.height };
  }
  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height / 2;
  const hw = obs.width / 2;
  const hh = obs.height / 2;
  const cos = Math.abs(Math.cos(obs.angle));
  const sin = Math.abs(Math.sin(obs.angle));
  const aabbHW = hw * cos + hh * sin;
  const aabbHH = hw * sin + hh * cos;
  return { left: cx - aabbHW, top: cy - aabbHH, right: cx + aabbHW, bottom: cy + aabbHH };
}

export function getBlockedIntervalsForRow(
  obstacles: ObstacleRect[],
  rowY: number,
  rowHeight: number,
  containerLeft: number,
  containerRight: number
): BlockedInterval[] {
  const rowTop = rowY;
  const rowBottom = rowY + rowHeight;
  const intervals: BlockedInterval[] = [];

  for (const obs of obstacles) {
    if (isCircular(obs)) {
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;
      const r = obs.width / 2;
      const interval = circleIntervalForBand(cx, cy, r, rowTop, rowBottom);
      if (interval) {
        const left = Math.max(interval.left, containerLeft);
        const right = Math.min(interval.right, containerRight);
        if (left < right) intervals.push({ left, right });
      }
    } else {
      const interval = rectIntervalForBand(obs, rowTop, rowBottom);
      if (!interval) continue;
      const left = Math.max(interval.left, containerLeft);
      const right = Math.min(interval.right, containerRight);
      if (left < right) intervals.push({ left, right });
    }
  }

  return mergeIntervals(intervals);
}

function mergeIntervals(intervals: BlockedInterval[]): BlockedInterval[] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a.left - b.left);
  const merged: BlockedInterval[] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const curr = intervals[i];
    if (curr.left <= last.right) {
      last.right = Math.max(last.right, curr.right);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

export function getAvailableSegments(
  blocked: BlockedInterval[],
  containerLeft: number,
  containerRight: number,
  minSegmentWidth: number = 40
): AvailableSegment[] {
  const segments: AvailableSegment[] = [];
  let cursor = containerLeft;
  for (const interval of blocked) {
    if (interval.left > cursor) {
      const w = interval.left - cursor;
      if (w >= minSegmentWidth) segments.push({ left: cursor, width: w });
    }
    cursor = Math.max(cursor, interval.right);
  }
  if (containerRight > cursor) {
    const w = containerRight - cursor;
    if (w >= minSegmentWidth) segments.push({ left: cursor, width: w });
  }
  return segments;
}

/**
 * Pick the best segment for a text line. Strongly prefers the leftmost
 * segment (natural reading order) unless a segment to the right is
 * dramatically wider (>2x).
 */
export function pickBestSegment(
  segments: AvailableSegment[]
): AvailableSegment | null {
  if (segments.length === 0) return null;
  let best = segments[0];
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].width > best.width * 2) {
      best = segments[i];
    }
  }
  return best;
}
