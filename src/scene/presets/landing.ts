import type { SceneDescription, SceneElement } from "../types";
import { SANS, SERIF, MONO } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const LANDING_UI = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="360" viewBox="0 0 420 360" fill="none">
  <rect width="420" height="360" rx="22" fill="#080d14"/>
  <rect x="18" y="18" width="384" height="324" rx="18" fill="#0c1424" stroke="rgba(148,163,184,0.12)"/>
  <rect x="38" y="38" width="112" height="12" rx="6" fill="rgba(148,163,184,0.35)"/>
  <rect x="38" y="68" width="344" height="166" rx="16" fill="#0e1a2e"/>
  <path d="M60 184C88 164 118 152 144 156C176 160 192 116 226 116C258 116 274 146 306 146C330 146 348 136 364 122" stroke="#a78bfa" stroke-width="3.5" stroke-linecap="round" opacity="0.95"/>
  <path d="M60 198C94 192 122 182 154 186C186 190 212 170 236 170C274 170 304 192 364 172" stroke="#67e8f9" stroke-width="3.5" stroke-linecap="round" opacity="0.9"/>
  <circle cx="226" cy="116" r="6" fill="#a78bfa"/>
  <circle cx="306" cy="146" r="6" fill="#22d3ee"/>
  <rect x="38" y="254" width="112" height="66" rx="14" fill="#111f33" stroke="rgba(124,58,237,0.15)"/>
  <rect x="164" y="254" width="106" height="66" rx="14" fill="#111f33" stroke="rgba(56,189,248,0.12)"/>
  <rect x="284" y="254" width="98" height="66" rx="14" fill="#111f33" stroke="rgba(148,163,184,0.1)"/>
  <text x="56" y="282" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif" letter-spacing="0.02em">Layouts synced</text>
  <text x="56" y="304" fill="#f8fafc" font-size="22" font-family="Arial, sans-serif" font-weight="700">94</text>
  <text x="182" y="282" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif" letter-spacing="0.02em">Live scenes</text>
  <text x="182" y="304" fill="#f8fafc" font-size="22" font-family="Arial, sans-serif" font-weight="700">12</text>
  <text x="302" y="282" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif" letter-spacing="0.02em">Avg refresh</text>
  <text x="302" y="304" fill="#f8fafc" font-size="22" font-family="Arial, sans-serif" font-weight="700">0.08ms</text>
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

  const heroImageY = narrow ? 540 : 138;
  const metricsY = narrow ? heroImageY + 360 : 514;
  const sectionY = narrow ? metricsY + 156 : 766;
  const featureY = sectionY + 180;
  const wordsY = featureY + 180;
  const quoteY = wordsY + 140;
  const pricingY = quoteY + 220;
  const bottomY = pricingY + 280;
  const footerY = bottomY + 140;
  const H = Math.max(vh, footerY + (narrow ? 272 : 192) + 40);

  return {
    id: "landing", name: "Landing Page", width: vw, height: H,
    backgroundColor: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(124,58,237,0.14) 0%, transparent 50%), linear-gradient(180deg, #050a12 0%, #07111d 45%, #0a1624 100%)",
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
        text: "Interactive page systems", fontSize: 11, fontWeight: 600, fontFamily: MONO, lineHeight: 16, color: "#7c8ea3",
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
        text: "NEW: richer preset library", fontSize: 11, fontWeight: 700, fontFamily: MONO,
        color: "#ddd6fe", backgroundColor: "rgba(124,58,237,0.18)", borderRadius: 14, padding: 6,
        border: "1px solid rgba(167,139,250,0.22)",
        mass: 0.12,
      },
      {
        id: "l-hero", type: "heading",
        rect: { x: mx, y: 162, width: heroTextW, height: 220 },
        throwable: false, pinned: true,
        text: "Design pages\nthat react like\nliving systems.",
        fontSize: narrow ? 44 : 68, fontWeight: 800, fontFamily: SANS,
        lineHeight: narrow ? 50 : 74, color: "#fafbfc",
        backgroundColor: "transparent",
      },
      {
        id: "l-sub", type: "paragraph",
        rect: { x: mx, y: narrow ? 360 : 394, width: heroTextW, height: 98 },
        throwable: false, pinned: true,
        text: "Prototype editorial layouts, launch pages, and dense operational views where every element responds to interaction — without sacrificing the craft that makes a page feel intentional.",
        fontSize: 18, fontWeight: 400, fontFamily: SANS, lineHeight: 29, color: "#8ba3b8",
        backgroundColor: "transparent",
      },
      {
        id: "l-cta1", type: "button",
        rect: { x: mx, y: narrow ? 476 : 516, width: 174, height: 50 },
        throwable: true, pinned: false,
        text: "Get started", fontSize: 15, fontWeight: 700, fontFamily: SANS,
        color: "#fff", backgroundColor: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: 14,
        boxShadow: "0 8px 32px rgba(124,58,237,0.42), 0 0 0 1px rgba(255,255,255,0.1) inset",
        mass: 0.6,
      },
      {
        id: "l-cta2", type: "button",
        rect: { x: mx + 188, y: narrow ? 476 : 516, width: 150, height: 50 },
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
        text: "Trusted by 2,000+ teams building production pages",
        fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 20, color: "#5D728A",
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
        const logoY1 = narrow ? 568 : 628;
        const logoY2 = logoY1 + 40;
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
        rect: { x: heroX, y: heroImageY, width: heroImageW, height: 346 },
        throwable: true, pinned: false,
        backgroundColor: "#0F172A", borderRadius: 22,
        imageAlt: "DOMino Studio product interface", imageSrc: LANDING_UI,
        boxShadow: "0 28px 70px rgba(2,6,23,0.48), 0 0 0 1px rgba(124,58,237,0.12), 0 0 80px rgba(124,58,237,0.08)",
        mass: 2.6,
      },

      // ── Metrics — throwable card ──
      {
        id: "l-metrics", type: "card",
        rect: { x: heroX, y: metricsY, width: heroImageW, height: 108 },
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
            text: "28 scene presets   ·   94 live text regions   ·   0.08ms avg layout pass",
            fontSize: 14, fontWeight: 600, fontFamily: SANS, lineHeight: 22, color: "#E8ECF2",
          },
        ],
      },

      // ── Feature section ──
      {
        id: "l-section-k", type: "badge",
        rect: { x: mx, y: sectionY, width: 180, height: 24 },
        throwable: true, pinned: false,
        text: "Why it feels better", fontSize: 11, fontWeight: 700, fontFamily: MONO,
        color: "#8CA0B8", backgroundColor: "rgba(15,23,42,0.5)", borderRadius: 6,
        mass: 0.1,
      },
      {
        id: "l-section-h", type: "heading",
        rect: { x: mx, y: sectionY + 34, width: w, height: 34 },
        throwable: false, pinned: true,
        text: "Built for real page systems",
        fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#F8FAFC",
        backgroundColor: "transparent",
      },
      {
        id: "l-section-p", type: "paragraph",
        rect: { x: mx, y: sectionY + 76, width: Math.min(w * 0.78, 760), height: 78 },
        throwable: false, pinned: true,
        text: "Every preset is designed to look like a finished page before anyone touches it. Real typographic rhythm, deliberate whitespace, and content that carries its own weight.",
        fontSize: 16, fontWeight: 400, fontFamily: SANS, lineHeight: 26, color: "#8599B0",
        backgroundColor: "transparent",
      },

      // ── Feature cards ──
      {
        id: "l-f1", type: "card",
        rect: { x: mx, y: featureY, width: fW, height: 124 },
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
          text: "Pricing, changelogs, and proof points in one frame that holds together under interaction.",
          fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#7B93AB",
        }],
      },
      {
        id: "l-f2", type: "card",
        rect: { x: mx + fW + 12, y: featureY, width: fW, height: 124 },
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
          text: "Covers, pull quotes, and sidebars that still feel edited when readers drag them.",
          fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#7B93AB",
        }],
      },
      {
        id: "l-f3", type: "card",
        rect: { x: mx + (fW + 12) * 2, y: featureY, width: fW, height: 124 },
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
          text: "Status boards and dashboards with real data density and room to breathe.",
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
        text: "Every page type gets its own voice. Not a feature grid — a system of distinct, publishable surfaces.",
        fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#8599B0",
        backgroundColor: "transparent",
      },

      // ── Quote card ──
      {
        id: "l-quote-card", type: "card",
        rect: { x: mx, y: quoteY, width: w, height: 154 },
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
            text: "\u201CWe prototyped a magazine cover and an analytics dashboard in the same afternoon. First time our pages felt authored, not generated.\u201D",
            fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 28, color: "#D0DBE6",
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
        text: "Layout tooling for pages with weight.",
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
