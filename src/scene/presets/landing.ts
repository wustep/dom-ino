import type { SceneDescription, SceneElement } from "../types";
import { SANS, SERIF, MONO } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const LANDING_UI = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="360" viewBox="0 0 420 360" fill="none">
  <defs>
    <linearGradient id="luFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1220"/>
      <stop offset="100%" stop-color="#060a12"/>
    </linearGradient>
    <linearGradient id="luChart" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#152038"/>
      <stop offset="100%" stop-color="#0c1628"/>
    </linearGradient>
  </defs>
  <rect width="420" height="360" rx="22" fill="url(#luFrame)"/>
  <rect x="18" y="18" width="384" height="324" rx="18" fill="#0a1222" stroke="rgba(148,163,184,0.14)"/>
  <rect x="38" y="38" width="120" height="10" rx="5" fill="rgba(148,163,184,0.28)"/>
  <rect x="38" y="58" width="72" height="10" rx="5" fill="rgba(124,58,237,0.35)"/>
  <rect x="38" y="80" width="344" height="154" rx="14" fill="url(#luChart)"/>
  <path d="M56 198C84 178 120 168 148 174C182 182 198 128 232 128C268 128 286 162 318 162C338 162 356 148 372 132" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" opacity="0.92"/>
  <path d="M56 214C92 206 124 194 158 200C192 206 214 182 244 182C278 182 302 208 368 186" stroke="#5eead4" stroke-width="2.75" stroke-linecap="round" opacity="0.88"/>
  <circle cx="232" cy="128" r="5.5" fill="#c4b5fd"/>
  <circle cx="318" cy="162" r="5.5" fill="#2dd4bf"/>
  <line x1="48" y1="248" x2="372" y2="248" stroke="rgba(148,163,184,0.12)" stroke-width="1"/>
  <rect x="38" y="262" width="112" height="62" rx="12" fill="#0f1a2e" stroke="rgba(124,58,237,0.18)"/>
  <rect x="164" y="262" width="106" height="62" rx="12" fill="#0f1a2e" stroke="rgba(45,212,191,0.14)"/>
  <rect x="284" y="262" width="98" height="62" rx="12" fill="#0f1a2e" stroke="rgba(148,163,184,0.1)"/>
  <text x="56" y="288" fill="#8899ae" font-size="10" font-family="Arial, sans-serif" letter-spacing="0.04em">LAYOUT PASSES</text>
  <text x="56" y="308" fill="#f8fafc" font-size="21" font-family="Arial, sans-serif" font-weight="700">0.08ms</text>
  <text x="182" y="288" fill="#8899ae" font-size="10" font-family="Arial, sans-serif" letter-spacing="0.04em">LIVE REGIONS</text>
  <text x="182" y="308" fill="#f8fafc" font-size="21" font-family="Arial, sans-serif" font-weight="700">94</text>
  <text x="302" y="288" fill="#8899ae" font-size="10" font-family="Arial, sans-serif" letter-spacing="0.04em">PRESETS</text>
  <text x="302" y="308" fill="#f8fafc" font-size="21" font-family="Arial, sans-serif" font-weight="700">28</text>
