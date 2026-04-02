import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CustomPage, SnapshotCustomPage } from "../App";
import type { SavedElement, SceneElement } from "../scene/types";
import type { PresetKey } from "../scene/presets";
import { Toolbar, type DebugSettings } from "./Toolbar";
import { createPhysicsEngine } from "../physics/engine";
import type { PhysicsEngine } from "../physics/engine";
import { PhysicsDomItem } from "./PhysicsDomItem";
import { TextFlowRegion } from "./TextFlowRegion";
import type { ObstacleRect } from "../scene/types";
import { QuickSavePicker } from "./QuickSavePicker";
import { ImportedPhysicsClone } from "./ImportedPhysicsClone";
import { computeTextFlow } from "../textflow/useTextFlow";

interface SnapshotPageViewProps {
  page: SnapshotCustomPage;
  currentPreset: PresetKey | "custom";
  onSelectPreset: (key: PresetKey) => void;
  onImportHtml: (html: string, name: string) => void;
  onFetchUrl: (url: string) => Promise<void>;
  savedElements: SavedElement[];
  onSaveElement: (el: SceneElement) => void;
  onUnsaveElement: (id: string) => void;
  onClearSaved: () => void;
  onRemoveSaved: (index: number) => void;
  customPages: CustomPage[];
  activeCustomId: string | null;
  onSelectCustomPage: (id: string) => void;
  onResetAll: () => void;
}

type SnapshotCandidate = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  saved: boolean;
  node: HTMLElement;
  sceneElement: SceneElement | null;
  display: string;
};

type SnapshotTextBlock = {
  id: string;
  sceneElement: SceneElement;
  node: HTMLElement;
};

type ImportedTextLayout = {
  id: string;
  sceneElement: SceneElement;
  containerX: number;
  containerY: number;
  containerWidth: number;
  containerMaxHeight: number;
};

function isTextSceneElement(
  sceneElement: SceneElement | null
): sceneElement is SceneElement & { type: "paragraph" | "heading" } {
  return (
    sceneElement?.type === "paragraph" || sceneElement?.type === "heading"
  );
}

function getStableNodeId(root: HTMLElement, node: HTMLElement): string {
  const existing = node.dataset.dominoId;
  if (existing) return existing;
  if (node.id) return `id:${node.id}`;
  const parts: string[] = [];
  let current: HTMLElement | null = node;
  while (current && current !== root) {
    const parent: HTMLElement | null = current.parentElement;
    const tag = current.tagName.toLowerCase();
    if (!parent) {
      parts.push(tag);
      break;
    }
    const siblings = (Array.from(parent.children) as HTMLElement[]).filter(
      (el) => el.tagName === current!.tagName
    );
    const index = siblings.indexOf(current);
    parts.push(`${tag}:${index}`);
    current = parent;
  }
  return `path:${parts.reverse().join("/")}`;
}

function textOf(el: HTMLElement): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function inferSnapshotElementType(el: HTMLElement, cs: CSSStyleDeclaration): SceneElement["type"] {
  const tag = el.tagName;
  if (/^H[1-6]$/.test(tag)) return "heading";
  if (tag === "P" || tag === "BLOCKQUOTE" || tag === "FIGCAPTION" || tag === "LI") return "paragraph";
  if (tag === "BUTTON") return "button";
  if (tag === "A") return cs.display === "inline" ? "link" : "button";
  if (tag === "IMG" || tag === "PICTURE" || tag === "VIDEO" || tag === "SVG") return "image";
  // FIGURE elements that contain images/videos are images
  if (tag === "FIGURE") {
    if (el.querySelector("img, picture, video, svg")) return "image";
  }
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return "input";
  // Divs/sections that contain an image as primary content
  if ((tag === "DIV" || tag === "SECTION" || tag === "ARTICLE") && el.children.length <= 3) {
    const img = el.querySelector("img, picture, video");
    if (img && img instanceof HTMLElement) {
      const imgRect = img.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      // If the image fills most of the container, treat the container as an image
      if (imgRect.width > elRect.width * 0.6 && imgRect.height > elRect.height * 0.4) return "image";
    }
  }
  const bg = cs.backgroundColor;
  const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  const hasBorder = parseFloat(cs.borderWidth || "0") > 0;
  const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
  const shortText = textOf(el).length > 0 && textOf(el).length < 40;
  const small = el.offsetWidth < 300 && el.offsetHeight < 120;
  if (shortText && small && (hasBg || hasBorder || hasShadow)) return "badge";
  if (hasBg || hasBorder || hasShadow) return "card";
  return "container";
}

