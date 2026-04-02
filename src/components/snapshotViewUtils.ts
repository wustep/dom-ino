import type { SceneElement } from "../scene/types";

export type ViewportRectLike = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function toStageRect(rect: ViewportRectLike) {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function isTextSceneElement(
  sceneElement: SceneElement | null
): sceneElement is SceneElement & { type: "paragraph" | "heading" } {
  return (
    sceneElement?.type === "paragraph" || sceneElement?.type === "heading"
  );
}

function isWikipediaSnapshotUrl(sourceUrl?: string): boolean {
  if (!sourceUrl) return false;
  try {
    return new URL(sourceUrl).hostname.includes("wikipedia.org");
  } catch {
    return false;
  }
}

const WIKIPEDIA_IMPORTED_TEXT_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "LI",
  "DD",
  "DT",
]);

const WIKIPEDIA_IMPORTED_TEXT_EXCLUDE_SELECTOR = [
  "table",
  "figure",
  "figcaption",
  "aside",
  "nav",
  "header",
  "footer",
  "form",
  "button",
  "[role='navigation']",
  "[role='banner']",
  "[role='complementary']",
  ".ambox",
  ".dablink",
  ".gallery",
  ".gallerybox",
  ".hatnote",
  ".infobox",
  ".metadata",
  ".navbox",
  ".portal",
  ".reference",
  ".references",
  ".reflist",
  ".rellink",
  ".sidebar",
  ".shortdescription",
  ".thumb",
  ".thumbcaption",
  ".thumbinner",
  ".tmbox",
  ".trow",
  ".vector-column-end",
  ".vector-column-start",
  ".vector-header-container",
  ".vector-page-toolbar",
  ".vector-page-titlebar",
  ".vector-sticky-header-container",
  ".vector-toc",
  ".mw-table-of-contents-container",
  ".mw-footer-container",
  "#mw-navigation",
  "#mw-panel",
  "#p-lang-btn",
  "#vector-page-titlebar-toc",
].join(", ");

export function isImportedTextBlockEligible(
  node: HTMLElement,
  sceneElement: SceneElement | null,
  sourceUrl?: string
): boolean {
  if (!isTextSceneElement(sceneElement)) return false;
  if (!isWikipediaSnapshotUrl(sourceUrl)) return true;
  if (!WIKIPEDIA_IMPORTED_TEXT_TAGS.has(node.tagName)) return false;
  return !node.closest(WIKIPEDIA_IMPORTED_TEXT_EXCLUDE_SELECTOR);
}

type BodyPos = { x: number; y: number; angle: number; w: number; h: number };

export function hasMovedImportedElement(
  sceneElement: SceneElement,
  bodyPosition?: BodyPos
): boolean {
  if (!bodyPosition) return false;

  return (
    Math.abs(bodyPosition.x - sceneElement.rect.x) > 0.5 ||
    Math.abs(bodyPosition.y - sceneElement.rect.y) > 0.5 ||
    Math.abs(bodyPosition.angle) > 0.01 ||
    bodyPosition.w !== sceneElement.rect.width ||
    bodyPosition.h !== sceneElement.rect.height
  );
}
