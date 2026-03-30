import { snapshot, rebuild, type serializedNodeWithId } from "rrweb-snapshot";
import type { SceneDescription, SceneElement, SceneElementType } from "./types";

let snapshotCounter = 0;

// ─── Main snapshot function ───

export async function snapshotHtmlToScene(
  html: string, containerWidth: number = 1200, sceneName: string = "Custom Page", sourceUrl?: string
): Promise<SceneDescription> {
  // Try rrweb-snapshot approach: render in iframe, serialize, rebuild, walk
  const rrwebResult = await tryRrwebSnapshot(html, containerWidth, sceneName, sourceUrl);
  if (rrwebResult && rrwebResult.elements.length >= 3) {
    return rrwebResult;
  }

  // Fall back to structural HTML parser
  return parseHtmlStructure(html, containerWidth, sceneName);
}

// ─── rrweb-snapshot based capture ───

function injectBaseTag(html: string, sourceUrl?: string): string {
  if (!sourceUrl) return html;
  try {
    const url = new URL(sourceUrl);
    const base = `<base href="${url.origin}/">`;
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (m) => m + base);
    }
    return `<head>${base}</head>` + html;
  } catch { return html; }
}

function tryRrwebSnapshot(
  html: string, containerWidth: number, sceneName: string, sourceUrl?: string
): Promise<SceneDescription | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${containerWidth}px;height:4000px;border:none;visibility:hidden;pointer-events:none;`;
    // allow-same-origin so we can access contentDocument
    // allow-scripts so JS-rendered pages can execute
    iframe.sandbox.add("allow-same-origin");
    iframe.sandbox.add("allow-scripts");
    iframe.srcdoc = injectBaseTag(html, sourceUrl);

    const timeout = setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
      resolve(null);
    }, 10000);

    iframe.onload = () => {
      // Wait for page to render (CSS loading, JS execution)
      const attempt = (retries: number) => {
        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc) { cleanup(); resolve(null); return; }

            // Use rrweb-snapshot to serialize the rendered DOM
            // This inlines all computed styles, resolves URLs, etc.
            const serialized = snapshot(iframeDoc, {
              inlineStylesheet: true,
              inlineImages: false,
              recordCanvas: false,
            });

            if (!serialized) {
              if (retries > 0) { attempt(retries - 1); return; }
              cleanup(); resolve(null); return;
            }

            // Rebuild the serialized DOM in a hidden container
            const container = document.createElement("div");
            container.style.cssText = `position:fixed;left:-10000px;top:0;width:${containerWidth}px;overflow:hidden;visibility:hidden;pointer-events:none;`;
            document.body.appendChild(container);

            // Create a wrapper document context for rebuild
            const rebuildDoc = document;
            const node = rebuild(serialized as serializedNodeWithId, {
              doc: rebuildDoc,
              hackCss: true,
              cache: { stylesWithHoverClass: new Map() },
            });

            if (node) {
              container.appendChild(node);
            }

            // Give the rebuilt DOM a moment to layout
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                try {
                  const elements: SceneElement[] = [];
                  const containerRect = container.getBoundingClientRect();
                  walkElement(container, elements, containerRect, 0, window);

                  if (elements.length < 3 && retries > 0) {
                    document.body.removeChild(container);
                    attempt(retries - 1);
                    return;
                  }

                  const maxY = elements.reduce((m, el) => Math.max(m, el.rect.y + el.rect.height), 600);

                  // Try to get background color
                  let bgColor = "#ffffff";
                  const bodyEl = container.querySelector("body") || container.firstElementChild;
                  if (bodyEl instanceof HTMLElement) {
                    const cs = window.getComputedStyle(bodyEl);
                    const bg = parseColor(cs.backgroundColor);
                    if (bg) bgColor = bg;
                  }

                  document.body.removeChild(container);
                  cleanup();

                  resolve(elements.length >= 3 ? {
                    id: `snapshot-${Date.now()}`, name: sceneName,
                    width: containerWidth, height: Math.max(maxY + 100, 800),
                    backgroundColor: bgColor, elements,
                  } : null);
                } catch {
                  try { document.body.removeChild(container); } catch {}
                  cleanup();
                  resolve(null);
                }
              });
            });
          } catch {
            if (retries > 0) { attempt(retries - 1); return; }
            cleanup(); resolve(null);
          }
        }, 1200);
      };

      attempt(2);
    };

    iframe.onerror = () => { cleanup(); resolve(null); };

    function cleanup() {
      clearTimeout(timeout);
      try { document.body.removeChild(iframe); } catch {}
    }

    document.body.appendChild(iframe);
  });
}

// ─── DOM walker (shared by rrweb rebuild and iframe approaches) ───

const TAG_TYPE_MAP: Record<string, SceneElementType> = {
  H1: "heading", H2: "heading", H3: "heading", H4: "heading", H5: "heading", H6: "heading",
  P: "paragraph", SPAN: "paragraph", BLOCKQUOTE: "paragraph", LI: "paragraph",
  BUTTON: "button", A: "link", IMG: "image",
  INPUT: "input", TEXTAREA: "input", SELECT: "input",
  HR: "divider", UL: "list", OL: "list",
  NAV: "container", HEADER: "container", FOOTER: "container",
  MAIN: "container", SECTION: "container", ARTICLE: "container",
  ASIDE: "container", DIV: "container", FORM: "container",
};

function inferElementType(el: HTMLElement, cs: CSSStyleDeclaration): SceneElementType {
  const tag = el.tagName;
  if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE") {
    const text = el.textContent?.trim() ?? "";
    const bg = cs.backgroundColor;
    const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
    const hasBoxShadow = cs.boxShadow && cs.boxShadow !== "none";
    const hasBorder = cs.borderWidth && parseFloat(cs.borderWidth) > 0;
    const isSmall = el.offsetWidth < 300 && el.offsetHeight < 200;
    if (isSmall && text.length < 50 && text.length > 0 && (hasBg || hasBoxShadow || hasBorder)) return "badge";
    if ((hasBg || hasBoxShadow || hasBorder) && el.children.length <= 6) return "card";
  }
  if (tag === "A") {
    if (cs.display === "inline-block" || cs.display === "flex" || cs.display === "inline-flex") return "button";
    return "link";
  }
  return TAG_TYPE_MAP[tag] ?? "container";
}

function parseColor(raw: string): string {
  if (!raw || raw === "transparent" || raw === "rgba(0, 0, 0, 0)") return "";
  return raw;
}
function parsePx(raw: string): number { return parseFloat(raw) || 0; }
function getDirectTextContent(el: HTMLElement): string {
  let text = "";
  for (const node of el.childNodes) { if (node.nodeType === Node.TEXT_NODE) text += node.textContent; }
  return text.trim();
}

function walkElement(el: HTMLElement, out: SceneElement[], rootRect: DOMRect, depth: number, win: Window) {
  if (depth > 14) return;
  const children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
  for (const child of children) {
    const tag = child.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "SVG" || tag === "LINK" || tag === "META" || tag === "HEAD" || tag === "TEMPLATE") continue;
    const cs = win.getComputedStyle(child);
    if (cs.display === "none" || cs.visibility === "hidden" || parsePx(cs.opacity) === 0) continue;
    const rect = child.getBoundingClientRect();
    const x = rect.left - rootRect.left, y = rect.top - rootRect.top, w = rect.width, h = rect.height;
    if (w < 1 || h < 1) { walkElement(child, out, rootRect, depth + 1, win); continue; }
    if (x + w < -100 || y + h < -100 || x > rootRect.width + 100) continue;
    const type = inferElementType(child, cs);
    const id = `snap-${snapshotCounter++}`;
    if (type === "container" && child.children.length > 0) {
      const bg = parseColor(cs.backgroundColor);
      const hasBorder = parsePx(cs.borderWidth) > 0;
      const hasBoxShadow = cs.boxShadow && cs.boxShadow !== "none";
      if (bg || hasBorder || hasBoxShadow) {
        out.push({ id, type: "card", rect: { x, y, width: w, height: h }, throwable: false, pinned: true, backgroundColor: bg || undefined, borderRadius: parsePx(cs.borderRadius), border: hasBorder ? cs.border : undefined, boxShadow: hasBoxShadow ? cs.boxShadow : undefined, padding: parsePx(cs.padding) });
      }
      walkElement(child, out, rootRect, depth + 1, win); continue;
    }
    if (type === "list") { walkElement(child, out, rootRect, depth + 1, win); continue; }
    const directText = getDirectTextContent(child);
    const fullText = (child.textContent ?? "").trim();
    const displayText = directText || (child.children.length === 0 ? fullText : "");
    if (!displayText && type !== "image" && type !== "input") {
      if (child.children.length > 0) walkElement(child, out, rootRect, depth + 1, win);
      continue;
    }
    const fontSize = parsePx(cs.fontSize) || 16;
    const fontWeight = parseInt(cs.fontWeight) || 400;
    const fontFamily = cs.fontFamily || "sans-serif";
    const lineHeight = parsePx(cs.lineHeight) || fontSize * 1.5;
    const element: SceneElement = { id, type, rect: { x, y, width: w, height: h }, throwable: false, pinned: true, text: displayText || undefined, fontSize, fontWeight, fontFamily, lineHeight: Math.round(lineHeight), color: parseColor(cs.color) || "#333", backgroundColor: parseColor(cs.backgroundColor) || undefined, borderRadius: parsePx(cs.borderRadius), padding: parsePx(cs.padding), border: parsePx(cs.borderWidth) > 0 ? cs.border : undefined, boxShadow: cs.boxShadow !== "none" ? cs.boxShadow : undefined, mass: 1 };
    if (type === "image" || tag === "IMG") { element.type = "image"; element.imageSrc = (child as HTMLImageElement).src; element.imageAlt = (child as HTMLImageElement).alt; }
    out.push(element);
    if (type === "card" && child.children.length > 0) {
      const childElements: SceneElement[] = [];
      walkElement(child, childElements, rootRect, depth + 1, win);
      element.children = childElements.map((ce) => ({ ...ce, rect: { ...ce.rect, x: ce.rect.x - x, y: ce.rect.y - y } }));
    }
  }
}

// ─── Structure-based fallback parser ───

function parseHtmlStructure(html: string, containerWidth: number, sceneName: string): SceneDescription {
  const SANS = '"DM Sans", "Helvetica Neue", sans-serif';
  const SERIF = '"Source Serif 4", Georgia, serif';
  const mx = 40;
  const contentW = Math.min(containerWidth - 80, 800);
  const elements: SceneElement[] = [];
  let y = 32;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const title = doc.title?.trim() || sceneName;
  elements.push({ id: `sp-${snapshotCounter++}`, type: "heading", rect: { x: mx, y, width: contentW, height: 44 }, throwable: false, pinned: true, text: title, fontSize: 30, fontWeight: 700, fontFamily: SANS, lineHeight: 38, color: "#1a1a1a" });
  y += 52;

  const descMeta = doc.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (descMeta?.content) {
    elements.push({ id: `sp-${snapshotCounter++}`, type: "paragraph", rect: { x: mx, y, width: contentW, height: 60 }, throwable: false, pinned: true, text: descMeta.content.trim(), fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#666" });
    y += 70;
  }

  const body = doc.body;
  if (body) {
    const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "LINK", "META", "HEAD", "NAV", "FOOTER", "ASIDE", "TEMPLATE", "IFRAME"]);

    function walk(el: Element) {
      if (y > 5000) return;
      for (const child of Array.from(el.children)) {
        if (y > 5000) return;
        const tag = child.tagName;
        if (skipTags.has(tag)) continue;
        const cls = (child.className || "").toString().toLowerCase();
        const cid = (child.id || "").toLowerCase();
        if (cls.includes("hidden") || cls.includes("modal") || cls.includes("popup") || cls.includes("cookie") || cid.includes("hidden") || cid.includes("modal")) continue;

        if (tag === "HR") { elements.push({ id: `sp-${snapshotCounter++}`, type: "divider", rect: { x: mx, y, width: contentW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" }); y += 16; continue; }
        if (tag === "IMG") { elements.push({ id: `sp-${snapshotCounter++}`, type: "image", rect: { x: mx, y, width: Math.min(contentW, 400), height: 200 }, throwable: true, pinned: false, backgroundColor: "#e8e5e0", borderRadius: 8, imageAlt: (child as HTMLImageElement).alt, imageSrc: (child as HTMLImageElement).src, mass: 2 }); y += 216; continue; }
        if (/^H[1-6]$/.test(tag)) {
          const text = (child.textContent || "").trim();
          if (!text || text.length > 500) { walk(child); continue; }
          const level = parseInt(tag[1]);
          const fs = [0, 28, 24, 20, 17, 15, 14][level];
          const lh = [0, 34, 30, 26, 24, 22, 20][level];
          const h = Math.min(Math.ceil(text.length / Math.floor(contentW / (fs * 0.55))) * lh + 8, 120);
          elements.push({ id: `sp-${snapshotCounter++}`, type: "heading", rect: { x: mx, y, width: contentW, height: h }, throwable: false, pinned: true, text, fontSize: fs, fontWeight: 700, fontFamily: level <= 2 ? SERIF : SANS, lineHeight: lh, color: "#1a1a1a" });
          y += h + 12; continue;
        }
        if (tag === "P" || tag === "BLOCKQUOTE" || tag === "FIGCAPTION") {
          const text = (child.textContent || "").trim();
          if (!text || text.length < 3 || text.length > 5000) { walk(child); continue; }
          const cpl = Math.floor(contentW / 9);
          const h = Math.min(Math.ceil(text.length / cpl) * 24 + 8, 600);
          elements.push({ id: `sp-${snapshotCounter++}`, type: "paragraph", rect: { x: mx, y, width: contentW, height: h }, throwable: false, pinned: true, text, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" });
          y += h + 14; continue;
        }
        if (tag === "LI") {
          const text = (child.textContent || "").trim();
          if (!text || text.length < 3 || text.length > 1000) continue;
          const h = Math.min(Math.ceil(text.length / Math.floor((contentW - 16) / 9)) * 22 + 4, 200);
          elements.push({ id: `sp-${snapshotCounter++}`, type: "paragraph", rect: { x: mx + 16, y, width: contentW - 16, height: h }, throwable: false, pinned: true, text: "\u2022 " + text, fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#444" });
          y += h + 6; continue;
        }
        walk(child);
      }
    }
    walk(body);
  }

  return { id: `snapshot-${Date.now()}`, name: sceneName, width: containerWidth, height: Math.max(y + 100, 800), backgroundColor: "#ffffff", elements };
}

// ─── URL fetching ───

export async function fetchPageHtml(url: string): Promise<{ html: string; url: string }> {
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }
  try {
    const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(normalizedUrl)}`, { signal: AbortSignal.timeout(18000) });
    if (res.ok) {
      const text = await res.text();
      if (text.length > 100 && !text.startsWith('{"error')) return { html: text, url: normalizedUrl };
    }
  } catch { /* try fallback */ }
  try {
    const res = await fetch(normalizedUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return { html: await res.text(), url: normalizedUrl };
  } catch { /* fall through */ }
  throw new Error(`Could not fetch ${normalizedUrl}. Try pasting HTML directly instead.`);
}

export function autoSelectThrowables(scene: SceneDescription): SceneDescription {
  const throwableTypes: SceneElementType[] = ["button", "badge", "card", "image", "link"];
  return { ...scene, elements: scene.elements.map((el) => throwableTypes.includes(el.type) && el.rect.width < 500 && el.rect.height < 400 ? { ...el, throwable: true, pinned: false } : el) };
}
