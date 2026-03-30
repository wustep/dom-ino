import type { SceneDescription, SceneElement, SceneElementType } from "./types";

let snapshotCounter = 0;

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

/**
 * Resolve a potentially relative URL against a base origin.
 */
function resolveUrl(href: string, baseOrigin: string): string {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return href.startsWith("//") ? "https:" + href : href;
  }
  return baseOrigin + (href.startsWith("/") ? "" : "/") + href;
}

/**
 * Rewrite relative url() references inside CSS to absolute URLs.
 */
function rewriteCssUrls(css: string, cssBaseUrl: string): string {
  let origin: string;
  let basePath: string;
  try {
    const u = new URL(cssBaseUrl);
    origin = u.origin;
    basePath = u.pathname.replace(/\/[^/]*$/, "/");
  } catch { return css; }

  return css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, ref: string) => {
    if (ref.startsWith("data:") || ref.startsWith("http://") || ref.startsWith("https://") || ref.startsWith("//")) {
      return match;
    }
    const abs = ref.startsWith("/") ? origin + ref : origin + basePath + ref;
    return `url("${abs}")`;
  });
}

/**
 * Rewrite relative src/srcset/href attributes in HTML to absolute URLs.
 */
function rewriteHtmlUrls(html: string, origin: string): string {
  return html
    .replace(/(src|srcset|poster)=["'](?!data:|http:|https:|\/\/|#)([^"']+)["']/gi,
      (_, attr: string, ref: string) => `${attr}="${origin}${ref.startsWith("/") ? "" : "/"}${ref}"`)
    .replace(/(href)=["'](?!data:|http:|https:|\/\/|#|javascript:|mailto:)([^"']+)["']/gi,
      (_, attr: string, ref: string) => `${attr}="${origin}${ref.startsWith("/") ? "" : "/"}${ref}"`);
}

/**
 * Fetch external stylesheets via proxy, inline them with absolute URLs,
 * and rewrite HTML resource URLs to absolute.
 */
async function prepareHtmlForSnapshot(html: string, sourceUrl?: string): Promise<string> {
  if (!sourceUrl) return html;

  let origin: string;
  try { origin = new URL(sourceUrl).origin; } catch { return html; }

  // 1. Fetch and inline external stylesheets
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  const hrefRegex = /href=["']([^"']+)["']/i;
  const links = html.match(linkRegex) || [];

  const fetches = links.map(async (linkTag) => {
    const hrefMatch = linkTag.match(hrefRegex);
    if (!hrefMatch) return null;
    const cssUrl = resolveUrl(hrefMatch[1], origin);
    try {
      const res = await fetch(`/api/fetch-page?url=${encodeURIComponent(cssUrl)}`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        let css = await res.text();
        if (css.length > 10 && css.length < 800000) {
          css = rewriteCssUrls(css, cssUrl);
          return { linkTag, css };
        }
      }
    } catch { /* skip */ }
    return null;
  });

  const results = await Promise.all(fetches);

  let modified = html;
  const inlinedStyles: string[] = [];
  for (const r of results) {
    if (!r) continue;
    inlinedStyles.push(r.css);
    modified = modified.replace(r.linkTag, "");
  }

  if (inlinedStyles.length > 0) {
    const styleBlock = `<style>${inlinedStyles.join("\n")}</style>`;
    if (/<\/head>/i.test(modified)) {
      modified = modified.replace(/<\/head>/i, styleBlock + "</head>");
    } else {
      modified = styleBlock + modified;
    }
  }

  // 2. Rewrite inline style url() references too
  modified = modified.replace(/style=["']([^"']*url\([^)]+\)[^"']*)["']/gi, (match, styleContent: string) => {
    const rewritten = rewriteCssUrls(styleContent, sourceUrl);
    return match.replace(styleContent, rewritten);
  });

  // 3. Rewrite HTML src/href attributes to absolute
  modified = rewriteHtmlUrls(modified, origin);

  // 4. Inject <base> as final fallback for anything we missed
  const base = `<base href="${origin}/">`;
  if (/<head[^>]*>/i.test(modified)) {
    modified = modified.replace(/<head[^>]*>/i, (m) => m + base);
  }

  return modified;
}

// ─── Main snapshot function ───

export async function snapshotHtmlToScene(
  html: string, containerWidth: number = 1200, sceneName: string = "Custom Page", sourceUrl?: string
): Promise<SceneDescription> {
  // Inline CSS, rewrite URLs to absolute so iframe renders correctly
  const prepared = await prepareHtmlForSnapshot(html, sourceUrl);

  // Try iframe approach with inlined CSS
  const iframeResult = await tryIframeSnapshot(prepared, containerWidth, sceneName);
  if (iframeResult && iframeResult.elements.length >= 5) {
    return iframeResult;
  }

  // Fall back to structural HTML parser
  return parseHtmlStructure(html, containerWidth, sceneName);
}

