import type { SceneDescription } from "../types";
import { SANS, SERIF, MONO } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const LANDING_UI = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="360" viewBox="0 0 420 360" fill="none">
  <rect width="420" height="360" rx="22" fill="#09111C"/>
  <rect x="18" y="18" width="384" height="324" rx="18" fill="#0F172A" stroke="#233246"/>
  <rect x="38" y="38" width="112" height="12" rx="6" fill="#CBD5E1"/>
  <rect x="38" y="68" width="344" height="166" rx="16" fill="#111F34"/>
  <path d="M60 184C88 164 118 152 144 156C176 160 192 116 226 116C258 116 274 146 306 146C330 146 348 136 364 122" stroke="#8B5CF6" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 198C94 192 122 182 154 186C186 190 212 170 236 170C274 170 304 192 364 172" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
  <circle cx="226" cy="116" r="7" fill="#8B5CF6"/>
  <circle cx="306" cy="146" r="7" fill="#38BDF8"/>
  <rect x="38" y="254" width="112" height="66" rx="14" fill="#13253B"/>
  <rect x="164" y="254" width="106" height="66" rx="14" fill="#13253B"/>
  <rect x="284" y="254" width="98" height="66" rx="14" fill="#13253B"/>
  <text x="56" y="282" fill="#E2E8F0" font-size="12" font-family="Arial, sans-serif">Layouts synced</text>
  <text x="56" y="304" fill="#FFFFFF" font-size="22" font-family="Arial, sans-serif" font-weight="700">94</text>
  <text x="182" y="282" fill="#E2E8F0" font-size="12" font-family="Arial, sans-serif">Live scenes</text>
  <text x="182" y="304" fill="#FFFFFF" font-size="22" font-family="Arial, sans-serif" font-weight="700">12</text>
  <text x="302" y="282" fill="#E2E8F0" font-size="12" font-family="Arial, sans-serif">Avg refresh</text>
  <text x="302" y="304" fill="#FFFFFF" font-size="22" font-family="Arial, sans-serif" font-weight="700">0.08ms</text>
