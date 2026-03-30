import { prepareWithSegments, layoutNextLine } from "@chenglou/pretext";
import type { PreparedTextWithSegments, LayoutCursor } from "@chenglou/pretext";
import type { ObstacleRect } from "../scene/types";
import {
  getBlockedIntervalsForRow,
  getAvailableSegments,
  pickBestSegment,
} from "./obstacles";

export interface FlowLine {
  text: string;
  x: number;
  y: number;
  width: number;
  maxWidth: number;
}

export interface TextFlowResult {
  lines: FlowLine[];
  totalHeight: number;
}

/**
 * Text-flow algorithm using Pretext's layoutNextLine:
 *
 * 1. Prepare text once via prepareWithSegments() (cached by text+font key).
 * 2. Walk downward row by row (each row = lineHeight tall).
 * 3. For each row's y-range, find which obstacles overlap vertically.
 * 4. Project those obstacles' horizontal extents into "blocked intervals".
 * 5. Subtract blocked intervals from [containerLeft, containerRight] to get
 *    available segments. Add padding around each obstacle.
 * 6. Pick the widest available segment (prefer leftmost on ties).
 * 7. Call layoutNextLine(prepared, cursor, segmentWidth) to get one line's
 *    worth of text that fits in that width.
 * 8. Position the resulting text at (segment.left, rowY).
 * 9. Advance cursor and y; repeat until text is exhausted or we run out
 *    of vertical space.
 *
 * If an entire row is blocked (no segment wide enough), we skip it and
 * continue downward. After 5 consecutive fully-blocked rows we bail out
 * to avoid infinite loops in pathological cases.
 */

const prepareCache = new Map<string, PreparedTextWithSegments>();

function getCachedPrepared(
  text: string,
  font: string
): PreparedTextWithSegments {
  const key = `${text}|${font}`;
  let prepared = prepareCache.get(key);
  if (!prepared) {
    prepared = prepareWithSegments(text, font);
    prepareCache.set(key, prepared);
    if (prepareCache.size > 60) {
      const oldest = prepareCache.keys().next().value;
      if (oldest) prepareCache.delete(oldest);
    }
  }
  return prepared;
}

export function computeTextFlow(
  text: string,
  font: string,
  lineHeight: number,
  containerX: number,
  containerY: number,
  containerWidth: number,
  containerMaxHeight: number,
  obstacles: ObstacleRect[],
  obstaclePadding: number = 8
): TextFlowResult {
  if (!text || containerWidth < 30) {
    return { lines: [], totalHeight: 0 };
  }

  const prepared = getCachedPrepared(text, font);
  const lines: FlowLine[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = containerY;
  const maxY = containerY + containerMaxHeight;
  const cLeft = containerX;
  const cRight = containerX + containerWidth;

  let emptyStreak = 0;

  while (y + lineHeight <= maxY) {
    const blocked = getBlockedIntervalsForRow(
      obstacles,
      y,
      lineHeight,
      cLeft,
      cRight
    );

    // Pad blocked intervals so text doesn't butt right against obstacles
    const padded = blocked.map((b) => ({
      left: b.left - obstaclePadding,
      right: b.right + obstaclePadding,
    }));

    const segments = getAvailableSegments(padded, cLeft, cRight, 20);
    const best = pickBestSegment(segments);

    if (!best) {
      y += lineHeight;
      emptyStreak++;
      if (emptyStreak > 5) break;
      continue;
    }

    emptyStreak = 0;

    const line = layoutNextLine(prepared, cursor, best.width);
    if (line === null) break;

    lines.push({
      text: line.text,
      x: best.left,
      y,
      width: line.width,
      maxWidth: best.width,
    });

    cursor = line.end;
    y += lineHeight;
  }

  return { lines, totalHeight: y - containerY };
}
