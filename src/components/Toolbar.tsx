import { memo, useState, useCallback } from "react";
import type { PresetKey } from "../scene/presets";
import { PRESET_LIST } from "../scene/presets";
import type { SavedElement } from "../scene/types";
import type { CustomPage } from "../App";

export interface DebugSettings {
  physicsEnabled: boolean;
  showObstacleBounds: boolean;
  showLineBounds: boolean;
  gravityX: number;
  gravityY: number;
  paused: boolean;
  pretextEnabled: boolean;
  allowWordBreaks: boolean;
}

interface ToolbarProps {
  settings: DebugSettings;
  onSettingsChange: (s: DebugSettings) => void;
  onExplode: () => void;
  onReset: () => void;
  onTogglePicker: () => void;
  pickerMode: boolean;
  savePickerMode: boolean;
  onToggleSavePicker: () => void;
  fps: number;
  bodyCount: number;
  lineCount: number;
  currentPreset: PresetKey | "custom";
  onSelectPreset: (key: PresetKey) => void;
  onImportHtml: (html: string, name: string) => void;
  onFetchUrl: (url: string) => Promise<void>;
  savedElements: SavedElement[];
  onDropSaved: (saved: SavedElement, x?: number, y?: number) => void;
  onClearSaved: () => void;
  onRemoveSaved: (index: number) => void;
  customPages: CustomPage[];
  activeCustomId: string | null;
  onSelectCustomPage: (id: string) => void;
  onResetAll: () => void;
}

type FlyoutPanel = "pages" | "settings" | "stash" | null;

// Survives component remounts (scene key changes)
let _pendingPanel: FlyoutPanel = null;