</svg>
`);

export function createLandingScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 1100);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1660);
  const fW = (w - 24) / 3;
  const heroImageW = Math.min(400, w * 0.37);
  const heroX = mx + w - heroImageW;
  const heroTextW = heroX - mx - 40;

  return {
    id: "landing", name: "Landing Page", width: vw, height: H, backgroundColor: "#07111D",
    elements: [
      { id: "l-logo", type: "badge", rect: { x: mx, y: 18, width: 54, height: 54 }, throwable: true, pinned: false, text: "DO", fontSize: 16, fontWeight: 800, fontFamily: MONO, color: "#E2E8F0", backgroundColor: "rgba(124,58,237,0.18)", borderRadius: 16, padding: 8, mass: 0.3 },
      { id: "l-brand", type: "heading", rect: { x: mx + 66, y: 22, width: 260, height: 32 }, throwable: false, pinned: true, text: "DOMino Studio", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#F8FAFC" },
      { id: "l-brand-sub", type: "heading", rect: { x: mx + 66, y: 54, width: 200, height: 16 }, throwable: false, pinned: true, text: "Interactive page systems", fontSize: 11, fontWeight: 600, fontFamily: MONO, lineHeight: 16, color: "#8CA0B8" },
      { id: "l-n1", type: "button", rect: { x: mx + w - 364, y: 28, width: 82, height: 28 }, throwable: true, pinned: false, text: "Use cases", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94A3B8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-n2", type: "button", rect: { x: mx + w - 274, y: 28, width: 64, height: 28 }, throwable: true, pinned: false, text: "Pricing", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94A3B8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-n3", type: "button", rect: { x: mx + w - 202, y: 28, width: 56, height: 28 }, throwable: true, pinned: false, text: "Docs", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94A3B8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-signin", type: "button", rect: { x: mx + w - 138, y: 22, width: 68, height: 34 }, throwable: true, pinned: false, text: "Sign in", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#E2E8F0", backgroundColor: "transparent", borderRadius: 8, border: "1px solid #253244", mass: 0.2 },
      { id: "l-cta-nav", type: "button", rect: { x: mx + w - 60, y: 22, width: 60, height: 34 }, throwable: true, pinned: false, text: "Demo", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7C3AED", borderRadius: 8, mass: 0.3 },

      { id: "l-eyebrow", type: "badge", rect: { x: mx, y: 114, width: 214, height: 28 }, throwable: true, pinned: false, text: "NEW: richer preset library", fontSize: 11, fontWeight: 700, fontFamily: MONO, color: "#C4B5FD", backgroundColor: "rgba(124,58,237,0.14)", borderRadius: 14, padding: 6, mass: 0.12 },
      { id: "l-hero", type: "heading", rect: { x: mx, y: 162, width: heroTextW, height: 220 }, throwable: false, pinned: true, text: "Design pages\nthat react like\nliving systems.", fontSize: 68, fontWeight: 800, fontFamily: SANS, lineHeight: 74, color: "#F8FAFC" },
      { id: "l-sub", type: "paragraph", rect: { x: mx, y: 394, width: heroTextW, height: 98 }, throwable: false, pinned: true, text: "DOMino Studio helps teams prototype editorial packages, launch surfaces, and dense operational pages that still feel intentional once the reader starts dragging pieces around. It is layout tooling for pages with actual narrative weight and cleaner visual hierarchy.", fontSize: 18, fontWeight: 400, fontFamily: SANS, lineHeight: 29, color: "#9FB0C5" },
      { id: "l-cta1", type: "button", rect: { x: mx, y: 516, width: 174, height: 50 }, throwable: true, pinned: false, text: "Start building", fontSize: 15, fontWeight: 700, fontFamily: SANS, color: "#fff", backgroundColor: "#7C3AED", borderRadius: 12, mass: 0.6 },
      { id: "l-cta2", type: "button", rect: { x: mx + 188, y: 516, width: 150, height: 50 }, throwable: true, pinned: false, text: "See examples", fontSize: 15, fontWeight: 500, fontFamily: SANS, color: "#E2E8F0", backgroundColor: "transparent", borderRadius: 12, border: "1px solid #2A394D", mass: 0.5 },
      { id: "l-proof", type: "heading", rect: { x: mx, y: 594, width: heroTextW, height: 20 }, throwable: false, pinned: true, text: "Used by design engineers, newsroom prototypers, and docs teams", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 20, color: "#5D728A" },
      { id: "l-logo-1", type: "heading", rect: { x: mx, y: 628, width: 120, height: 24 }, throwable: false, pinned: true, text: "Masthead", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#8398B1" },
      { id: "l-logo-2", type: "heading", rect: { x: mx + 126, y: 628, width: 120, height: 24 }, throwable: false, pinned: true, text: "Orbit Docs", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#8398B1" },
      { id: "l-logo-3", type: "heading", rect: { x: mx + 266, y: 628, width: 120, height: 24 }, throwable: false, pinned: true, text: "Northstar", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#8398B1" },

      { id: "l-hero-ui", type: "image", rect: { x: heroX, y: 138, width: heroImageW, height: 346 }, throwable: true, pinned: false, backgroundColor: "#0F172A", borderRadius: 22, imageAlt: "DOMino Studio product interface", imageSrc: LANDING_UI, boxShadow: "0 24px 60px rgba(2,6,23,0.42)", mass: 2.6 },
      { id: "l-metrics-kicker", type: "heading", rect: { x: heroX, y: 514, width: heroImageW, height: 18 }, throwable: false, pinned: true, text: "Studio metrics", fontSize: 11, fontWeight: 700, fontFamily: MONO, lineHeight: 18, color: "#8CA0B8" },
      { id: "l-metric-1-n", type: "heading", rect: { x: heroX, y: 542, width: 120, height: 34 }, throwable: false, pinned: true, text: "28", fontSize: 34, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#FFFFFF" },
      { id: "l-metric-1-l", type: "heading", rect: { x: heroX, y: 580, width: 120, height: 18 }, throwable: false, pinned: true, text: "scene presets", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#8CA0B8" },
      { id: "l-metric-2-n", type: "heading", rect: { x: heroX + 132, y: 542, width: 120, height: 34 }, throwable: false, pinned: true, text: "94", fontSize: 34, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#FFFFFF" },
      { id: "l-metric-2-l", type: "heading", rect: { x: heroX + 132, y: 580, width: 120, height: 18 }, throwable: false, pinned: true, text: "live text regions", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#8CA0B8" },
      { id: "l-metric-3-n", type: "heading", rect: { x: heroX + 284, y: 542, width: 120, height: 34 }, throwable: false, pinned: true, text: "0.08ms", fontSize: 34, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#FFFFFF" },
      { id: "l-metric-3-l", type: "heading", rect: { x: heroX + 284, y: 580, width: 120, height: 18 }, throwable: false, pinned: true, text: "avg layout pass", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#8CA0B8" },

      { id: "l-section-k", type: "heading", rect: { x: mx, y: 726, width: 180, height: 18 }, throwable: false, pinned: true, text: "Why it feels better", fontSize: 11, fontWeight: 700, fontFamily: MONO, lineHeight: 18, color: "#8CA0B8" },
      { id: "l-section-h", type: "heading", rect: { x: mx, y: 754, width: w, height: 34 }, throwable: false, pinned: true, text: "Built for real page systems", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#F8FAFC" },
      { id: "l-section-p", type: "paragraph", rect: { x: mx, y: 798, width: Math.min(w * 0.78, 760), height: 78 }, throwable: false, pinned: true, text: "The strongest presets read as pages before they are touched. That means larger brands, more typographic rhythm, and fewer containers overloaded with copy. The text should carry the mood. The panels should support it.", fontSize: 16, fontWeight: 400, fontFamily: SANS, lineHeight: 26, color: "#90A2B8" },

      { id: "l-f1", type: "card", rect: { x: mx, y: 906, width: fW, height: 124 }, throwable: true, pinned: false, text: "Launch surfaces", fontSize: 20, fontWeight: 700, fontFamily: SANS, color: "#F8FAFC", backgroundColor: "#0D1A2A", borderRadius: 18, padding: 22, border: "1px solid #223247", boxShadow: "0 14px 34px rgba(2,6,23,0.28)", mass: 1.4,
        children: [{ id: "l-f1-d", type: "paragraph", rect: { x: 0, y: 12, width: 0, height: 0 }, throwable: false, pinned: true, text: "Proof points, release notes, pricing, and momentum in one readable frame.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#91A4BB" }] },
      { id: "l-f2", type: "card", rect: { x: mx + fW + 12, y: 906, width: fW, height: 124 }, throwable: true, pinned: false, text: "Editorial packages", fontSize: 20, fontWeight: 700, fontFamily: SANS, color: "#F8FAFC", backgroundColor: "#0D1A2A", borderRadius: 18, padding: 22, border: "1px solid #223247", boxShadow: "0 14px 34px rgba(2,6,23,0.28)", mass: 1.4,
        children: [{ id: "l-f2-d", type: "paragraph", rect: { x: 0, y: 12, width: 0, height: 0 }, throwable: false, pinned: true, text: "Covers, rails, captions, and plates that still feel edited under motion.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#91A4BB" }] },
      { id: "l-f3", type: "card", rect: { x: mx + (fW + 12) * 2, y: 906, width: fW, height: 124 }, throwable: true, pinned: false, text: "Operational pages", fontSize: 20, fontWeight: 700, fontFamily: SANS, color: "#F8FAFC", backgroundColor: "#0D1A2A", borderRadius: 18, padding: 22, border: "1px solid #223247", boxShadow: "0 14px 34px rgba(2,6,23,0.28)", mass: 1.4,
        children: [{ id: "l-f3-d", type: "paragraph", rect: { x: 0, y: 12, width: 0, height: 0 }, throwable: false, pinned: true, text: "Dense board views with named work, states, and enough whitespace to scan.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#91A4BB" }] },

      { id: "l-words-1", type: "heading", rect: { x: mx, y: 1066, width: 180, height: 32 }, throwable: false, pinned: true, text: "Article", fontSize: 30, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#F8FAFC" },
      { id: "l-words-2", type: "heading", rect: { x: mx + 200, y: 1066, width: 220, height: 32 }, throwable: false, pinned: true, text: "Dashboard", fontSize: 30, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#9FB0C5" },
      { id: "l-words-3", type: "heading", rect: { x: mx + 458, y: 1066, width: 200, height: 32 }, throwable: false, pinned: true, text: "Editorial", fontSize: 30, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#F8FAFC" },
      { id: "l-words-4", type: "heading", rect: { x: mx + 708, y: 1066, width: 180, height: 32 }, throwable: false, pinned: true, text: "Landing", fontSize: 30, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#9FB0C5" },
      { id: "l-words-p", type: "paragraph", rect: { x: mx, y: 1110, width: w, height: 52 }, throwable: false, pinned: true, text: "The library works best when each page has its own voice. These larger labels make the page feel like a system of distinct publication modes instead of one endless feature grid.", fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#90A2B8" },

      { id: "l-quote-card", type: "card", rect: { x: mx, y: 1188, width: w, height: 154 }, throwable: true, pinned: false, text: "What teams say after switching", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#F8FAFC", backgroundColor: "#0D1A2A", borderRadius: 18, padding: 24, border: "1px solid #223247", boxShadow: "0 18px 40px rgba(2,6,23,0.28)", mass: 2,
        children: [
          { id: "l-quote-a", type: "paragraph", rect: { x: 0, y: 16, width: 0, height: 0 }, throwable: false, pinned: true, text: '"We were able to prototype a whole Sunday package and an analytics launch page in the same system. The pages finally felt authored instead of AI-generated placeholders."', fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 28, color: "#D7E0EA" },
          { id: "l-quote-b", type: "paragraph", rect: { x: 0, y: 12, width: 0, height: 0 }, throwable: false, pinned: true, text: "Ava Moreno, design engineering lead at Masthead", fontSize: 12, fontWeight: 600, fontFamily: SANS, lineHeight: 18, color: "#C4B5FD" },
        ] },

      { id: "l-plan-bg", type: "container", rect: { x: mx, y: 1374, width: 320, height: 228 }, throwable: false, pinned: true, backgroundColor: "#0D1A2A", borderRadius: 18, border: "1px solid #223247", boxShadow: "0 18px 40px rgba(2,6,23,0.28)" },
      { id: "l-check-bg", type: "container", rect: { x: mx + 336, y: 1374, width: w - 336, height: 228 }, throwable: false, pinned: true, backgroundColor: "#0D1A2A", borderRadius: 18, border: "1px solid #223247", boxShadow: "0 18px 40px rgba(2,6,23,0.28)" },
      { id: "l-plan-h", type: "heading", rect: { x: mx + 22, y: 1398, width: 220, height: 24 }, throwable: false, pinned: true, text: "Starter plan", fontSize: 20, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#F8FAFC" },
      { id: "l-plan-a", type: "heading", rect: { x: mx + 22, y: 1434, width: 260, height: 34 }, throwable: false, pinned: true, text: "$49 / editor / month", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#FFFFFF" },
      { id: "l-plan-b", type: "paragraph", rect: { x: mx + 22, y: 1482, width: 276, height: 44 }, throwable: false, pinned: true, text: "Preset library, scene editor, import tools, and unlimited local prototypes.", fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#91A4BB" },
      { id: "l-plan-c", type: "paragraph", rect: { x: mx + 22, y: 1534, width: 276, height: 40 }, throwable: false, pinned: true, text: "Enterprise adds approvals, shared collections, and publishing workflows.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#91A4BB" },

      { id: "l-check-h", type: "heading", rect: { x: mx + 358, y: 1398, width: 260, height: 24 }, throwable: false, pinned: true, text: "Launch in one afternoon", fontSize: 20, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#F8FAFC" },
      { id: "l-check-a", type: "paragraph", rect: { x: mx + 358, y: 1434, width: w - 380, height: 20 }, throwable: false, pinned: true, text: "1  Choose a preset with the right narrative shape", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#C4B5FD" },
      { id: "l-check-b", type: "paragraph", rect: { x: mx + 358, y: 1462, width: w - 380, height: 20 }, throwable: false, pinned: true, text: "2  Swap in your copy, diagrams, and named work items", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#C4B5FD" },
      { id: "l-check-c", type: "paragraph", rect: { x: mx + 358, y: 1490, width: w - 380, height: 20 }, throwable: false, pinned: true, text: "3  Tune motion and save reusable scene fragments", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#C4B5FD" },
      { id: "l-check-d", type: "paragraph", rect: { x: mx + 358, y: 1518, width: w - 380, height: 20 }, throwable: false, pinned: true, text: "4  Publish a page that still looks intentional after interaction", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#C4B5FD" },
      { id: "l-check-e", type: "paragraph", rect: { x: mx + 358, y: 1550, width: w - 380, height: 34 }, throwable: false, pinned: true, text: "The richer presets are meant to demonstrate that last step, not just the mechanics behind it.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#91A4BB" },

      { id: "l-bottom", type: "paragraph", rect: { x: mx, y: 1618, width: w, height: 42 }, throwable: false, pinned: true, text: "No empty hero placeholders. No tiny logos pretending to be social proof. Just presets with enough specificity to feel like real pages you might actually publish, audit, or present to a team.", fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#8196AD" },
    ],
  };
}
