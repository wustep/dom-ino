import { memo, useMemo, useEffect } from "react";
import type { FlowLine } from "../textflow/useTextFlow";
import { computeTextFlow } from "../textflow/useTextFlow";
import type { ObstacleRect } from "../scene/types";

interface TextFlowRegionProps {
  text: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  containerX: number;
  containerY: number;
  containerWidth: number;
  containerMaxHeight: number;
  obstacles: ObstacleRect[];
  showDebug?: boolean;
  generation: number;
  onLineCount?: (count: number) => void;
}

/**
 * Parse a CSS font shorthand string to extract weight and family.
 * E.g. "700 17px \"Source Serif 4\", Georgia, serif"
 *   -> { weight: 700, family: '"Source Serif 4", Georgia, serif' }
 */
function parseFontShorthand(font: string): { weight: number; family: string } {
  const weightMatch = font.match(/^(\d+)\s+\d+px\s+(.+)$/);
  if (weightMatch) {
    return { weight: parseInt(weightMatch[1]), family: weightMatch[2] };
  }
  const sizeMatch = font.match(/^(\d+px)\s+(.+)$/);
  if (sizeMatch) {
    return { weight: 400, family: sizeMatch[2] };
  }
  return { weight: 400, family: font };
}

export const TextFlowRegion = memo(function TextFlowRegion({
  text,
  font,
  fontSize,
  lineHeight,
  color,
  containerX,
  containerY,
  containerWidth,
  containerMaxHeight,
  obstacles,
  showDebug,
  generation,
  onLineCount,
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
      obstacles
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, font, lineHeight, containerX, containerY, containerWidth, containerMaxHeight, obstacles, generation]);

  useEffect(() => {
    onLineCount?.(flow.lines.length);
  }, [flow, onLineCount]);

  const { weight, family } = useMemo(() => parseFontShorthand(font), [font]);

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
            fontWeight: weight,
            color,
            whiteSpace: "pre",
            overflow: "visible",
            pointerEvents: "none",
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
