import type { SceneDescription, SceneElement } from "../types";

// ── Nothing-design font stack ──
const BODY = '"Space Grotesk", "DM Sans", system-ui, sans-serif';
const DATA = '"Space Mono", "JetBrains Mono", monospace';
const DISPLAY = '"Doto", "Space Mono", monospace';

export function createLandingScene(vw: number, vh: number): SceneDescription {
  const narrow = vw < 820;
  const w = Math.min(vw - 40, 1100);
  const mx = Math.max(20, (vw - w) / 2);
  const colW = (w - 32) / 3;

  // ── Vertical anchors ──
  const eyebrowY = 140;
  const dominoY = eyebrowY + 36;
  const subheadY = dominoY + (narrow ? 64 : 92);
  const bodyY = subheadY + 72;
  const ctaY = bodyY + 84;
  const metricsY = ctaY + 96;
  const capLabelY = metricsY + 172;
  const capHeadY = capLabelY + 36;
  const capBodyY = capHeadY + 44;
  const featY = capBodyY + 68;
  const tagsY = featY + 196;
  const tagDescY = tagsY + 48;
  const quoteY = tagDescY + 64;
  const priceY = quoteY + 232;
  const bottomY = priceY + (narrow ? 572 : 320);
  const footerY = bottomY + 96;
  const H = Math.max(vh, footerY + (narrow ? 280 : 220));

  return {
    id: "landing",
    name: "Landing Page",
    width: vw,
    height: H,
    backgroundColor: "#000000",
    elements: [
      // ── Nav ──
      {
        id: "l-logo", type: "badge",
        rect: { x: mx, y: 24, width: 42, height: 42 },
        throwable: true, pinned: false,
        text: "DO", fontSize: 14, fontWeight: 400, fontFamily: DATA,
        color: "#E8E8E8", backgroundColor: "#111111", borderRadius: 8, padding: 8,
        border: "1px solid #333333",
        letterSpacing: "0.04em",
        mass: 0.3,
      },
      {
        id: "l-brand", type: "heading",
        rect: { x: mx + 54, y: 30, width: 160, height: 14 },
        throwable: false, pinned: true,
        text: "DOMINO STUDIO", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        lineHeight: 14, color: "#999999", letterSpacing: "0.08em",
        backgroundColor: "transparent",
      },
      {
        id: "l-brand-sub", type: "heading",
        rect: { x: mx + 54, y: 48, width: 200, height: 14 },
        throwable: false, pinned: true,
        text: "Physics-native layout engine", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        lineHeight: 14, color: "#666666", letterSpacing: "0.04em",
        backgroundColor: "transparent",
      },
      {
        id: "l-n1", type: "button",
        rect: { x: mx + w - 380, y: 30, width: 88, height: 28 },
        throwable: true, pinned: false,
        text: "USE CASES", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#666666", backgroundColor: "transparent", borderRadius: 0,
        letterSpacing: "0.06em",
        mass: 0.1,
      },
      {
        id: "l-n2", type: "button",
        rect: { x: mx + w - 284, y: 30, width: 68, height: 28 },
        throwable: true, pinned: false,
        text: "PRICING", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#666666", backgroundColor: "transparent", borderRadius: 0,
        letterSpacing: "0.06em",
        mass: 0.1,
      },
      {
        id: "l-n3", type: "button",
        rect: { x: mx + w - 208, y: 30, width: 48, height: 28 },
        throwable: true, pinned: false,
        text: "DOCS", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#666666", backgroundColor: "transparent", borderRadius: 0,
        letterSpacing: "0.06em",
        mass: 0.1,
      },
      {
        id: "l-signin", type: "button",
        rect: { x: mx + w - 148, y: 24, width: 76, height: 36 },
        throwable: true, pinned: false,
        text: "SIGN IN", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#E8E8E8", backgroundColor: "transparent", borderRadius: 999,
        border: "1px solid #333333",
        letterSpacing: "0.06em",
        mass: 0.15,
      },
      {
        id: "l-cta-nav", type: "button",
        rect: { x: mx + w - 64, y: 24, width: 64, height: 36 },
        throwable: true, pinned: false,
        text: "START", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#000000", backgroundColor: "#FFFFFF", borderRadius: 999,
        letterSpacing: "0.06em",
        mass: 0.2,
      },

      // ── Hero ──
      {
        id: "l-eyebrow", type: "badge",
        rect: { x: mx, y: eyebrowY, width: 200, height: 26 },
        throwable: true, pinned: false,
        text: "PHYSICS-NATIVE LAYOUT", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 999, padding: 6,
        border: "1px solid #222222",
        letterSpacing: "0.06em",
        mass: 0.1,
      },
      {
        id: "l-hero", type: "heading",
        rect: { x: mx, y: dominoY, width: narrow ? Math.min(w, 260) : 340, height: narrow ? 62 : 78 },
        throwable: true, pinned: false,
        text: "DOMINO",
        fontSize: narrow ? 56 : 72, fontWeight: 400, fontFamily: DISPLAY,
        lineHeight: narrow ? 56 : 72, letterSpacing: "-0.03em", color: "#FFFFFF",
        backgroundColor: "#111111", borderRadius: 8, padding: 12,
        border: "1px solid #222222",
        mass: 1.8,
      },
      // Red dot — the single accent moment
      {
        id: "l-dot", type: "badge",
        rect: { x: mx + (narrow ? 248 : 316), y: dominoY + (narrow ? 40 : 52), width: 12, height: 12 },
        throwable: true, pinned: false,
        text: "", fontSize: 1, fontWeight: 400, fontFamily: DATA,
        color: "transparent", backgroundColor: "#D71921", borderRadius: 999,
        mass: 0.04,
      },
      {
        id: "l-sub-h", type: "heading",
        rect: { x: mx, y: subheadY, width: narrow ? w : Math.min(w * 0.6, 600), height: 68 },
        throwable: false, pinned: true,
        text: "Pages that hold their composure\nwhen everything moves.",
        fontSize: 24, fontWeight: 500, fontFamily: BODY,
        lineHeight: 32, color: "#E8E8E8",
        backgroundColor: "transparent",
      },
      {
        id: "l-sub", type: "paragraph",
        rect: { x: mx, y: bodyY, width: narrow ? w : Math.min(w * 0.55, 560), height: 78 },
        throwable: false, pinned: true,
        text: "Editorial spreads, dashboards, and dense layouts — with real typographic rhythm and text that reflows around whatever you throw, in real time.",
        fontSize: 16, fontWeight: 400, fontFamily: BODY, lineHeight: 26, color: "#999999",
        backgroundColor: "transparent",
      },
      {
        id: "l-cta1", type: "button",
        rect: { x: mx, y: ctaY, width: 158, height: 44 },
        throwable: true, pinned: false,
        text: "GET STARTED", fontSize: 13, fontWeight: 400, fontFamily: DATA,
        color: "#000000", backgroundColor: "#FFFFFF", borderRadius: 999,
        letterSpacing: "0.06em",
        mass: 0.5,
      },
      {
        id: "l-cta2", type: "button",
        rect: { x: mx + 174, y: ctaY, width: 156, height: 44 },
        throwable: true, pinned: false,
        text: "WATCH DEMO", fontSize: 13, fontWeight: 400, fontFamily: DATA,
        color: "#E8E8E8", backgroundColor: "transparent", borderRadius: 999,
        border: "1px solid #333333",
        letterSpacing: "0.06em",
        mass: 0.4,
      },

      // ── Metrics — instrument-panel cards ──
      {
        id: "l-m1", type: "card",
        rect: { x: mx, y: metricsY, width: colW, height: 108 },
        throwable: true, pinned: false,
        text: "LAYOUT PASS", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 20,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 0.8,
        children: [{
          id: "l-m1-v", type: "paragraph",
          rect: { x: 0, y: 16, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "0.09ms", fontSize: 36, fontWeight: 400, fontFamily: DATA,
          lineHeight: 40, color: "#FFFFFF",
        }],
      },
      {
        id: "l-m2", type: "card",
        rect: { x: mx + colW + 16, y: metricsY, width: colW, height: 108 },
        throwable: true, pinned: false,
        text: "FLOW REGIONS", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 20,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 0.8,
        children: [{
          id: "l-m2-v", type: "paragraph",
          rect: { x: 0, y: 16, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "94", fontSize: 36, fontWeight: 400, fontFamily: DATA,
          lineHeight: 40, color: "#FFFFFF",
        }],
      },
      {
        id: "l-m3", type: "card",
        rect: { x: mx + (colW + 16) * 2, y: metricsY, width: colW, height: 108 },
        throwable: true, pinned: false,
        text: "PRESETS", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 20,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 0.8,
        children: [{
          id: "l-m3-v", type: "paragraph",
          rect: { x: 0, y: 16, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "4", fontSize: 36, fontWeight: 400, fontFamily: DATA,
          lineHeight: 40, color: "#FFFFFF",
        }],
      },

      // ── Capabilities ──
      {
        id: "l-section-k", type: "badge",
        rect: { x: mx, y: capLabelY, width: 128, height: 24 },
        throwable: true, pinned: false,
        text: "CAPABILITIES", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 4, padding: 4,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 0.08,
      },
      {
        id: "l-section-h", type: "heading",
        rect: { x: mx, y: capHeadY, width: w, height: 32 },
        throwable: false, pinned: true,
        text: "Built for real products, not toy layouts",
        fontSize: 24, fontWeight: 500, fontFamily: BODY, lineHeight: 32, color: "#E8E8E8",
        backgroundColor: "transparent",
      },
      {
        id: "l-section-p", type: "paragraph",
        rect: { x: mx, y: capBodyY, width: Math.min(w * 0.75, 720), height: 52 },
        throwable: false, pinned: true,
        text: "Each preset reads as a shippable surface first: hierarchy you can feel, margins that breathe, and copy that does more than fill space.",
        fontSize: 16, fontWeight: 400, fontFamily: BODY, lineHeight: 26, color: "#999999",
        backgroundColor: "transparent",
      },

      // ── Feature cards ──
      {
        id: "l-f1", type: "card",
        rect: { x: mx, y: featY, width: colW, height: 148 },
        throwable: true, pinned: false,
        text: "LAUNCH SURFACES", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 20,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 1.2,
        children: [{
          id: "l-f1-d", type: "paragraph",
          rect: { x: 0, y: 16, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Pricing, changelogs, and proof in one frame that still reads clean mid-throw.",
          fontSize: 14, fontWeight: 400, fontFamily: BODY, lineHeight: 22, color: "#666666",
        }],
      },
      {
        id: "l-f2", type: "card",
        rect: { x: mx + colW + 16, y: featY, width: colW, height: 148 },
        throwable: true, pinned: false,
        text: "EDITORIAL PACKAGES", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 20,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 1.2,
        children: [{
          id: "l-f2-d", type: "paragraph",
          rect: { x: 0, y: 16, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Covers, pull quotes, and sidebars that keep their editorial voice when they slide.",
          fontSize: 14, fontWeight: 400, fontFamily: BODY, lineHeight: 22, color: "#666666",
        }],
      },
      {
        id: "l-f3", type: "card",
        rect: { x: mx + (colW + 16) * 2, y: featY, width: colW, height: 148 },
        throwable: true, pinned: false,
        text: "OPERATIONAL PAGES", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 20,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 1.2,
        children: [{
          id: "l-f3-d", type: "paragraph",
          rect: { x: 0, y: 16, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Status and ops views with real density — legible before and after the widgets scatter.",
          fontSize: 14, fontWeight: 400, fontFamily: BODY, lineHeight: 22, color: "#666666",
        }],
      },

      // ── Type tags — throwable pills ──
      {
        id: "l-words-1", type: "badge",
        rect: { x: mx, y: tagsY, width: 104, height: 34 },
        throwable: true, pinned: false,
        text: "ARTICLE", fontSize: 12, fontWeight: 400, fontFamily: DATA,
        color: "#E8E8E8", backgroundColor: "#111111", borderRadius: 999,
        border: "1px solid #222222",
        letterSpacing: "0.06em", padding: 6,
        mass: 0.2,
      },
      {
        id: "l-words-2", type: "badge",
        rect: { x: mx + 120, y: tagsY, width: 134, height: 34 },
        throwable: true, pinned: false,
        text: "DASHBOARD", fontSize: 12, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 999,
        border: "1px solid #222222",
        letterSpacing: "0.06em", padding: 6,
        mass: 0.2,
      },
      {
        id: "l-words-3", type: "badge",
        rect: { x: mx + 270, y: tagsY, width: 120, height: 34 },
        throwable: true, pinned: false,
        text: "EDITORIAL", fontSize: 12, fontWeight: 400, fontFamily: DATA,
        color: "#E8E8E8", backgroundColor: "#111111", borderRadius: 999,
        border: "1px solid #222222",
        letterSpacing: "0.06em", padding: 6,
        mass: 0.2,
      },
      {
        id: "l-words-4", type: "badge",
        rect: { x: mx + 406, y: tagsY, width: 112, height: 34 },
        throwable: true, pinned: false,
        text: "LANDING", fontSize: 12, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 999,
        border: "1px solid #222222",
        letterSpacing: "0.06em", padding: 6,
        mass: 0.2,
      },
      {
        id: "l-words-p", type: "paragraph",
        rect: { x: mx, y: tagDescY, width: w, height: 48 },
        throwable: false, pinned: true,
        text: "Each page type keeps its own tone. You get a system of surfaces, not a grid of same-y cards.",
        fontSize: 14, fontWeight: 400, fontFamily: BODY, lineHeight: 22, color: "#666666",
        backgroundColor: "transparent",
      },

      // ── Quote ──
      {
        id: "l-quote-card", type: "card",
        rect: { x: mx, y: quoteY, width: w, height: 168 },
        throwable: true, pinned: false,
        text: "FROM THE TEAMS", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#666666", backgroundColor: "#111111", borderRadius: 12, padding: 24,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 1.8,
        children: [
          {
            id: "l-quote-a", type: "paragraph",
            rect: { x: 0, y: 20, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "\u201CWe mocked a magazine cover and a metrics wall the same afternoon. For once the comps felt authored \u2014 not like a template had sneezed.\u201D",
            fontSize: 18, fontWeight: 400, fontFamily: BODY, lineHeight: 28, color: "#E8E8E8",
          },
          {
            id: "l-quote-b", type: "paragraph",
            rect: { x: 0, y: 16, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "AVA MORENO \u2014 DESIGN ENGINEERING, MASTHEAD",
            fontSize: 11, fontWeight: 400, fontFamily: DATA, lineHeight: 16, color: "#666666",
            letterSpacing: "0.06em",
          },
        ],
      },

      // ── Pricing ──
      {
        id: "l-plan", type: "card",
        rect: { x: mx, y: priceY, width: narrow ? w : 320, height: 256 },
        throwable: true, pinned: false,
        text: "STARTER", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 22,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 1.6,
        children: [
          {
            id: "l-plan-price", type: "paragraph",
            rect: { x: 0, y: 16, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "$49", fontSize: 48, fontWeight: 400, fontFamily: BODY,
            lineHeight: 52, color: "#FFFFFF",
          },
          {
            id: "l-plan-unit", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "/EDITOR/MONTH", fontSize: 11, fontWeight: 400, fontFamily: DATA,
            lineHeight: 16, color: "#666666",
            letterSpacing: "0.06em",
          },
          {
            id: "l-plan-desc", type: "paragraph",
            rect: { x: 0, y: 16, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Full preset library, scene editor, import tools, and unlimited prototypes.",
            fontSize: 14, fontWeight: 400, fontFamily: BODY, lineHeight: 22, color: "#666666",
          },
          {
            id: "l-plan-ent", type: "paragraph",
            rect: { x: 0, y: 8, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Enterprise adds team permissions, shared collections, and publishing workflows.",
            fontSize: 13, fontWeight: 400, fontFamily: BODY, lineHeight: 20, color: "#666666",
          },
        ],
      },
      {
        id: "l-checklist", type: "card",
        rect: { x: narrow ? mx : mx + 336, y: narrow ? priceY + 272 : priceY, width: narrow ? w : w - 336, height: 256 },
        throwable: true, pinned: false,
        text: "LAUNCH CHECKLIST", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        color: "#999999", backgroundColor: "#111111", borderRadius: 12, padding: 22,
        border: "1px solid #222222",
        letterSpacing: "0.08em",
        mass: 1.6,
        children: [
          {
            id: "l-check-a", type: "paragraph",
            rect: { x: 0, y: 16, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "01  Pick a preset that fits your page type",
            fontSize: 13, fontWeight: 400, fontFamily: DATA, lineHeight: 26, color: "#E8E8E8",
          },
          {
            id: "l-check-b", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "02  Drop in your content and assets",
            fontSize: 13, fontWeight: 400, fontFamily: DATA, lineHeight: 26, color: "#E8E8E8",
          },
          {
            id: "l-check-c", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "03  Tune physics and save reusable fragments",
            fontSize: 13, fontWeight: 400, fontFamily: DATA, lineHeight: 26, color: "#E8E8E8",
          },
          {
            id: "l-check-d", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "04  Ship a page that holds up under interaction",
            fontSize: 13, fontWeight: 400, fontFamily: DATA, lineHeight: 26, color: "#E8E8E8",
          },
          {
            id: "l-check-e", type: "paragraph",
            rect: { x: 0, y: 12, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Most teams ship in under four hours.",
            fontSize: 13, fontWeight: 400, fontFamily: BODY, lineHeight: 20, color: "#666666",
          },
        ],
      },

      // ── Bottom CTA ──
      {
        id: "l-bottom", type: "paragraph",
        rect: { x: mx, y: bottomY, width: w, height: 60 },
        throwable: false, pinned: true,
        text: "Pages that feel crafted before anyone touches them \u2014 and still feel crafted after. Start building for free.",
        fontSize: 18, fontWeight: 400, fontFamily: BODY, lineHeight: 28, color: "#666666",
        backgroundColor: "transparent",
      },

      // ── Footer ──
      {
        id: "l-footer-line-top", type: "divider",
        rect: { x: mx, y: footerY, width: w, height: 1 },
        throwable: false, pinned: true,
        backgroundColor: "#222222",
      },
      {
        id: "l-footer-brand", type: "badge",
        rect: { x: mx, y: footerY + 32, width: 42, height: 42 },
        throwable: true, pinned: false,
        text: "DO", fontSize: 14, fontWeight: 400, fontFamily: DATA,
        color: "#666666", backgroundColor: "#111111", borderRadius: 8, padding: 6,
        border: "1px solid #222222",
        mass: 0.2,
      },
      {
        id: "l-footer-name", type: "heading",
        rect: { x: mx + 54, y: footerY + 36, width: 160, height: 14 },
        throwable: false, pinned: true,
        text: "DOMINO STUDIO", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        lineHeight: 14, color: "#666666", letterSpacing: "0.08em",
        backgroundColor: "transparent",
      },
      {
        id: "l-footer-tagline", type: "paragraph",
        rect: { x: mx + 54, y: footerY + 56, width: 240, height: 16 },
        throwable: false, pinned: true,
        text: "Layout that keeps its nerve.", fontSize: 12, fontWeight: 400, fontFamily: BODY,
        lineHeight: 16, color: "#333333",
        backgroundColor: "transparent",
      },
      // Nav columns
      ...((() => {
        const cols = [
          { label: "PRODUCT", items: ["Features", "Pricing", "Changelog", "Docs"] },
          { label: "RESOURCES", items: ["Blog", "Guides", "API", "Community"] },
          { label: "COMPANY", items: ["About", "Careers", "Privacy", "Terms"] },
        ];
        const colStartX = narrow ? 0 : Math.floor(w * 0.42);
        const colSpacing = narrow ? Math.floor(w / 3) : Math.floor(w * 0.19);
        const colTopY = narrow ? footerY + 108 : footerY + 32;
        const result: SceneElement[] = [];
        cols.forEach((col, ci) => {
          result.push({
            id: `l-ft-h${ci}`, type: "heading",
            rect: { x: mx + colStartX + ci * colSpacing, y: colTopY, width: 120, height: 14 },
            throwable: false, pinned: true,
            text: col.label, fontSize: 11, fontWeight: 400, fontFamily: DATA,
            lineHeight: 14, color: "#666666", letterSpacing: "0.08em",
            backgroundColor: "transparent",
          });
          col.items.forEach((item, ii) => {
            result.push({
              id: `l-ft-${ci}-${ii}`, type: "heading",
              rect: { x: mx + colStartX + ci * colSpacing, y: colTopY + 24 + ii * 22, width: 120, height: 16 },
              throwable: false, pinned: true,
              text: item, fontSize: 13, fontWeight: 400, fontFamily: BODY,
              lineHeight: 16, color: "#333333",
              backgroundColor: "transparent",
            });
          });
        });
        return result;
      })()),
      {
        id: "l-footer-line", type: "divider",
        rect: { x: mx, y: footerY + (narrow ? 232 : 152), width: w, height: 1 },
        throwable: false, pinned: true,
        backgroundColor: "#222222",
      },
      {
        id: "l-footer-copy", type: "paragraph",
        rect: { x: mx, y: footerY + (narrow ? 248 : 168), width: w / 2, height: 14 },
        throwable: false, pinned: true,
        text: "\u00A9 2026 DOMino Studio", fontSize: 11, fontWeight: 400, fontFamily: DATA,
        lineHeight: 14, color: "#333333",
        backgroundColor: "transparent",
      },
      {
        id: "l-footer-links", type: "paragraph",
        rect: { x: mx + w / 2, y: footerY + (narrow ? 248 : 168), width: w / 2, height: 14 },
        throwable: false, pinned: true,
        text: "Status  \u00B7  Twitter  \u00B7  GitHub",
        fontSize: 11, fontWeight: 400, fontFamily: DATA, lineHeight: 14, color: "#333333",
        textAlign: "right",
        backgroundColor: "transparent",
      },
    ],
  };
}