</svg>
`);

export function createLandingScene(vw: number, vh: number): SceneDescription {
  const narrow = vw < 820;
  const w = Math.min(vw - 40, 1100);
  const mx = Math.max(20, (vw - w) / 2);
  const fW = (w - 24) / 3;
  const heroImageW = narrow ? Math.min(w, 400) : Math.min(400, w * 0.37);
  const heroX = narrow ? mx + (w - heroImageW) / 2 : mx + w - heroImageW;
  const heroTextW = narrow ? w : heroX - mx - 40;

  const heroImageY = narrow ? 548 : 144;
  const metricsY = narrow ? heroImageY + 368 : 528;
  const sectionY = narrow ? metricsY + 168 : 792;
  const featureY = sectionY + 196;
  const wordsY = featureY + 148;
  const quoteY = wordsY + 152;
  const pricingY = quoteY + 232;
  const bottomY = pricingY + 292;
  const footerY = bottomY + 148;
  const H = Math.max(vh, footerY + (narrow ? 280 : 200) + 40);

  return {
    id: "landing", name: "Landing Page", width: vw, height: H,
    backgroundColor: "radial-gradient(ellipse 110% 70% at 18% -10%, rgba(124,58,237,0.12) 0%, transparent 42%), radial-gradient(ellipse 90% 50% at 88% 20%, rgba(45,212,191,0.06) 0%, transparent 45%), linear-gradient(180deg, #040810 0%, #07111d 48%, #0c1828 100%)",
    elements: [
      // ── Nav ──
      {
        id: "l-logo", type: "badge",
        rect: { x: mx, y: 18, width: 54, height: 54 },
        throwable: true, pinned: false,
        text: "DO", fontSize: 16, fontWeight: 800, fontFamily: MONO,
        color: "#f1f5f9", backgroundColor: "rgba(124,58,237,0.22)", borderRadius: 16, padding: 8,
        border: "1px solid rgba(167,139,250,0.25)",
        mass: 0.3,
      },
      {
        id: "l-brand", type: "heading",
        rect: { x: mx + 66, y: 22, width: 260, height: 32 },
        throwable: false, pinned: true,
        text: "DOMino Studio", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#fafbfc",
        backgroundColor: "transparent",
      },
      {
        id: "l-brand-sub", type: "heading",
        rect: { x: mx + 66, y: 54, width: 200, height: 16 },
        throwable: false, pinned: true,
        text: "Physics-native page prototypes", fontSize: 11, fontWeight: 600, fontFamily: MONO, lineHeight: 16, color: "#7a8fa5",
        backgroundColor: "transparent",
      },
      {
        id: "l-n1", type: "button",
        rect: { x: mx + w - 364, y: 26, width: 82, height: 30 },
        throwable: true, pinned: false,
        text: "Use cases", fontSize: 13, fontWeight: 500, fontFamily: SANS,
        color: "#cbd5e1", backgroundColor: "rgba(148,163,184,0.06)", borderRadius: 8,
        border: "1px solid transparent",
        mass: 0.12,
      },
      {
        id: "l-n2", type: "button",
        rect: { x: mx + w - 274, y: 26, width: 64, height: 30 },
        throwable: true, pinned: false,
        text: "Pricing", fontSize: 13, fontWeight: 500, fontFamily: SANS,
        color: "#cbd5e1", backgroundColor: "rgba(148,163,184,0.06)", borderRadius: 8,
        border: "1px solid transparent",
        mass: 0.12,
      },
      {
        id: "l-n3", type: "button",
        rect: { x: mx + w - 202, y: 26, width: 56, height: 30 },
        throwable: true, pinned: false,
        text: "Docs", fontSize: 13, fontWeight: 500, fontFamily: SANS,
        color: "#cbd5e1", backgroundColor: "rgba(148,163,184,0.06)", borderRadius: 8,
        border: "1px solid transparent",
        mass: 0.12,
      },
      {
        id: "l-signin", type: "button",
        rect: { x: mx + w - 138, y: 22, width: 68, height: 34 },
        throwable: true, pinned: false,
        text: "Sign in", fontSize: 13, fontWeight: 500, fontFamily: SANS,
        color: "#e2e8f0", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10,
        border: "1px solid rgba(148,163,184,0.15)",
        mass: 0.2,
      },
      {
        id: "l-cta-nav", type: "button",
        rect: { x: mx + w - 60, y: 22, width: 60, height: 34 },
        throwable: true, pinned: false,
        text: "Demo", fontSize: 13, fontWeight: 600, fontFamily: SANS,
        color: "#fff", backgroundColor: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: 10,
        boxShadow: "0 4px 20px rgba(124,58,237,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset",
        mass: 0.3,
      },

      // ── Hero ──
      {
        id: "l-eyebrow", type: "badge",
        rect: { x: mx, y: 114, width: 214, height: 28 },
        throwable: true, pinned: false,
        text: "New: four polished scene presets", fontSize: 11, fontWeight: 700, fontFamily: MONO,
        color: "#ddd6fe", backgroundColor: "rgba(124,58,237,0.18)", borderRadius: 14, padding: 6,
        border: "1px solid rgba(167,139,250,0.22)",
        mass: 0.12,
      },
      {
        id: "l-hero", type: "heading",
        rect: { x: mx, y: 162, width: heroTextW, height: 220 },
        throwable: false, pinned: true,
        text: "Pages that stay\ncomposed when\neverything moves.",
        fontSize: narrow ? 44 : 66, fontWeight: 800, fontFamily: SANS,
        lineHeight: narrow ? 50 : 72, letterSpacing: "-0.02em", color: "#fafbfc",
        backgroundColor: "transparent",
      },
      {
        id: "l-sub", type: "paragraph",
        rect: { x: mx, y: narrow ? 368 : 402, width: heroTextW, height: 104 },
        throwable: false, pinned: true,
        text: "Editorial spreads, marketing shells, and dense dashboards — all with real typographic rhythm and text that reflows around whatever you throw, in real time.",
        fontSize: 18, fontWeight: 400, fontFamily: SANS, lineHeight: 30, color: "#8aa2b8",
        backgroundColor: "transparent",
      },
      {
        id: "l-cta1", type: "button",
        rect: { x: mx, y: narrow ? 488 : 528, width: 174, height: 50 },
        throwable: true, pinned: false,
        text: "Get started", fontSize: 15, fontWeight: 700, fontFamily: SANS,
        color: "#fff", backgroundColor: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: 14,
        boxShadow: "0 8px 32px rgba(124,58,237,0.42), 0 0 0 1px rgba(255,255,255,0.1) inset",
        mass: 0.6,
      },
      {
        id: "l-cta2", type: "button",
        rect: { x: mx + 188, y: narrow ? 488 : 528, width: 150, height: 50 },
        throwable: true, pinned: false,
        text: "Watch demo", fontSize: 15, fontWeight: 500, fontFamily: SANS,
        color: "#e2e8f0", backgroundColor: "rgba(15,23,42,0.35)", borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.18)",
        mass: 0.5,
      },

      // ── Social proof logos — all throwable ──
      {
        id: "l-proof", type: "heading",
        rect: { x: mx, y: narrow ? 538 : 594, width: heroTextW, height: 20 },
        throwable: false, pinned: true,
        text: "Trusted by teams who ship pages that still feel designed after the first throw",
        fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 20, color: "#5a6f85",
        backgroundColor: "transparent",
      },
      // Row 1
      ...((() => {
        const logoRow1 = [
          { id: "l-logo-1", text: "Vectral", w: 104 },
          { id: "l-logo-2", text: "Streamline", w: 130 },
          { id: "l-logo-3", text: "Northstar", w: 118 },
          { id: "l-logo-4", text: "Forma", w: 90 },
          { id: "l-logo-5", text: "Datapulse", w: 122 },
        ];
        const logoRow2 = [
          { id: "l-logo-6", text: "Reforge", w: 102 },
          { id: "l-logo-7", text: "Lineage", w: 104 },
          { id: "l-logo-8", text: "Superstack", w: 134 },
          { id: "l-logo-9", text: "Relay", w: 82 },
          { id: "l-logo-10", text: "Masthead", w: 114 },
        ];
        const logoY1 = narrow ? 582 : 642;
        const logoY2 = logoY1 + 42;
        const gap = 14;
        const makeLogo = (logo: { id: string; text: string; w: number }, xOff: number, y: number): SceneElement => ({
          id: logo.id, type: "badge",
          rect: { x: mx + xOff, y, width: logo.w, height: 32 },
          throwable: true, pinned: false,
          text: logo.text, fontSize: 15, fontWeight: 700, fontFamily: SANS,
          color: "#6B829B", backgroundColor: "rgba(15,23,42,0.5)", borderRadius: 8,
          border: "1px solid rgba(30,45,63,0.6)",
          mass: 0.25,
          letterSpacing: "0.02em",
        });
        const result: SceneElement[] = [];
        let x1 = 0;
        for (const l of logoRow1) { result.push(makeLogo(l, x1, logoY1)); x1 += l.w + gap; }
        let x2 = 0;
        for (const l of logoRow2) { result.push(makeLogo(l, x2, logoY2)); x2 += l.w + gap; }
        return result;
      })()),

      // ── Hero UI image ──
      {
        id: "l-hero-ui", type: "image",
        rect: { x: heroX, y: heroImageY, width: heroImageW, height: 352 },
        throwable: true, pinned: false,
        backgroundColor: "#0F172A", borderRadius: 22,
        imageAlt: "DOMino Studio product interface", imageSrc: LANDING_UI,
        boxShadow: "0 28px 70px rgba(2,6,23,0.48), 0 0 0 1px rgba(124,58,237,0.12), 0 0 80px rgba(124,58,237,0.08)",
        mass: 2.6,
      },

      // ── Metrics — throwable card ──
      {
        id: "l-metrics", type: "card",
        rect: { x: heroX, y: metricsY, width: heroImageW, height: 112 },
        throwable: true, pinned: false,
        text: "Studio metrics", fontSize: 11, fontWeight: 700, fontFamily: MONO,
        color: "#8CA0B8",
        backgroundColor: "rgba(13,26,42,0.92)", borderRadius: 18, padding: 18,
        border: "1px solid rgba(56,189,248,0.12)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 16px 40px rgba(2,6,23,0.38)",
        mass: 1.4,
        children: [
          {
            id: "l-metrics-row", type: "paragraph",
            rect: { x: 0, y: 14, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "28 presets   ·   94 flowing regions   ·   sub-millisecond layout pass",
            fontSize: 14, fontWeight: 600, fontFamily: SANS, lineHeight: 22, color: "#E8ECF2",
          },
        ],
      },

      // ── Feature section ──
      {
        id: "l-section-k", type: "badge",
        rect: { x: mx, y: sectionY, width: 180, height: 24 },
        throwable: true, pinned: false,
        text: "Why teams stay", fontSize: 11, fontWeight: 700, fontFamily: MONO,
        color: "#94a3b8", backgroundColor: "rgba(15,23,42,0.45)", borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.1)",
        mass: 0.1,
      },
      {
        id: "l-section-h", type: "heading",
        rect: { x: mx, y: sectionY + 38, width: w, height: 38 },
        throwable: false, pinned: true,
        text: "Built like real products, not toy layouts",
        fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 38, color: "#f8fafc",
        backgroundColor: "transparent",
      },
      {
        id: "l-section-p", type: "paragraph",
        rect: { x: mx, y: sectionY + 84, width: Math.min(w * 0.78, 760), height: 84 },
        throwable: false, pinned: true,
        text: "Each preset reads as a shippable surface first: hierarchy you can feel, margins that breathe, and copy that does more than fill space.",
        fontSize: 16, fontWeight: 400, fontFamily: SANS, lineHeight: 27, color: "#8299b0",
        backgroundColor: "transparent",
      },

      // ── Feature cards ──
      {
        id: "l-f1", type: "card",
        rect: { x: mx, y: featureY, width: fW, height: 132 },
        throwable: true, pinned: false,
        text: "Launch surfaces", fontSize: 20, fontWeight: 700, fontFamily: SANS,
        color: "#f8fafc", backgroundColor: "rgba(13,26,42,0.88)", borderRadius: 20, padding: 22,
        border: "1px solid rgba(148,163,184,0.12)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 36px rgba(2,6,23,0.4)",
        mass: 1.4,
        children: [{
          id: "l-f1-d", type: "paragraph",
          rect: { x: 0, y: 12, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Pricing, changelogs, and proof in one frame that still reads clean mid-throw.",
          fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#7B93AB",
        }],
      },
      {
        id: "l-f2", type: "card",
        rect: { x: mx + fW + 12, y: featureY, width: fW, height: 132 },
        throwable: true, pinned: false,
        text: "Editorial packages", fontSize: 20, fontWeight: 700, fontFamily: SANS,
        color: "#f8fafc", backgroundColor: "rgba(13,26,42,0.88)", borderRadius: 20, padding: 22,
        border: "1px solid rgba(148,163,184,0.12)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 36px rgba(2,6,23,0.4)",
        mass: 1.4,
        children: [{
          id: "l-f2-d", type: "paragraph",
          rect: { x: 0, y: 12, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Covers, pull quotes, and sidebars that keep their editorial voice when they slide.",
          fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#7B93AB",
        }],
      },
      {
        id: "l-f3", type: "card",
        rect: { x: mx + (fW + 12) * 2, y: featureY, width: fW, height: 132 },
        throwable: true, pinned: false,
        text: "Operational pages", fontSize: 20, fontWeight: 700, fontFamily: SANS,
        color: "#f8fafc", backgroundColor: "rgba(13,26,42,0.88)", borderRadius: 20, padding: 22,
        border: "1px solid rgba(148,163,184,0.12)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 36px rgba(2,6,23,0.4)",
        mass: 1.4,
        children: [{
          id: "l-f3-d", type: "paragraph",
          rect: { x: 0, y: 12, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Status and ops views with real density — legible before and after the widgets scatter.",
          fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#7B93AB",
        }],
      },

      // ── Word labels — throwable badges ──
      {
        id: "l-words-1", type: "badge",
        rect: { x: mx, y: wordsY, width: 120, height: 38 },
        throwable: true, pinned: false,
        text: "Article", fontSize: 26, fontWeight: 700, fontFamily: SANS,
        color: "#F8FAFC", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10,
        mass: 0.4,
      },
      {
        id: "l-words-2", type: "badge",
        rect: { x: mx + 136, y: wordsY, width: 172, height: 38 },
        throwable: true, pinned: false,
        text: "Dashboard", fontSize: 26, fontWeight: 700, fontFamily: SANS,
        color: "#9FB0C5", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10,
        mass: 0.45,
      },
      {
        id: "l-words-3", type: "badge",
        rect: { x: mx + 324, y: wordsY, width: 142, height: 38 },
        throwable: true, pinned: false,
        text: "Editorial", fontSize: 26, fontWeight: 700, fontFamily: SANS,
        color: "#F8FAFC", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10,
        mass: 0.4,
      },
      {
        id: "l-words-4", type: "badge",
        rect: { x: mx + 482, y: wordsY, width: 138, height: 38 },
        throwable: true, pinned: false,
        text: "Landing", fontSize: 26, fontWeight: 700, fontFamily: SANS,
        color: "#9FB0C5", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10,
        mass: 0.4,
      },
      {
        id: "l-words-p", type: "paragraph",
        rect: { x: mx, y: wordsY + 50, width: w, height: 52 },
        throwable: false, pinned: true,
        text: "Each page type keeps its own tone. You get a system of surfaces, not a grid of same-y cards.",
        fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 25, color: "#8299b0",
        backgroundColor: "transparent",
      },

      // ── Quote card ──
      {
        id: "l-quote-card", type: "card",
        rect: { x: mx, y: quoteY, width: w, height: 160 },
        throwable: true, pinned: false,
        text: "From the teams using it", fontSize: 11, fontWeight: 700, fontFamily: MONO,
        color: "#94a3b8", backgroundColor: "rgba(13,26,42,0.9)", borderRadius: 20, padding: 24,
        border: "1px solid rgba(167,139,250,0.15)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 16px 44px rgba(2,6,23,0.42)",
        mass: 2,
        children: [
          {
            id: "l-quote-a", type: "paragraph",
            rect: { x: 0, y: 16, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "\u201CWe mocked a magazine cover and a metrics wall the same afternoon. For once the comps felt authored — not like a template had sneezed.\u201D",
            fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 29, color: "#d2dce6",
          },
          {
            id: "l-quote-b", type: "paragraph",
            rect: { x: 0, y: 12, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Ava Moreno, design engineering lead at Masthead",
            fontSize: 12, fontWeight: 600, fontFamily: SANS, lineHeight: 18, color: "#C4B5FD",
          },
        ],
      },

      // ── Pricing — throwable card ──
      {
        id: "l-plan", type: "card",
        rect: { x: mx, y: pricingY, width: narrow ? w : 320, height: 228 },
        throwable: true, pinned: false,
        text: "Starter plan", fontSize: 20, fontWeight: 700, fontFamily: SANS,
        color: "#f8fafc", backgroundColor: "rgba(13,26,42,0.9)", borderRadius: 20, padding: 22,
        border: "1px solid rgba(148,163,184,0.14)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 14px 40px rgba(2,6,23,0.4)",
        mass: 1.8,
        children: [
          {
            id: "l-plan-price", type: "paragraph",
            rect: { x: 0, y: 14, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "$49 / editor / month",
            fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#FFFFFF",
          },
          {
            id: "l-plan-desc", type: "paragraph",
            rect: { x: 0, y: 12, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Full preset library, scene editor, import tools, and unlimited prototypes.",
            fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#7B93AB",
          },
          {
            id: "l-plan-ent", type: "paragraph",
            rect: { x: 0, y: 8, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Enterprise adds team permissions, shared collections, and publishing workflows.",
            fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#56708A",
          },
        ],
      },

      // ── Checklist — throwable card ──
      {
        id: "l-checklist", type: "card",
        rect: { x: narrow ? mx : mx + 336, y: narrow ? pricingY + 244 : pricingY, width: narrow ? w : w - 336, height: 228 },
        throwable: true, pinned: false,
        text: "Launch in one afternoon", fontSize: 20, fontWeight: 700, fontFamily: SANS,
        color: "#f8fafc", backgroundColor: "rgba(13,26,42,0.9)", borderRadius: 20, padding: 22,
        border: "1px solid rgba(148,163,184,0.14)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 14px 40px rgba(2,6,23,0.4)",
        mass: 1.8,
        children: [
          {
            id: "l-check-a", type: "paragraph",
            rect: { x: 0, y: 14, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "1  Pick a preset that fits your page type",
            fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 24, color: "#C4B5FD",
          },
          {
            id: "l-check-b", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "2  Drop in your content and assets",
            fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 24, color: "#C4B5FD",
          },
          {
            id: "l-check-c", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "3  Tune physics and save reusable fragments",
            fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 24, color: "#C4B5FD",
          },
          {
            id: "l-check-d", type: "paragraph",
            rect: { x: 0, y: 4, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "4  Ship a page that holds up under interaction",
            fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 24, color: "#C4B5FD",
          },
          {
            id: "l-check-e", type: "paragraph",
            rect: { x: 0, y: 10, width: 0, height: 0 },
            throwable: false, pinned: true,
            text: "Most teams go from first import to published page in under four hours.",
            fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#7B93AB",
          },
        ],
      },

      // ── Bottom CTA ──
      {
        id: "l-bottom", type: "card",
        rect: { x: mx, y: bottomY, width: w, height: 72 },
        throwable: true, pinned: false,
        text: "",
        fontSize: 15, fontWeight: 400, fontFamily: SANS,
        color: "#94a3b8", backgroundColor: "rgba(13,26,42,0.55)", borderRadius: 16, padding: 20,
        border: "1px solid rgba(148,163,184,0.12)",
        backdropFilter: "blur(14px)",
        mass: 1.2,
        children: [{
          id: "l-bottom-p", type: "paragraph",
          rect: { x: 0, y: 0, width: 0, height: 0 },
          throwable: false, pinned: true,
          text: "Pages that feel crafted before anyone touches them — and still feel crafted after. Start building for free, no credit card required.",
          fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#8599B0",
        }],
      },

      // ── Footer ──
      {
        id: "l-footer-line-top", type: "divider",
        rect: { x: mx, y: footerY, width: w, height: 1 },
        throwable: false, pinned: true,
        backgroundColor: "#152236",
      },
      // Brand
      {
        id: "l-footer-brand", type: "badge",
        rect: { x: mx, y: footerY + 36, width: 46, height: 46 },
        throwable: true, pinned: false,
        text: "DO", fontSize: 14, fontWeight: 800, fontFamily: MONO,
        color: "#94A3B8", backgroundColor: "rgba(124,58,237,0.12)", borderRadius: 14, padding: 6,
        mass: 0.2,
      },
      {
        id: "l-footer-name", type: "heading",
        rect: { x: mx + 58, y: footerY + 40, width: 200, height: 22 },
        throwable: false, pinned: true,
        text: "DOMino Studio", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#94A3B8",
        backgroundColor: "transparent",
      },
      {
        id: "l-footer-tagline", type: "paragraph",
        rect: { x: mx + 58, y: footerY + 64, width: 240, height: 18 },
        throwable: false, pinned: true,
        text: "Layout that keeps its nerve when physics shows up.",
        fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18, color: "#3D5269",
        backgroundColor: "transparent",
      },
      // Nav columns
      ...((() => {
        const cols = [
          { label: "Product", items: ["Features", "Pricing", "Changelog", "Docs"] },
          { label: "Resources", items: ["Blog", "Guides", "API", "Community"] },
          { label: "Company", items: ["About", "Careers", "Privacy", "Terms"] },
        ];
        const colStartX = narrow ? 0 : Math.floor(w * 0.42);
        const colSpacing = narrow ? Math.floor(w / 3) : Math.floor(w * 0.19);
        const colTopY = narrow ? footerY + 116 : footerY + 36;
        const result: SceneElement[] = [];
        cols.forEach((col, ci) => {
          result.push({
            id: `l-ft-h${ci}`, type: "heading",
            rect: { x: mx + colStartX + ci * colSpacing, y: colTopY, width: 120, height: 16 },
            throwable: false, pinned: true,
            text: col.label, fontSize: 11, fontWeight: 700, fontFamily: MONO,
            lineHeight: 16, color: "#4A6178", letterSpacing: "0.06em",
            backgroundColor: "transparent",
          });
          col.items.forEach((item, ii) => {
            result.push({
              id: `l-ft-${ci}-${ii}`, type: "heading",
              rect: { x: mx + colStartX + ci * colSpacing, y: colTopY + 26 + ii * 24, width: 120, height: 18 },
              throwable: false, pinned: true,
              text: item, fontSize: 13, fontWeight: 400, fontFamily: SANS,
              lineHeight: 18, color: "#5D728A",
              backgroundColor: "transparent",
            });
          });
        });
        return result;
      })()),
      // Copyright bar
      {
        id: "l-footer-line", type: "divider",
        rect: { x: mx, y: footerY + (narrow ? 240 : 160), width: w, height: 1 },
        throwable: false, pinned: true,
        backgroundColor: "#152236",
      },
      {
        id: "l-footer-copy", type: "paragraph",
        rect: { x: mx, y: footerY + (narrow ? 256 : 176), width: w / 2, height: 16 },
        throwable: false, pinned: true,
        text: "© 2026 DOMino Studio", fontSize: 11, fontWeight: 400, fontFamily: SANS, lineHeight: 16, color: "#2E4358",
        backgroundColor: "transparent",
      },
      {
        id: "l-footer-links", type: "paragraph",
        rect: { x: mx + w / 2, y: footerY + (narrow ? 256 : 176), width: w / 2, height: 16 },
        throwable: false, pinned: true,
        text: "Status   ·   Twitter   ·   GitHub",
        fontSize: 11, fontWeight: 400, fontFamily: SANS, lineHeight: 16, color: "#2E4358",
        textAlign: "right",
        backgroundColor: "transparent",
      },
    ],
  };
}
