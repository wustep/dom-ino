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
  const w = Math.min(vw - 40, 900);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1400);
  const colW = (w - 30) / 2;

  const EDITORIAL_L = `In the quiet hours before dawn, when the city sleeps and the machines hum, there exists a peculiar kind of clarity. The words arrange themselves differently at this hour — more honestly, perhaps. The typographer knows this feeling intimately: the moment when spacing clicks into place, when the river of white space between lines finds its natural course, and the page begins to breathe. It is not merely an arrangement of letters; it is an architecture of meaning, built one glyph at a time.`;

  const EDITORIAL_R = `The relationship between text and its obstacles has fascinated layout designers since the invention of the printing press. A woodcut illustration dropped into a column of text creates a conversation between image and word. The text must negotiate its path — flowing left when blocked on the right, splitting into rivulets around a central obstruction, sometimes abandoning a line entirely when no space remains. These negotiations happen invisibly in every browser, every PDF renderer, every typesetting engine on earth.`;

  const EDITORIAL_B = `What happens when those obstacles begin to move? When the woodcut illustration slides downward, or drifts to the left, or spins lazily in zero gravity? The text must renegotiate, instantly, for every frame. This is the challenge at the heart of DOMino's editorial engine: real-time text reflow that maintains readability even as the page transforms beneath it. Each line is computed individually, measured against the current obstacle positions, and placed in the widest available segment. The result is text that appears to have a physical awareness of its surroundings — liquid typography that pours itself into whatever shape remains.`;

  return {
    id: "editorial", name: "Editorial", width: vw, height: H, backgroundColor: "#f4f1eb",
    elements: [
      // Masthead
      { id: "e-rule-top", type: "divider", rect: { x: mx, y: 24, width: w, height: 2 }, throwable: false, pinned: true, backgroundColor: "#1a1a1a" },
      { id: "e-masthead", type: "heading", rect: { x: mx, y: 32, width: w, height: 50 }, throwable: false, pinned: true, text: "The Editorial Engine", fontSize: 38, fontWeight: 700, fontFamily: SERIF, lineHeight: 46, color: "#1a1a1a" },
      { id: "e-date", type: "heading", rect: { x: mx, y: 84, width: w, height: 20 }, throwable: false, pinned: true, text: "Vol. I \u00b7 Sunday Edition \u00b7 March 2026", fontSize: 11, fontWeight: 400, fontFamily: SERIF, lineHeight: 18, color: "#888" },
      { id: "e-rule-mid", type: "divider", rect: { x: mx, y: 110, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ccc" },

      // Subhead
      { id: "e-subhead", type: "heading", rect: { x: mx, y: 124, width: w, height: 28 }, throwable: false, pinned: true, text: "When Text Becomes Liquid", fontSize: 22, fontWeight: 700, fontFamily: SERIF, lineHeight: 28, color: "#1a1a1a" },
      { id: "e-byline", type: "heading", rect: { x: mx, y: 158, width: w, height: 18 }, throwable: false, pinned: true, text: "By the DOMino Editorial Board", fontSize: 12, fontWeight: 400, fontFamily: SERIF, lineHeight: 18, color: "#999" },
      { id: "e-rule-sub", type: "divider", rect: { x: mx, y: 184, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" },

      // Left column
      { id: "e-col-l", type: "paragraph", rect: { x: mx, y: 200, width: colW, height: 400 }, throwable: false, pinned: true, text: EDITORIAL_L, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },

      // Right column
      { id: "e-col-r", type: "paragraph", rect: { x: mx + colW + 30, y: 200, width: colW, height: 400 }, throwable: false, pinned: true, text: EDITORIAL_R, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },

      // Full-width bottom paragraph
      { id: "e-rule-bot", type: "divider", rect: { x: mx, y: 630, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" },
      { id: "e-full", type: "paragraph", rect: { x: mx, y: 650, width: w, height: 400 }, throwable: false, pinned: true, text: EDITORIAL_B, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },

      // Throwable orbs / elements
      { id: "e-orb-1", type: "badge", rect: { x: mx + colW / 2 - 30, y: 280, width: 60, height: 60 }, throwable: true, pinned: false, text: "A", fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#c0392b", borderRadius: 30, mass: 0.8 },
      { id: "e-orb-2", type: "badge", rect: { x: mx + colW + 30 + colW / 2 - 25, y: 320, width: 50, height: 50 }, throwable: true, pinned: false, text: "B", fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#2980b9", borderRadius: 25, mass: 0.6 },
      { id: "e-orb-3", type: "badge", rect: { x: mx + w / 2 - 35, y: 720, width: 70, height: 70 }, throwable: true, pinned: false, text: "C", fontSize: 24, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#27ae60", borderRadius: 35, mass: 1.0 },
      { id: "e-orb-4", type: "badge", rect: { x: mx + 80, y: 750, width: 44, height: 44 }, throwable: true, pinned: false, text: "D", fontSize: 16, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#8e44ad", borderRadius: 22, mass: 0.5 },
      { id: "e-orb-5", type: "badge", rect: { x: mx + w - 120, y: 700, width: 55, height: 55 }, throwable: true, pinned: false, text: "E", fontSize: 20, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#e67e22", borderRadius: 28, mass: 0.7 },

      // Throwable cards
      { id: "e-card-1", type: "card", rect: { x: mx + colW - 40, y: 440, width: 110, height: 70 }, throwable: true, pinned: false, text: "Drag me", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 10, padding: 14, border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", mass: 0.6 },
      { id: "e-card-2", type: "card", rect: { x: mx + colW + 60, y: 440, width: 110, height: 70 }, throwable: true, pinned: false, text: "Throw me", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 10, padding: 14, border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", mass: 0.6 },

      // Section label
      { id: "e-section", type: "heading", rect: { x: mx, y: 1080, width: w, height: 20 }, throwable: false, pinned: true, text: "Inspired by chenglou/pretext \u00b7 somnai-dreams/pretext-demos", fontSize: 10, fontWeight: 400, fontFamily: MONO, lineHeight: 16, color: "#bbb" },
    ],
  };
}

export type PresetKey = "article" | "dashboard" | "landing" | "editorial";

export const PRESET_LIST: { key: PresetKey; label: string }[] = [
  { key: "article", label: "Article" },
  { key: "dashboard", label: "Dashboard" },
  { key: "landing", label: "Landing" },
  { key: "editorial", label: "Editorial" },
];

export function getPresetScene(key: PresetKey, vw: number, vh: number): SceneDescription {
  switch (key) {
    case "article": return createSampleScene(vw, vh);
    case "dashboard": return createDashboardScene(vw, vh);
    case "landing": return createLandingScene(vw, vh);
    case "editorial": return createEditorialScene(vw, vh);
  }
}
