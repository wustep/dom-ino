import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SceneElement, SavedElement } from "../scene/types";
import type { SnapshotCandidate, SnapshotTextBlock } from "../components/snapshotHelpers";
import {
  isTextSceneElement,
  getStableNodeId,
  textOf,
  hasSignificantMediaDescendants,
  elementToSceneElement,
  pickContentRoot,
} from "../components/snapshotHelpers";
import { toStageRect } from "../components/snapshotViewUtils";
import { isPretextBlockEligible } from "../scene/siteStyles";

interface UseSnapshotScannerOptions {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  pageId: string;
  sourceUrl?: string;
  preparedHtml: string;
  savedElements: SavedElement[];
  onSaveElement: (el: SceneElement) => void;
  onUnsaveElement: (id: string) => void;
}

interface UseSnapshotScannerResult {
  candidates: SnapshotCandidate[];
  textBlocks: SnapshotTextBlock[];
  selectableCandidates: SnapshotCandidate[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  iframeHeight: number;
  nodesRef: React.RefObject<Map<string, HTMLElement>>;
  textNodesRef: React.RefObject<Map<string, HTMLElement>>;
  handleIframeLoad: () => void;
  toggleSelected: (id: string) => void;
  saveNode: (id: string) => void;
  unsaveNode: (id: string) => void;
}

export function useSnapshotScanner({
  iframeRef,
  stageRef,
  pageId,
  sourceUrl,
  preparedHtml,
  savedElements,
  onSaveElement,
  onUnsaveElement,
}: UseSnapshotScannerOptions): UseSnapshotScannerResult {
  const nodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const textNodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const [iframeHeight, setIframeHeight] = useState(1600);
  const [candidates, setCandidates] = useState<SnapshotCandidate[]>([]);
  const [textBlocks, setTextBlocks] = useState<SnapshotTextBlock[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const savedIds = useMemo(() => new Set(savedElements.map((s) => s.element.id)), [savedElements]);

  const scanCandidates = useCallback(() => {
    const iframe = iframeRef.current;
    const stage = stageRef.current;
    if (!iframe || !stage) return;
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win || !doc.body) return;

    const root = pickContentRoot(doc);
    const viewportRect = new DOMRect(0, 0, 0, 0);
    const nodes = new Map<string, HTMLElement>();
    const textNodes = new Map<string, HTMLElement>();
    const next: SnapshotCandidate[] = [];
    const nextTextBlocks: SnapshotTextBlock[] = [];

    let counter = 0;
    const walk = (el: HTMLElement, depth: number, insideTextBlock: boolean) => {
      if (depth > 40) return;
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
        const mediaElement = /^(IMG|PICTURE|VIDEO|SVG|FIGURE)$/.test(tag);
        const sizableBlock = rect.width >= 48 && rect.height >= 24;
        if (inlineish && !mediaElement && !hasBg && !hasBorder && !hasShadow) {
          walk(childEl, depth + 1, insideTextBlock);
          continue;
        }
        if (!semantic && !hasBg && !hasBorder && !hasShadow && text.length < 12 && !sizableBlock) {
          walk(childEl, depth + 1, insideTextBlock);
          continue;
        }

        const dominoId = getStableNodeId(root, childEl) || `snapshot-node-${counter++}`;
        childEl.dataset.dominoId = dominoId;
        const sceneElement = elementToSceneElement(childEl, viewportRect, cs, rect, text);
        const textSceneElement = isTextSceneElement(sceneElement) ? sceneElement : null;
        const hasMediaDescendants = hasSignificantMediaDescendants(childEl);
        nodes.set(dominoId, childEl);
        const isTextBlock =
          textSceneElement !== null &&
          isPretextBlockEligible(childEl, textSceneElement, sourceUrl) &&
          text.length > 0 &&
          (!hasMediaDescendants || tag === "FIGCAPTION");
        if (isTextBlock && !insideTextBlock) {
          textNodes.set(dominoId, childEl);
          nextTextBlocks.push({ id: dominoId, sceneElement: textSceneElement, node: childEl });
        }
        const stageRect = toStageRect(rect);
        next.push({
          id: dominoId,
          x: stageRect.x,
          y: stageRect.y,
          width: stageRect.width,
          height: stageRect.height,
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

    const bodyH = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, iframe.clientHeight);
    setIframeHeight(Math.max(800, bodyH));
  }, [iframeRef, stageRef, sourceUrl, savedIds]);

  const scheduledScanRef = useRef<number | null>(null);
  const scheduleScanCandidates = useCallback(() => {
    if (scheduledScanRef.current !== null) return;
    scheduledScanRef.current = requestAnimationFrame(() => {
      scheduledScanRef.current = null;
      scanCandidates();
    });
  }, [scanCandidates]);

  const selectableCandidates = useMemo(
    () => candidates.filter((c) =>
      c.sceneElement &&
      c.sceneElement.type !== "paragraph" &&
      c.sceneElement.type !== "heading" &&
      (c.sceneElement.type === "image" || (c.display !== "inline" && c.display !== "contents")) &&
      c.width >= 40 &&
      c.height >= 20
    ),
    [candidates]
  );

  // Auto-selection
  const autoSelectedRef = useRef(false);

  useEffect(() => {
    autoSelectedRef.current = false;
  }, [pageId]);

  useEffect(() => {
    scanCandidates();
    const onResize = () => scheduleScanCandidates();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scanCandidates, scheduleScanCandidates, preparedHtml]);

  useEffect(() => {
    return () => {
      if (scheduledScanRef.current !== null) {
        cancelAnimationFrame(scheduledScanRef.current);
        scheduledScanRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoSelectedRef.current || selectableCandidates.length === 0) return;
    autoSelectedRef.current = true;
    const throwableTypes = new Set(["image", "badge", "button", "card", "link", "input"]);
    const picked: SnapshotCandidate[] = [];
    for (const c of selectableCandidates) {
      if (!c.sceneElement) continue;
      const t = c.sceneElement.type;
      if (!throwableTypes.has(t)) continue;
      if ((c.display === "inline" || c.display === "contents") && t !== "image") continue;
      const maxW = t === "image" ? 900 : 500;
      const maxH = t === "image" ? 700 : 400;
      if (c.width > maxW || c.height > maxH) continue;
      if (c.width < 30 || c.height < 16) continue;
      if (c.y < 40) continue;

      const cls = (c.node.className || "").toString().toLowerCase();
      const id = (c.node.id || "").toLowerCase();
      const tag = c.node.tagName;
      const isNoticeBox =
        cls.includes("ambox") ||
        cls.includes("tmbox") ||
        cls.includes("ombox");
      const isInfobox =
        cls.includes("infobox") ||
        cls.includes("sidebar") ||
        cls.includes("navbox");
      const isGallery = cls.includes("gallery") || cls.includes("thumb") || cls.includes("trow");
      const isTable = tag === "TABLE" || tag === "TBODY" || tag === "THEAD";
      const isMediaWrapper = t === "image" && (tag === "FIGURE" || isGallery);
      const isFloatAnchor = (() => {
        try {
          const styles = (iframeRef.current?.contentWindow ?? window).getComputedStyle(c.node);
          return styles.float === "left" || styles.float === "right";
        } catch {
          return false;
        }
      })();
      if (isInfobox || id.includes("infobox")) continue;
      if ((isGallery || isTable) && !isMediaWrapper && !isNoticeBox) continue;
      if (isFloatAnchor && t !== "image" && (c.width > 200 || c.height > 200)) continue;
      if (t === "card" && !isNoticeBox && (c.width > 400 || c.height > 300)) continue;
      if (isNoticeBox && (c.width > 980 || c.height > 320)) continue;
      if (picked.some((p) => p.node.contains(c.node))) continue;
      picked.push(c);
      if (picked.length >= 200) break;
    }
    if (picked.length > 0) {
      setSelectedIds(new Set(picked.map((candidate) => candidate.id)));
    }
  }, [selectableCandidates, iframeRef]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc?.body) return;
    const h = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0, 1200);
    setIframeHeight(h);
    scanCandidates();

    // Copy @font-face rules from iframe to the parent document so the
    // Pretext text overlay can render with the same custom fonts.
    try {
      const fontRules: string[] = [];
      for (const sheet of Array.from(doc.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSFontFaceRule) {
              fontRules.push(rule.cssText);
            }
          }
        } catch { /* cross-origin sheet, skip */ }
      }
      if (fontRules.length > 0) {
        const id = "domino-iframe-fonts";
        let fontStyle = document.getElementById(id) as HTMLStyleElement | null;
        if (!fontStyle) {
          fontStyle = document.createElement("style");
          fontStyle.id = id;
          document.head.appendChild(fontStyle);
        }
        fontStyle.textContent = fontRules.join("\n");
      }
    } catch { /* ignore font extraction errors */ }

    // Wait for images to finish loading, then re-measure height and re-scan.
    const images = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[];
    const pending = images.filter((img) => img.src && !img.complete);
    if (pending.length > 0) {
      const settled = Promise.allSettled(
        pending.map((img) => new Promise<void>((resolve) => {
          if (img.complete) { resolve(); return; }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }))
      );
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000));
      Promise.race([settled, timeout]).then(() => {
        if (!iframeRef.current?.contentDocument?.body) return;
        const newH = Math.max(
          iframeRef.current.contentDocument.body.scrollHeight,
          iframeRef.current.contentDocument.documentElement?.scrollHeight || 0,
          1200
        );
        setIframeHeight(newH);
        scheduleScanCandidates();
      });
    }
  }, [iframeRef, scanCandidates, scheduleScanCandidates]);

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

  return {
    candidates,
    textBlocks,
    selectableCandidates,
    selectedIds,
    setSelectedIds,
    iframeHeight,
    nodesRef,
    textNodesRef,
    handleIframeLoad,
    toggleSelected,
    saveNode,
    unsaveNode,
  };
}
