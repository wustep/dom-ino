import type { SceneElement } from "../scene/types";

type RootRectLike = Pick<DOMRect, "left" | "top">;

interface MeasureGlyphBodiesOptions {
  idPrefix: string;
  rootRect: RootRectLike;
  zIndex?: number;
}

type GraphemeSegment = {
  segment: string;
  index: number;
};

let graphemeSegmenter: Intl.Segmenter | null = null;
if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
  graphemeSegmenter = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  });
}

function segmentGraphemes(text: string): GraphemeSegment[] {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), ({ segment, index }) => ({
      segment,
      index,
    }));
  }

  const segments: GraphemeSegment[] = [];
  let index = 0;
  for (const segment of Array.from(text)) {
    segments.push({ segment, index });
    index += segment.length;
  }
  return segments;
}

function parseFontWeight(value: string): number {
  if (value === "bold") return 700;
  if (value === "normal") return 400;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 400;
}

/**
 * Measures rendered text in the DOM and produces one throwable scene element
 * per non-whitespace grapheme.
 */
export function measureGlyphBodiesFromDomNode(
  node: HTMLElement,
  { idPrefix, rootRect, zIndex = 6 }: MeasureGlyphBodiesOptions
): SceneElement[] {
  const doc = node.ownerDocument;
  const win = doc.defaultView ?? window;
  const walker = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  const glyphs: SceneElement[] = [];
  let glyphIndex = 0;

  let currentNode = walker.nextNode();
  while (currentNode) {
    const textNode = currentNode as Text;
    const parent = textNode.parentElement;
    const rawText = textNode.textContent ?? "";
    currentNode = walker.nextNode();

    if (!parent || rawText.length === 0) continue;

    let computedStyle: CSSStyleDeclaration;
    try {
      computedStyle = win.getComputedStyle(parent);
    } catch {
      continue;
    }

    if (
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      parseFloat(computedStyle.opacity || "1") === 0
    ) {
      continue;
    }

    const fontSize = parseFloat(computedStyle.fontSize) || 16;
    const parsedLineHeight = parseFloat(computedStyle.lineHeight);
    const lineHeight = Number.isFinite(parsedLineHeight)
      ? parsedLineHeight
      : fontSize * 1.2;

    for (const { segment, index } of segmentGraphemes(rawText)) {
      if (!segment.trim()) continue;

      try {
        range.setStart(textNode, index);
        range.setEnd(textNode, index + segment.length);
      } catch {
        continue;
      }

      const rect =
        Array.from(range.getClientRects()).find(
          (candidate) => candidate.width > 0.5 && candidate.height > 0.5
        ) ?? range.getBoundingClientRect();

      if (rect.width <= 0.5 || rect.height <= 0.5) continue;

      glyphs.push({
        id: `${idPrefix}-glyph-${glyphIndex++}`,
        type: "glyph",
        rect: {
          x: rect.left - rootRect.left,
          y: rect.top - rootRect.top,
          width: rect.width,
          height: rect.height,
        },
        throwable: true,
        pinned: false,
        affectsTextFlow: false,
        text: segment,
        fontSize,
        fontWeight: parseFontWeight(computedStyle.fontWeight),
        fontStyle:
          (computedStyle.fontStyle as SceneElement["fontStyle"]) || "normal",
        fontFamily: computedStyle.fontFamily || undefined,
        lineHeight,
        color: computedStyle.color || "#333",
        letterSpacing:
          computedStyle.letterSpacing &&
          computedStyle.letterSpacing !== "normal"
            ? computedStyle.letterSpacing
            : undefined,
        opacity:
          parseFloat(computedStyle.opacity || "1") < 1
            ? parseFloat(computedStyle.opacity || "1")
            : undefined,
        zIndex,
        mass: 0.15,
        friction: 0.35,
        frictionAir: 0.012,
        restitution: 0.12,
      });
    }
  }

  return glyphs;
}