function getResolvedImageSrc(el: HTMLImageElement): string | undefined {
  const raw = el.currentSrc || el.getAttribute("src") || el.src;
  if (!raw) return undefined;
  try {
    return new URL(raw, el.baseURI).href;
  } catch {
    return raw;
  }
}

function elementToSceneElement(el: HTMLElement, rootRect: DOMRect, win: Window): SceneElement | null {
  const cs = win.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  const text = textOf(el);
  const type = inferSnapshotElementType(el, cs);
  return {
    id: el.dataset.dominoId || `snapshot-${Math.random().toString(36).slice(2, 8)}`,
    type,
    rect: {
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
    },
    throwable: true,
    pinned: false,
    text: text || undefined,
    fontSize: parseFloat(cs.fontSize) || 16,
    fontWeight: parseInt(cs.fontWeight) || 400,
    fontFamily: cs.fontFamily || "\"DM Sans\", sans-serif",
    lineHeight: parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 16) * 1.5,
    color: cs.color || "#333",
    backgroundColor: cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : undefined,
    borderRadius: parseFloat(cs.borderRadius) || 0,
    padding: parseFloat(cs.paddingLeft) || 0,
    border: parseFloat(cs.borderWidth) > 0 ? cs.border : undefined,
    boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : undefined,
    imageSrc: (() => {
      if (el.tagName === "IMG") return getResolvedImageSrc(el as HTMLImageElement);
      // For figure/picture/div containers, find the inner img
      const innerImg = el.querySelector("img") as HTMLImageElement | null;
      if (innerImg) return getResolvedImageSrc(innerImg);
      return undefined;
    })(),
    imageAlt: (() => {
      if (el.tagName === "IMG") return (el as HTMLImageElement).alt;
      const innerImg = el.querySelector("img") as HTMLImageElement | null;
      return innerImg?.alt;
    })(),
    mass: 1,
  };
}

function isStaticTextFlowObstacleCandidate(
  candidate: SnapshotCandidate,
  sourceWindow: Window | null
): boolean {
  if (!candidate.sceneElement || isTextSceneElement(candidate.sceneElement)) {
    return false;
  }
  if (candidate.display === "inline" || candidate.display === "contents") {
    return false;
  }
  if (candidate.width < 60 || candidate.height < 24) {
    return false;
  }

  const cls = (candidate.node.className || "").toString().toLowerCase();
  const id = (candidate.node.id || "").toLowerCase();
  const tag = candidate.node.tagName;
  const looksLikeMediaAnchor =
    candidate.sceneElement.type === "image" ||
    tag === "FIGURE" ||
    tag === "TABLE" ||
    tag === "TBODY" ||
    tag === "THEAD";
  const looksLikeLayoutAnchor =
    cls.includes("infobox") ||
    cls.includes("thumb") ||
    cls.includes("gallery") ||
    cls.includes("trow") ||
    id.includes("infobox");

  let isFloatAnchor = false;
  try {
    if (sourceWindow) {
      const cs = sourceWindow.getComputedStyle(candidate.node);
      isFloatAnchor = cs.float === "left" || cs.float === "right";
    }
  } catch {
    // Ignore style lookup failures inside the sandboxed iframe.
  }

  return looksLikeMediaAnchor || looksLikeLayoutAnchor || isFloatAnchor;
}

function pickContentRoot(doc: Document): HTMLElement {
  const selectors = [
    "main article",
    "main",
    "article",
    "#mw-content-text .mw-parser-output",
    "#mw-content-text",
    ".mw-body-content",
    "#content",
    "[role='main']",
    "#__next main",
    "#__next",
    "#root main",
    "#root",
    "body",
  ];
  for (const selector of selectors) {
    const node = doc.querySelector(selector);
    if (node instanceof HTMLElement) return node;
  }
  return doc.body as HTMLElement;
}

