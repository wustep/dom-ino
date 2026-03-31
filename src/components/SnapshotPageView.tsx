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

interface SnapshotPageViewProps {
  page: SnapshotCustomPage;
  currentPreset: PresetKey | "custom";
  onSelectPreset: (key: PresetKey) => void;
  onImportHtml: (html: string, name: string) => void;
  onFetchUrl: (url: string) => Promise<void>;
  savedElements: SavedElement[];
  onSaveElement: (el: SceneElement) => void;
  onUnsaveElement: (id: string) => void;
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
  if (tag === "IMG") return "image";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return "input";
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
    imageSrc: el.tagName === "IMG" ? (el as HTMLImageElement).src : undefined,
    imageAlt: el.tagName === "IMG" ? (el as HTMLImageElement).alt : undefined,
    mass: 1,
  };
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
    pretextEnabled: false,
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
    const walk = (el: HTMLElement, depth: number) => {
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
        if (rect.width < 12 || rect.height < 12) { walk(childEl, depth + 1); continue; }
        if (rect.bottom < 0 || rect.right < 0 || rect.left > win.innerWidth) { walk(childEl, depth + 1); continue; }

        const text = textOf(childEl);
        const display = cs.display || "";
        const inlineish = display === "inline" || display === "contents";
        const bg = cs.backgroundColor;
        const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
        const hasBorder = parseFloat(cs.borderWidth || "0") > 0;
        const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
        const semantic = /^(BUTTON|A|IMG|INPUT|TEXTAREA|SELECT|H[1-6]|P|BLOCKQUOTE|FIGCAPTION|TABLE|FIGURE)$/.test(tag);
        const sizableBlock = rect.width >= 48 && rect.height >= 24;
        if (inlineish && !hasBg && !hasBorder && !hasShadow) {
          walk(childEl, depth + 1);
          continue;
        }
        if (!semantic && !hasBg && !hasBorder && !hasShadow && text.length < 12 && !sizableBlock) {
          walk(childEl, depth + 1);
          continue;
        }

        const dominoId = getStableNodeId(root, childEl) || `snapshot-node-${counter++}`;
        childEl.dataset.dominoId = dominoId;
        const sceneElement = elementToSceneElement(childEl, viewportRect, win);
        nodes.set(dominoId, childEl);
        if (
          sceneElement &&
          (sceneElement.type === "paragraph" || sceneElement.type === "heading") &&
          text.length > 0
        ) {
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

        walk(childEl, depth + 1);
      }
    };

    walk(root, 0);
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

  useEffect(() => {
    // Keep snapshot candidates/text blocks current for imported-page overlays.
    // Pretext and physics overlays depend on this data even when picker mode is closed.
    scanCandidates();
    const onResize = () => scanCandidates();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scanCandidates, page.preparedHtml]);

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

  // Hide originals for selected DOM nodes so overlay clones replace them visually.
  useEffect(() => {
    const current = nodesRef.current;
    current.forEach((node, id) => {
      if (selectedIds.has(id)) {
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
  }, [selectedIds, candidates]);

  const selectedElements = useMemo(() => {
    return selectableCandidates
      .filter((c) => selectedIds.has(c.id) && c.sceneElement)
      .map((c) => ({
        ...c.sceneElement!,
        id: c.id,
        throwable: true,
        pinned: false,
      }));
  }, [selectableCandidates, selectedIds]);

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

  const staticObstacleElements = useMemo(() => {
    return selectableCandidates
      .filter((c) => !selectedIds.has(c.id) && c.sceneElement)
      .map((c) => ({
        ...c.sceneElement!,
        id: c.id,
        throwable: false,
        pinned: true,
      }));
  }, [selectableCandidates, selectedIds]);

  const importedObstacles: ObstacleRect[] = useMemo(() => {
    const moving: ObstacleRect[] = [...selectedElements, ...droppedElements].map((el) => {
      const pos = bodyPositions.get(el.id);
      return {
        id: el.id,
        x: pos?.x ?? el.rect.x,
        y: pos?.y ?? el.rect.y,
        width: pos?.w ?? el.rect.width,
        height: pos?.h ?? el.rect.height,
        angle: pos?.angle ?? 0,
        borderRadius: el.borderRadius,
      };
    });

    const staticRects: ObstacleRect[] = staticObstacleElements.map((el) => ({
      id: el.id,
      x: el.rect.x,
      y: el.rect.y,
      width: el.rect.width,
      height: el.rect.height,
      angle: 0,
      borderRadius: el.borderRadius,
    }));

    return [...staticRects, ...moving];
  }, [selectedElements, droppedElements, bodyPositions, staticObstacleElements]);

  const overlayScene = useMemo(() => ({
    id: `snapshot-overlay-${page.id}`,
    name: page.name,
    width: stageRef.current?.clientWidth || window.innerWidth,
    height: iframeHeight,
    backgroundColor: "transparent",
    elements: [...staticObstacleElements, ...selectedElements, ...droppedElements],
  }), [page.id, page.name, iframeHeight, staticObstacleElements, selectedElements, droppedElements]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const engine = createPhysicsEngine(overlayScene, stage);
    physicsRef.current = engine;
    return () => {
      cancelAnimationFrame(rafRef.current);
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
                    c.saved ? unsaveNode(c.id) : saveNode(c.id);
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
      {importedTextFlowActive && textBlocks.map((t) => {
        const el = t.sceneElement;
        const fw = el.fontWeight ?? 400;
        const fs = el.fontSize ?? 16;
        const ff = el.fontFamily ?? '"DM Sans", sans-serif';
        const font = `${fw !== 400 ? fw + " " : ""}${fs}px ${ff}`;
        return (
          <TextFlowRegion
            key={`imported-text-${t.id}`}
            text={el.text ?? ""}
            font={font}
            fontSize={fs}
            lineHeight={el.lineHeight ?? Math.round(fs * 1.5)}
            color={el.color ?? "#333"}
            containerX={el.rect.x + (el.padding ?? 0)}
            containerY={el.rect.y + (el.padding ?? 0)}
            containerWidth={el.rect.width - (el.padding ?? 0) * 2}
            containerMaxHeight={Math.max(el.rect.height + 200, 300)}
            obstacles={importedObstacles}
            showDebug={settings.showLineBounds}
            generation={bodyPositions.size + selectedIds.size + droppedElements.length}
          />
        );
      })}

      {/* Physics overlay for selected/dropped imported-page components */}
      {selectedElements.map((el) => {
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
          />
        );
      })}
      {droppedElements.map((el) => {
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
        onClearSaved={() => {}}
        onRemoveSaved={() => {}}
        customPages={customPages}
        activeCustomId={activeCustomId}
        onSelectCustomPage={onSelectCustomPage}
        onResetAll={onResetAll}
      />
    </div>
  );
}
