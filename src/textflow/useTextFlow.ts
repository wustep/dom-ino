import { prepareWithSegments, layoutNextLine } from "@chenglou/pretext";
import type { PreparedTextWithSegments, LayoutCursor } from "@chenglou/pretext";
import type { ObstacleRect } from "../scene/types";
import {
  getBlockedIntervalsForRow,
  getAvailableSegments,
} from "./obstacles";

export interface FlowLine {
  text: string;
  x: number;
  y: number;
  width: number;
  maxWidth: number;
  /** Character offset of this line's text within the full source string. */
  charOffset: number;
}

export interface TextFlowResult {
  lines: FlowLine[];
  totalHeight: number;
  endCursor: LayoutCursor;
}

function lineBreaksInsideSegment(cursor: LayoutCursor): boolean {
  return cursor.graphemeIndex > 0;
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
 * 6. Walk those segments left-to-right, laying out one fragment per segment.
 * 7. Call layoutNextLine(prepared, cursor, segmentWidth) for each viable slot
 *    so a single visual row can occupy both sides of an obstacle.
 * 8. Position the resulting fragment at (segment.left, rowY).
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

function cursorToTextOffset(
  prepared: PreparedTextWithSegments,
  cursor: LayoutCursor
): number {
  if (!Array.isArray(prepared.segments) || !Array.isArray(prepared.kinds)) {
    return cursor.graphemeIndex;
  }

  let offset = 0;

  for (let i = 0; i < cursor.segmentIndex; i++) {
    const kind = prepared.kinds[i];
    if (kind === "soft-hyphen" || kind === "hard-break") continue;
    offset += prepared.segments[i]?.length ?? 0;
  }

  if (cursor.graphemeIndex > 0) {
    const segment = prepared.segments[cursor.segmentIndex] ?? "";
    offset += Array.from(segment).slice(0, cursor.graphemeIndex).join("").length;
  }

  return offset;
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
  obstaclePadding: number = 8,
  minSegmentWidth: number = 8,
  allowWordBreaks: boolean = true,
  startCursor?: LayoutCursor
): TextFlowResult {
  const zeroCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  if (!text || containerWidth < 30) {
    return { lines: [], totalHeight: 0, endCursor: startCursor ?? zeroCursor };
  }

  const prepared = getCachedPrepared(text, font);
  const lines: FlowLine[] = [];
  let cursor: LayoutCursor = startCursor ?? zeroCursor;
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

    const segments = getAvailableSegments(padded, cLeft, cRight, minSegmentWidth);
    if (segments.length === 0) {
      y += lineHeight;
      emptyStreak++;
      if (emptyStreak > 5) break;
      continue;
    }

    emptyStreak = 0;
    let rowCursor = cursor;
    let placedFragment = false;
    let exhausted = false;

    for (const segment of segments) {
      const line = layoutNextLine(prepared, rowCursor, segment.width);
      if (line === null) {
        exhausted = true;
        break;
      }

      if (!allowWordBreaks && lineBreaksInsideSegment(line.end)) {
        continue;
      }

      lines.push({
        text: line.text,
        x: segment.left,
        y,
        width: line.width,
        maxWidth: segment.width,
        charOffset: cursorToTextOffset(prepared, line.start),
      });

      rowCursor = line.end;
      placedFragment = true;
    }

    if (!placedFragment) {
      if (exhausted) break;
      y += lineHeight;
      emptyStreak++;
      if (emptyStreak > 5) break;
      continue;
    }

    cursor = rowCursor;
    y += lineHeight;
    if (exhausted) break;
  }

  return { lines, totalHeight: y - containerY, endCursor: cursor };
}