export function SnapshotPageView({
  page,
  currentPreset,
  onSelectPreset,
  onImportHtml,
  onFetchUrl,
  savedElements,
  onSaveElement,
  onUnsaveElement,
  onClearSaved,
  onRemoveSaved,
  customPages,
  activeCustomId,
  onSelectCustomPage,
  onResetAll,
}: SnapshotPageViewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const textNodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const rafRef = useRef<number>(0);
  const fpsFrames = useRef<number[]>([]);
  const [iframeHeight, setIframeHeight] = useState(1600);
  const [pickerMode, setPickerMode] = useState(false);
  const [savePickerMode, setSavePickerMode] = useState(false);
  const [candidates, setCandidates] = useState<SnapshotCandidate[]>([]);
  const [textBlocks, setTextBlocks] = useState<SnapshotTextBlock[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [droppedElements, setDroppedElements] = useState<SceneElement[]>([]);
  const [bodyPositions, setBodyPositions] = useState<Map<string, { x: number; y: number; angle: number; w: number; h: number }>>(new Map());
  const [fps, setFps] = useState(60);
  const [settings, setSettings] = useState<DebugSettings>({
    physicsEnabled: true,
    showObstacleBounds: false,
    showLineBounds: false,
    gravityX: 0,
    gravityY: 0,
    paused: false,
    pretextEnabled: true,
    allowWordBreaks: true,
  });

  const savedIds = useMemo(() => new Set(savedElements.map((s) => s.element.id)), [savedElements]);

  const scanCandidates = useCallback(() => {
    const iframe = iframeRef.current;
    const stage = stageRef.current;
    if (!iframe || !stage) return;
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win || !doc.body) return;

    const root = pickContentRoot(doc);
    // Physics/text overlays are positioned relative to the iframe viewport,
    // not the semantic content root. Using root-relative coordinates causes
    // selected clones to appear shifted away from the original DOM node.
    const viewportRect = new DOMRect(0, 0, 0, 0);
    const frameRect = iframe.getBoundingClientRect();
    const nodes = new Map<string, HTMLElement>();
    const textNodes = new Map<string, HTMLElement>();
    const next: SnapshotCandidate[] = [];
    const nextTextBlocks: SnapshotTextBlock[] = [];

    let counter = 0;
    const walk = (el: HTMLElement, depth: number, insideTextBlock: boolean) => {
      if (depth > 20) return;
      for (const child of Array.from(el.children)) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const childEl = child as HTMLElement;
        const tag = childEl.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "HEAD", "TEMPLATE"].includes(tag)) continue;
        const role = childEl.getAttribute("role");
        if (role === "navigation" || role === "banner" || role === "complementary") continue;
        const cls = (childEl.className || "").toString().toLowerCase();
        const id = (childEl.id || "").toLowerCase();
        if (cls.includes("sidebar") || cls.includes("navigation") || cls.includes("interlanguage") || id.includes("sidebar")) continue;

        let cs: CSSStyleDeclaration;
        try { cs = win.getComputedStyle(childEl); } catch { continue; }
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity || "1") === 0) continue;
        if (cs.position === "fixed" || cs.position === "sticky") continue;

        const rect = childEl.getBoundingClientRect();
        if (rect.width < 12 || rect.height < 12) { walk(childEl, depth + 1, insideTextBlock); continue; }
        if (rect.bottom < 0 || rect.right < 0 || rect.left > win.innerWidth) { walk(childEl, depth + 1, insideTextBlock); continue; }

        const text = textOf(childEl);
        const display = cs.display || "";
        const inlineish = display === "inline" || display === "contents";
        const bg = cs.backgroundColor;
        const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
        const hasBorder = parseFloat(cs.borderWidth || "0") > 0;
        const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
        const semantic = /^(BUTTON|A|IMG|PICTURE|VIDEO|SVG|INPUT|TEXTAREA|SELECT|H[1-6]|P|BLOCKQUOTE|FIGCAPTION|TABLE|FIGURE)$/.test(tag);
        const sizableBlock = rect.width >= 48 && rect.height >= 24;
        if (inlineish && !hasBg && !hasBorder && !hasShadow) {
          walk(childEl, depth + 1, insideTextBlock);
          continue;
        }
        if (!semantic && !hasBg && !hasBorder && !hasShadow && text.length < 12 && !sizableBlock) {
          walk(childEl, depth + 1, insideTextBlock);
          continue;
        }

        const dominoId = getStableNodeId(root, childEl) || `snapshot-node-${counter++}`;
        childEl.dataset.dominoId = dominoId;
        const sceneElement = elementToSceneElement(childEl, viewportRect, win);
        const hasMediaDescendants = childEl.querySelector("img, picture, video, svg, canvas") !== null;
        nodes.set(dominoId, childEl);
        const isTextBlock =
          isTextSceneElement(sceneElement) &&
          text.length > 0 &&
          (!hasMediaDescendants || tag === "FIGCAPTION");
        if (isTextBlock && !insideTextBlock) {
          textNodes.set(dominoId, childEl);
          nextTextBlocks.push({ id: dominoId, sceneElement, node: childEl });
        }
        next.push({
          id: dominoId,
          x: rect.left - frameRect.left,
          y: rect.top - frameRect.top,
          width: rect.width,
          height: rect.height,
          borderRadius: parseFloat(cs.borderRadius) || 0,
          saved: savedIds.has(dominoId),
          node: childEl,
          sceneElement,
          display,
        });

        walk(childEl, depth + 1, insideTextBlock || isTextBlock);
      }
    };

    walk(root, 0, false);
    nodesRef.current = nodes;
    textNodesRef.current = textNodes;
    setCandidates(next);
    setTextBlocks(nextTextBlocks);

    const bodyH = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, frameRect.height);
    setIframeHeight(Math.max(800, bodyH));
  }, [savedIds]);

  const selectableCandidates = useMemo(
    () => candidates.filter((c) =>
      c.sceneElement &&
      c.sceneElement.type !== "paragraph" &&
      c.sceneElement.type !== "heading" &&
      c.display !== "inline" &&
      c.display !== "contents" &&
      c.width >= 40 &&
      c.height >= 20
    ),
    [candidates]
  );

  const autoSelectedRef = useRef(false);

  useEffect(() => {
    scanCandidates();
    const onResize = () => scanCandidates();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scanCandidates, page.preparedHtml]);

  useEffect(() => {
    if (autoSelectedRef.current || selectableCandidates.length === 0) return;
    autoSelectedRef.current = true;
    const throwableTypes = new Set(["image", "badge", "button", "card", "link", "input"]);
    const picked: SnapshotCandidate[] = [];
    for (const c of selectableCandidates) {
      if (!c.sceneElement) continue;
      const t = c.sceneElement.type;
      if (!throwableTypes.has(t)) continue;
      if (c.width > 500 || c.height > 400) continue;
      if (c.width < 30 || c.height < 16) continue;
      if (c.y < 40) continue;

      const cls = (c.node.className || "").toString().toLowerCase();
      const id = (c.node.id || "").toLowerCase();
      const tag = c.node.tagName;
      const isInfobox =
        cls.includes("infobox") ||
        cls.includes("sidebar") ||
        cls.includes("navbox") ||
        cls.includes("tmbox") ||
        cls.includes("ambox");
      const isGallery = cls.includes("gallery") || cls.includes("thumb") || cls.includes("trow");
      const isTable = tag === "TABLE" || tag === "TBODY" || tag === "THEAD";
      const isFloatAnchor = (() => {
        try {
          const styles = (iframeRef.current?.contentWindow ?? window).getComputedStyle(c.node);
          return styles.float === "left" || styles.float === "right";
        } catch {
          return false;
        }
      })();
      if (isInfobox || isGallery || isTable || id.includes("infobox")) continue;
      if (isFloatAnchor && (c.width > 200 || c.height > 200)) continue;
      if (t === "card" && (c.width > 400 || c.height > 300)) continue;
      if (picked.some((p) => p.node.contains(c.node))) continue;
      picked.push(c);
      if (picked.length >= 30) break;
    }
    if (picked.length > 0) {
      setSelectedIds(new Set(picked.map((candidate) => candidate.id)));
    }
  }, [selectableCandidates]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc?.body) return;
    const h = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, 1200);
    setIframeHeight(h);
    scanCandidates();
  }, [scanCandidates]);

  const saveNode = useCallback((id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    const sceneEl = candidate?.sceneElement;
    if (sceneEl) onSaveElement(sceneEl);
  }, [onSaveElement, candidates]);

  const unsaveNode = useCallback((id: string) => {
    onUnsaveElement(id);
  }, [onUnsaveElement]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filter out selected elements whose DOM nodes are descendants of another
  // selected element — the parent clone already includes them visually.
  const selectedCandidates = useMemo(() => {
    const selected = selectableCandidates.filter(
      (c) => selectedIds.has(c.id) && c.sceneElement
    );
    return selected.filter((c) => !selected.some(
      (other) => other.id !== c.id && other.node.contains(c.node)
    ));
  }, [selectableCandidates, selectedIds]);

  const activeSelectedIds = useMemo(
    () => new Set(selectedCandidates.map((candidate) => candidate.id)),
    [selectedCandidates]
  );

  // Hide originals for active selected DOM nodes so overlay clones replace them visually.
  // In picker mode, show originals so the user sees what they're selecting.
  useEffect(() => {
    const current = nodesRef.current;
    current.forEach((node, id) => {
      if (activeSelectedIds.has(id) && !pickerMode) {
        if (!node.dataset.dominoOriginalVisibility) {
          node.dataset.dominoOriginalVisibility = node.style.visibility || "";
        }
        node.style.visibility = "hidden";
      } else if (node.dataset.dominoOriginalVisibility !== undefined) {
        node.style.visibility = node.dataset.dominoOriginalVisibility;
        delete node.dataset.dominoOriginalVisibility;
      }
    });
    return () => {
      current.forEach((node) => {
        if (node.dataset.dominoOriginalVisibility !== undefined) {
          node.style.visibility = node.dataset.dominoOriginalVisibility;
          delete node.dataset.dominoOriginalVisibility;
        }
      });
    };
  }, [activeSelectedIds, candidates, pickerMode]);

  const selectedElements = useMemo(() => {
    return selectedCandidates
      .map((c) => ({
        ...c.sceneElement!,
        id: c.id,
        throwable: true,
        pinned: false,
      }));
  }, [selectedCandidates]);

  const staticObstacleCandidates = useMemo(() => {
    const sourceWindow = iframeRef.current?.contentWindow ?? null;
    const obstacleCandidates: SnapshotCandidate[] = [];

    for (const candidate of candidates) {
      if (!isStaticTextFlowObstacleCandidate(candidate, sourceWindow)) continue;
      if (selectedCandidates.some((selected) => selected.node.contains(candidate.node))) {
        continue;
      }
      if (obstacleCandidates.some((existing) => existing.node.contains(candidate.node))) {
        continue;
      }
      obstacleCandidates.push(candidate);
    }

    return obstacleCandidates;
  }, [candidates, selectedCandidates]);

  // Hide original text nodes when Pretext overlay is active.
  const importedTextFlowActive =
    settings.pretextEnabled &&
    textBlocks.length > 0 &&
    (selectedElements.length > 0 || droppedElements.length > 0);
  useEffect(() => {
    const current = textNodesRef.current;
    current.forEach((node) => {
      if (importedTextFlowActive) {
        if (!node.dataset.dominoOriginalVisibility) {
          node.dataset.dominoOriginalVisibility = node.style.visibility || "";
        }
        node.style.visibility = "hidden";
      } else if (node.dataset.dominoOriginalVisibility !== undefined) {
        node.style.visibility = node.dataset.dominoOriginalVisibility;
        delete node.dataset.dominoOriginalVisibility;
      }
    });
    return () => {
      current.forEach((node) => {
        if (node.dataset.dominoOriginalVisibility !== undefined) {
          node.style.visibility = node.dataset.dominoOriginalVisibility;
          delete node.dataset.dominoOriginalVisibility;
        }
      });
    };
  }, [importedTextFlowActive, textBlocks]);

  const importedObstacles: ObstacleRect[] = useMemo(() => {
    // When the Pretext text overlay is active (original text hidden), ALL
    // selected elements must be obstacles — even at rest — so text wraps
    // around them. Without this, text renders underneath elements that
    // haven't been moved yet (e.g. floated images, infoboxes).
    const obstacles: ObstacleRect[] = [];

    for (const el of [...selectedElements, ...droppedElements]) {
      if (obstacles.some((o) => o.id === el.id)) continue;
      const pos = bodyPositions.get(el.id);
      obstacles.push({
        id: el.id,
        x: pos?.x ?? el.rect.x,
        y: pos?.y ?? el.rect.y,
        width: pos?.w ?? el.rect.width,
        height: pos?.h ?? el.rect.height,
        angle: pos?.angle ?? 0,
        borderRadius: el.borderRadius,
      });
    }

    for (const candidate of staticObstacleCandidates) {
      const el = candidate.sceneElement;
      if (!el || obstacles.some((o) => o.id === candidate.id)) continue;
      obstacles.push({
        id: candidate.id,
        x: el.rect.x,
        y: el.rect.y,
        width: el.rect.width,
        height: el.rect.height,
        angle: 0,
        borderRadius: el.borderRadius,
      });
    }

    return obstacles;
  }, [selectedElements, droppedElements, staticObstacleCandidates, bodyPositions]);

  const importedTextLayouts = useMemo(() => {
    if (!importedTextFlowActive) return [];

    const sortedBlocks = [...textBlocks].sort((a, b) => {
      const ay = a.sceneElement.rect.y;
      const by = b.sceneElement.rect.y;
      if (Math.abs(ay - by) > 1) return ay - by;
      return a.sceneElement.rect.x - b.sceneElement.rect.x;
    });

    const placed: Array<ImportedTextLayout & { textBottom: number; contentLeft: number; contentRight: number }> = [];
    const layouts: ImportedTextLayout[] = [];

    for (const block of sortedBlocks) {
      const el = block.sceneElement;
      const padding = el.padding ?? 0;
      const fw = el.fontWeight ?? 400;
      const fs = el.fontSize ?? 16;
      const ff = el.fontFamily ?? '"DM Sans", sans-serif';
      const font = `${fw !== 400 ? `${fw} ` : ""}${fs}px ${ff}`;
      const contentLeft = el.rect.x + padding;
      const contentRight = el.rect.x + el.rect.width - padding;
      const originalTextTop = el.rect.y + padding;

      let shiftedTextTop = originalTextTop;
      for (const prev of placed) {
        const overlapsHorizontally =
          Math.min(contentRight, prev.contentRight) - Math.max(contentLeft, prev.contentLeft) > 12;
        if (!overlapsHorizontally) continue;
        if (prev.textBottom + 4 > shiftedTextTop) {
          shiftedTextTop = prev.textBottom + 4;
        }
      }

      const remainingHeight = Math.max(0, iframeHeight - shiftedTextTop - 24);
      if (remainingHeight < fs) continue;

      const flow = computeTextFlow(
        el.text ?? "",
        font,
        el.lineHeight ?? Math.round(fs * 1.5),
        contentLeft,
        shiftedTextTop,
        Math.max(0, el.rect.width - padding * 2),
        remainingHeight,
        importedObstacles
      );

      const containerWidth = Math.max(0, el.rect.width - padding * 2);
      const layout: ImportedTextLayout = {
        id: block.id,
        sceneElement: el,
        containerX: contentLeft,
        containerY: shiftedTextTop,
        containerWidth,
        containerMaxHeight: remainingHeight,
      };
      layouts.push(layout);
      placed.push({
        ...layout,
        textBottom: shiftedTextTop + flow.totalHeight,
        contentLeft,
        contentRight,
      });
    }

    return layouts;
  }, [iframeHeight, importedObstacles, importedTextFlowActive, textBlocks]);

  // Only include dynamic (throwable) elements in the physics scene to avoid
  // recreating the engine when static obstacle lists change. Static obstacles
  // are still tracked for Pretext reflow but don't need physics bodies.
  const physicsElements = useMemo(
    () => [...selectedElements, ...droppedElements],
    [selectedElements, droppedElements]
  );
  const physicsSceneRef = useRef<{ id: string; width: number; height: number }>({
    id: page.id,
    width: stageRef.current?.clientWidth || window.innerWidth,
    height: iframeHeight,
  });
  physicsSceneRef.current = { id: page.id, width: stageRef.current?.clientWidth || window.innerWidth, height: iframeHeight };

  const overlayScene = useMemo(() => ({
    id: `snapshot-overlay-${page.id}`,
    name: page.name,
    width: physicsSceneRef.current.width,
    height: physicsSceneRef.current.height,
    backgroundColor: "transparent",
    elements: physicsElements,
  }), [page.id, page.name, physicsElements]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const engine = createPhysicsEngine(overlayScene, stage);
    physicsRef.current = engine;
    engine.setGravity(settings.gravityX, settings.gravityY);
    if (pickerMode || savePickerMode || settings.paused || !settings.physicsEnabled) {
      engine.pause();
    }
    return () => {
      // Don't cancel the RAF loop here — it's managed by a separate effect
      // and checks physicsRef.current on each frame. Cancelling it here would
      // kill the animation loop permanently since the RAF effect's deps don't
      // include overlayScene.
      engine.destroy();
      physicsRef.current = null;
    };
  }, [overlayScene]);

  useEffect(() => {
    let last = 0;
    let prevSnapshot = "";
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const engine = physicsRef.current;
      if (!engine || !settings.physicsEnabled) return;
      const now = performance.now();
      fpsFrames.current.push(now);
      while (fpsFrames.current.length > 0 && fpsFrames.current[0] < now - 1000) fpsFrames.current.shift();
      if (now - last > 250) { setFps(fpsFrames.current.length); last = now; }
      const positions = engine.getBodyPositions();
      let snapshot = "";
      for (const [id, p] of positions) snapshot += `${id}:${p.x.toFixed(1)},${p.y.toFixed(1)},${p.angle.toFixed(3)};`;
      if (snapshot !== prevSnapshot) {
        prevSnapshot = snapshot;
        setBodyPositions(positions);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [settings.physicsEnabled]);

  useEffect(() => { physicsRef.current?.setGravity(settings.gravityX, settings.gravityY); }, [settings.gravityX, settings.gravityY]);
  useEffect(() => {
    const engine = physicsRef.current;
    if (!engine) return;
    if (!settings.physicsEnabled || settings.paused || pickerMode || savePickerMode) {
      engine.pause();
    } else {
      engine.resume();
    }
  }, [settings.physicsEnabled, settings.paused, pickerMode, savePickerMode]);

  return (
    <div
      ref={stageRef}
      style={{ position: "relative", width: "100%", minHeight: iframeHeight, background: "#fff", cursor: settings.physicsEnabled ? "grab" : "default" }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData("application/domino-saved")) as SavedElement;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const el = {
            ...data.element,
            id: `snapshot-drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            throwable: true,
            pinned: false,
            rect: {
              ...data.element.rect,
              x: x - data.element.rect.width / 2,
              y: y - data.element.rect.height / 2,
            },
          };
          setDroppedElements((prev) => [...prev, el]);
        } catch { /* ignore */ }
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={page.preparedHtml}
        sandbox="allow-same-origin"
        style={{
          width: "100%",
          height: iframeHeight,
          border: "none",
          display: "block",
          background: "#fff",
          pointerEvents: pickerMode || settings.physicsEnabled ? "none" : "auto",
        }}
        onLoad={handleIframeLoad}
      />

      {pickerMode && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.08)", pointerEvents: "none" }} />
          {selectableCandidates.map((c) => {
            const wide = c.width >= 80;
            const selected = selectedIds.has(c.id);
            return (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: c.x - 2,
                  top: c.y - 2,
                  width: c.width + 4,
                  height: c.height + 4,
                  borderRadius: (c.borderRadius ?? 0) + 2,
                  border: selected ? "2px solid rgba(59,130,246,0.8)" : "2px dashed rgba(59,130,246,0.45)",
                  background: selected ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.04)",
                  boxSizing: "border-box",
                  pointerEvents: "auto",
                  zIndex: 100,
                  cursor: "pointer",
                }}
                onClick={() => toggleSelected(c.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelected(c.id);
                  }}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    height: 18,
                    minWidth: 18,
                    borderRadius: 9,
                    padding: wide ? "0 7px" : "0 4px",
                    border: "2px solid #fff",
                    background: selected ? "#3b82f6" : "#aaa",
                    color: "#fff",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 9,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    pointerEvents: "auto",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selected ? "✓" : ""}
                  {wide && (selected ? " Physics" : "")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (c.saved) {
                      unsaveNode(c.id);
                    } else {
                      saveNode(c.id);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: -8,
                    left: -8,
                    height: 18,
                    minWidth: 18,
                    borderRadius: 9,
                    padding: wide ? "0 7px" : "0 4px",
                    border: "2px solid #fff",
                    background: c.saved ? "#16a34a" : "#7c3aed",
                    color: "#fff",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 9,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    pointerEvents: "auto",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.saved ? "✓" : ""}
                  {wide && (c.saved ? " Saved" : " Save")}
                </button>
              </div>
            );
          })}
          <div
            style={{
              position: "fixed",
              top: 12,
              right: 12,
              zIndex: 101,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(20,20,24,0.75)",
              color: "#ddd",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              pointerEvents: "none",
            }}
          >
            {selectableCandidates.length} selectable · {selectedIds.size} selected
          </div>
        </>
      )}

      {savePickerMode && (
        <QuickSavePicker
          candidates={selectableCandidates
            .filter((candidate) => candidate.sceneElement)
            .map((candidate) => ({
              id: candidate.id,
              element: candidate.sceneElement!,
              x: candidate.x,
              y: candidate.y,
              width: candidate.width,
              height: candidate.height,
              borderRadius: candidate.borderRadius,
              saved: candidate.saved,
            }))}
          onSave={onSaveElement}
          onClose={() => {
            setSavePickerMode(false);
            if (!settings.paused) physicsRef.current?.resume();
          }}
        />
      )}

      {/* Pretext text overlay for imported pages */}
      {importedTextFlowActive && importedTextLayouts.map((layout) => {
        const el = layout.sceneElement;
        const fw = el.fontWeight ?? 400;
        const fs = el.fontSize ?? 16;
        const ff = el.fontFamily ?? '"DM Sans", sans-serif';
        const font = `${fw !== 400 ? fw + " " : ""}${fs}px ${ff}`;
        return (
          <TextFlowRegion
            key={`imported-text-${layout.id}`}
            text={el.text ?? ""}
            font={font}
            fontSize={fs}
            lineHeight={el.lineHeight ?? Math.round(fs * 1.5)}
            color={el.color ?? "#333"}
            containerX={layout.containerX}
            containerY={layout.containerY}
            containerWidth={layout.containerWidth}
            containerMaxHeight={layout.containerMaxHeight}
            obstacles={importedObstacles}
            showDebug={settings.showLineBounds}
            generation={bodyPositions.size + selectedIds.size + droppedElements.length}
          />
        );
      })}

      {/* Physics overlay for selected/dropped imported-page components.
          Hidden during picker mode so originals are visible for selection. */}
      {!pickerMode && selectedElements.map((el) => {
        const pos = bodyPositions.get(el.id);
        const candidate = selectableCandidates.find((c) => c.id === el.id);
        if (!candidate) return null;
        return (
          <ImportedPhysicsClone
            key={el.id}
            sourceNode={candidate.node}
            sourceWindow={iframeRef.current?.contentWindow ?? window}
            x={pos?.x ?? el.rect.x}
            y={pos?.y ?? el.rect.y}
            angle={pos?.angle ?? 0}
            width={pos?.w ?? el.rect.width}
            height={pos?.h ?? el.rect.height}
            showDebug={settings.showObstacleBounds}
            renderVersion={importedTextFlowActive}
          />
        );
      })}
      {!pickerMode && droppedElements.map((el) => {
        const pos = bodyPositions.get(el.id);
        return (
          <PhysicsDomItem
            key={el.id}
            element={el}
            x={pos?.x ?? el.rect.x}
            y={pos?.y ?? el.rect.y}
            angle={pos?.angle ?? 0}
            isPhysicsEnabled={true}
            showDebug={settings.showObstacleBounds}
            isPinned={false}
          />
        );
      })}

      <Toolbar
        settings={settings}
        onSettingsChange={setSettings}
        onExplode={() => physicsRef.current?.explode()}
        onReset={() => physicsRef.current?.reset()}
        onTogglePicker={() => {
          setPickerMode((prev) => {
            if (!prev) {
              setSavePickerMode(false);
              physicsRef.current?.reset();
              physicsRef.current?.pause();
            } else if (!settings.paused) {
              physicsRef.current?.resume();
            }
            return !prev;
          });
        }}
        pickerMode={pickerMode}
        savePickerMode={savePickerMode}
        onToggleSavePicker={() => {
          setSavePickerMode((prev) => {
            if (!prev) {
              setPickerMode(false);
              physicsRef.current?.pause();
            } else if (!settings.paused) {
              physicsRef.current?.resume();
            }
            return !prev;
          });
        }}
        fps={fps}
        bodyCount={selectedElements.length + droppedElements.length}
        lineCount={0}
        currentPreset={currentPreset}
        onSelectPreset={onSelectPreset}
        onImportHtml={onImportHtml}
        onFetchUrl={onFetchUrl}
        savedElements={savedElements}
        onDropSaved={(saved, x, y) => {
          const el = {
            ...saved.element,
            id: `snapshot-drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            throwable: true,
            pinned: false,
            rect: {
              ...saved.element.rect,
              x: x != null ? x - saved.element.rect.width / 2 : (stageRef.current?.clientWidth || 1000) / 2 - saved.element.rect.width / 2,
              y: y != null ? y - saved.element.rect.height / 2 : iframeHeight / 2 - saved.element.rect.height / 2,
            },
          };
          setDroppedElements((prev) => [...prev, el]);
        }}
        onClearSaved={onClearSaved}
        onRemoveSaved={onRemoveSaved}
        customPages={customPages}
        activeCustomId={activeCustomId}
        onSelectCustomPage={onSelectCustomPage}
        onResetAll={onResetAll}
      />
    </div>
  );
}