export const Toolbar = memo(function Toolbar(props: ToolbarProps) {
  const {
    settings, onSettingsChange, onExplode, onReset,
    onTogglePicker, pickerMode, savePickerMode, onToggleSavePicker, fps, bodyCount, lineCount,
    currentPreset, onSelectPreset, onImportHtml, onFetchUrl,
    savedElements, onDropSaved, onClearSaved, onRemoveSaved,
    customPages, activeCustomId, onSelectCustomPage, onResetAll,
  } = props;

  const [openPanel, setOpenPanel] = useState<FlyoutPanel>(_pendingPanel);

  // Clear the pending panel after consuming it
  if (_pendingPanel) _pendingPanel = null;
  const [collapsed, setCollapsed] = useState(false);
  const [importTab, setImportTab] = useState<"url" | "html">("url");
  const [urlInput, setUrlInput] = useState("");
  const [htmlInput, setHtmlInput] = useState("");
  const [importName, setImportName] = useState("Custom Page");
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fetchError, setFetchError] = useState("");

  const update = useCallback(
    (partial: Partial<DebugSettings>) => onSettingsChange({ ...settings, ...partial }),
    [settings, onSettingsChange]
  );

  const toggle = (panel: FlyoutPanel) => setOpenPanel((p) => (p === panel ? null : panel));

  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    setFetchStatus("loading"); setFetchError("");
    try {
      await onFetchUrl(urlInput.trim());
      setFetchStatus("idle");
      setOpenPanel(null);
      setUrlInput("");
    } catch (e) {
      setFetchStatus("error");
      setFetchError(e instanceof Error ? e.message : "Could not fetch page.");
    }
  }, [urlInput, onFetchUrl]);

  const handlePasteImport = useCallback(() => {
    if (!htmlInput.trim()) return;
    onImportHtml(htmlInput, importName);
    setHtmlInput(""); setOpenPanel(null);
  }, [htmlInput, importName, onImportHtml]);

  if (collapsed) {
    return (
      <div
        style={{
          position: "fixed", bottom: 0, right: 0, zIndex: 9999,
          width: 80, height: 80,
        }}
      >
        <style>{`${toolbarTooltipCss}
          .domino-collapsed-trigger .domino-collapsed-btn { opacity: 0; transform: translateY(4px); transition: opacity 0.5s ease, transform 0.3s ease; }
          .domino-collapsed-trigger:hover .domino-collapsed-btn { opacity: 1; transform: translateY(0); }
        `}</style>
        <div className="domino-collapsed-trigger" style={{ width: "100%", height: "100%" }}>
          <div className="domino-toolbar-tooltip-wrap" style={{ position: "absolute", bottom: 16, right: 16 }}>
            <button className="domino-collapsed-btn" type="button" onClick={() => setCollapsed(false)} aria-label="Show toolbar" style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(20,20,24,0.85)", backdropFilter: "blur(12px)",
              color: "#888", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}><ChevronUpIcon /></button>
            <span className="domino-toolbar-tooltip">Show toolbar</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pages flyout */}
      {openPanel === "pages" && (
        <div style={{ ...flyoutBase, bottom: 56, right: 16, width: 340 }}>
          <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Pages</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {PRESET_LIST.map(({ key, label }) => (
                <button key={key} onClick={() => { onSelectPreset(key); setOpenPanel(null); }}
                  style={{ ...chipStyle, ...(currentPreset === key && !activeCustomId ? chipActiveStyle : {}) }}>{label}</button>
              ))}
              {customPages.map((cp) => (
                <button key={cp.id} onClick={() => { onSelectCustomPage(cp.id); setOpenPanel(null); }}
                  style={{ ...chipStyle, ...(activeCustomId === cp.id ? chipActiveStyle : {}), maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{cp.name}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: "8px 14px 6px" }}>
            <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
              {(["url", "html"] as const).map((tab) => (
                <button key={tab} onClick={() => setImportTab(tab)} style={{
                  flex: 1, padding: "5px 0", border: "none",
                  borderBottom: importTab === tab ? "2px solid #a78bfa" : "2px solid transparent",
                  backgroundColor: "transparent", color: importTab === tab ? "#fff" : "#666",
                  fontSize: 10, fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                  cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{tab === "url" ? "Fetch URL" : "Paste HTML"}</button>
              ))}
            </div>
            {importTab === "url" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="example.com"
                  onKeyDown={(e) => { if (e.key === "Enter") handleFetchUrl(); }}
                  style={{ ...inputStyle, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }} />
                {fetchStatus === "error" && <div style={{ fontSize: 10, color: "#f87171" }}>{fetchError || "Could not fetch."}</div>}
                <button onClick={handleFetchUrl} disabled={!urlInput.trim() || fetchStatus === "loading"}
                  style={{ ...primaryBtnStyle, opacity: urlInput.trim() ? 1 : 0.4, cursor: urlInput.trim() ? "pointer" : "not-allowed" }}>
                  {fetchStatus === "loading" ? "Fetching..." : "Fetch & Import"}</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={importName} onChange={(e) => setImportName(e.target.value)} placeholder="Name" style={{ ...inputStyle, fontSize: 11 }} />
                <textarea value={htmlInput} onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder={'<h1>Hello</h1>\n<p>Content</p>'}
                  style={{ ...inputStyle, height: 90, resize: "vertical", fontFamily: '"JetBrains Mono", monospace', fontSize: 10, lineHeight: 1.5 }} />
                <button onClick={handlePasteImport} disabled={!htmlInput.trim()}
                  style={{ ...primaryBtnStyle, opacity: htmlInput.trim() ? 1 : 0.4, cursor: htmlInput.trim() ? "pointer" : "not-allowed" }}>Import</button>
              </div>
            )}
          </div>
          <div style={{ height: 6 }} />
        </div>
      )}

      {/* Stash flyout — shows saved components for dropping */}
      {openPanel === "stash" && (
        <div style={{ ...flyoutBase, bottom: 56, right: 16, width: 300 }}>
          <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Saved Components</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  setOpenPanel(null);
                  onToggleSavePicker();
                }}
                style={{ ...tinyBtnStyle, color: savePickerMode ? "#c4b5fd" : "#a78bfa", borderColor: savePickerMode ? "rgba(196,181,253,0.35)" : undefined }}
              >
                {savePickerMode ? "Done picking" : "Pick from page"}
              </button>
              {savedElements.length > 0 && <button onClick={onClearSaved} style={{ ...tinyBtnStyle, color: "#f87171" }}>Clear</button>}
            </div>
          </div>
          <div style={{ padding: "6px 10px", maxHeight: 260, overflowY: "auto" }}>
            {savedElements.length === 0 ? (
              <div style={{ padding: "14px 4px", color: "#555", fontSize: 10, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.6 }}>
                Use `Pick from page` for a quick eyedropper-style save, or enter component mode when you also want to toggle physics and delete elements.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {savedElements.map((s, i) => (
                  <div key={i}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/domino-saved", JSON.stringify(s));
                      e.dataTransfer.effectAllowed = "copy";
                      // Create a drag preview that looks like the actual component
                      const preview = document.createElement("div");
                      preview.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${Math.min(s.element.rect.width, 200)}px;height:${Math.min(s.element.rect.height, 100)}px;background:${s.element.backgroundColor || "#fff"};border-radius:${s.element.borderRadius ?? 6}px;border:${s.element.border || "1px solid #ddd"};box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;font-size:${Math.min(s.element.fontSize ?? 13, 14)}px;font-family:${s.element.fontFamily || "sans-serif"};color:${s.element.color || "#333"};padding:8px;box-sizing:border-box;overflow:hidden;`;
                      preview.textContent = s.element.text?.slice(0, 30) || s.element.type;
                      document.body.appendChild(preview);
                      e.dataTransfer.setDragImage(preview, preview.offsetWidth / 2, preview.offsetHeight / 2);
                      requestAnimationFrame(() => document.body.removeChild(preview));
                    }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 6px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", cursor: "grab" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0, backgroundColor: s.element.backgroundColor ?? "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: s.element.color ?? "#999", fontFamily: '"JetBrains Mono", monospace', overflow: "hidden" }}>
                        {s.element.type.slice(0, 3)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: "#ddd", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.element.text?.slice(0, 20) || s.element.type}</div>
                        <div style={{ fontSize: 8, color: "#666" }}>drag to page · {s.sourceScene}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      <button onClick={() => { _pendingPanel = "stash"; onDropSaved(s); }} style={{ ...tinyBtnStyle, color: "#a78bfa" }}>Drop</button>
                      <button onClick={() => onRemoveSaved(i)} style={{ ...tinyBtnStyle, color: "#666" }}>&times;</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ height: 4 }} />
        </div>
      )}

      {/* Settings flyout */}
      {openPanel === "settings" && (
        <div style={{ ...flyoutBase, bottom: 56, right: 16, width: 240 }}>
          <div style={{ padding: "8px 12px", display: "flex", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, color: "#888", fontFamily: '"JetBrains Mono", monospace' }}>
            <span><span style={{ color: fps > 50 ? "#4ade80" : fps > 30 ? "#fbbf24" : "#f87171" }}>{fps}</span> fps</span>
            <span>{bodyCount} bodies</span>
            <span>{lineCount} lines</span>
          </div>
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
            <Toggle label="Physics" checked={settings.physicsEnabled} onChange={(v) => update({ physicsEnabled: v })} />
            <Toggle label="Pretext reflow" checked={settings.pretextEnabled} onChange={(v) => update({ pretextEnabled: v })} />
            <Toggle label="Break words" checked={settings.allowWordBreaks} onChange={(v) => update({ allowWordBreaks: v })} />
            <Lbl text="Gravity" />
            <Slider label="X" value={settings.gravityX} min={-3} max={3} onValue={(v) => update({ gravityX: v })} onReset={() => update({ gravityX: 0 })} />
            <Slider label="Y" value={settings.gravityY} min={-3} max={3} onValue={(v) => update({ gravityY: v })} onReset={() => update({ gravityY: 0 })} />
            <Lbl text="Debug" />
            <Toggle label="Obstacles" checked={settings.showObstacleBounds} onChange={(v) => update({ showObstacleBounds: v })} />
            <Toggle label="Lines" checked={settings.showLineBounds} onChange={(v) => update({ showLineBounds: v })} />
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => { onResetAll(); setOpenPanel(null); }} style={{
                width: "100%", padding: "5px 0", borderRadius: 5,
                border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "transparent",
                color: "#f87171", fontSize: 9, fontWeight: 600,
                fontFamily: '"DM Sans", sans-serif', cursor: "pointer",
              }}>Reset all state</button>
            </div>
          </div>
          <div style={{ height: 3 }} />
        </div>
      )}

      {/* ─── Compact pill ─── */}
      <div style={{
        position: "fixed", bottom: 16, right: 16, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 1,
        height: 36, padding: "0 2px", borderRadius: 10,
        backgroundColor: "rgba(20,20,24,0.92)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}>
        <Btn active={openPanel === "pages"} onClick={() => toggle("pages")} tip="Pages"><PageIcon /></Btn>
        <Sep />
        <Btn onClick={() => update({ paused: !settings.paused })} tip={settings.paused ? "Resume physics" : "Pause physics"} accent={settings.paused ? "#fbbf24" : undefined}>
          {settings.paused ? <PlayIcon /> : <PauseIcon />}
        </Btn>
        <Btn onClick={onExplode} tip="Explode scene"><ExplodeIcon /></Btn>
        <Btn onClick={onReset} tip="Reset scene"><ResetIcon /></Btn>
        <Sep />
        {/* Components mode: combined picker + stash entry point */}
        <Btn active={pickerMode} onClick={onTogglePicker} tip={pickerMode ? "Exit component mode" : "Enter component mode"} accent={pickerMode ? "#3b82f6" : undefined}><PickerIcon /></Btn>
        <Btn active={openPanel === "stash" || savePickerMode} onClick={() => toggle("stash")} tip="Saved components" accent={savePickerMode ? "#c4b5fd" : savedElements.length > 0 ? "#a78bfa" : undefined} dataAttrs={{ "data-domino-stash-trigger": "true" }}>
          <StashIcon />
          {savedElements.length > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: "#a78bfa", marginLeft: -2 }}>{savedElements.length}</span>}
        </Btn>
        <Sep />
        <Btn active={openPanel === "settings"} onClick={() => toggle("settings")} tip="Settings"><SettingsIcon /></Btn>
        <Btn onClick={() => { setOpenPanel(null); setCollapsed(true); }} tip="Hide toolbar" compact><ChevronDownIcon /></Btn>
      </div>

      {openPanel && <div style={{ position: "fixed", inset: 0, zIndex: 9997 }} onPointerDown={() => setOpenPanel(null)} />}
      <style>{`${toolbarTooltipCss}
        @keyframes flyUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  );
});

// ─── Styles ───
const toolbarTooltipCss = `
  .domino-toolbar-tooltip-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .domino-toolbar-tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    transform: translate(-50%, 4px);
    opacity: 0;
    pointer-events: none;
    white-space: nowrap;
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(10,10,14,0.94);
    color: #f3f4f6;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    font-family: "DM Sans", sans-serif;
    font-size: 10px;
    line-height: 1;
    letter-spacing: 0.01em;
    transition: opacity 0.14s ease, transform 0.14s ease;
  }

  .domino-toolbar-tooltip-wrap:hover .domino-toolbar-tooltip,
  .domino-toolbar-tooltip-wrap:focus-within .domino-toolbar-tooltip {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

const flyoutBase: React.CSSProperties = { position: "fixed", zIndex: 9998, maxHeight: "calc(100vh - 80px)", overflowY: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(20,20,24,0.95)", backdropFilter: "blur(20px)", boxShadow: "0 12px 48px rgba(0,0,0,0.45)", fontFamily: '"DM Sans", sans-serif', color: "#ccc", animation: "flyUp 0.15s ease" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "#ddd", fontSize: 11, fontFamily: '"DM Sans", sans-serif', outline: "none", boxSizing: "border-box" };
const primaryBtnStyle: React.CSSProperties = { padding: "6px 0", borderRadius: 6, border: "none", backgroundColor: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', transition: "opacity 0.12s" };
const chipStyle: React.CSSProperties = { padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "transparent", color: "#999", fontSize: 11, fontWeight: 400, fontFamily: '"DM Sans", sans-serif', cursor: "pointer" };
const chipActiveStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600 };
const tinyBtnStyle: React.CSSProperties = { padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", fontSize: 9, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', cursor: "pointer", whiteSpace: "nowrap" as const };

// ─── Sub-components ───
function Sep() { return <div style={{ width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.06)", margin: "0 1px" }} />; }

function Btn({
  children,
  onClick,
  active,
  tip,
  accent,
  compact,
  dataAttrs,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  tip?: string;
  accent?: string;
  compact?: boolean;
  dataAttrs?: Record<string, string>;
}) {
  return (
    <div className="domino-toolbar-tooltip-wrap">
      <button {...dataAttrs} type="button" onClick={onClick} aria-label={tip} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, padding: compact ? "0 4px" : "0 7px", borderRadius: 7, border: "none", backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent", color: accent ?? (active ? "#fff" : "#777"), cursor: "pointer", transition: "all 0.12s", height: 30, minWidth: compact ? 24 : 30 }}>{children}</button>
      {tip ? <span className="domino-toolbar-tooltip">{tip}</span> : null}
    </div>
  );
}

function Lbl({ text }: { text: string }) { return <div style={{ fontSize: 8, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, marginBottom: -2 }}>{text}</div>; }

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}><span>{label}</span><div onClick={() => onChange(!checked)} style={{ width: 28, height: 16, borderRadius: 8, backgroundColor: checked ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", flexShrink: 0 }}><div style={{ position: "absolute", top: 2, left: checked ? 14 : 2, width: 12, height: 12, borderRadius: "50%", backgroundColor: checked ? "#4ade80" : "#555", transition: "left 0.2s" }} /></div></label>;
}

function Slider({ label, value, min, max, onValue, onReset }: { label: string; value: number; min: number; max: number; onValue: (v: number) => void; onReset: () => void }) {
  return <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 9, color: "#888" }}>{label}: {value.toFixed(1)}</span><button onClick={onReset} style={{ background: "none", border: "none", color: "#555", fontSize: 8, cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: '"JetBrains Mono", monospace' }}>0</button></div><input type="range" min={min} max={max} step="0.1" value={value} onChange={(e) => onValue(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#555", height: 4 }} /></div>;
}

// ─── Icons ───
function PageIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1.5" width="10" height="11" rx="1.5" /><line x1="4.5" y1="4.5" x2="9.5" y2="4.5" /><line x1="4.5" y1="7" x2="8" y2="7" /><line x1="4.5" y1="9.5" x2="7" y2="9.5" /></svg>; }
function PauseIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2.5" width="3" height="9" rx="1" /><rect x="8" y="2.5" width="3" height="9" rx="1" /></svg>; }
function PlayIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M4 2.5L11.5 7L4 11.5Z" /></svg>; }
function ExplodeIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="7" cy="7" r="2" /><line x1="7" y1="1" x2="7" y2="3.5" /><line x1="7" y1="10.5" x2="7" y2="13" /><line x1="1" y1="7" x2="3.5" y2="7" /><line x1="10.5" y1="7" x2="13" y2="7" /><line x1="2.8" y1="2.8" x2="4.5" y2="4.5" /><line x1="9.5" y1="9.5" x2="11.2" y2="11.2" /><line x1="11.2" y1="2.8" x2="9.5" y2="4.5" /><line x1="4.5" y1="9.5" x2="2.8" y2="11.2" /></svg>; }
function ResetIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7A5 5 0 1 1 4.3 11" /><polyline points="2,4 2,7 5,7" /></svg>; }
function PickerIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" /><rect x="8" y="1.5" width="4.5" height="4.5" rx="1" /><rect x="1.5" y="8" width="4.5" height="4.5" rx="1" /><circle cx="10.25" cy="10.25" r="2" /></svg>; }
function StashIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5L7 1.5L12 4.5L7 7.5Z" /><path d="M2 7L7 10L12 7" /><path d="M2 9.5L7 12.5L12 9.5" /></svg>; }
function SettingsIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>;
}
function ChevronDownIcon() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5,4.5 6,8 9.5,4.5" /></svg>; }
function ChevronUpIcon() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5,7.5 6,4 9.5,7.5" /></svg>; }