// ─── Iframe-based snapshot ───

function tryIframeSnapshot(
  html: string, containerWidth: number, sceneName: string
): Promise<SceneDescription | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${containerWidth}px;height:4000px;border:none;visibility:hidden;pointer-events:none;`;
    iframe.sandbox.add("allow-same-origin");
    iframe.srcdoc = html;

    const timeout = setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
      resolve(null);
    }, 8000);

    iframe.onload = () => {
      const attempt = (retries: number) => {
        try {
          const doc = iframe.contentDocument;
          const win = doc?.defaultView;
          if (!doc || !doc.body || !win) { clearTimeout(timeout); document.body.removeChild(iframe); resolve(null); return; }

          const elements: SceneElement[] = [];
          walkElement(doc.body, elements, doc.body.getBoundingClientRect(), 0, win);

          if (elements.length < 5 && retries > 0) {
            setTimeout(() => attempt(retries - 1), 800);
            return;
          }

          clearTimeout(timeout);
          const maxY = elements.reduce((m, el) => Math.max(m, el.rect.y + el.rect.height), 600);
          const bgColor = parseColor(win.getComputedStyle(doc.body).backgroundColor) || "#ffffff";
          document.body.removeChild(iframe);

          resolve(elements.length >= 5 ? {
            id: `snapshot-${Date.now()}`, name: sceneName,
            width: containerWidth, height: Math.max(maxY + 100, 800),
            backgroundColor: bgColor, elements,
          } : null);
        } catch { clearTimeout(timeout); try { document.body.removeChild(iframe); } catch {} resolve(null); }
      };
      // Wait for inlined CSS to apply
      setTimeout(() => attempt(3), 300);
    };

    iframe.onerror = () => { clearTimeout(timeout); try { document.body.removeChild(iframe); } catch {} resolve(null); };
    document.body.appendChild(iframe);
  });
}

// ─── Structure-based HTML parser fallback ───

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
  elements.push({
    id: `sp-${snapshotCounter++}`, type: "heading",
    rect: { x: mx, y, width: contentW, height: 44 },
    throwable: false, pinned: true, text: title,
    fontSize: 30, fontWeight: 700, fontFamily: SANS, lineHeight: 38, color: "#1a1a1a",
  });
  y += 52;

  const descMeta = doc.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (descMeta?.content) {
    elements.push({
      id: `sp-${snapshotCounter++}`, type: "paragraph",
      rect: { x: mx, y, width: contentW, height: 60 },
      throwable: false, pinned: true, text: descMeta.content.trim(),
      fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#666",
    });
    y += 70;
  }

  const body = doc.body;
  if (body) {
    const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "LINK", "META", "HEAD", "NAV", "FOOTER", "ASIDE", "TEMPLATE", "IFRAME"]);

    function extractInlineColor(el: Element): string | undefined {
      const style = el.getAttribute("style") || "";
      const m = style.match(/color\s*:\s*([^;]+)/i);
      return m ? m[1].trim() : undefined;
    }
    function extractInlineBg(el: Element): string | undefined {
      const style = el.getAttribute("style") || "";
      const m = style.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      return m ? m[1].trim() : undefined;
    }

    function walk(el: Element) {
      if (y > 5000) return;
      for (const child of Array.from(el.children)) {
        if (y > 5000) return;
        const tag = child.tagName;
        if (skipTags.has(tag)) continue;

        const cls = (child.className || "").toString().toLowerCase();
        const id = (child.id || "").toLowerCase();
        if (cls.includes("hidden") || cls.includes("modal") || cls.includes("popup") || cls.includes("cookie") ||
            id.includes("hidden") || id.includes("modal") || id.includes("popup")) continue;

        if (tag === "HR") {
          elements.push({ id: `sp-${snapshotCounter++}`, type: "divider", rect: { x: mx, y, width: contentW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" });
          y += 16;
          continue;
        }

        if (tag === "IMG") {
          const alt = (child as HTMLImageElement).alt || "";
          elements.push({ id: `sp-${snapshotCounter++}`, type: "image", rect: { x: mx, y, width: Math.min(contentW, 400), height: 200 }, throwable: true, pinned: false, backgroundColor: "#e8e5e0", borderRadius: 8, imageAlt: alt, imageSrc: (child as HTMLImageElement).src, mass: 2 });
          y += 216;
          continue;
        }

        if (/^H[1-6]$/.test(tag)) {
          const text = (child.textContent || "").trim();
          if (!text || text.length > 500) { walk(child); continue; }
          const level = parseInt(tag[1]);
          const fontSize = [0, 28, 24, 20, 17, 15, 14][level];
          const lineH = [0, 34, 30, 26, 24, 22, 20][level];
          const charsPerLine = Math.floor(contentW / (fontSize * 0.55));
          const height = Math.min(Math.ceil(text.length / charsPerLine) * lineH + 8, 120);
          elements.push({
            id: `sp-${snapshotCounter++}`, type: "heading",
            rect: { x: mx, y, width: contentW, height },
            throwable: false, pinned: true, text,
            fontSize, fontWeight: 700, fontFamily: level <= 2 ? SERIF : SANS,
            lineHeight: lineH, color: extractInlineColor(child) || "#1a1a1a",
          });
          y += height + 12;
          continue;
        }

        if (tag === "P" || tag === "BLOCKQUOTE" || tag === "FIGCAPTION") {
          const text = (child.textContent || "").trim();
          if (!text || text.length < 3 || text.length > 5000) { walk(child); continue; }
          const lineH = 24;
          const charsPerLine = Math.floor(contentW / 9);
          const lineCount = Math.ceil(text.length / charsPerLine);
          const height = Math.min(lineCount * lineH + 8, 600);
          elements.push({
            id: `sp-${snapshotCounter++}`, type: "paragraph",
            rect: { x: mx, y, width: contentW, height },
            throwable: false, pinned: true, text,
            fontSize: 15, fontWeight: 400, fontFamily: SERIF,
            lineHeight: lineH, color: extractInlineColor(child) || "#333",
            backgroundColor: extractInlineBg(child),
          });
          y += height + 14;
          continue;
        }

        if (tag === "TABLE") {
          // Render table as a card with text summary
          const text = (child.textContent || "").trim().slice(0, 500);
          if (text.length > 10) {
            elements.push({
              id: `sp-${snapshotCounter++}`, type: "card",
              rect: { x: mx, y, width: contentW, height: 120 },
              throwable: true, pinned: false, text: text.slice(0, 120) + (text.length > 120 ? "..." : ""),
              fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18,
              color: "#444", backgroundColor: "#f9f9f9", borderRadius: 8, padding: 12,
              border: "1px solid #e0e0e0", mass: 1,
            });
            y += 136;
          }
          continue;
        }

        if (tag === "BUTTON" || (tag === "A" && child.children.length <= 2 && (child.textContent || "").length < 40)) {
          const text = (child.textContent || "").trim();
          if (!text || text.length > 40) { walk(child); continue; }
          elements.push({
            id: `sp-${snapshotCounter++}`, type: "button",
            rect: { x: mx, y, width: Math.min(text.length * 9 + 32, 200), height: 36 },
            throwable: true, pinned: false, text,
            fontSize: 13, fontWeight: 600, fontFamily: SANS,
            color: "#fff", backgroundColor: extractInlineBg(child) || "#1a1a1a",
            borderRadius: 8, mass: 0.3,
          });
          y += 48;
          continue;
        }

        if (tag === "LI") {
          const text = (child.textContent || "").trim();
          if (!text || text.length < 3 || text.length > 1000) continue;
          const lineH = 22;
          const charsPerLine = Math.floor((contentW - 16) / 9);
          const lineCount = Math.ceil(text.length / charsPerLine);
          const height = Math.min(lineCount * lineH + 4, 200);
          elements.push({
            id: `sp-${snapshotCounter++}`, type: "paragraph",
            rect: { x: mx + 16, y, width: contentW - 16, height },
            throwable: false, pinned: true, text: "\u2022 " + text,
            fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: lineH, color: "#444",
          });
          y += height + 6;
          continue;
        }

        // For divs with inline styles that give them visual identity, capture as cards
        const inlineBg = extractInlineBg(child);
        if (inlineBg && child.children.length <= 4) {
          const text = (child.textContent || "").trim().slice(0, 200);
          if (text) {
            elements.push({
              id: `sp-${snapshotCounter++}`, type: "card",
              rect: { x: mx, y, width: contentW, height: 80 },
              throwable: true, pinned: false, text,
              fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20,
              color: extractInlineColor(child) || "#333",
              backgroundColor: inlineBg, borderRadius: 8, padding: 12, mass: 0.8,
            });
            y += 96;
            continue;
          }
        }

        walk(child);
      }
    }

    walk(body);
  }

  return {
    id: `snapshot-${Date.now()}`, name: sceneName,
    width: containerWidth, height: Math.max(y + 100, 800),
    backgroundColor: "#ffffff", elements,
  };
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

// ─── Iframe DOM walker ───

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

export function autoSelectThrowables(scene: SceneDescription): SceneDescription {
  const throwableTypes: SceneElementType[] = ["button", "badge", "card", "image", "link"];
  return { ...scene, elements: scene.elements.map((el) => throwableTypes.includes(el.type) && el.rect.width < 500 && el.rect.height < 400 ? { ...el, throwable: true, pinned: false } : el) };
}
