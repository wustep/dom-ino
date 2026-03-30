import type { SceneDescription } from "./types";
import { createSampleScene } from "./sampleScene";

const SANS = '"DM Sans", "Helvetica Neue", sans-serif';
const SERIF = '"Source Serif 4", Georgia, serif';
const MONO = '"JetBrains Mono", monospace';

export function createDashboardScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 1100);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1000);
  const cW = (w - 24) / 3;
  const sideW = w * 0.34;
  const mainW = w - sideW - 20;

  return {
    id: "dashboard", name: "Dashboard", width: vw, height: H, backgroundColor: "#f8fafc",
    elements: [
      // Top bar
      { id: "d-logo", type: "badge", rect: { x: mx, y: 18, width: 36, height: 36 }, throwable: true, pinned: false, text: "A", fontSize: 16, fontWeight: 800, fontFamily: SANS, color: "#fff", backgroundColor: "#3b82f6", borderRadius: 10, padding: 8, mass: 0.3 },
      { id: "d-title", type: "heading", rect: { x: mx + 46, y: 22, width: 120, height: 28 }, throwable: false, pinned: true, text: "Analytics", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#0f172a" },
      { id: "d-nav1", type: "button", rect: { x: mx + 200, y: 24, width: 80, height: 28 }, throwable: true, pinned: false, text: "Overview", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)", borderRadius: 6, mass: 0.15 },
      { id: "d-nav2", type: "button", rect: { x: mx + 288, y: 24, width: 80, height: 28 }, throwable: true, pinned: false, text: "Reports", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "transparent", borderRadius: 6, mass: 0.15 },
      { id: "d-nav3", type: "button", rect: { x: mx + 376, y: 24, width: 80, height: 28 }, throwable: true, pinned: false, text: "Settings", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "transparent", borderRadius: 6, mass: 0.15 },
      { id: "d-avatar", type: "badge", rect: { x: mx + w - 36, y: 18, width: 36, height: 36 }, throwable: true, pinned: false, text: "JS", fontSize: 12, fontWeight: 700, fontFamily: SANS, color: "#fff", backgroundColor: "#6366f1", borderRadius: 18, padding: 8, mass: 0.2 },
      { id: "d-search", type: "input", rect: { x: mx + w - 240, y: 22, width: 190, height: 32 }, throwable: true, pinned: false, text: "Search...", fontSize: 13, fontFamily: SANS, color: "#94a3b8", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 8, mass: 0.3 },
      { id: "d-div", type: "divider", rect: { x: mx, y: 62, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#e2e8f0" },

      // Page title
      { id: "d-page-title", type: "heading", rect: { x: mx, y: 78, width: 200, height: 28 }, throwable: false, pinned: true, text: "Dashboard", fontSize: 22, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#0f172a" },
      { id: "d-period", type: "badge", rect: { x: mx + w - 130, y: 80, width: 130, height: 28 }, throwable: true, pinned: false, text: "Last 30 days \u25BE", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#475569", backgroundColor: "#fff", borderRadius: 6, border: "1px solid #e2e8f0", padding: 6, mass: 0.15 },

      // KPI row
      { id: "kpi-1", type: "card", rect: { x: mx, y: 120, width: cW, height: 100 }, throwable: true, pinned: false, text: "Revenue", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0", mass: 1.2,
        children: [{ id: "kpi-1-v", type: "paragraph", rect: { x: 0, y: 28, width: cW - 32, height: 30 }, throwable: false, pinned: true, text: "$142,580", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#0f172a" }] },
      { id: "kpi-2", type: "card", rect: { x: mx + cW + 12, y: 120, width: cW, height: 100 }, throwable: true, pinned: false, text: "Active Users", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0", mass: 1.2,
        children: [{ id: "kpi-2-v", type: "paragraph", rect: { x: 0, y: 28, width: cW - 32, height: 30 }, throwable: false, pinned: true, text: "23,847", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#0f172a" }] },
      { id: "kpi-3", type: "card", rect: { x: mx + (cW + 12) * 2, y: 120, width: cW, height: 100 }, throwable: true, pinned: false, text: "Conversion", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0", mass: 1.2,
        children: [{ id: "kpi-3-v", type: "paragraph", rect: { x: 0, y: 28, width: cW - 32, height: 30 }, throwable: false, pinned: true, text: "4.28%", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#16a34a" }] },

      // Chart
      { id: "d-chart", type: "image", rect: { x: mx, y: 236, width: mainW, height: 280 }, throwable: true, pinned: false, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", mass: 3 },

      // Sidebar
      { id: "d-side-h", type: "heading", rect: { x: mx + mainW + 20, y: 236, width: sideW, height: 22 }, throwable: false, pinned: true, text: "Recent Activity", fontSize: 14, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0f172a" },
      { id: "d-side-p", type: "paragraph", rect: { x: mx + mainW + 20, y: 268, width: sideW, height: 200 }, throwable: false, pinned: true,
        text: "User signups increased by 12% this week compared to the previous period. The marketing campaign launched on Monday contributed to a significant spike in traffic from social media channels. Mobile users now account for 67% of all sessions, up from 58% last quarter. Server response times improved 23% after the infrastructure migration.",
        fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#475569" },

      // Badges + buttons
      { id: "d-live", type: "badge", rect: { x: mx + mainW + 20, y: 480, width: 52, height: 22 }, throwable: true, pinned: false, text: "LIVE", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#16a34a", borderRadius: 11, padding: 4, mass: 0.08 },
      { id: "d-alert", type: "badge", rect: { x: mx + mainW + 80, y: 480, width: 72, height: 22 }, throwable: true, pinned: false, text: "2 ALERTS", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#ef4444", borderRadius: 11, padding: 4, mass: 0.08 },
      { id: "d-export", type: "button", rect: { x: mx, y: 532, width: 110, height: 34 }, throwable: true, pinned: false, text: "Export CSV", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#3b82f6", borderRadius: 8, mass: 0.4 },
      { id: "d-filter", type: "button", rect: { x: mx + 118, y: 532, width: 90, height: 34 }, throwable: true, pinned: false, text: "Filters", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#475569", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", mass: 0.3 },

      // Bottom table-like summary
      { id: "d-table-h", type: "heading", rect: { x: mx, y: 586, width: w, height: 22 }, throwable: false, pinned: true, text: "Summary", fontSize: 16, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0f172a" },
      { id: "d-table-p", type: "paragraph", rect: { x: mx, y: 620, width: w, height: 200 }, throwable: false, pinned: true,
        text: "The platform continues to show strong growth across all key metrics. Customer satisfaction scores remain at an all-time high of 4.8 out of 5 stars. The engineering team is on track to deliver the next major release by the end of the quarter, which will include enhanced reporting capabilities, a redesigned onboarding flow, and improved real-time collaboration features for enterprise teams.",
        fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#64748b" },
    ],
  };
}

export function createLandingScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 1000);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1200);
  const fW = (w - 24) / 3;

  return {
    id: "landing", name: "Landing Page", width: vw, height: H, backgroundColor: "#09090b",
    elements: [
      // Nav
      { id: "l-logo", type: "badge", rect: { x: mx, y: 20, width: 40, height: 40 }, throwable: true, pinned: false, text: "\u25C6", fontSize: 18, fontWeight: 400, fontFamily: SANS, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 10, padding: 8, mass: 0.3 },
      { id: "l-brand", type: "heading", rect: { x: mx + 50, y: 26, width: 80, height: 28 }, throwable: false, pinned: true, text: "Acme", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#f8fafc" },
      { id: "l-n1", type: "button", rect: { x: mx + w - 320, y: 26, width: 70, height: 28 }, throwable: true, pinned: false, text: "Features", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94a3b8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-n2", type: "button", rect: { x: mx + w - 240, y: 26, width: 70, height: 28 }, throwable: true, pinned: false, text: "Pricing", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94a3b8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-n3", type: "button", rect: { x: mx + w - 160, y: 26, width: 60, height: 28 }, throwable: true, pinned: false, text: "Docs", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94a3b8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-cta-nav", type: "button", rect: { x: mx + w - 90, y: 22, width: 90, height: 34 }, throwable: true, pinned: false, text: "Sign Up", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7c3aed", borderRadius: 8, mass: 0.3 },

      // Hero
      { id: "l-eyebrow", type: "badge", rect: { x: mx, y: 100, width: 160, height: 26 }, throwable: true, pinned: false, text: "Announcing v3.0 \u2192", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 13, padding: 6, mass: 0.12 },
      { id: "l-hero", type: "heading", rect: { x: mx, y: 142, width: w, height: 140 }, throwable: false, pinned: true, text: "Build faster.\nShip smarter.", fontSize: 60, fontWeight: 800, fontFamily: SANS, lineHeight: 68, color: "#f8fafc" },
      { id: "l-sub", type: "paragraph", rect: { x: mx, y: 296, width: Math.min(w * 0.58, 540), height: 80 }, throwable: false, pinned: true, text: "The all-in-one platform for modern development teams. From prototype to production, we handle the infrastructure so you can focus on what matters.", fontSize: 17, fontWeight: 400, fontFamily: SANS, lineHeight: 26, color: "#94a3b8" },

      // CTAs
      { id: "l-cta1", type: "button", rect: { x: mx, y: 396, width: 160, height: 48 }, throwable: true, pinned: false, text: "Start Free Trial", fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7c3aed", borderRadius: 10, mass: 0.6 },
      { id: "l-cta2", type: "button", rect: { x: mx + 174, y: 396, width: 140, height: 48 }, throwable: true, pinned: false, text: "Watch Demo", fontSize: 15, fontWeight: 500, fontFamily: SANS, color: "#e2e8f0", backgroundColor: "transparent", borderRadius: 10, border: "1px solid #334155", mass: 0.5 },

      // Social proof
      { id: "l-proof", type: "heading", rect: { x: mx, y: 470, width: w, height: 20 }, throwable: false, pinned: true, text: "Trusted by 50,000+ developers worldwide", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 20, color: "#64748b" },

      // Feature cards
      { id: "l-f1", type: "card", rect: { x: mx, y: 516, width: fW, height: 160 }, throwable: true, pinned: false, text: "Lightning Fast", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#f8fafc", backgroundColor: "#18181b", borderRadius: 14, padding: 20, border: "1px solid #27272a", mass: 1.4,
        children: [{ id: "l-f1-d", type: "paragraph", rect: { x: 0, y: 32, width: fW - 40, height: 80 }, throwable: false, pinned: true, text: "Sub-millisecond deploys with edge-optimized infrastructure across 200+ locations.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#71717a" }] },
      { id: "l-f2", type: "card", rect: { x: mx + fW + 12, y: 516, width: fW, height: 160 }, throwable: true, pinned: false, text: "Auto Scaling", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#f8fafc", backgroundColor: "#18181b", borderRadius: 14, padding: 20, border: "1px solid #27272a", mass: 1.4,
        children: [{ id: "l-f2-d", type: "paragraph", rect: { x: 0, y: 32, width: fW - 40, height: 80 }, throwable: false, pinned: true, text: "Handles traffic spikes automatically. Zero configuration needed. Pay only for what you use.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#71717a" }] },
      { id: "l-f3", type: "card", rect: { x: mx + (fW + 12) * 2, y: 516, width: fW, height: 160 }, throwable: true, pinned: false, text: "Team Collab", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#f8fafc", backgroundColor: "#18181b", borderRadius: 14, padding: 20, border: "1px solid #27272a", mass: 1.4,
        children: [{ id: "l-f3-d", type: "paragraph", rect: { x: 0, y: 32, width: fW - 40, height: 80 }, throwable: false, pinned: true, text: "Built-in review flows, branching, and instant preview environments for your whole team.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#71717a" }] },

      // Testimonial
      { id: "l-q-h", type: "heading", rect: { x: mx, y: 710, width: w, height: 28 }, throwable: false, pinned: true, text: "What developers say", fontSize: 22, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#f8fafc" },
      { id: "l-quote", type: "paragraph", rect: { x: mx, y: 752, width: Math.min(w * 0.65, 600), height: 110 }, throwable: false, pinned: true,
        text: `\u201CSwitching to Acme reduced our deploy times from 12 minutes to under 30 seconds. The DX is incredible \u2014 it feels like the tooling finally caught up with how we actually want to build software.\u201D`,
        fontSize: 16, fontWeight: 400, fontFamily: SERIF, lineHeight: 26, color: "#cbd5e1" },
      { id: "l-author", type: "badge", rect: { x: mx, y: 872, width: 170, height: 28 }, throwable: true, pinned: false, text: "\u2014 Sarah Chen, CTO", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 6, padding: 6, mass: 0.15 },

      // Bottom
      { id: "l-bottom", type: "paragraph", rect: { x: mx, y: 930, width: w, height: 160 }, throwable: false, pinned: true,
        text: "Join over 50,000 developers who have made the switch. Our platform handles billions of requests daily across 200+ edge locations worldwide. Whether you're a solo developer or a Fortune 500 enterprise team, we scale with you. Free tier includes unlimited projects, custom domains, and automatic HTTPS \u2014 no credit card required to get started.",
        fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#52525b" },

      // Bottom CTA
      { id: "l-bottom-cta", type: "button", rect: { x: mx, y: 1110, width: 180, height: 48 }, throwable: true, pinned: false, text: "Get Started Free \u2192", fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7c3aed", borderRadius: 10, mass: 0.6 },
    ],
  };
}

export function createEditorialScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 920);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1600);
  const col2W = (w - 28) / 2;
  const col3W = (w - 48) / 3;

  const COL_L = `In the quiet hours before dawn, when the city sleeps and the machines hum, there exists a peculiar kind of clarity. The words arrange themselves differently at this hour \u2014 more honestly, perhaps. The typographer knows this feeling intimately: the moment when spacing clicks into place, when the river of white space between lines finds its natural course, and the page begins to breathe. It is not merely an arrangement of letters; it is an architecture of meaning, built one glyph at a time, tested against the constraints of the medium.`;

  const COL_R = `The relationship between text and its obstacles has fascinated layout designers since the invention of the printing press. A woodcut illustration dropped into a column of text creates a conversation between image and word. The text must negotiate its path \u2014 flowing left when blocked on the right, splitting into rivulets around a central obstruction, sometimes abandoning a line entirely when no space remains. These negotiations happen invisibly in every browser, every typesetting engine on earth.`;

  const SEC2_1 = `The physics of digital typography operate on principles that would be familiar to any compositor from the age of hot metal. Weight, space, and rhythm govern the placement of every character. But where the compositor had minutes to set a single line, the modern layout engine must recalculate thousands of lines in a single frame \u2014 sixteen milliseconds of pure arithmetic.`;

  const SEC2_2 = `Pretext, the engine beneath this demonstration, achieves this through a single key insight: text measurement can be decoupled from the DOM entirely. By pre-computing segment widths using the browser's own font engine, then performing layout as pure mathematics, it sidesteps the most expensive operation in web rendering: layout reflow. The result is text that can be re-laid out hundreds of times per second.`;

  const SEC2_3 = `The editorial implications are profound. Imagine a newspaper where the illustrations drift lazily across the page, and the columns of text reform around them like water around stones in a stream. Imagine a textbook where diagrams can be repositioned by the reader, with every paragraph automatically adjusting. This is the future that DOMino explores.`;

  return {
    id: "editorial", name: "Editorial", width: vw, height: H, backgroundColor: "#f4f1eb",
    elements: [
      // Masthead
      { id: "e-r1", type: "divider", rect: { x: mx, y: 20, width: w, height: 3 }, throwable: false, pinned: true, backgroundColor: "#1a1a1a" },
      { id: "e-mast", type: "heading", rect: { x: mx, y: 28, width: w, height: 48 }, throwable: false, pinned: true, text: "The Editorial Engine", fontSize: 40, fontWeight: 700, fontFamily: SERIF, lineHeight: 46, color: "#1a1a1a" },
      { id: "e-vol", type: "heading", rect: { x: mx, y: 78, width: w / 2, height: 16 }, throwable: false, pinned: true, text: "Vol. I \u00b7 Sunday Edition \u00b7 March 2026", fontSize: 10, fontWeight: 400, fontFamily: SERIF, lineHeight: 14, color: "#999" },
      { id: "e-price", type: "badge", rect: { x: mx + w - 60, y: 74, width: 60, height: 20 }, throwable: true, pinned: false, text: "$2.50", fontSize: 10, fontWeight: 600, fontFamily: MONO, color: "#1a1a1a", backgroundColor: "transparent", borderRadius: 0, border: "1px solid #ccc", mass: 0.08 },
      { id: "e-r2", type: "divider", rect: { x: mx, y: 100, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#bbb" },
      { id: "e-r2b", type: "divider", rect: { x: mx, y: 103, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#bbb" },

      // Headline
      { id: "e-hl", type: "heading", rect: { x: mx, y: 116, width: w, height: 34 }, throwable: false, pinned: true, text: "When Text Becomes Liquid", fontSize: 28, fontWeight: 700, fontFamily: SERIF, lineHeight: 34, color: "#1a1a1a" },
      { id: "e-by", type: "heading", rect: { x: mx, y: 156, width: w, height: 16 }, throwable: false, pinned: true, text: "By the DOMino Editorial Board \u00b7 Illustrated in real-time", fontSize: 11, fontWeight: 400, fontFamily: SERIF, lineHeight: 16, color: "#999" },
      { id: "e-r3", type: "divider", rect: { x: mx, y: 180, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" },

      // Two-column section
      { id: "e-c1", type: "paragraph", rect: { x: mx, y: 196, width: col2W, height: 360 }, throwable: false, pinned: true, text: COL_L, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },
      { id: "e-c2", type: "paragraph", rect: { x: mx + col2W + 28, y: 196, width: col2W, height: 360 }, throwable: false, pinned: true, text: COL_R, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },

      // Orbs in two-column area
      { id: "e-o1", type: "badge", rect: { x: mx + col2W / 2 - 28, y: 270, width: 56, height: 56 }, throwable: true, pinned: false, text: "A", fontSize: 20, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#c0392b", borderRadius: 28, mass: 0.7 },
      { id: "e-o2", type: "badge", rect: { x: mx + col2W + 28 + col2W / 2 - 24, y: 300, width: 48, height: 48 }, throwable: true, pinned: false, text: "B", fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#2980b9", borderRadius: 24, mass: 0.6 },

      // Mid-section rule + heading
      { id: "e-r4", type: "divider", rect: { x: mx, y: 580, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ccc" },
      { id: "e-mid-h", type: "heading", rect: { x: mx, y: 596, width: w, height: 24 }, throwable: false, pinned: true, text: "The Physics of the Page", fontSize: 20, fontWeight: 700, fontFamily: SERIF, lineHeight: 24, color: "#1a1a1a" },
      { id: "e-r5", type: "divider", rect: { x: mx, y: 628, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" },

      // Three-column section
      { id: "e-t1", type: "paragraph", rect: { x: mx, y: 644, width: col3W, height: 340 }, throwable: false, pinned: true, text: SEC2_1, fontSize: 14, fontWeight: 400, fontFamily: SERIF, lineHeight: 22, color: "#444" },
      { id: "e-t2", type: "paragraph", rect: { x: mx + col3W + 24, y: 644, width: col3W, height: 340 }, throwable: false, pinned: true, text: SEC2_2, fontSize: 14, fontWeight: 400, fontFamily: SERIF, lineHeight: 22, color: "#444" },
      { id: "e-t3", type: "paragraph", rect: { x: mx + (col3W + 24) * 2, y: 644, width: col3W, height: 340 }, throwable: false, pinned: true, text: SEC2_3, fontSize: 14, fontWeight: 400, fontFamily: SERIF, lineHeight: 22, color: "#444" },

      // Orbs in three-column area
      { id: "e-o3", type: "badge", rect: { x: mx + col3W + 24 + col3W / 2 - 32, y: 720, width: 64, height: 64 }, throwable: true, pinned: false, text: "C", fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#27ae60", borderRadius: 32, mass: 0.9 },
      { id: "e-o4", type: "badge", rect: { x: mx + 60, y: 760, width: 40, height: 40 }, throwable: true, pinned: false, text: "D", fontSize: 14, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#8e44ad", borderRadius: 20, mass: 0.4 },
      { id: "e-o5", type: "badge", rect: { x: mx + (col3W + 24) * 2 + col3W / 2 - 26, y: 740, width: 52, height: 52 }, throwable: true, pinned: false, text: "E", fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#e67e22", borderRadius: 26, mass: 0.6 },

      // Floating cards
      { id: "e-card-1", type: "card", rect: { x: mx + col2W - 30, y: 440, width: 90, height: 56 }, throwable: true, pinned: false, text: "Drag me", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 8, padding: 12, border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", mass: 0.4 },
      { id: "e-card-2", type: "card", rect: { x: mx + col2W + 58, y: 440, width: 90, height: 56 }, throwable: true, pinned: false, text: "Throw me", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 8, padding: 12, border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", mass: 0.4 },
      { id: "e-img", type: "image", rect: { x: mx + w / 2 - 70, y: 900, width: 140, height: 90 }, throwable: true, pinned: false, backgroundColor: "#e0dcd4", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", mass: 1.2 },

      // Footer
      { id: "e-r6", type: "divider", rect: { x: mx, y: 1020, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ccc" },
      { id: "e-foot", type: "heading", rect: { x: mx, y: 1034, width: w, height: 14 }, throwable: false, pinned: true, text: "Powered by @chenglou/pretext \u00b7 Inspired by somnai-dreams/pretext-demos \u00b7 Built with Matter.js", fontSize: 9, fontWeight: 400, fontFamily: MONO, lineHeight: 14, color: "#bbb" },
    ],
  };
}

export function createDarkEngineScene(vw: number, vh: number): SceneDescription {
  const PAL_SERIF = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
  const w = Math.min(vw - 80, 1200);
  const mx = Math.max(40, (vw - w) / 2);
  const H = Math.max(vh, 1800);
  const colGap = 40;
  const colCount = vw > 900 ? 2 : 1;
  const colW = colCount === 2 ? (w - colGap) / 2 : w;
  const col2X = mx + colW + colGap;

  const BODY_1 = `The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step depends on the previous one. Every step requires the rendering engine to consult its internal layout tree \u2014 a structure so expensive to maintain that browsers guard access behind synchronous reflow barriers that can freeze the main thread for tens of milliseconds at a time.`;

  const BODY_2 = `For a paragraph in a blog post, this pipeline is invisible. The browser loads, lays out, and paints before the reader\u2019s eye has traveled from the address bar to the first word. But the web is no longer a collection of static documents. It is a platform for applications, and those applications need to know about text in ways the original pipeline never anticipated. A messaging app needs exact bubble heights. A masonry layout needs card heights. An editorial page needs text flowing around images, ads, and interactive elements.`;

  const BODY_3 = `What if text measurement did not require the DOM at all? What if you could compute exactly where every line of text would break, exactly how wide each line would be, and exactly how tall the entire text block would be, using nothing but arithmetic? This is the core insight of Pretext. The browser\u2019s canvas API includes a measureText method that returns the width of any string in any font without triggering a layout reflow. Pretext exploits this asymmetry: measure once via canvas, cache the widths, then layout is pure arithmetic.`;

  const BODY_4 = `The performance improvement is not incremental. Measuring five hundred text blocks with DOM methods costs fifteen to thirty milliseconds and triggers five hundred layout reflows. With Pretext, the same operation costs 0.05 milliseconds and triggers zero reflows. This is a three-hundred-fold improvement. But even that number understates the impact, because Pretext\u2019s cost does not scale with page complexity \u2014 it is independent of how many other elements exist on the page.`;

  const BODY_5 = `With DOM-free text measurement, an entire class of previously impractical interfaces becomes trivial. Text can flow around arbitrary shapes \u2014 rectangles, circles, polygons, even image alpha channels. Obstacles can move, animate, or be dragged by the user, and the text reflows instantly because the layout computation takes less than a millisecond. This is exactly what CSS Shapes tried to accomplish, but with none of its limitations.`;

  const BODY_6 = `The glowing orbs drifting across this page are not decorative \u2014 they are the demonstration. Each orb is a circular obstacle. For every line of text, the engine checks whether the line\u2019s vertical band intersects each orb. If it does, it computes the blocked horizontal interval and subtracts it from the available width. The remaining width might be split into two or more segments \u2014 and the engine fills every viable slot, flowing text on both sides of the obstacle simultaneously.`;

  const bodyY = 140;

  return {
    id: "engine", name: "Engine", width: vw, height: H, backgroundColor: "#0a0a0c",
    elements: [
      // Headline
      { id: "de-hl", type: "heading", rect: { x: mx, y: 40, width: w, height: 70 }, throwable: false, pinned: true,
        text: "THE FUTURE OF TEXT LAYOUT IS NOT CSS", fontSize: 48, fontWeight: 700, fontFamily: PAL_SERIF, lineHeight: 52, color: "#ffffff" },
      { id: "de-hint", type: "heading", rect: { x: mx, y: 112, width: w, height: 16 }, throwable: false, pinned: true,
        text: "Drag the orbs \u00b7 Text reflows at 60fps \u00b7 Zero DOM reads", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 16, color: "rgba(255,255,255,0.22)" },

      // Column 1
      { id: "de-p1", type: "paragraph", rect: { x: mx, y: bodyY, width: colW, height: 320 }, throwable: false, pinned: true,
        text: BODY_1, fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, lineHeight: 28, color: "#e8e4dc" },
      { id: "de-p2", type: "paragraph", rect: { x: mx, y: bodyY + 340, width: colW, height: 320 }, throwable: false, pinned: true,
        text: BODY_2, fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, lineHeight: 28, color: "#e8e4dc" },
      { id: "de-p3", type: "paragraph", rect: { x: mx, y: bodyY + 680, width: colW, height: 320 }, throwable: false, pinned: true,
        text: BODY_3, fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, lineHeight: 28, color: "#e8e4dc" },

      // Column 2 (or below on narrow)
      { id: "de-p4", type: "paragraph", rect: { x: colCount === 2 ? col2X : mx, y: colCount === 2 ? bodyY : bodyY + 1020, width: colW, height: 320 }, throwable: false, pinned: true,
        text: BODY_4, fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, lineHeight: 28, color: "#e8e4dc" },
      { id: "de-p5", type: "paragraph", rect: { x: colCount === 2 ? col2X : mx, y: colCount === 2 ? bodyY + 340 : bodyY + 1360, width: colW, height: 320 }, throwable: false, pinned: true,
        text: BODY_5, fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, lineHeight: 28, color: "#e8e4dc" },
      { id: "de-p6", type: "paragraph", rect: { x: colCount === 2 ? col2X : mx, y: colCount === 2 ? bodyY + 680 : bodyY + 1700, width: colW, height: 320 }, throwable: false, pinned: true,
        text: BODY_6, fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, lineHeight: 28, color: "#e8e4dc" },

      // Pullquote
      { id: "de-pq", type: "card", rect: { x: mx, y: bodyY + 1020, width: colCount === 2 ? colW : w, height: 60 }, throwable: true, pinned: false,
        text: "\u201CThe performance improvement is not incremental \u2014 it is categorical. 0.05ms versus 30ms.\u201D",
        fontSize: 17, fontWeight: 400, fontFamily: PAL_SERIF, color: "#b8a070", backgroundColor: "transparent",
        borderRadius: 0, padding: 14, border: "none", mass: 0.6 },

      // Glowing orbs
      { id: "de-orb-gold", type: "badge", rect: { x: mx + colW * 0.4, y: bodyY + 100, width: 120, height: 120 }, throwable: true, pinned: false,
        text: "", fontSize: 1, fontWeight: 400, fontFamily: SANS, color: "transparent",
        backgroundColor: "radial-gradient(circle at 35% 35%, rgba(196,163,90,0.35), rgba(196,163,90,0.12) 55%, transparent 72%)",
        borderRadius: 60, mass: 1.5, boxShadow: "0 0 60px 15px rgba(196,163,90,0.18), 0 0 120px 40px rgba(196,163,90,0.07)" },
      { id: "de-orb-blue", type: "badge", rect: { x: colCount === 2 ? col2X + 80 : mx + 60, y: bodyY + 400, width: 90, height: 90 }, throwable: true, pinned: false,
        text: "", fontSize: 1, fontWeight: 400, fontFamily: SANS, color: "transparent",
        backgroundColor: "radial-gradient(circle at 35% 35%, rgba(100,140,255,0.35), rgba(100,140,255,0.12) 55%, transparent 72%)",
        borderRadius: 45, mass: 1.0, boxShadow: "0 0 60px 15px rgba(100,140,255,0.18), 0 0 120px 40px rgba(100,140,255,0.07)" },
      { id: "de-orb-pink", type: "badge", rect: { x: mx + colW * 0.6, y: bodyY + 600, width: 100, height: 100 }, throwable: true, pinned: false,
        text: "", fontSize: 1, fontWeight: 400, fontFamily: SANS, color: "transparent",
        backgroundColor: "radial-gradient(circle at 35% 35%, rgba(232,100,130,0.35), rgba(232,100,130,0.12) 55%, transparent 72%)",
        borderRadius: 50, mass: 1.2, boxShadow: "0 0 60px 15px rgba(232,100,130,0.18), 0 0 120px 40px rgba(232,100,130,0.07)" },
      { id: "de-orb-green", type: "badge", rect: { x: colCount === 2 ? col2X + colW * 0.3 : mx + w * 0.5, y: bodyY + 250, width: 80, height: 80 }, throwable: true, pinned: false,
        text: "", fontSize: 1, fontWeight: 400, fontFamily: SANS, color: "transparent",
        backgroundColor: "radial-gradient(circle at 35% 35%, rgba(80,200,140,0.35), rgba(80,200,140,0.12) 55%, transparent 72%)",
        borderRadius: 40, mass: 0.8, boxShadow: "0 0 60px 15px rgba(80,200,140,0.18), 0 0 120px 40px rgba(80,200,140,0.07)" },
      { id: "de-orb-purple", type: "badge", rect: { x: colCount === 2 ? col2X + colW - 100 : mx + w - 100, y: bodyY + 60, width: 70, height: 70 }, throwable: true, pinned: false,
        text: "", fontSize: 1, fontWeight: 400, fontFamily: SANS, color: "transparent",
        backgroundColor: "radial-gradient(circle at 35% 35%, rgba(150,100,220,0.35), rgba(150,100,220,0.12) 55%, transparent 72%)",
        borderRadius: 35, mass: 0.7, boxShadow: "0 0 60px 15px rgba(150,100,220,0.18), 0 0 120px 40px rgba(150,100,220,0.07)" },

      // Credit
      { id: "de-credit", type: "heading", rect: { x: mx, y: colCount === 2 ? bodyY + 1100 : bodyY + 2060, width: w, height: 14 }, throwable: false, pinned: true,
        text: "Adapted from somnai-dreams/pretext-demos \u00b7 Powered by @chenglou/pretext", fontSize: 9, fontWeight: 400, fontFamily: MONO, lineHeight: 14, color: "rgba(255,255,255,0.28)" },
    ],
  };
}

export type PresetKey = "article" | "dashboard" | "landing" | "editorial" | "engine";

export const PRESET_LIST: { key: PresetKey; label: string }[] = [
  { key: "article", label: "Article" },
  { key: "dashboard", label: "Dashboard" },
  { key: "landing", label: "Landing" },
  { key: "editorial", label: "Editorial" },
  { key: "engine", label: "Engine" },
];

export function getPresetScene(key: PresetKey, vw: number, vh: number): SceneDescription {
  switch (key) {
    case "article": return createSampleScene(vw, vh);
    case "dashboard": return createDashboardScene(vw, vh);
    case "landing": return createLandingScene(vw, vh);
    case "editorial": return createEditorialScene(vw, vh);
    case "engine": return createDarkEngineScene(vw, vh);
  }
}
