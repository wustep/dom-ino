import type { ObstacleRect, BlockedInterval, AvailableSegment } from "../scene/types";

/**
 * Obstacle → row exclusion algorithm:
 *
 * For each text row (defined by y-position and lineHeight), we check which
 * obstacle bounding boxes overlap that row vertically. For each overlapping
 * obstacle, we project its horizontal extent onto the row to create a
 * "blocked interval". We then merge overlapping blocked intervals, subtract
 * them from the row's full width, and return the available segments where
 * text can be placed.
 *
 * For rotated obstacles, we compute the axis-aligned bounding box (AABB)
 * of the rotated rectangle as the exclusion zone.
 */

export function getObstacleAABB(obs: ObstacleRect): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  if (Math.abs(obs.angle) < 0.001) {
    return {
      left: obs.x,
      top: obs.y,
      right: obs.x + obs.width,
      bottom: obs.y + obs.height,
    };
  }

  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height / 2;
  const hw = obs.width / 2;
  const hh = obs.height / 2;
  const cos = Math.abs(Math.cos(obs.angle));
  const sin = Math.abs(Math.sin(obs.angle));

  const aabbHW = hw * cos + hh * sin;
  const aabbHH = hw * sin + hh * cos;

  return {
    left: cx - aabbHW,
    top: cy - aabbHH,
    right: cx + aabbHW,
    bottom: cy + aabbHH,
  };
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
    const aabb = getObstacleAABB(obs);

    // Skip if obstacle doesn't overlap this row vertically
    if (aabb.bottom <= rowTop || aabb.top >= rowBottom) continue;

    // Clamp horizontal extent to container bounds
    const left = Math.max(aabb.left, containerLeft);
    const right = Math.min(aabb.right, containerRight);

    if (left < right) {
      intervals.push({ left, right });
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

/**
 * From blocked intervals, compute available segments for text placement.
 * Returns segments sorted left-to-right, each with a `left` offset
 * (relative to container) and `width`.
 */
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
      if (w >= minSegmentWidth) {
        segments.push({ left: cursor, width: w });
      }
    }
    cursor = Math.max(cursor, interval.right);
  }

  if (containerRight > cursor) {
    const w = containerRight - cursor;
    if (w >= minSegmentWidth) {
      segments.push({ left: cursor, width: w });
    }
  }

  return segments;
}

/**
 * Pick the best segment for a text line. Strongly prefers the leftmost
 * segment (natural reading order) unless a segment to the right is
 * dramatically wider (>2x). This ensures text wraps on BOTH sides
 * of an obstacle when there's usable space on the left.
 */
export function pickBestSegment(
  segments: AvailableSegment[]
): AvailableSegment | null {
  if (segments.length === 0) return null;
  // Default to leftmost
  let best = segments[0];
  for (let i = 1; i < segments.length; i++) {
    // Only switch to a rightward segment if it's more than 2x wider
    if (segments[i].width > best.width * 2) {
      best = segments[i];
    }
  }
  return best;
}
