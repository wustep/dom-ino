import { useState, useEffect, useMemo, useCallback } from "react";
import { DominoScene } from "./components/DominoScene";
import type { SceneDescription, SceneElement, SavedElement } from "./scene/types";
import type { PresetKey } from "./scene/presetScenes";
import { getPresetScene } from "./scene/presetScenes";
import { snapshotHtmlToScene, autoSelectThrowables, fetchPageHtml } from "./scene/domSnapshot";

export interface CustomPage {
  id: string;
  name: string;
  scene: SceneDescription;
}

export default function App() {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [currentPreset, setCurrentPreset] = useState<PresetKey | "custom">("article");
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [sceneKey, setSceneKey] = useState(0);
  const [savedElements, setSavedElements] = useState<SavedElement[]>([]);

  useEffect(() => {
    const h = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const dismiss = () => setShowHint(false);
    window.addEventListener("mousedown", dismiss, { once: true });
    const timer = setTimeout(dismiss, 8000);
    return () => { window.removeEventListener("mousedown", dismiss); clearTimeout(timer); };
  }, [showHint]);

  const scene = useMemo(() => {
    if (currentPreset === "custom" && activeCustomId) {
      const cp = customPages.find((p) => p.id === activeCustomId);
      if (cp) return { ...cp.scene, width: windowSize.width };
    }
    if (currentPreset !== "custom") {
      return getPresetScene(currentPreset, windowSize.width, windowSize.height);
    }
    return getPresetScene("article", windowSize.width, windowSize.height);
  }, [currentPreset, activeCustomId, customPages, windowSize.width, windowSize.height]);

  const handleSelectPreset = useCallback((key: PresetKey) => {
    setCurrentPreset(key);
    setActiveCustomId(null);
    setSceneKey((k) => k + 1);
    setShowHint(false);
  }, []);

  const handleSelectCustomPage = useCallback((id: string) => {
    setCurrentPreset("custom");
    setActiveCustomId(id);
    setSceneKey((k) => k + 1);
    setShowHint(false);
  }, []);

  const handleImportHtml = useCallback(async (html: string, name: string) => {
    const raw = await snapshotHtmlToScene(html, Math.min(windowSize.width - 40, 1100), name);
    const withThrowables = autoSelectThrowables(raw);
    const page: CustomPage = { id: `custom-${Date.now()}`, name, scene: withThrowables };
    setCustomPages((prev) => [...prev, page]);
    setActiveCustomId(page.id);
    setCurrentPreset("custom");
    setSceneKey((k) => k + 1);
    setShowHint(false);
  }, [windowSize.width]);

  const handleFetchUrl = useCallback(async (url: string) => {
    const html = await fetchPageHtml(url);
    let name = url.replace(/^https?:\/\//, "").split("/")[0];
    if (name.length > 25) name = name.slice(0, 25) + "...";
    await handleImportHtml(html, name);
  }, [handleImportHtml]);

  const handleSceneChange = useCallback((newScene: SceneDescription, remount = true) => {
    if (activeCustomId) {
      setCustomPages((prev) => prev.map((p) => p.id === activeCustomId ? { ...p, scene: newScene } : p));
    } else {
      const page: CustomPage = { id: `custom-${Date.now()}`, name: newScene.name || "Modified", scene: newScene };
      setCustomPages((prev) => [...prev, page]);
      setActiveCustomId(page.id);
      setCurrentPreset("custom");
    }
    if (remount) setSceneKey((k) => k + 1);
  }, [activeCustomId]);

  const handleSaveElement = useCallback((el: SceneElement) => {
    setSavedElements((prev) => {
      if (prev.some((s) => s.element.id === el.id && s.sourceScene === scene.name)) return prev;
      return [...prev, { element: { ...el }, savedAt: Date.now(), sourceScene: scene.name }];
    });
  }, [scene.name]);

  const handleUnsaveElement = useCallback((id: string) => {
    setSavedElements((prev) => prev.filter((s) => s.element.id !== id));
  }, []);

  const handleDropSaved = useCallback((saved: SavedElement, dropX?: number, dropY?: number) => {
    const el = { ...saved.element };
    el.id = `dropped-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    el.throwable = true; el.pinned = false;
    el.rect = {
      ...el.rect,
      x: dropX != null ? dropX - el.rect.width / 2 : (windowSize.width - el.rect.width) / 2 + (Math.random() - 0.5) * 120,
      y: dropY != null ? dropY - el.rect.height / 2 : window.scrollY + windowSize.height / 2 - el.rect.height / 2 + (Math.random() - 0.5) * 60,
    };
    const newScene = { ...scene, elements: [...scene.elements, el] };
    if (activeCustomId) {
      setCustomPages((prev) => prev.map((p) => p.id === activeCustomId ? { ...p, scene: newScene } : p));
    } else {
      const page: CustomPage = { id: `custom-${Date.now()}`, name: scene.name || "Modified", scene: newScene };
      setCustomPages((prev) => [...prev, page]);
      setActiveCustomId(page.id);
      setCurrentPreset("custom");
    }
    setSceneKey((k) => k + 1);
  }, [scene, activeCustomId, windowSize]);

  const handleClearSaved = useCallback(() => setSavedElements([]), []);
  const handleRemoveSaved = useCallback((index: number) => {
    setSavedElements((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <>
      <DominoScene
        key={sceneKey} scene={scene} onSceneChange={handleSceneChange}
        currentPreset={currentPreset} onSelectPreset={handleSelectPreset}
        onImportHtml={handleImportHtml} onFetchUrl={handleFetchUrl}
        savedElements={savedElements} onSaveElement={handleSaveElement}
        onUnsaveElement={handleUnsaveElement}
        onDropSaved={handleDropSaved} onClearSaved={handleClearSaved}
        onRemoveSaved={handleRemoveSaved}
        customPages={customPages} activeCustomId={activeCustomId}
        onSelectCustomPage={handleSelectCustomPage}
      />
      {showHint && <Hint />}
    </>
  );
}

function Hint() {
  return (
    <div style={{
      position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)",
      zIndex: 10000, padding: "10px 20px", borderRadius: 10,
      backgroundColor: "rgba(20,20,24,0.88)", backdropFilter: "blur(12px)",
      color: "#ddd", fontSize: 13, fontFamily: '"DM Sans", sans-serif',
      fontWeight: 500, boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      pointerEvents: "none", animation: "hintFade 0.5s ease both",
      display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 15, opacity: 0.6 }}>&#8597;</span>
      Grab any card, badge, or button and throw it
      <style>{`@keyframes hintFade { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
