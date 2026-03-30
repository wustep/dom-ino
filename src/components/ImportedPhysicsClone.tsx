import { useEffect, useRef } from "react";

interface ImportedPhysicsCloneProps {
  sourceNode: HTMLElement;
  sourceWindow: Window;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  showDebug: boolean;
}

function cloneWithInlineStyles(
  node: Node,
  sourceWindow: Window,
  targetDocument: Document
): Node {
  if (node.nodeType === Node.TEXT_NODE) {
    return targetDocument.createTextNode(node.textContent ?? "");
  }
  if (!(node instanceof sourceWindow.HTMLElement)) {
    return targetDocument.createTextNode("");
  }

  const clone = targetDocument.createElement(node.tagName.toLowerCase());
  const computed = sourceWindow.getComputedStyle(node);
  // cssText is supported in Chromium and gives a fast, accurate visual clone.
  clone.setAttribute("style", computed.cssText);

  // Normalize a few properties for overlay rendering
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.pointerEvents = "none";

  if (node instanceof sourceWindow.HTMLImageElement) {
    (clone as HTMLImageElement).src = node.currentSrc || node.src;
    (clone as HTMLImageElement).alt = node.alt;
  }

  for (const child of Array.from(node.childNodes)) {
    clone.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument));
  }
  return clone;
}

export function ImportedPhysicsClone({
  sourceNode,
  sourceWindow,
  x,
  y,
  angle,
  width,
  height,
  showDebug,
}: ImportedPhysicsCloneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.innerHTML = "";
    const clone = cloneWithInlineStyles(sourceNode, sourceWindow, mount.ownerDocument);
    if (clone instanceof HTMLElement) {
      clone.style.width = "100%";
      clone.style.height = "100%";
      clone.style.overflow = "hidden";
      mount.appendChild(clone);
    }
  }, [sourceNode, sourceWindow]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          transform: angle !== 0 ? `rotate(${angle}rad)` : undefined,
          transformOrigin: "center center",
          zIndex: 20,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      </div>
      {showDebug && (
        <div
          style={{
            position: "absolute",
            left: x - 1,
            top: y - 1,
            width: width + 2,
            height: height + 2,
            transform: angle !== 0 ? `rotate(${angle}rad)` : undefined,
            transformOrigin: "center center",
            border: "2px dashed rgba(231,76,60,0.45)",
            backgroundColor: "rgba(231,76,60,0.04)",
            pointerEvents: "none",
            zIndex: 100,
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
}
