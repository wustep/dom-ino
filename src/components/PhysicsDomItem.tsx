import { memo } from "react";
import type { SceneElement } from "../scene/types";

interface PhysicsDomItemProps {
  element: SceneElement;
  x: number;
  y: number;
  angle: number;
  isPhysicsEnabled: boolean;
  showDebug: boolean;
  isPinned: boolean;
}

function getBackgroundStyle(background?: string): React.CSSProperties {
  if (!background) return {};
  return background.includes("gradient")
    ? { background }
    : { backgroundColor: background };
}

export const PhysicsDomItem = memo(function PhysicsDomItem({
  element, x, y, angle, isPhysicsEnabled, showDebug, isPinned,
}: PhysicsDomItemProps) {
  const isThrowable = element.throwable;
  const live = isPhysicsEnabled && isThrowable;
  const px = live ? x : element.rect.x;
  const py = live ? y : element.rect.y;
  const pa = live ? angle : 0;

  const wrapStyle: React.CSSProperties = {
    position: "absolute", left: px, top: py,
    width: element.rect.width, height: element.rect.height,
    transform: pa !== 0 ? `rotate(${pa}rad)` : undefined,
    transformOrigin: "center center",
    zIndex: isThrowable ? 10 : 1,
    pointerEvents: "none", userSelect: "none",
    transition: live ? undefined : "left 0.35s ease, top 0.35s ease, transform 0.35s ease",
    borderRadius: element.borderRadius ?? 0,
    opacity: element.opacity,
  };

  const renderInner = () => {
    switch (element.type) {
      case "card":
        return (
          <div style={{
            width: "100%", height: "100%",
            ...getBackgroundStyle(element.backgroundColor ?? "#fff"),
            borderRadius: element.borderRadius ?? 8,
            padding: element.padding ?? 16,
            border: element.border ?? "1px solid #e5e5e5",
            boxShadow: element.boxShadow ?? "0 1px 4px rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column",
            overflow: "hidden", boxSizing: "border-box",
            position: "relative",
            color: element.color ?? "#1a1a1a", fontFamily: element.fontFamily,
            textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined,
          }}>
            {element.text && (
              <div style={{ fontSize: element.fontSize ?? 16, fontWeight: element.fontWeight ?? 600, fontStyle: element.fontStyle ?? "normal", fontFamily: element.fontFamily, color: element.color ?? "#1a1a1a", lineHeight: "1.3", letterSpacing: element.letterSpacing, textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined }}>
                {element.text}
              </div>
            )}
            {element.children?.map((child) => (
              <div key={child.id} style={{ marginTop: child.rect.y > 0 ? child.rect.y : 8, fontSize: child.fontSize ?? 13, fontWeight: child.fontWeight ?? 400, fontStyle: child.fontStyle ?? "normal", fontFamily: child.fontFamily, color: child.color ?? "#777", lineHeight: child.lineHeight ? `${child.lineHeight}px` : "1.5", letterSpacing: child.letterSpacing, textAlign: child.textAlign as React.CSSProperties["textAlign"] | undefined, opacity: child.opacity }}>
                {child.text}
              </div>
            ))}
          </div>
        );
      case "button": case "link":
        return (
          <div style={{ width: "100%", height: "100%", ...getBackgroundStyle(element.backgroundColor ?? "#1a1a1a"), borderRadius: element.borderRadius ?? 6, border: element.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: element.fontSize ?? 14, fontWeight: element.fontWeight ?? 500, fontStyle: element.fontStyle ?? "normal", fontFamily: element.fontFamily, color: element.color ?? "#fff", letterSpacing: element.letterSpacing, textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined, boxShadow: element.boxShadow, boxSizing: "border-box" }}>
            {element.text}
          </div>
        );
      case "badge": {
        const bg = element.backgroundColor ?? "#333";
        return (
          <div style={{ width: "100%", height: "100%", ...getBackgroundStyle(bg), borderRadius: element.borderRadius ?? 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: element.fontSize ?? 11, fontWeight: element.fontWeight ?? 700, fontStyle: element.fontStyle ?? "normal", fontFamily: element.fontFamily, color: element.color ?? "#fff", letterSpacing: element.letterSpacing ?? "0.05em", textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined, boxShadow: element.boxShadow }}>
            {element.text}
          </div>
        );
      }
      case "image":
        return (
          <div style={{ width: "100%", height: "100%", ...getBackgroundStyle(element.backgroundColor ?? "#e5e5e5"), borderRadius: element.borderRadius ?? 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: element.boxShadow }}>
            {element.imageSrc ? (
              <img src={element.imageSrc} alt={element.imageAlt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
            ) : (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.25 }}>
                <rect x="6" y="10" width="36" height="28" rx="3" stroke="#888" strokeWidth="2" fill="none" />
                <circle cx="16" cy="20" r="4" fill="#888" />
                <path d="M6 32L18 22L26 28L34 18L42 26V35C42 36.66 40.66 38 39 38H9C7.34 38 6 36.66 6 35Z" fill="#888" opacity="0.35" />
              </svg>
            )}
          </div>
        );
      case "input":
        return (<div style={{ width: "100%", height: "100%", ...getBackgroundStyle(element.backgroundColor ?? "#fff"), borderRadius: element.borderRadius ?? 6, border: element.border ?? "1px solid #ddd", display: "flex", alignItems: "center", padding: element.padding ?? 8, fontSize: element.fontSize ?? 14, fontStyle: element.fontStyle ?? "normal", fontFamily: element.fontFamily, color: element.color ?? "#999", letterSpacing: element.letterSpacing, textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined, boxSizing: "border-box" }}>{element.text ?? "Input..."}</div>);
      case "container":
        return (<div style={{ width: "100%", height: "100%", ...getBackgroundStyle(element.backgroundColor), borderRadius: element.borderRadius ?? 0, border: element.border, boxShadow: element.boxShadow, overflow: "hidden", boxSizing: "border-box" }} />);
      case "divider":
        return (<div style={{ width: "100%", height: "100%", backgroundColor: element.backgroundColor ?? "#e5e5e5" }} />);
      default:
        return (<div style={{ width: "100%", height: "100%", ...getBackgroundStyle(element.backgroundColor ?? "rgba(200,200,200,0.3)"), borderRadius: element.borderRadius ?? 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: element.fontSize ?? 12, fontStyle: element.fontStyle ?? "normal", fontFamily: element.fontFamily, color: element.color ?? "#888", letterSpacing: element.letterSpacing, textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined, boxSizing: "border-box", border: element.border }}>{element.text}</div>);
    }
  };

  return (
    <>
      <div style={wrapStyle}>{renderInner()}</div>
      {showDebug && isThrowable && (
        <div style={{
          position: "absolute", left: px - 1, top: py - 1,
          width: element.rect.width + 2, height: element.rect.height + 2,
          transform: pa !== 0 ? `rotate(${pa}rad)` : undefined,
          transformOrigin: "center center",
          border: "2px dashed rgba(231,76,60,0.45)", backgroundColor: "rgba(231,76,60,0.04)",
          pointerEvents: "none", zIndex: 100, boxSizing: "border-box",
          borderRadius: element.borderRadius ?? 0,
        }} />
      )}
    </>
  );
});
