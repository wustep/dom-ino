import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react";
import type {
  ObstacleRect,
  SavedElement,
  SceneDescription,
  SceneElement,
} from "../scene/types";
import type { PresetKey } from "../scene/presets";
import type { CustomPage } from "../App";
import type { LayoutCursor } from "@chenglou/pretext";
import { createPhysicsEngine } from "../physics/engine";
import type { PhysicsEngine } from "../physics/engine";
import { TextFlowRegion } from "./TextFlowRegion";
import { computeTextFlow } from "../textflow/useTextFlow";
import { PhysicsDomItem } from "./PhysicsDomItem";
import { Toolbar } from "./Toolbar";
import type { DebugSettings } from "./Toolbar";
import { getObstacleAABB } from "../textflow/obstacles";
import { ThrowablePicker } from "./ThrowablePicker";
import { QuickSavePicker } from "./QuickSavePicker";
import { getBackgroundStyle } from "../utils/styles";
import { buildFontString } from "../utils/fonts";
import { usePhysicsLoop } from "../hooks/usePhysicsLoop";
import { measureGlyphBodiesFromDomNode } from "../textflow/glyphBodies";

interface DominoSceneProps {
  scene: SceneDescription;
  onSceneChange?: (scene: SceneDescription, remount?: boolean) => void;
  currentPreset: PresetKey | "custom";
  onSelectPreset: (key: PresetKey) => void;
  onImportHtml: (html: string, name: string) => void;
  onFetchUrl: (url: string) => Promise<void>;
  savedElements: SavedElement[];
  onSaveElement: (el: SceneElement) => void;
  onUnsaveElement: (id: string) => void;
  onDropSaved: (saved: SavedElement, x?: number, y?: number) => void;
  onClearSaved: () => void;
  onRemoveSaved: (index: number) => void;
  onSaveStashImageFiles?: (files: File[]) => void;
  customPages?: CustomPage[];
  activeCustomId?: string | null;
  onSelectCustomPage?: (id: string) => void;
  onResetAll?: () => void;
}


function computeTextMaxHeights(
  textElements: SceneElement[], allElements: SceneElement[], sceneHeight: number
): Map<string, number> {
  const allYStops: number[] = [];
  for (const el of allElements) { if (el.type !== "divider") allYStops.push(el.rect.y); }
  allYStops.push(sceneHeight);
  allYStops.sort((a, b) => a - b);
  const result = new Map<string, number>();
  for (const el of textElements) {
    const elBottom = el.rect.y + el.rect.height;
    let nextY = sceneHeight;
    for (const stop of allYStops) { if (stop > elBottom - 4) { nextY = stop; break; } }
    result.set(el.id, Math.min(Math.max(el.rect.height, nextY - el.rect.y - 4), 3000));
  }
  return result;
}

