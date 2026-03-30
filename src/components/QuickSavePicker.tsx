import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { SceneElement } from "../scene/types";

export interface SavePickerCandidate {
  id: string;
  element: SceneElement;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  saved: boolean;
}

interface QuickSavePickerProps {
  candidates: SavePickerCandidate[];
  onSave: (el: SceneElement) => void;
  onClose: () => void;
}

interface FlyBadge {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  label: string;
}

const HOVER_HALO = 18;
const OUTLINE_INSET = HOVER_HALO - 2;
const FLY_MS = 520;

function getCandidateLabel(candidate: SavePickerCandidate): string {
  const text = candidate.element.text?.trim();
  if (text) return text.slice(0, 20);
  return candidate.element.type;
}

export const QuickSavePicker = memo(function QuickSavePicker({
  candidates,
  onSave,
  onClose,
}: QuickSavePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flyBadges, setFlyBadges] = useState<FlyBadge[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  const handleSave = useCallback((candidate: SavePickerCandidate, target: HTMLDivElement) => {
    if (candidate.saved) return;
    onSave(candidate.element);

    const from = target.getBoundingClientRect();
    const stashTrigger = document.querySelector("[data-domino-stash-trigger='true']") as HTMLElement | null;
    const to = stashTrigger?.getBoundingClientRect();
    if (!to) return;

    const flyId = `${candidate.id}-${Date.now()}`;
    const nextBadge: FlyBadge = {
      id: flyId,
      left: from.left,
      top: from.top,
      width: Math.min(Math.max(from.width, 56), 160),
      height: Math.min(Math.max(from.height, 24), 56),
      dx: to.left + to.width / 2 - (from.left + from.width / 2),
      dy: to.top + to.height / 2 - (from.top + from.height / 2),
      label: getCandidateLabel(candidate),
    };
    setFlyBadges((prev) => [...prev, nextBadge]);
    const timeoutId = window.setTimeout(() => {
      setFlyBadges((prev) => prev.filter((badge) => badge.id !== flyId));
      timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timeoutId);
    }, FLY_MS + 80);
    timeoutsRef.current.push(timeoutId);
  }, [onSave]);

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.08)", zIndex: 180, pointerEvents: "none" }} />

      <div style={{
        position: "fixed",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 220,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(18, 18, 24, 0.88)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f3f0ff",
        backdropFilter: "blur(14px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
        fontFamily: '"DM Sans", sans-serif',
      }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "rgba(124, 58, 237, 0.18)",
          color: "#c4b5fd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <EyedropperIcon />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>Stash picker</div>
          <div style={{ fontSize: 11, color: "rgba(243,240,255,0.72)" }}>Click any component to save it. Press Esc when you’re done.</div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif',
            padding: "5px 10px",
            borderRadius: 999,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>

      {candidates.map((candidate) => {
        const hovered = hoveredId === candidate.id;
        const saved = candidate.saved;
        return (
          <div
            key={candidate.id}
            onMouseEnter={() => setHoveredId(candidate.id)}
            onMouseLeave={() => setHoveredId((current) => (current === candidate.id ? null : current))}
            onClick={(event) => handleSave(candidate, event.currentTarget)}
            style={{
              position: "absolute",
              left: candidate.x - HOVER_HALO,
              top: candidate.y - HOVER_HALO,
              width: candidate.width + HOVER_HALO * 2,
              height: candidate.height + HOVER_HALO * 2,
              zIndex: 205,
              cursor: saved ? "default" : "crosshair",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: OUTLINE_INSET,
                top: OUTLINE_INSET,
                width: candidate.width + 4,
                height: candidate.height + 4,
                borderRadius: (candidate.borderRadius ?? 0) + 2,
                border: saved
                  ? "2px solid rgba(34, 197, 94, 0.72)"
                  : hovered
                    ? "2px solid rgba(124, 58, 237, 0.8)"
                    : "2px dashed rgba(124, 58, 237, 0.28)",
                background: saved
                  ? "rgba(34, 197, 94, 0.08)"
                  : hovered
                    ? "rgba(124, 58, 237, 0.10)"
                    : "rgba(124, 58, 237, 0.03)",
                boxSizing: "border-box",
                pointerEvents: "none",
                transition: "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
                boxShadow: hovered && !saved ? "0 10px 26px rgba(124, 58, 237, 0.14)" : undefined,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: HOVER_HALO - 8,
                top: HOVER_HALO - 10,
                height: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "0 9px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: saved ? "rgba(22, 163, 74, 0.95)" : "rgba(124, 58, 237, 0.96)",
                color: "#fff",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.02em",
                boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
                pointerEvents: "none",
                opacity: hovered || saved ? 1 : 0.92,
                transform: hovered ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 120ms ease, opacity 120ms ease",
                whiteSpace: "nowrap",
              }}
            >
              {saved ? <CheckIcon /> : <EyedropperIcon />}
              {saved ? "Saved" : "Save to stash"}
            </div>
          </div>
        );
      })}

      {flyBadges.map((badge) => (
        <div
          key={badge.id}
          style={{
            position: "fixed",
            left: badge.left,
            top: badge.top,
            width: badge.width,
            height: badge.height,
            zIndex: 230,
            pointerEvents: "none",
            borderRadius: Math.min(badge.height / 2, 16),
            border: "1px solid rgba(255,255,255,0.16)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.96), rgba(168,85,247,0.9))",
            boxShadow: "0 16px 36px rgba(76,29,149,0.28)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 12px",
            boxSizing: "border-box",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            animation: "stashFly 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            ["--dx" as string]: `${badge.dx}px`,
            ["--dy" as string]: `${badge.dy}px`,
          }}
        >
          {badge.label}
        </div>
      ))}

      <style>{`
        @keyframes stashFly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.96;
          }
          72% {
            opacity: 0.84;
          }
          100% {
            transform: translate(var(--dx), var(--dy)) scale(0.16);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
});

function EyedropperIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.5L13.5 5.5" />
      <path d="M6.5 12.5L12.5 6.5C13.1 5.9 13.1 4.9 12.5 4.3L11.7 3.5C11.1 2.9 10.1 2.9 9.5 3.5L3.5 9.5" />
      <path d="M2.5 13.5L6 10" />
      <path d="M2.5 13.5H5.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.3L4.9 8.7L9.5 3.9" />
    </svg>
  );
}
