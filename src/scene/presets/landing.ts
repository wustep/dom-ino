import type { SceneDescription } from "../types";
import { SANS, SERIF, MONO } from "./fonts";

export function createLandingScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 1000);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1200);
  const fW = (w - 24) / 3;

  return {
    id: "landing", name: "Landing Page", width: vw, height: H, backgroundColor: "#09090b",
    elements: [
      // Nav
      { id: "l-logo", type: "badge", rect: { x: mx, y: 20, width: 40, height: 40 }, throwable: true, pinned: false, text: "◆", fontSize: 18, fontWeight: 400, fontFamily: SANS, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 10, padding: 8, mass: 0.3 },
      { id: "l-brand", type: "heading", rect: { x: mx + 50, y: 26, width: 80, height: 28 }, throwable: false, pinned: true, text: "Acme", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#f8fafc" },
      { id: "l-n1", type: "button", rect: { x: mx + w - 320, y: 26, width: 70, height: 28 }, throwable: true, pinned: false, text: "Features", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94a3b8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-n2", type: "button", rect: { x: mx + w - 240, y: 26, width: 70, height: 28 }, throwable: true, pinned: false, text: "Pricing", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94a3b8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-n3", type: "button", rect: { x: mx + w - 160, y: 26, width: 60, height: 28 }, throwable: true, pinned: false, text: "Docs", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#94a3b8", backgroundColor: "transparent", borderRadius: 4, mass: 0.12 },
      { id: "l-cta-nav", type: "button", rect: { x: mx + w - 90, y: 22, width: 90, height: 34 }, throwable: true, pinned: false, text: "Sign Up", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7c3aed", borderRadius: 8, mass: 0.3 },

      // Hero
      { id: "l-eyebrow", type: "badge", rect: { x: mx, y: 100, width: 160, height: 26 }, throwable: true, pinned: false, text: "Announcing v3.0 →", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 13, padding: 6, mass: 0.12 },
      { id: "l-hero", type: "heading", rect: { x: mx, y: 142, width: w, height: 140 }, throwable: false, pinned: true, text: "Build faster.\nShip smarter.", fontSize: 60, fontWeight: 800, fontFamily: SANS, lineHeight: 68, color: "#f8fafc" },
      { id: "l-sub", type: "paragraph", rect: { x: mx, y: 296, width: Math.min(w * 0.58, 540), height: 80 }, throwable: false, pinned: true, text: "The all-in-one platform for modern development teams. From prototype to production, we handle the infrastructure so you can focus on what matters.", fontSize: 17, fontWeight: 400, fontFamily: SANS, lineHeight: 26, color: "#94a3b8" },

      // CTAs
      { id: "l-cta1", type: "button", rect: { x: mx, y: 396, width: 160, height: 48 }, throwable: true, pinned: false, text: "Start Free Trial", fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7c3aed", borderRadius: 10, mass: 0.6 },
      { id: "l-cta2", type: "button", rect: { x: mx + 174, y: 396, width: 140, height: 48 }, throwable: true, pinned: false, text: "Watch Demo", fontSize: 15, fontWeight: 500, fontFamily: SANS, color: "#e2e8f0", backgroundColor: "transparent", borderRadius: 10, border: "1px solid #334155", mass: 0.5 },

      // Social proof
      { id: "l-proof", type: "heading", rect: { x: mx, y: 470, width: w, height: 20 }, throwable: false, pinned: true, text: "Trusted by 50,000+ developers worldwide", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 20, color: "#64748b" },

      // Logo strip
      { id: "l-logo-1", type: "badge", rect: { x: mx, y: 498, width: 68, height: 24 }, throwable: true, pinned: false, text: "Vercel", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#52525b", backgroundColor: "transparent", borderRadius: 4, mass: 0.08 },
      { id: "l-logo-2", type: "badge", rect: { x: mx + 76, y: 498, width: 68, height: 24 }, throwable: true, pinned: false, text: "Stripe", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#52525b", backgroundColor: "transparent", borderRadius: 4, mass: 0.08 },
      { id: "l-logo-3", type: "badge", rect: { x: mx + 152, y: 498, width: 68, height: 24 }, throwable: true, pinned: false, text: "Linear", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#52525b", backgroundColor: "transparent", borderRadius: 4, mass: 0.08 },
      { id: "l-logo-4", type: "badge", rect: { x: mx + 228, y: 498, width: 68, height: 24 }, throwable: true, pinned: false, text: "Notion", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#52525b", backgroundColor: "transparent", borderRadius: 4, mass: 0.08 },

      // Feature cards
      { id: "l-f1", type: "card", rect: { x: mx, y: 546, width: fW, height: 160 }, throwable: true, pinned: false, text: "Lightning Fast", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#f8fafc", backgroundColor: "#18181b", borderRadius: 14, padding: 20, border: "1px solid #27272a", mass: 1.4,
        children: [{ id: "l-f1-d", type: "paragraph", rect: { x: 0, y: 32, width: fW - 40, height: 80 }, throwable: false, pinned: true, text: "Sub-millisecond deploys with edge-optimized infrastructure across 200+ locations.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#71717a" }] },
      { id: "l-f2", type: "card", rect: { x: mx + fW + 12, y: 546, width: fW, height: 160 }, throwable: true, pinned: false, text: "Auto Scaling", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#f8fafc", backgroundColor: "#18181b", borderRadius: 14, padding: 20, border: "1px solid #27272a", mass: 1.4,
        children: [{ id: "l-f2-d", type: "paragraph", rect: { x: 0, y: 32, width: fW - 40, height: 80 }, throwable: false, pinned: true, text: "Handles traffic spikes automatically. Zero configuration needed. Pay only for what you use.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#71717a" }] },
      { id: "l-f3", type: "card", rect: { x: mx + (fW + 12) * 2, y: 546, width: fW, height: 160 }, throwable: true, pinned: false, text: "Team Collab", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#f8fafc", backgroundColor: "#18181b", borderRadius: 14, padding: 20, border: "1px solid #27272a", mass: 1.4,
        children: [{ id: "l-f3-d", type: "paragraph", rect: { x: 0, y: 32, width: fW - 40, height: 80 }, throwable: false, pinned: true, text: "Built-in review flows, branching, and instant preview environments for your whole team.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#71717a" }] },

      // Testimonial
      { id: "l-q-h", type: "heading", rect: { x: mx, y: 740, width: w, height: 28 }, throwable: false, pinned: true, text: "What developers say", fontSize: 22, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#f8fafc" },
      { id: "l-quote", type: "paragraph", rect: { x: mx, y: 782, width: Math.min(w * 0.65, 600), height: 110 }, throwable: false, pinned: true,
        text: `\u201CSwitching to Acme reduced our deploy times from 12 minutes to under 30 seconds. The DX is incredible \u2014 it feels like the tooling finally caught up with how we actually want to build software.\u201D`,
        fontSize: 16, fontWeight: 400, fontFamily: SERIF, lineHeight: 26, color: "#cbd5e1" },
      { id: "l-author", type: "badge", rect: { x: mx, y: 902, width: 170, height: 28 }, throwable: true, pinned: false, text: "— Sarah Chen, CTO", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 6, padding: 6, mass: 0.15 },

      // Bottom body
      { id: "l-bottom", type: "paragraph", rect: { x: mx, y: 960, width: w, height: 140 }, throwable: false, pinned: true,
        text: "Join over 50,000 developers who have made the switch. Our platform handles billions of requests daily across 200+ edge locations worldwide. Whether you're a solo developer or a Fortune 500 enterprise team, we scale with you. Free tier includes unlimited projects, custom domains, and automatic HTTPS — no credit card required to get started.",
        fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#52525b" },

      // Bottom CTA
      { id: "l-bottom-cta", type: "button", rect: { x: mx, y: 1120, width: 180, height: 48 }, throwable: true, pinned: false, text: "Get Started Free →", fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#7c3aed", borderRadius: 10, mass: 0.6 },

      // Footer badges
      { id: "l-soc", type: "badge", rect: { x: mx + 194, y: 1130, width: 66, height: 28 }, throwable: true, pinned: false, text: "GitHub", fontSize: 11, fontWeight: 600, fontFamily: MONO, color: "#71717a", backgroundColor: "rgba(113,113,122,0.08)", borderRadius: 6, padding: 5, mass: 0.1 },
      { id: "l-tw", type: "badge", rect: { x: mx + 268, y: 1130, width: 46, height: 28 }, throwable: true, pinned: false, text: "X/𝕏", fontSize: 11, fontWeight: 600, fontFamily: MONO, color: "#71717a", backgroundColor: "rgba(113,113,122,0.08)", borderRadius: 6, padding: 5, mass: 0.1 },
    ],
  };
}
