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

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return targetDocument.createTextNode("");
  }

  const sourceEl = node as Element;

  // Preserve SVG and other non-HTML element subtrees instead of dropping them.
  if (sourceEl.namespaceURI && sourceEl.namespaceURI !== "http://www.w3.org/1999/xhtml") {
    const cloneEl = targetDocument.createElementNS(sourceEl.namespaceURI, sourceEl.tagName);
    for (const attr of Array.from(sourceEl.attributes)) {
      cloneEl.setAttribute(attr.name, attr.value);
    }
    const computed = sourceWindow.getComputedStyle(sourceEl);
    const styleText = Array.from(computed)
      .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
      .join("");
    cloneEl.setAttribute("style", styleText);
    for (const child of Array.from(sourceEl.childNodes)) {
      cloneEl.appendChild(cloneWithInlineStyles(child, sourceWindow, targetDocument));
    }
    return cloneEl;
  }

  const htmlNode = sourceEl as HTMLElement;
  const tagName = htmlNode.tagName.toLowerCase();
  const clone = targetDocument.createElement(tagName);
  const computed = sourceWindow.getComputedStyle(htmlNode);
  // Build an explicit inline style string from computed properties.
  // computed.cssText is unreliable/empty for getComputedStyle() on some elements.
  const styleText = Array.from(computed)
    .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
    .join("");
  clone.setAttribute("style", styleText);

  // Normalize a few properties for overlay rendering
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.pointerEvents = "none";

  if (tagName === "img") {
    const imageNode = htmlNode as HTMLImageElement;
    (clone as HTMLImageElement).src = imageNode.currentSrc || imageNode.src;
    (clone as HTMLImageElement).alt = imageNode.alt;
  }
  if (tagName === "input") {
    (clone as HTMLInputElement).value = (htmlNode as HTMLInputElement).value;
  }
  if (tagName === "textarea") {
    (clone as HTMLTextAreaElement).value = (htmlNode as HTMLTextAreaElement).value;
  }
  if (tagName === "canvas") {
    const dataUrl = (htmlNode as HTMLCanvasElement).toDataURL?.();
    if (dataUrl) {
      const img = targetDocument.createElement("img");
      img.src = dataUrl;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      return img;
    }
  }

  for (const child of Array.from(htmlNode.childNodes)) {
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
    if (clone.nodeType === Node.ELEMENT_NODE) {
      const cloneEl = clone as HTMLElement;
      cloneEl.style.width = "100%";
      cloneEl.style.height = "100%";
      cloneEl.style.overflow = "hidden";
    }
    mount.appendChild(clone);
  }, [sourceNode, sourceWindow]);

  return (
    <>
      <div
        role="button"
        aria-label={`Physics clone ${sourceNode.tagName.toLowerCase()}`}
        data-domino-physics-clone="true"
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          transform: angle !== 0 ? `rotate(${angle}rad)` : undefined,
          transformOrigin: "center center",
          zIndex: 20,
          // Let pointer events pass through to the parent Matter container,
          // matching the behavior used by preset PhysicsDomItem overlays.
          pointerEvents: "none",
          overflow: "hidden",
          cursor: "grab",
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
