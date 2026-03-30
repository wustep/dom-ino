import type { SceneDescription } from "../types";
import { SANS, MONO } from "./fonts";

const PAL_SERIF = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';

const BODY_1 = `The web renders text through a pipeline designed thirty years ago for static documents. A browser loads a font, shapes text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step depends on the previous one. Every step requires the rendering engine to consult its internal layout tree — a structure so expensive to maintain that browsers guard access behind synchronous reflow barriers that can freeze the main thread for tens of milliseconds at a time.`;

const BODY_2 = `For a paragraph in a blog post, this pipeline is invisible. The browser loads, lays out, and paints before the reader\u2019s eye has traveled from the address bar to the first word. But the web is no longer a collection of static documents. It is a platform for applications, and those applications need to know about text in ways the original pipeline never anticipated. A messaging app needs exact bubble heights. A masonry layout needs card heights. An editorial page needs text flowing around images, ads, and interactive elements.`;

const BODY_3 = `What if text measurement did not require the DOM at all? What if you could compute exactly where every line of text would break, exactly how wide each line would be, and exactly how tall the entire text block would be, using nothing but arithmetic? This is the core insight of Pretext. The browser\u2019s canvas API includes a measureText method that returns the width of any string in any font without triggering a layout reflow. Pretext exploits this asymmetry: measure once via canvas, cache the widths, then layout is pure arithmetic.`;

const BODY_4 = `The performance improvement is not incremental. Measuring five hundred text blocks with DOM methods costs fifteen to thirty milliseconds and triggers five hundred layout reflows. With Pretext, the same operation costs 0.05 milliseconds and triggers zero reflows. This is a three-hundred-fold improvement. But even that number understates the impact, because Pretext\u2019s cost does not scale with page complexity — it is independent of how many other elements exist on the page.`;

const BODY_5 = `With DOM-free text measurement, an entire class of previously impractical interfaces becomes trivial. Text can flow around arbitrary shapes — rectangles, circles, polygons, even image alpha channels. Obstacles can move, animate, or be dragged by the user, and the text reflows instantly because the layout computation takes less than a millisecond. This is exactly what CSS Shapes tried to accomplish, but with none of its limitations.`;

const BODY_6 = `The glowing orbs drifting across this page are not decorative — they are the demonstration. Each orb is a circular obstacle. For every line of text, the engine checks whether the line\u2019s vertical band intersects each orb. If it does, it computes the blocked horizontal interval and subtracts it from the available width. The remaining width might be split into two or more segments — and the engine fills every viable slot, flowing text on both sides of the obstacle simultaneously.`;

export function createEngineScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 80, 1200);
  const mx = Math.max(40, (vw - w) / 2);
  const H = Math.max(vh, 1800);
  const colGap = 40;
  const colCount = vw > 900 ? 2 : 1;
  const colW = colCount === 2 ? (w - colGap) / 2 : w;
  const col2X = mx + colW + colGap;
  const bodyY = 140;

  return {
    id: "engine", name: "Engine", width: vw, height: H, backgroundColor: "#0a0a0c",
    elements: [
      // Headline
      { id: "de-hl", type: "heading", rect: { x: mx, y: 40, width: w, height: 70 }, throwable: false, pinned: true,
        text: "THE FUTURE OF TEXT LAYOUT IS NOT CSS", fontSize: 48, fontWeight: 700, fontFamily: PAL_SERIF, lineHeight: 52, color: "#ffffff" },
      { id: "de-hint", type: "heading", rect: { x: mx, y: 112, width: w, height: 16 }, throwable: false, pinned: true,
        text: "Drag the orbs · Text reflows at 60fps · Zero DOM reads", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 16, color: "rgba(255,255,255,0.22)" },

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
        text: "\u201CThe performance improvement is not incremental — it is categorical. 0.05ms versus 30ms.\u201D",
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
        text: "Adapted from somnai-dreams/pretext-demos · Powered by @chenglou/pretext", fontSize: 9, fontWeight: 400, fontFamily: MONO, lineHeight: 14, color: "rgba(255,255,255,0.28)" },
    ],
  };
}
