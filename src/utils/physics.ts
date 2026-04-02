export type BodyPos = {
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
};

/**
 * Compare two snapshots of body positions and return true if any body
 * has moved beyond the specified thresholds. Used by DominoScene and
 * SnapshotPageView to avoid unnecessary React state updates on each
 * animation frame.
 */
export function bodyPositionsChanged(
  prev: Map<string, BodyPos>,
  next: Map<string, BodyPos>
): boolean {
  if (prev.size !== next.size) return true;
  for (const [id, nextPos] of next) {
    const prevPos = prev.get(id);
    if (!prevPos) return true;
    if (
      Math.abs(prevPos.x - nextPos.x) > 0.05 ||
      Math.abs(prevPos.y - nextPos.y) > 0.05 ||
      Math.abs(prevPos.angle - nextPos.angle) > 0.0005 ||
      prevPos.w !== nextPos.w ||
      prevPos.h !== nextPos.h
    ) {
      return true;
    }
  }
  return false;
}
