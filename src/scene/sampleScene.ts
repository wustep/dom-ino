import type { SceneDescription } from "./types";

const SERIF = '"Source Serif 4", Georgia, serif';
const SANS = '"DM Sans", "Helvetica Neue", sans-serif';
const MONO = '"JetBrains Mono", monospace';

const P1 = `The ancient art of typography has always been about controlling space. From Gutenberg's movable type to modern CSS flexbox, the fundamental challenge remains the same: how do you arrange glyphs on a surface so that meaning emerges from the pattern? Every line break is a decision. Every margin is a statement. The relationship between text and the objects around it defines the character of a layout.`;

const P2 = `In digital interfaces, we've surrendered this control to the browser's layout engine. Text reflows automatically, columns resize predictably, and we rarely think about the mechanics underneath. But what happens when objects on a page start moving? When a card drifts through a paragraph, the text must adapt — finding new paths around obstacles, reforming into readable lines even as its container shifts beneath it.`;

const P3 = `This is the premise of DOMino: a physics-driven text layout experiment that treats every element on the page as a participant in a living composition. Grab any highlighted element and throw it. Watch as surrounding text reflows in real time, finding the available space and reforming around obstacles. The effect is something between a magazine layout, a physics sandbox, and a typographic playground.`;

const P4 = `The technical underpinnings combine three powerful ideas. First, the DOM snapshot reconstructs a familiar webpage into a controllable scene graph. Second, Matter.js provides robust two-dimensional physics with gravity, collisions, and momentum. Third, Pretext handles text measurement and line-by-line layout, computing each row's available width based on the positions of all nearby obstacles.`;

