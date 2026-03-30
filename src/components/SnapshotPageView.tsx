import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CustomPage, SnapshotCustomPage } from "../App";
import type { SavedElement, SceneElement } from "../scene/types";
import type { PresetKey } from "../scene/presets";
import { Toolbar, type DebugSettings } from "./Toolbar";

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
};

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
    imageSrc: el instanceof HTMLImageElement ? el.src : undefined,
    imageAlt: el instanceof HTMLImageElement ? el.alt : undefined,
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
  const [iframeHeight, setIframeHeight] = useState(1600);
  const [pickerMode, setPickerMode] = useState(false);
  const [candidates, setCandidates] = useState<SnapshotCandidate[]>([]);
  const [settings, setSettings] = useState<DebugSettings>({
    physicsEnabled: false,
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
    const rootRect = root.getBoundingClientRect();
    const frameRect = iframe.getBoundingClientRect();
    const nodes = new Map<string, HTMLElement>();
    const next: SnapshotCandidate[] = [];

    let counter = 0;
    const walk = (el: HTMLElement, depth: number) => {
      if (depth > 20) return;
      for (const child of Array.from(el.children)) {
        if (!(child instanceof HTMLElement)) continue;
        const tag = child.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "HEAD", "TEMPLATE"].includes(tag)) continue;
        const role = child.getAttribute("role");
        if (role === "navigation" || role === "banner" || role === "complementary") continue;
        const cls = (child.className || "").toString().toLowerCase();
        const id = (child.id || "").toLowerCase();
        if (cls.includes("sidebar") || cls.includes("navigation") || cls.includes("interlanguage") || id.includes("sidebar")) continue;

        let cs: CSSStyleDeclaration;
        try { cs = win.getComputedStyle(child); } catch { continue; }
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity || "1") === 0) continue;
        if (cs.position === "fixed" || cs.position === "sticky") continue;

        const rect = child.getBoundingClientRect();
        if (rect.width < 12 || rect.height < 12) { walk(child, depth + 1); continue; }
        if (rect.bottom < 0 || rect.right < 0 || rect.left > win.innerWidth) { walk(child, depth + 1); continue; }

        const text = textOf(child);
        const bg = cs.backgroundColor;
        const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
        const hasBorder = parseFloat(cs.borderWidth || "0") > 0;
        const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
        const semantic = /^(BUTTON|A|IMG|INPUT|TEXTAREA|SELECT|H[1-6]|P|BLOCKQUOTE|FIGCAPTION)$/.test(tag);
        if (!semantic && !hasBg && !hasBorder && !hasShadow && text.length < 12) {
          walk(child, depth + 1);
          continue;
        }

        const dominoId = `snapshot-node-${counter++}`;
        child.dataset.dominoId = dominoId;
        nodes.set(dominoId, child);
        next.push({
          id: dominoId,
          x: rect.left - frameRect.left,
          y: rect.top - frameRect.top,
          width: rect.width,
          height: rect.height,
          borderRadius: parseFloat(cs.borderRadius) || 0,
          saved: savedIds.has(dominoId),
          node: child,
        });

        walk(child, depth + 1);
      }
    };

    walk(root, 0);
    nodesRef.current = nodes;
    setCandidates(next);

    const bodyH = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, frameRect.height);
    setIframeHeight(Math.max(800, bodyH));
  }, [savedIds]);

  useEffect(() => {
    if (!pickerMode) return;
    scanCandidates();
    const onResize = () => scanCandidates();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pickerMode, scanCandidates]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc?.body) return;
    const h = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, 1200);
    setIframeHeight(h);
    if (pickerMode) scanCandidates();
  }, [pickerMode, scanCandidates]);

  const saveNode = useCallback((id: string) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    if (!doc || !win) return;
    const node = nodesRef.current.get(id);
    if (!node) return;
    const root = pickContentRoot(doc);
    const sceneEl = elementToSceneElement(node, root.getBoundingClientRect(), win);
    if (sceneEl) onSaveElement(sceneEl);
  }, [onSaveElement]);

  const unsaveNode = useCallback((id: string) => {
    onUnsaveElement(id);
  }, [onUnsaveElement]);

  return (
    <div ref={stageRef} style={{ position: "relative", width: "100%", minHeight: iframeHeight, background: "#fff" }}>
      <iframe
        ref={iframeRef}
        srcDoc={page.preparedHtml}
        sandbox="allow-same-origin"
        style={{ width: "100%", height: iframeHeight, border: "none", display: "block", background: "#fff" }}
        onLoad={handleIframeLoad}
      />

      {pickerMode && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.08)", pointerEvents: "none" }} />
          {candidates.map((c) => {
            const wide = c.width >= 80;
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
                  border: "2px dashed rgba(59,130,246,0.45)",
                  background: "rgba(59,130,246,0.04)",
                  boxSizing: "border-box",
                  pointerEvents: "none",
                  zIndex: 100,
                }}
              >
                <button
                  onClick={() => (c.saved ? unsaveNode(c.id) : saveNode(c.id))}
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
        </>
      )}

      <Toolbar
        settings={settings}
        onSettingsChange={setSettings}
        onExplode={() => {}}
        onReset={() => {}}
        onTogglePicker={() => setPickerMode((p) => !p)}
        pickerMode={pickerMode}
        fps={0}
        bodyCount={0}
        lineCount={0}
        currentPreset={currentPreset}
        onSelectPreset={onSelectPreset}
        onImportHtml={onImportHtml}
        onFetchUrl={onFetchUrl}
        savedElements={savedElements}
        onDropSaved={() => {}}
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
