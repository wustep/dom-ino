import { memo, useMemo, useEffect } from "react";
import type { LayoutCursor } from "@chenglou/pretext";
import type { FlowLine } from "../textflow/useTextFlow";
import { computeTextFlow } from "../textflow/useTextFlow";
import type { ObstacleRect } from "../scene/types";

interface TextFlowRegionProps {
  text: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  opacity?: number;
  letterSpacing?: string;
  textAlign?: string;
  containerX: number;
  containerY: number;
  containerWidth: number;
  containerMaxHeight: number;
  obstacles: ObstacleRect[];
  showDebug?: boolean;
  generation: number;
  onLineCount?: (count: number) => void;
  minSegmentWidth?: number;
  allowWordBreaks?: boolean;
  startCursor?: LayoutCursor;
  onEndCursor?: (cursor: LayoutCursor) => void;
}

/**
 * Parse a CSS font shorthand string to extract style, weight, and family.
 * E.g. "italic 700 17px \"Source Serif 4\", Georgia, serif"
 *   -> { style: "italic", weight: 700, family: '"Source Serif 4", Georgia, serif' }
 */
function parseFontShorthand(font: string): {
  style: "normal" | "italic" | "oblique";
  weight: number;
  family: string;
} {
  const fontMatch = font.match(/^(?:(italic|oblique)\s+)?(?:(\d+)\s+)?(\d+px)\s+(.+)$/);
  if (fontMatch) {
    return {
      style: (fontMatch[1] as "italic" | "oblique" | undefined) ?? "normal",
      weight: fontMatch[2] ? parseInt(fontMatch[2], 10) : 400,
      family: fontMatch[4],
    };
  }

  return { style: "normal", weight: 400, family: font };
}

export const TextFlowRegion = memo(function TextFlowRegion({
  text,
  font,
  fontSize,
  lineHeight,
  color,
  opacity,
  letterSpacing,
  textAlign,
  containerX,
  containerY,
  containerWidth,
  containerMaxHeight,
  obstacles,
  showDebug,
  generation,
  onLineCount,
  minSegmentWidth = 8,
  allowWordBreaks = true,
  startCursor,
  onEndCursor,
}: TextFlowRegionProps) {
  const flow = useMemo(() => {
    return computeTextFlow(
      text,
      font,
      lineHeight,
      containerX,
      containerY,
      containerWidth,
      containerMaxHeight,
      obstacles,
      8,
      minSegmentWidth,
      allowWordBreaks,
      startCursor
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, font, lineHeight, containerX, containerY, containerWidth, containerMaxHeight, obstacles, generation, minSegmentWidth, allowWordBreaks, startCursor]);

  useEffect(() => {
    onLineCount?.(flow.lines.length);
  }, [flow, onLineCount]);

  useEffect(() => {
    onEndCursor?.(flow.endCursor);
  }, [flow, onEndCursor]);

  const { style, weight, family } = useMemo(() => parseFontShorthand(font), [font]);

  return (
    <>
      {flow.lines.map((line: FlowLine, i: number) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: line.x,
            top: line.y,
            height: lineHeight,
            fontSize,
            lineHeight: `${lineHeight}px`,
            fontFamily: family,
            fontStyle: style,
            fontWeight: weight,
            color,
            opacity,
            letterSpacing,
            textAlign: textAlign as React.CSSProperties["textAlign"] | undefined,
            whiteSpace: "pre",
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 11,
          }}
        >
          {line.text}
        </div>
      ))}
      {showDebug &&
        flow.lines.map((line: FlowLine, i: number) => (
          <div
            key={`dbg-${i}`}
            style={{
              position: "absolute",
              left: line.x,
              top: line.y,
              width: line.maxWidth,
              height: lineHeight,
              border: "1px solid rgba(59, 130, 246, 0.3)",
              backgroundColor: "rgba(59, 130, 246, 0.04)",
              pointerEvents: "none",
              boxSizing: "border-box",
              zIndex: 50,
            }}
          />
        ))}
    </>
  );
});