export function createSampleScene(vw: number, vh: number): SceneDescription {
  const maxW = Math.min(vw - 40, 1120);
  const mx = Math.max(20, (vw - maxW) / 2);
  const contentW = maxW;
  const mainW = Math.min(contentW * 0.62, 660);
  const sX = mx + mainW + 36;
  const sW = contentW - mainW - 36;
  const H = Math.max(vh, 1400);

  return {
    id: "article", name: "Article", width: vw, height: H, backgroundColor: "#FAFAF8",
    elements: [
      // Nav
      { id: "logo", type: "badge", rect: { x: mx, y: 24, width: 94, height: 30 }, throwable: true, pinned: false, text: "DOMino", fontSize: 13, fontWeight: 700, fontFamily: MONO, color: "#FAFAF8", backgroundColor: "#1a1a1a", borderRadius: 6, padding: 6, mass: 0.4 },
      { id: "nav-1", type: "button", rect: { x: mx + 110, y: 26, width: 56, height: 26 }, throwable: true, pinned: false, text: "About", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#666", backgroundColor: "transparent", borderRadius: 4, mass: 0.15 },
      { id: "nav-2", type: "button", rect: { x: mx + 174, y: 26, width: 60, height: 26 }, throwable: true, pinned: false, text: "Demos", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#666", backgroundColor: "transparent", borderRadius: 4, mass: 0.15 },
      { id: "nav-3", type: "button", rect: { x: mx + 242, y: 26, width: 64, height: 26 }, throwable: true, pinned: false, text: "Source", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#666", backgroundColor: "transparent", borderRadius: 4, mass: 0.15 },
      { id: "nav-subscribe", type: "button", rect: { x: mx + contentW - 110, y: 22, width: 110, height: 32 }, throwable: true, pinned: false, text: "Subscribe", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#1a1a1a", borderRadius: 8, mass: 0.3 },
      { id: "divider-top", type: "divider", rect: { x: mx, y: 66, width: contentW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#e0ddd8" },

      // Category + date
      { id: "cat-badge", type: "badge", rect: { x: mx, y: 88, width: 90, height: 24 }, throwable: true, pinned: false, text: "EXPERIMENT", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#7c3aed", backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 4, padding: 4, mass: 0.1 },

      // Hero
      { id: "hero-title", type: "heading", rect: { x: mx, y: 126, width: contentW, height: 130 }, throwable: false, pinned: true, text: "When Typography\nMeets Physics", fontSize: 54, fontWeight: 700, fontFamily: SERIF, lineHeight: 64, color: "#1a1a1a" },
      { id: "hero-sub", type: "heading", rect: { x: mx, y: 266, width: mainW + 60, height: 26 }, throwable: false, pinned: true, text: "A real-time text reflow experiment with DOM physics — March 2026", fontSize: 17, fontWeight: 400, fontFamily: SANS, lineHeight: 26, color: "#999" },
      { id: "divider-hero", type: "divider", rect: { x: mx, y: 308, width: mainW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#e8e5e0" },

      // Body
      { id: "p1", type: "paragraph", rect: { x: mx, y: 330, width: mainW, height: 200 }, throwable: false, pinned: true, text: P1, fontSize: 17, fontWeight: 400, fontFamily: SERIF, lineHeight: 28, color: "#333" },
      { id: "p2", type: "paragraph", rect: { x: mx, y: 550, width: mainW, height: 200 }, throwable: false, pinned: true, text: P2, fontSize: 17, fontWeight: 400, fontFamily: SERIF, lineHeight: 28, color: "#333" },

      // Pull quote
      { id: "pullquote", type: "card", rect: { x: mx, y: 770, width: mainW, height: 80 }, throwable: true, pinned: false, text: '"Every line break is a decision. Every margin is a statement."', fontSize: 20, fontWeight: 500, fontFamily: SERIF, color: "#7c3aed", backgroundColor: "transparent", borderRadius: 0, padding: 18, border: "none", boxShadow: "none", mass: 0.8, children: [] },

      { id: "mid-h", type: "heading", rect: { x: mx, y: 870, width: mainW, height: 40 }, throwable: false, pinned: true, text: "The Living Page", fontSize: 30, fontWeight: 700, fontFamily: SERIF, lineHeight: 40, color: "#1a1a1a" },
      { id: "p3", type: "paragraph", rect: { x: mx, y: 930, width: mainW, height: 200 }, throwable: false, pinned: true, text: P3, fontSize: 17, fontWeight: 400, fontFamily: SERIF, lineHeight: 28, color: "#333" },
      { id: "p4", type: "paragraph", rect: { x: mx, y: 1150, width: mainW, height: 200 }, throwable: false, pinned: true, text: P4, fontSize: 17, fontWeight: 400, fontFamily: SERIF, lineHeight: 28, color: "#333" },

      // Sidebar
      { id: "side-label", type: "heading", rect: { x: sX, y: 330, width: sW, height: 20 }, throwable: false, pinned: true, text: "Related", fontSize: 11, fontWeight: 700, fontFamily: MONO, lineHeight: 18, color: "#aaa" },
      { id: "card-1", type: "card", rect: { x: sX, y: 360, width: sW, height: 140 }, throwable: true, pinned: false, text: "Real-time Reflow", fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 12, padding: 18, border: "1px solid #e8e5e0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", mass: 1.4,
        children: [{ id: "card-1-d", type: "paragraph", rect: { x: 0, y: 32, width: sW - 36, height: 70 }, throwable: false, pinned: true, text: "Text reflows around moving DOM elements using Pretext's line-by-line layout.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#888" }] },
      { id: "card-2", type: "card", rect: { x: sX, y: 516, width: sW, height: 140 }, throwable: true, pinned: false, text: "Matter.js Physics", fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 12, padding: 18, border: "1px solid #e8e5e0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", mass: 1.4,
        children: [{ id: "card-2-d", type: "paragraph", rect: { x: 0, y: 32, width: sW - 36, height: 70 }, throwable: false, pinned: true, text: "Drag, throw, and watch elements collide with realistic friction and bounce.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 19, color: "#888" }] },

      // Tags
      { id: "tag-1", type: "badge", rect: { x: sX, y: 676, width: 58, height: 24 }, throwable: true, pinned: false, text: "NEW", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#e74c3c", borderRadius: 12, padding: 5, mass: 0.1 },
      { id: "tag-2", type: "badge", rect: { x: sX + 66, y: 676, width: 58, height: 24 }, throwable: true, pinned: false, text: "BETA", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#8e44ad", borderRadius: 12, padding: 5, mass: 0.1 },
      { id: "tag-3", type: "badge", rect: { x: sX + 132, y: 676, width: 48, height: 24 }, throwable: true, pinned: false, text: "v2.0", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#27ae60", borderRadius: 12, padding: 5, mass: 0.1 },

      // Image
      { id: "img-1", type: "image", rect: { x: sX, y: 716, width: sW, height: 160 }, throwable: true, pinned: false, backgroundColor: "#e8e5e0", borderRadius: 12, imageAlt: "Illustration", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", mass: 2 },

      // CTA
      { id: "cta-1", type: "button", rect: { x: sX, y: 896, width: 140, height: 40 }, throwable: true, pinned: false, text: "Try It Out \u2192", fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#1a1a1a", borderRadius: 8, mass: 0.5 },
      { id: "cta-2", type: "button", rect: { x: sX + 148, y: 896, width: 110, height: 40 }, throwable: true, pinned: false, text: "View Source", fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #d0cdc8", mass: 0.5 },

      // Stats
      { id: "card-stats", type: "card", rect: { x: sX, y: 956, width: sW, height: 100 }, throwable: true, pinned: false, text: "Performance", fontSize: 10, fontWeight: 600, fontFamily: MONO, color: "#999", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e8e5e0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", mass: 1,
        children: [{ id: "stats-val", type: "paragraph", rect: { x: 0, y: 24, width: sW - 32, height: 40 }, throwable: false, pinned: true, text: "~0.09ms layout \u00b7 60fps \u00b7 Live reflow", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#1a1a1a" }] },

      // Newsletter
      { id: "newsletter", type: "card", rect: { x: sX, y: 1076, width: sW, height: 110 }, throwable: true, pinned: false, text: "Stay updated", fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#f5f3f0", borderRadius: 12, padding: 16, border: "1px solid #e8e5e0", mass: 1,
        children: [{ id: "nl-d", type: "paragraph", rect: { x: 0, y: 28, width: sW - 32, height: 50 }, throwable: false, pinned: true, text: "Get notified when we publish new experiments and demos.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18, color: "#888" }] },
    ],
  };
}
