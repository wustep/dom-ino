import { useState, useCallback, memo } from "react";
import type { SceneElement, SavedElement } from "../scene/types";

interface ThrowablePickerProps {
  elements: SceneElement[];
  savedElements: SavedElement[];
  onToggle: (id: string) => void;
  onSave: (el: SceneElement) => void;
  onUnsave: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const PILL_FONT: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontWeight: 600,
  letterSpacing: "0.01em",
};

const CONTROL_HALO = 18;
const OUTLINE_INSET = CONTROL_HALO - 2;

export const ThrowablePicker = memo(function ThrowablePicker({
  elements, savedElements, onToggle, onSave, onUnsave, onDelete, onClose,
}: ThrowablePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const pickable = elements.filter(
    (el) => el.type !== "divider" && !(el.type === "paragraph" && !el.throwable) && !(el.type === "heading" && !el.throwable)
  );

  const savedIds = new Set(savedElements.map((s) => s.element.id));

  const handleSave = useCallback((el: SceneElement) => {
    onSave(el);
    setFlashId(el.id);
    setTimeout(() => setFlashId(null), 800);
  }, [onSave]);

  const isWide = (el: SceneElement) => el.rect.width >= 80;

  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.15)", zIndex: 200 }} />

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 210,
        padding: "7px 16px",
        backgroundColor: "rgba(59,130,246,0.95)",
        color: "#fff", fontSize: 12,
        ...PILL_FONT,
        fontWeight: 500,
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <span style={{ opacity: 0.9 }}>Toggle physics or save components to stash</span>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 6, color: "#fff", padding: "3px 14px", fontSize: 12,
          cursor: "pointer", ...PILL_FONT,
        }}>Done</button>
      </div>

      {pickable.map((el) => {
        const isHovered = hoveredId === el.id;
        const isSaved = savedIds.has(el.id);
        const isFlash = flashId === el.id;
        const wide = isWide(el);

        return (
          <div
            key={`pick-${el.id}`}
            onMouseEnter={() => setHoveredId(el.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "absolute",
              left: el.rect.x - CONTROL_HALO,
              top: el.rect.y - CONTROL_HALO,
              width: el.rect.width + CONTROL_HALO * 2,
              height: el.rect.height + CONTROL_HALO * 2,
              zIndex: 205,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: OUTLINE_INSET,
                top: OUTLINE_INSET,
                width: el.rect.width + 4,
                height: el.rect.height + 4,
                borderRadius: (el.borderRadius ?? 0) + 2,
                border: el.throwable
                  ? "2px solid rgba(59,130,246,0.7)"
                  : isHovered ? "2px dashed rgba(59,130,246,0.4)" : "2px dashed rgba(150,150,150,0.2)",
                backgroundColor: el.throwable
                  ? "rgba(59,130,246,0.06)"
                  : isHovered ? "rgba(59,130,246,0.03)" : "transparent",
                transition: "border-color 0.15s, background-color 0.15s",
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            />

            {/* Physics pill (top-right) — clickable to toggle */}
            <div
              onClick={(e) => { e.stopPropagation(); onToggle(el.id); }}
              style={{
                position: "absolute", top: CONTROL_HALO - 8, right: CONTROL_HALO - 8,
                height: 18, borderRadius: 9,
                padding: wide ? "0 7px" : "0 4px",
                minWidth: 18,
                backgroundColor: el.throwable ? "#3b82f6" : "#aaa",
                border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 3,
                fontSize: 9, color: "#fff",
                ...PILL_FONT,
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                cursor: "pointer",
                transition: "background-color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {el.throwable ? "\u2713" : ""}
              {wide && (el.throwable ? " Physics" : "")}
            </div>

            {/* Save/Saved pill (top-left) — always visible if saved, hover if not */}
            {isSaved ? (
              <div
                onClick={(e) => { e.stopPropagation(); onUnsave(el.id); }}
                style={{
                  position: "absolute", top: CONTROL_HALO - 8, left: CONTROL_HALO - 8,
                  height: 18, borderRadius: 9,
                  padding: wide ? "0 7px" : "0 4px",
                  minWidth: 18,
                  backgroundColor: "#16a34a",
                  border: "2px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 3,
                  fontSize: 9, color: "#fff",
                  ...PILL_FONT,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  animation: isFlash ? "savedFlash 0.3s ease" : undefined,
                }}
              >
                {"\u2713"}{wide && " Saved"}
              </div>
            ) : isHovered ? (
              <div
                onClick={(e) => { e.stopPropagation(); handleSave(el); }}
                style={{
                  position: "absolute", top: CONTROL_HALO - 8, left: CONTROL_HALO - 8,
                  height: 18, borderRadius: 9,
                  padding: "0 7px",
                  backgroundColor: "#7c3aed",
                  border: "2px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#fff",
                  ...PILL_FONT,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Save
              </div>
            ) : null}

            {/* Delete button (bottom-right) — shows on hover */}
            {isHovered && (
              <div
                onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
                style={{
                  position: "absolute", bottom: CONTROL_HALO - 8, right: CONTROL_HALO - 8,
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: "#dc2626",
                  border: "2px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff",
                  ...PILL_FONT,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                }}
                title="Remove element"
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" /></svg>
              </div>
            )}
          </div>
        );
      })}

      <style>{`@keyframes savedFlash { 0% { transform: scale(1.2); } 100% { transform: scale(1); } }`}</style>
    </>
  );
});
