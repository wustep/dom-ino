import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { SnapshotPickerOverlay } from "./SnapshotPickerOverlay";
import { computeTextFlow, type TextFlowResult } from "../textflow/useTextFlow";
import {
  hasMovedImportedElement,
  hasRenderableImportedText,
} from "./snapshotViewUtils";
import { buildFontString, DEFAULT_SANS } from "../utils/fonts";
import { usePhysicsLoop } from "../hooks/usePhysicsLoop";
import { useSnapshotScanner } from "../hooks/useSnapshotScanner";
import {
  isStaticTextFlowObstacleCandidate,
  syncHiddenNodes,
  restoreHiddenNodes,
  extractInlineStyles,
  revealHiddenAncestors,
  restoreRevealedAncestors,
  type SnapshotCandidate,
  type InlineStyleRun,
} from "./snapshotHelpers";

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
  onSaveStashImageFiles?: (files: File[]) => void;
  customPages: CustomPage[];
  activeCustomId: string | null;
  onSelectCustomPage: (id: string) => void;
  onResetAll: () => void;
}

type ImportedTextLayout = {
  id: string;
  sceneElement: SceneElement;
  containerX: number;
  containerY: number;
  containerWidth: number;
  containerMaxHeight: number;
  flow: TextFlowResult;
  inlineStyles?: InlineStyleRun[];
};

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
  onSaveStashImageFiles,
  customPages,
  activeCustomId,
  onSelectCustomPage,
  onResetAll,
}: SnapshotPageViewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const hiddenSelectedNodesRef = useRef<Map<HTMLElement, string>>(new Map());
  const hiddenTextNodesRef = useRef<Map<HTMLElement, string>>(new Map());
  const [pickerMode, setPickerMode] = useState(false);
  const [savePickerMode, setSavePickerMode] = useState(false);
  const [droppedElements, setDroppedElements] = useState<SceneElement[]>([]);
  const [settings, setSettings] = useState<DebugSettings>({
    physicsEnabled: true,
    showObstacleBounds: false,
    showLineBounds: false,
    gravityX: 0,
    gravityY: 0,
    paused: false,
    pretextEnabled: true,
    allowWordBreaks: true,
    restitution: 0.3,
  });

  const { bodyPositions, fps } = usePhysicsLoop({
    physicsRef,
    physicsEnabled: settings.physicsEnabled,
    gravityX: settings.gravityX,
    gravityY: settings.gravityY,
    restitution: settings.restitution,
  });

  const {
    candidates,
    textBlocks,
    selectableCandidates,
    selectedIds,
    iframeHeight,
    iframeLoaded,
    nodesRef,
    textNodesRef,
    handleIframeLoad,
    toggleSelected,
    saveNode,
    unsaveNode,
  } = useSnapshotScanner({
    iframeRef,
    stageRef,
    pageId: page.id,
    sourceUrl: page.sourceUrl,
    preparedHtml: page.preparedHtml,
    savedElements,
    onSaveElement,
    onUnsaveElement,
  });

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

  const selectableCandidateMap = useMemo(
    () => new Map(selectableCandidates.map((candidate) => [candidate.id, candidate])),
    [selectableCandidates]
  );

  useLayoutEffect(() => {
    const desiredNodes =
      pickerMode
        ? []
        : Array.from(activeSelectedIds)
            .map((id) => nodesRef.current.get(id))
            .filter((node): node is HTMLElement => Boolean(node));
    syncHiddenNodes(hiddenSelectedNodesRef.current, desiredNodes);
  }, [activeSelectedIds, candidates, pickerMode]);

  useEffect(() => {
    const hiddenSelectedNodes = hiddenSelectedNodesRef.current;
    return () => restoreHiddenNodes(hiddenSelectedNodes);
  }, []);

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

  const hasMovedSelectedElements = useMemo(
    () => selectedElements.some((el) => hasMovedImportedElement(el, bodyPositions.get(el.id))),
    [bodyPositions, selectedElements]
  );

  const importedTextFlowActive =
    settings.pretextEnabled &&
    textBlocks.length > 0 &&
    (hasMovedSelectedElements || droppedElements.length > 0);

  useEffect(() => {
    const hiddenTextNodes = hiddenTextNodesRef.current;
    return () => restoreHiddenNodes(hiddenTextNodes);
  }, []);

  const importedObstacles: ObstacleRect[] = useMemo(() => {
    // When the Pretext text overlay is active (original text hidden), ALL
    // selected elements must be obstacles — even at rest — so text wraps
    // around them. Without this, text renders underneath elements that
    // haven't been moved yet (e.g. floated images, infoboxes).
    const obstacles: ObstacleRect[] = [];

    for (const el of [...selectedElements, ...droppedElements]) {
      if (obstacles.some((o) => o.id === el.id)) continue;
      // During picker mode, originals are restored at their initial positions,
      // so use el.rect instead of physics bodyPositions for correct reflow.
      const pos = pickerMode ? undefined : bodyPositions.get(el.id);
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
  }, [selectedElements, droppedElements, staticObstacleCandidates, bodyPositions, pickerMode]);

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
      const paddingX = el.padding ?? 0;
      const paddingY = el.paddingVertical ?? paddingX;
      const fs = el.fontSize ?? 16;
      const font = buildFontString(fs, el.fontWeight, el.fontFamily ?? DEFAULT_SANS, el.fontStyle);
      const contentLeft = el.rect.x + paddingX;
      const contentRight = el.rect.x + el.rect.width - paddingX;
      const originalTextTop = el.rect.y + paddingY;

      let shiftedTextTop = originalTextTop;
      for (const prev of placed) {
        const overlapsHorizontally =
          Math.min(contentRight, prev.contentRight) - Math.max(contentLeft, prev.contentLeft) > 12;
        if (!overlapsHorizontally) continue;
        if (prev.textBottom + 4 > shiftedTextTop) {
          shiftedTextTop = prev.textBottom + 4;
        }
      }

      const remainingHeight = Math.max(0, iframeHeight - shiftedTextTop - paddingY - 24);
      if (remainingHeight < fs) continue;

      const flow = computeTextFlow(
        el.text ?? "",
        font,
        el.lineHeight ?? Math.round(fs * 1.5),
        contentLeft,
        shiftedTextTop,
        Math.max(0, el.rect.width - paddingX * 2),
        remainingHeight,
        importedObstacles
      );

      const containerWidth = Math.max(0, el.rect.width - paddingX * 2);
      const win = iframeRef.current?.contentWindow;
      let inlineStyles: InlineStyleRun[] | undefined;
      if (win) {
        const revealedNodes = revealHiddenAncestors(block.node);
        try { inlineStyles = extractInlineStyles(block.node, win); } catch { /* */ }
        finally { restoreRevealedAncestors(revealedNodes); }
        if (inlineStyles && inlineStyles.length === 0) inlineStyles = undefined;
      }
      const layout: ImportedTextLayout = {
        id: block.id,
        sceneElement: el,
        containerX: contentLeft,
        containerY: shiftedTextTop,
        containerWidth,
        containerMaxHeight: remainingHeight,
        flow,
        inlineStyles,
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

  useLayoutEffect(() => {
    const desiredNodes = importedTextFlowActive
      ? importedTextLayouts
          .filter((layout) => hasRenderableImportedText(layout.flow))
          .map((layout) => textNodesRef.current.get(layout.id))
          .filter((node): node is HTMLElement => Boolean(node))
      : [];
    syncHiddenNodes(hiddenTextNodesRef.current, desiredNodes);
  }, [importedTextFlowActive, importedTextLayouts]);

  // Only include dynamic (throwable) elements in the physics scene to avoid
  // recreating the engine when static obstacle lists change. Static obstacles
  // are still tracked for Pretext reflow but don't need physics bodies.
  const physicsElements = useMemo(
    () => (iframeLoaded ? [...selectedElements, ...droppedElements] : []),
    [iframeLoaded, selectedElements, droppedElements]
  );

  const baseOverlayScene = useMemo(() => ({
    id: `snapshot-overlay-${page.id}`,
    name: page.name,
    width: stageRef.current?.clientWidth || window.innerWidth,
    height: 1600,
    backgroundColor: "transparent",
    elements: [] as SceneElement[],
  }), [page.id, page.name]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const engine = createPhysicsEngine(baseOverlayScene, stage);
    physicsRef.current = engine;
    return () => {
      engine.destroy();
      physicsRef.current = null;
    };
  }, [baseOverlayScene]);

  // Sync physics bodies incrementally so adding/removing elements doesn't
  // destroy the engine and reset existing body positions.
  useEffect(() => {
    const engine = physicsRef.current;
    if (!engine) return;

    engine.resize(stageRef.current?.clientWidth || window.innerWidth, iframeHeight);
  }, [iframeHeight]);

  useEffect(() => {
    const engine = physicsRef.current;
    if (!engine) return;

    const desiredIds = new Set(physicsElements.map((el) => el.id));

    for (const id of engine.bodies.keys()) {
      if (!desiredIds.has(id)) {
        engine.removeBody(id);
      }
    }

    for (const el of physicsElements) {
      if (!engine.bodies.has(el.id)) {
        engine.addBody(el);
      }
    }
  }, [physicsElements]);

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
      style={{ position: "relative", width: "100%", minHeight: iframeHeight, background: "#fff" }}
    >
      <div
        ref={stageRef}
        style={{
          position: "relative",
          width: "100%",
          minHeight: iframeHeight,
          cursor: settings.physicsEnabled ? "grab" : "default",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
        }}
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
          <SnapshotPickerOverlay
            selectableCandidates={selectableCandidates}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onSaveNode={saveNode}
            onUnsaveNode={unsaveNode}
            onClose={() => {
              setPickerMode(false);
              if (!settings.paused) physicsRef.current?.resume();
            }}
          />
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
            onUnsave={onUnsaveElement}
            onClose={() => {
              setSavePickerMode(false);
              if (!settings.paused) physicsRef.current?.resume();
            }}
          />
        )}

        {/* Pretext text overlay for imported pages */}
        {importedTextFlowActive && importedTextLayouts.map((layout) => {
          const el = layout.sceneElement;
          const fs = el.fontSize ?? 16;
          const font = buildFontString(fs, el.fontWeight, el.fontFamily ?? DEFAULT_SANS);
          const hasContainerVisuals = el.backgroundColor || el.border || el.boxShadow;
          return (
            <React.Fragment key={`imported-text-${layout.id}`}>
              {hasContainerVisuals && (
                <div style={{
                  position: "absolute",
                  left: el.rect.x,
                  top: el.rect.y,
                  width: el.rect.width,
                  height: el.rect.height,
                  backgroundColor: el.backgroundColor,
                  border: el.border,
                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                  boxShadow: el.boxShadow,
                  boxSizing: "border-box",
                  pointerEvents: "none",
                  zIndex: 10,
                }} />
              )}
              <TextFlowRegion
                text={el.text ?? ""}
                font={font}
                fontSize={fs}
                lineHeight={el.lineHeight ?? Math.round(fs * 1.5)}
                color={el.color ?? "#333"}
                opacity={el.opacity}
                letterSpacing={el.letterSpacing}
                containerX={layout.containerX}
                containerY={layout.containerY}
                containerWidth={layout.containerWidth}
                containerMaxHeight={layout.containerMaxHeight}
                textAlign={el.textAlign}
                obstacles={importedObstacles}
                flow={layout.flow}
                inlineStyles={layout.inlineStyles}
                showDebug={settings.showLineBounds}
                generation={bodyPositions.size + selectedIds.size + droppedElements.length}
              />
            </React.Fragment>
          );
        })}

        {/* Physics overlay for selected/dropped imported-page components.
            Hidden during picker mode so originals are visible for selection. */}
        {!pickerMode && selectedElements.map((el) => {
          const pos = bodyPositions.get(el.id);
          const candidate = selectableCandidateMap.get(el.id);
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
            />
          );
        })}
      </div>

      <Toolbar
        settings={settings}
        onSettingsChange={setSettings}
        onExplode={() => physicsRef.current?.explode()}
        onReset={() => physicsRef.current?.reset()}
        onTogglePicker={() => {
          setPickerMode((prev) => {
            if (!prev) {
              setSavePickerMode(false);
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
              x: x != null ? x - saved.element.rect.width / 2 : (stageRef.current?.clientWidth || 1000) / 2 - saved.element.rect.width / 2 + (Math.random() - 0.5) * 120,
              y: y != null ? y - saved.element.rect.height / 2 : window.scrollY + window.innerHeight / 2 - saved.element.rect.height / 2 + (Math.random() - 0.5) * 60,
            },
          };
          setDroppedElements((prev) => [...prev, el]);
        }}
        onClearSaved={onClearSaved}
        onRemoveSaved={onRemoveSaved}
        onSaveStashImageFiles={onSaveStashImageFiles}
        customPages={customPages}
        activeCustomId={activeCustomId}
        onSelectCustomPage={onSelectCustomPage}
        onResetAll={onResetAll}
      />
    </div>
  );
}