export function DominoScene({
  scene, onSceneChange,
  currentPreset, onSelectPreset, onImportHtml, onFetchUrl,
  savedElements, onSaveElement, onUnsaveElement, onDropSaved, onClearSaved, onRemoveSaved, onSaveStashImageFiles,
  customPages, activeCustomId, onSelectCustomPage, onResetAll,
}: DominoSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);

  const [generation, setGeneration] = useState(0);
  const [totalLineCount, setTotalLineCount] = useState(0);
  const [pickerMode, setPickerMode] = useState(false);
  const [savePickerMode, setSavePickerMode] = useState(false);
  const [textBodyElements, setTextBodyElements] = useState<SceneElement[]>([]);
  const textMeasureRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const effectiveElements = scene.elements;

  const [settings, setSettings] = useState<DebugSettings>({
    physicsEnabled: true, showObstacleBounds: false, showLineBounds: false,
    gravityX: 0, gravityY: 0, paused: false, pretextEnabled: true, textBodiesEnabled: false, maxAutoSelectComponents: 500, allowWordBreaks: true, restitution: 0.3,
  });

  const bumpGeneration = useCallback(() => setGeneration((g) => g + 1), []);
  const { bodyPositions, fps } = usePhysicsLoop({
    physicsRef,
    physicsEnabled: settings.physicsEnabled,
    gravityX: settings.gravityX,
    gravityY: settings.gravityY,
    restitution: settings.restitution,
    onPositionsChanged: bumpGeneration,
  });

  const { textElements, throwableElements, staticElements } = useMemo(() => {
    const text: SceneElement[] = [], throwable: SceneElement[] = [], staticEls: SceneElement[] = [];
    for (const el of effectiveElements) {
      const isText = (el.type === "paragraph" || el.type === "heading") && el.text && !el.throwable;
      if (isText) text.push(el);
      if (el.throwable) throwable.push(el);
      else if (!isText) staticEls.push(el);
    }
    return { textElements: text, throwableElements: throwable, staticElements: staticEls };
  }, [effectiveElements]);

  const textMaxHeights = useMemo(
    () => computeTextMaxHeights(textElements, effectiveElements, scene.height),
    [textElements, effectiveElements, scene.height]
  );

  // Measure glyph bodies from a transparent clone of each text block rendered in the DOM.
  useLayoutEffect(() => {
    if (!settings.textBodiesEnabled) {
      setTextBodyElements([]);
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const rootRect = container.getBoundingClientRect();
    const nextBodies: SceneElement[] = [];
    for (const el of textElements) {
      const node = textMeasureRefs.current.get(el.id);
      if (!node) continue;
      nextBodies.push(
        ...measureGlyphBodiesFromDomNode(node, {
          idPrefix: `${el.id}-text-body`,
          rootRect,
          zIndex: (el.zIndex ?? 2) + 4,
        }).map((body) => ({ ...body, color: el.color ?? body.color }))
      );
    }
    setTextBodyElements(nextBodies);
  }, [scene.id, scene.width, scene.height, settings.textBodiesEnabled, textElements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const engine = createPhysicsEngine(scene, container);
    physicsRef.current = engine;
    return () => {
      engine.destroy();
      physicsRef.current = null;
    };
  }, [scene]);

  useEffect(() => { if (settings.paused) physicsRef.current?.pause(); else physicsRef.current?.resume(); }, [settings.paused]);

  const obstacles: ObstacleRect[] = useMemo(() => {
    if (!settings.pretextEnabled) return [];
    return effectiveElements
      .filter((el) => {
        const participates = el.affectsTextFlow ?? el.throwable;
        if (!participates) return false;
        if (el.type === "divider") return false;
        if ((el.type === "paragraph" || el.type === "heading") && !el.throwable)
          return false;
        return true;
      })
      .map((el) => {
      const pos = bodyPositions.get(el.id);
      return {
        id: el.id,
        x: pos?.x ?? el.rect.x,
        y: pos?.y ?? el.rect.y,
        width: pos?.w ?? el.rect.width,
        height: pos?.h ?? el.rect.height,
        angle: pos?.angle ?? 0,
        borderRadius: el.borderRadius,
        physicsShape: el.physicsShape,
        polygonPoints: el.polygonPoints,
      };
    });
  }, [effectiveElements, bodyPositions, settings.pretextEnabled]);

  // Compute start cursors for text continuation chains.
  // E.g. col2 continues from col1, col3 from col2 — we run computeTextFlow
  // for predecessors to derive where each successor should start.
  const continuationCursors = useMemo(() => {
    const cursors = new Map<string, LayoutCursor>();
    if (!settings.pretextEnabled) return cursors;

    // Build ordered chains starting from each root (elements without textContinuationId)
    const visited = new Set<string>();
    for (const el of textElements) {
      if (el.textContinuationId || visited.has(el.id)) continue;
      // Walk the chain forward
      let current: SceneElement | undefined = el;
      let prevCursor: LayoutCursor | undefined;
      while (current) {
        visited.add(current.id);
        if (prevCursor) {
          cursors.set(current.id, prevCursor);
        }
        // Find next element in chain
        const nextEl = textElements.find(
          (te) => te.textContinuationId === current!.id
        );
        if (!nextEl) break;

        // Compute flow for current element to get end cursor
        const fs = current.fontSize ?? 16;
        const font = buildFontString(fs, current.fontWeight, current.fontFamily, current.fontStyle);
        const pad = current.padding ?? 0;
        const flowResult = computeTextFlow(
          current.text!,
          font,
          current.lineHeight ?? 28,
          current.rect.x + pad,
          current.rect.y + pad,
          current.rect.width - pad * 2,
          (textMaxHeights.get(current.id) ?? current.rect.height) - pad * 2,
          obstacles,
          8,
          current.minSegmentWidth ?? (current.type === "heading" ? 80 : 8),
          current.allowWordBreaks ?? (current.type === "heading" ? false : settings.allowWordBreaks),
          prevCursor
        );
        prevCursor = flowResult.endCursor;
        current = nextEl;
      }
    }
    return cursors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textElements, textMaxHeights, obstacles, settings.pretextEnabled, settings.allowWordBreaks, generation]);

  const handleExplode = useCallback(() => physicsRef.current?.explode(), []);
  const handleReset = useCallback(() => {
    physicsRef.current?.reset();
  }, []);
  const handleToggleThrowable = useCallback((elementId: string) => {
    if (!onSceneChange) return;
    onSceneChange(
      { ...scene, elements: scene.elements.map((el) => el.id === elementId ? { ...el, throwable: !el.throwable } : el) },
      false
    );
  }, [scene, onSceneChange]);

  const handleSaveElement = useCallback((el: SceneElement) => onSaveElement(el), [onSaveElement]);

  const saveCandidates = useMemo(() => {
    return effectiveElements
      .filter((el) => el.type !== "divider" && !(el.type === "paragraph" && !el.throwable) && !(el.type === "heading" && !el.throwable))
      .map((el) => {
        const pos = bodyPositions.get(el.id);
        return {
          id: el.id,
          element: el,
          x: pos?.x ?? el.rect.x,
          y: pos?.y ?? el.rect.y,
          width: pos?.w ?? el.rect.width,
          height: pos?.h ?? el.rect.height,
          borderRadius: el.borderRadius,
          saved: savedElements.some((saved) => saved.element.id === el.id),
        };
      });
  }, [effectiveElements, bodyPositions, savedElements]);

  const lineCountRef = useRef(0);
  const reportLines = useCallback((count: number) => { lineCountRef.current += count; }, []);
  useEffect(() => { lineCountRef.current = 0; const t = setTimeout(() => setTotalLineCount(lineCountRef.current), 50); return () => clearTimeout(t); }, [generation]);

  // Sync glyph bodies into physics engine incrementally.
  useEffect(() => {
    const engine = physicsRef.current;
    if (!engine) return;
    const desiredIds = new Set(textBodyElements.map((el) => el.id));
    for (const id of [...engine.bodies.keys()]) {
      if (id.includes("-text-body-") && !desiredIds.has(id)) engine.removeBody(id);
    }
    for (const el of textBodyElements) {
      if (!engine.bodies.has(el.id)) engine.addBody(el);
    }
  }, [textBodyElements]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/domino-saved"));
      if (data) {
        const rect = e.currentTarget.getBoundingClientRect();
        onDropSaved(data as SavedElement, e.clientX - rect.left, e.clientY - rect.top);
      }
    } catch { /* not a valid drop */ }
  }, [onDropSaved]);

  return (
    <div style={{ position: "relative", width: scene.width, height: scene.height, ...getBackgroundStyle(scene.backgroundColor), overflow: "hidden", cursor: "grab" }}>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: scene.width,
          height: scene.height,
          cursor: "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {staticElements.map((el) => (
          <PhysicsDomItem key={el.id} element={el} x={el.rect.x} y={el.rect.y} angle={0} isPhysicsEnabled={false} showDebug={false} />
        ))}

        {/* Invisible measurement layer — renders text at its natural position so we can
            use Range.getClientRects() on each grapheme to place glyph bodies. */}
        {settings.textBodiesEnabled && (
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {textElements.map((el) => {
              const pad = el.padding ?? 0;
              return (
                <div
                  key={`measure-${el.id}`}
                  ref={(node) => {
                    if (node) textMeasureRefs.current.set(el.id, node);
                    else textMeasureRefs.current.delete(el.id);
                  }}
                  style={{
                    position: "absolute",
                    left: el.rect.x + pad,
                    top: el.rect.y + pad,
                    width: el.rect.width - pad * 2,
                    fontSize: el.fontSize ?? 16,
                    fontWeight: el.fontWeight ?? 400,
                    fontStyle: el.fontStyle ?? "normal",
                    fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif',
                    lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6",
                    color: "transparent",
                    letterSpacing: el.letterSpacing,
                    textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  {el.text}
                </div>
              );
            })}
          </div>
        )}

        {/* Letter bodies — one PhysicsDomItem per glyph */}
        {settings.textBodiesEnabled && textBodyElements.map((el) => {
          const pos = bodyPositions.get(el.id);
          return (
            <PhysicsDomItem
              key={el.id}
              element={el}
              x={pos?.x ?? el.rect.x}
              y={pos?.y ?? el.rect.y}
              angle={pos?.angle ?? 0}
              isPhysicsEnabled={settings.physicsEnabled}
              showDebug={settings.showObstacleBounds}
            />
          );
        })}

        {/* Live reflow text — hidden when letter-body mode is on */}
        {!settings.textBodiesEnabled && (settings.pretextEnabled
          ? textElements.map((el) => {
              const fs = el.fontSize ?? 16;
              const font = buildFontString(fs, el.fontWeight, el.fontFamily, el.fontStyle);
              const pad = el.padding ?? 0;
              const flowMinSegmentWidth = el.minSegmentWidth ?? (el.type === "heading" ? 80 : 8);
              const allowWordBreaks = el.allowWordBreaks ?? (el.type === "heading" ? false : settings.allowWordBreaks);
              const startCursor = continuationCursors.get(el.id);
              return (<TextFlowRegion key={el.id} text={el.text!} font={font} fontSize={fs}
                lineHeight={el.lineHeight ?? 28} color={el.color ?? "#333"}
                opacity={el.opacity} letterSpacing={el.letterSpacing} textAlign={el.textAlign}
                containerX={el.rect.x + pad} containerY={el.rect.y + pad}
                containerWidth={el.rect.width - pad * 2}
                containerMaxHeight={(textMaxHeights.get(el.id) ?? el.rect.height) - pad * 2}
                obstacles={obstacles} showDebug={settings.showLineBounds}
                generation={generation} onLineCount={reportLines}
                minSegmentWidth={flowMinSegmentWidth}
                allowWordBreaks={allowWordBreaks}
                startCursor={startCursor} />);
            })
          : textElements.map((el) => {
              const pad = el.padding ?? 0;
              return (
                <div key={el.id} style={{ position: "absolute", left: el.rect.x + pad, top: el.rect.y + pad, width: el.rect.width - pad * 2, fontSize: el.fontSize ?? 16, fontWeight: el.fontWeight ?? 400, fontStyle: el.fontStyle ?? "normal", fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif', lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6", color: el.color ?? "#333", opacity: el.opacity, letterSpacing: el.letterSpacing, textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined, pointerEvents: "none", zIndex: 2 }}>{el.text}</div>
              );
            }))}

        {throwableElements.map((el) => {
          const pos = bodyPositions.get(el.id);
          return (<PhysicsDomItem key={el.id} element={el}
            x={pos?.x ?? el.rect.x} y={pos?.y ?? el.rect.y} angle={pos?.angle ?? 0}
            isPhysicsEnabled={settings.physicsEnabled} showDebug={settings.showObstacleBounds}
            />);
        })}

        {settings.showObstacleBounds && obstacles.map((obs) => {
          const aabb = getObstacleAABB(obs);
          return (<div key={`aabb-${obs.id}`} style={{ position: "absolute", left: aabb.left, top: aabb.top, width: aabb.right - aabb.left, height: aabb.bottom - aabb.top, border: "1px dashed rgba(231,76,60,0.35)", backgroundColor: "rgba(231,76,60,0.04)", pointerEvents: "none", zIndex: 99, boxSizing: "border-box" }} />);
        })}

        {pickerMode && (
          <ThrowablePicker elements={effectiveElements.map((el) => {
            const pos = bodyPositions.get(el.id);
            return pos ? { ...el, rect: { ...el.rect, x: pos.x, y: pos.y } } : el;
          })} savedElements={savedElements}
            onToggle={handleToggleThrowable} onSave={handleSaveElement} onUnsave={onUnsaveElement}
            onDelete={(id: string) => {
              if (!onSceneChange) return;
              onSceneChange({ ...scene, elements: scene.elements.filter((el) => el.id !== id) }, false);
            }}
            onClose={() => {
              setPickerMode(false);
              if (!settings.paused) physicsRef.current?.resume();
            }} />
        )}

        {savePickerMode && (
          <QuickSavePicker
            candidates={saveCandidates}
            onSave={handleSaveElement}
            onUnsave={onUnsaveElement}
            onClose={() => {
              setSavePickerMode(false);
              if (!settings.paused) physicsRef.current?.resume();
            }}
          />
        )}

      </div>

      <Toolbar
        settings={settings} onSettingsChange={setSettings}
        onExplode={handleExplode} onReset={handleReset}
        onTogglePicker={() => {
          setPickerMode((prev) => {
            if (!prev) {
              setSavePickerMode(false);
              physicsRef.current?.pause();
            } else {
              if (!settings.paused) physicsRef.current?.resume();
            }
            return !prev;
          });
        }} pickerMode={pickerMode}
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
        fps={fps} bodyCount={throwableElements.length + textBodyElements.length} lineCount={settings.textBodiesEnabled ? 0 : totalLineCount}
        currentPreset={currentPreset} onSelectPreset={onSelectPreset}
        onImportHtml={onImportHtml} onFetchUrl={onFetchUrl}
        savedElements={savedElements} onDropSaved={onDropSaved}
        onSaveStashImageFiles={onSaveStashImageFiles}
        onClearSaved={onClearSaved} onRemoveSaved={onRemoveSaved}
        customPages={customPages ?? []} activeCustomId={activeCustomId ?? null}
        onSelectCustomPage={onSelectCustomPage ?? (() => {})}
        onResetAll={onResetAll ?? (() => {})}
      />
    </div>
  );
}
