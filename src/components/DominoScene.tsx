import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type {
  ObstacleRect,
  SavedElement,
  SceneDescription,
  SceneElement,
} from "../scene/types";
import type { PresetKey } from "../scene/presets";
import type { CustomPage } from "../App";
import { createPhysicsEngine } from "../physics/engine";
import type { PhysicsEngine } from "../physics/engine";
import { TextFlowRegion } from "./TextFlowRegion";
import { PhysicsDomItem } from "./PhysicsDomItem";
import { Toolbar } from "./Toolbar";
import type { DebugSettings } from "./Toolbar";
import { getObstacleAABB } from "../textflow/obstacles";
import { ThrowablePicker } from "./ThrowablePicker";
import { QuickSavePicker } from "./QuickSavePicker";

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
  customPages?: CustomPage[];
  activeCustomId?: string | null;
  onSelectCustomPage?: (id: string) => void;
  onResetAll?: () => void;
}

type BodyPos = { x: number; y: number; angle: number; w: number; h: number };

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
  savedElements, onSaveElement, onUnsaveElement, onDropSaved, onClearSaved, onRemoveSaved,
  customPages, activeCustomId, onSelectCustomPage, onResetAll,
}: DominoSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const rafRef = useRef<number>(0);
  const fpsTimestamps = useRef<number[]>([]);

  const [bodyPositions, setBodyPositions] = useState<Map<string, BodyPos>>(new Map());
  const [generation, setGeneration] = useState(0);
  const [fps, setFps] = useState(60);
  const [totalLineCount, setTotalLineCount] = useState(0);
  const [pickerMode, setPickerMode] = useState(false);
  const [savePickerMode, setSavePickerMode] = useState(false);
  const effectiveElements = scene.elements;

  const [settings, setSettings] = useState<DebugSettings>({
    physicsEnabled: true, showObstacleBounds: false, showLineBounds: false,
    gravityX: 0, gravityY: 0, paused: false, pretextEnabled: true, allowWordBreaks: true,
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const engine = createPhysicsEngine(scene, container);
    physicsRef.current = engine;
    setBodyPositions(new Map());
    return () => {
      // Don't cancel RAF here — the loop effect only depends on physicsEnabled.
      // Cancelling on scene/engine teardown would stop syncing forever until that toggles (HMR included).
      engine.destroy();
      physicsRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    let lastFpsUpdate = 0, prevSnapshot = "";
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const engine = physicsRef.current;
      if (!engine || !settings.physicsEnabled) return;
      const now = performance.now();
      fpsTimestamps.current.push(now);
      while (fpsTimestamps.current.length > 0 && fpsTimestamps.current[0] < now - 1000) fpsTimestamps.current.shift();
      if (now - lastFpsUpdate > 250) { setFps(fpsTimestamps.current.length); lastFpsUpdate = now; }
      const positions = engine.getBodyPositions();
      let snapshot = "";
      for (const [id, p] of positions) snapshot += `${id}:${p.x.toFixed(1)},${p.y.toFixed(1)},${p.angle.toFixed(3)};`;
      if (snapshot !== prevSnapshot) { prevSnapshot = snapshot; setBodyPositions(positions); setGeneration((g) => g + 1); }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [settings.physicsEnabled]);

  useEffect(() => { physicsRef.current?.setGravity(settings.gravityX, settings.gravityY); }, [settings.gravityX, settings.gravityY]);
  useEffect(() => { if (settings.paused) physicsRef.current?.pause(); else physicsRef.current?.resume(); }, [settings.paused]);

  const obstacles: ObstacleRect[] = useMemo(() => {
    if (!settings.pretextEnabled) return [];
    return effectiveElements
      .filter((el) => {
        const participates = el.affectsTextFlow ?? el.throwable;
        if (!participates) return false;
        return el.type !== "paragraph" && el.type !== "heading" && el.type !== "divider";
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

  return (
    <div
      style={{ position: "relative", width: scene.width, height: scene.height, backgroundColor: scene.backgroundColor, overflow: "hidden", cursor: "grab" }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData("application/domino-saved"));
          if (data) {
            const rect = e.currentTarget.getBoundingClientRect();
            onDropSaved(data as SavedElement, e.clientX - rect.left, e.clientY - rect.top);
          }
        } catch { /* not a valid drop */ }
      }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0, width: scene.width, height: scene.height }}>
        {staticElements.map((el) => (
          <PhysicsDomItem key={el.id} element={el} x={el.rect.x} y={el.rect.y} angle={0} isPhysicsEnabled={false} showDebug={false} isPinned={true} />
        ))}

        {settings.pretextEnabled
          ? textElements.map((el) => {
              const fw = el.fontWeight ?? 400, fs = el.fontSize ?? 16;
              const ff = el.fontFamily ?? '"Source Serif 4", Georgia, serif';
              const stylePrefix = el.fontStyle && el.fontStyle !== "normal" ? `${el.fontStyle} ` : "";
              const weightPart = fw !== 400 ? `${fw} ` : "";
              const font = `${stylePrefix}${weightPart}${fs}px ${ff}`;
              const pad = el.padding ?? 0;
              const flowMinSegmentWidth = el.minSegmentWidth ?? (el.type === "heading" ? 80 : 8);
              const allowWordBreaks = el.allowWordBreaks ?? (el.type === "heading" ? false : settings.allowWordBreaks);
              return (<TextFlowRegion key={el.id} text={el.text!} font={font} fontSize={fs}
                lineHeight={el.lineHeight ?? 28} color={el.color ?? "#333"}
                opacity={el.opacity} letterSpacing={el.letterSpacing} textAlign={el.textAlign}
                containerX={el.rect.x + pad} containerY={el.rect.y + pad}
                containerWidth={el.rect.width - pad * 2}
                containerMaxHeight={(textMaxHeights.get(el.id) ?? el.rect.height) - pad * 2}
                obstacles={obstacles} showDebug={settings.showLineBounds}
                generation={generation} onLineCount={reportLines}
                minSegmentWidth={flowMinSegmentWidth}
                allowWordBreaks={allowWordBreaks} />);
            })
          : textElements.map((el) => {
              const pad = el.padding ?? 0;
              return (
                <div key={el.id} style={{ position: "absolute", left: el.rect.x + pad, top: el.rect.y + pad, width: el.rect.width - pad * 2, fontSize: el.fontSize ?? 16, fontWeight: el.fontWeight ?? 400, fontStyle: el.fontStyle ?? "normal", fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif', lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6", color: el.color ?? "#333", opacity: el.opacity, letterSpacing: el.letterSpacing, textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined, pointerEvents: "none", zIndex: 2 }}>{el.text}</div>
              );
            })}

        {throwableElements.map((el) => {
          const pos = bodyPositions.get(el.id);
          return (<PhysicsDomItem key={el.id} element={el}
            x={pos?.x ?? el.rect.x} y={pos?.y ?? el.rect.y} angle={pos?.angle ?? 0}
            isPhysicsEnabled={settings.physicsEnabled} showDebug={settings.showObstacleBounds}
            isPinned={false} />);
        })}

        {settings.showObstacleBounds && obstacles.map((obs) => {
          const aabb = getObstacleAABB(obs);
          return (<div key={`aabb-${obs.id}`} style={{ position: "absolute", left: aabb.left, top: aabb.top, width: aabb.right - aabb.left, height: aabb.bottom - aabb.top, border: "1px dashed rgba(231,76,60,0.35)", backgroundColor: "rgba(231,76,60,0.04)", pointerEvents: "none", zIndex: 99, boxSizing: "border-box" }} />);
        })}

        {pickerMode && (
          <ThrowablePicker elements={effectiveElements} savedElements={savedElements}
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
              // Entering picker: reset bodies to original positions and pause
              setSavePickerMode(false);
              physicsRef.current?.reset();
              physicsRef.current?.pause();
            } else {
              // Exiting picker: resume physics
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
        fps={fps} bodyCount={throwableElements.length} lineCount={totalLineCount}
        currentPreset={currentPreset} onSelectPreset={onSelectPreset}
        onImportHtml={onImportHtml} onFetchUrl={onFetchUrl}
        savedElements={savedElements} onDropSaved={onDropSaved}
        onClearSaved={onClearSaved} onRemoveSaved={onRemoveSaved}
        customPages={customPages ?? []} activeCustomId={activeCustomId ?? null}
        onSelectCustomPage={onSelectCustomPage ?? (() => {})}
        onResetAll={onResetAll ?? (() => {})}
      />
    </div>
  );
}
