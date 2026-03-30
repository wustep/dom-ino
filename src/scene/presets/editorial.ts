import type { SceneDescription } from "../types";
import { SERIF, SANS, MONO } from "./fonts";

export function createEditorialScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 920);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1600);
  const col2W = (w - 28) / 2;
  const col3W = (w - 48) / 3;

  const COL_L = `In the quiet hours before dawn, when the city sleeps and the machines hum, there exists a peculiar kind of clarity. The words arrange themselves differently at this hour — more honestly, perhaps. The typographer knows this feeling intimately: the moment when spacing clicks into place, when the river of white space between lines finds its natural course, and the page begins to breathe. It is not merely an arrangement of letters; it is an architecture of meaning, built one glyph at a time, tested against the constraints of the medium.`;

  const COL_R = `The relationship between text and its obstacles has fascinated layout designers since the invention of the printing press. A woodcut illustration dropped into a column of text creates a conversation between image and word. The text must negotiate its path — flowing left when blocked on the right, splitting into rivulets around a central obstruction, sometimes abandoning a line entirely when no space remains. These negotiations happen invisibly in every browser, every typesetting engine on earth.`;

  const SEC2_1 = `The physics of digital typography operate on principles that would be familiar to any compositor from the age of hot metal. Weight, space, and rhythm govern the placement of every character. But where the compositor had minutes to set a single line, the modern layout engine must recalculate thousands of lines in a single frame — sixteen milliseconds of pure arithmetic.`;

  const SEC2_2 = `Pretext, the engine beneath this demonstration, achieves this through a single key insight: text measurement can be decoupled from the DOM entirely. By pre-computing segment widths using the browser's own font engine, then performing layout as pure mathematics, it sidesteps the most expensive operation in web rendering: layout reflow. The result is text that can be re-laid out hundreds of times per second.`;

  const SEC2_3 = `The editorial implications are profound. Imagine a newspaper where the illustrations drift lazily across the page, and the columns of text reform around them like water around stones in a stream. Imagine a textbook where diagrams can be repositioned by the reader, with every paragraph automatically adjusting. This is the future that DOMino explores.`;

  return {
    id: "editorial", name: "Editorial", width: vw, height: H, backgroundColor: "#f4f1eb",
    elements: [
      // Masthead
      { id: "e-r1", type: "divider", rect: { x: mx, y: 20, width: w, height: 3 }, throwable: false, pinned: true, backgroundColor: "#1a1a1a" },
      { id: "e-mast", type: "heading", rect: { x: mx, y: 28, width: w, height: 48 }, throwable: false, pinned: true, text: "The Editorial Engine", fontSize: 40, fontWeight: 700, fontFamily: SERIF, lineHeight: 46, color: "#1a1a1a" },
      { id: "e-vol", type: "heading", rect: { x: mx, y: 78, width: w / 2, height: 16 }, throwable: false, pinned: true, text: "Vol. I · Sunday Edition · March 2026", fontSize: 10, fontWeight: 400, fontFamily: SERIF, lineHeight: 14, color: "#999" },
      { id: "e-price", type: "badge", rect: { x: mx + w - 60, y: 74, width: 60, height: 20 }, throwable: true, pinned: false, text: "$2.50", fontSize: 10, fontWeight: 600, fontFamily: MONO, color: "#1a1a1a", backgroundColor: "transparent", borderRadius: 0, border: "1px solid #ccc", mass: 0.08 },
      { id: "e-r2", type: "divider", rect: { x: mx, y: 100, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#bbb" },
      { id: "e-r2b", type: "divider", rect: { x: mx, y: 103, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#bbb" },

      // Section badges
      { id: "e-sec-1", type: "badge", rect: { x: mx, y: 108, width: 72, height: 18 }, throwable: true, pinned: false, text: "OPINION", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#c0392b", backgroundColor: "transparent", borderRadius: 0, mass: 0.04 },
      { id: "e-sec-2", type: "badge", rect: { x: mx + 80, y: 108, width: 48, height: 18 }, throwable: true, pinned: false, text: "TECH", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#2980b9", backgroundColor: "transparent", borderRadius: 0, mass: 0.04 },
      { id: "e-sec-3", type: "badge", rect: { x: mx + 136, y: 108, width: 66, height: 18 }, throwable: true, pinned: false, text: "CULTURE", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#27ae60", backgroundColor: "transparent", borderRadius: 0, mass: 0.04 },

      // Headline
      { id: "e-hl", type: "heading", rect: { x: mx, y: 136, width: w, height: 34 }, throwable: false, pinned: true, text: "When Text Becomes Liquid", fontSize: 28, fontWeight: 700, fontFamily: SERIF, lineHeight: 34, color: "#1a1a1a" },
      { id: "e-by", type: "heading", rect: { x: mx, y: 176, width: w, height: 16 }, throwable: false, pinned: true, text: "By the DOMino Editorial Board · Illustrated in real-time", fontSize: 11, fontWeight: 400, fontFamily: SERIF, lineHeight: 16, color: "#999" },
      { id: "e-r3", type: "divider", rect: { x: mx, y: 200, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" },

      // Two-column section
      { id: "e-c1", type: "paragraph", rect: { x: mx, y: 216, width: col2W, height: 360 }, throwable: false, pinned: true, text: COL_L, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },
      { id: "e-c2", type: "paragraph", rect: { x: mx + col2W + 28, y: 216, width: col2W, height: 360 }, throwable: false, pinned: true, text: COL_R, fontSize: 15, fontWeight: 400, fontFamily: SERIF, lineHeight: 24, color: "#333" },

      // Orbs in two-column area
      { id: "e-o1", type: "badge", rect: { x: mx + col2W / 2 - 28, y: 290, width: 56, height: 56 }, throwable: true, pinned: false, text: "A", fontSize: 20, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#c0392b", borderRadius: 28, mass: 0.7 },
      { id: "e-o2", type: "badge", rect: { x: mx + col2W + 28 + col2W / 2 - 24, y: 320, width: 48, height: 48 }, throwable: true, pinned: false, text: "B", fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#2980b9", borderRadius: 24, mass: 0.6 },

      // Mid-section rule + heading
      { id: "e-r4", type: "divider", rect: { x: mx, y: 600, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ccc" },
      { id: "e-mid-h", type: "heading", rect: { x: mx, y: 616, width: w, height: 24 }, throwable: false, pinned: true, text: "The Physics of the Page", fontSize: 20, fontWeight: 700, fontFamily: SERIF, lineHeight: 24, color: "#1a1a1a" },
      { id: "e-r5", type: "divider", rect: { x: mx, y: 648, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ddd" },

      // Three-column section
      { id: "e-t1", type: "paragraph", rect: { x: mx, y: 664, width: col3W, height: 340 }, throwable: false, pinned: true, text: SEC2_1, fontSize: 14, fontWeight: 400, fontFamily: SERIF, lineHeight: 22, color: "#444" },
      { id: "e-t2", type: "paragraph", rect: { x: mx + col3W + 24, y: 664, width: col3W, height: 340 }, throwable: false, pinned: true, text: SEC2_2, fontSize: 14, fontWeight: 400, fontFamily: SERIF, lineHeight: 22, color: "#444" },
      { id: "e-t3", type: "paragraph", rect: { x: mx + (col3W + 24) * 2, y: 664, width: col3W, height: 340 }, throwable: false, pinned: true, text: SEC2_3, fontSize: 14, fontWeight: 400, fontFamily: SERIF, lineHeight: 22, color: "#444" },

      // Orbs in three-column area
      { id: "e-o3", type: "badge", rect: { x: mx + col3W + 24 + col3W / 2 - 32, y: 740, width: 64, height: 64 }, throwable: true, pinned: false, text: "C", fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#27ae60", borderRadius: 32, mass: 0.9 },
      { id: "e-o4", type: "badge", rect: { x: mx + 60, y: 780, width: 40, height: 40 }, throwable: true, pinned: false, text: "D", fontSize: 14, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#8e44ad", borderRadius: 20, mass: 0.4 },
      { id: "e-o5", type: "badge", rect: { x: mx + (col3W + 24) * 2 + col3W / 2 - 26, y: 760, width: 52, height: 52 }, throwable: true, pinned: false, text: "E", fontSize: 18, fontWeight: 700, fontFamily: SERIF, color: "#fff", backgroundColor: "#e67e22", borderRadius: 26, mass: 0.6 },

      // Floating cards
      { id: "e-card-1", type: "card", rect: { x: mx + col2W - 30, y: 460, width: 90, height: 56 }, throwable: true, pinned: false, text: "Drag me", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 8, padding: 12, border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", mass: 0.4 },
      { id: "e-card-2", type: "card", rect: { x: mx + col2W + 58, y: 460, width: 90, height: 56 }, throwable: true, pinned: false, text: "Throw me", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 8, padding: 12, border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", mass: 0.4 },
      { id: "e-img", type: "image", rect: { x: mx + w / 2 - 70, y: 920, width: 140, height: 90 }, throwable: true, pinned: false, backgroundColor: "#e0dcd4", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", mass: 1.2 },

      // Decorative pull-quote
      { id: "e-pq", type: "card", rect: { x: mx + w / 2 - 140, y: 1040, width: 280, height: 50 }, throwable: true, pinned: false,
        text: '"The page begins to breathe."', fontSize: 16, fontWeight: 500, fontFamily: SERIF, color: "#8e44ad", backgroundColor: "transparent",
        borderRadius: 0, padding: 12, border: "none", boxShadow: "none", mass: 0.5, children: [] },

      // Footer
      { id: "e-r6", type: "divider", rect: { x: mx, y: 1120, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#ccc" },
      { id: "e-foot", type: "heading", rect: { x: mx, y: 1134, width: w, height: 14 }, throwable: false, pinned: true, text: "Powered by @chenglou/pretext · Inspired by somnai-dreams/pretext-demos · Built with Matter.js", fontSize: 9, fontWeight: 400, fontFamily: MONO, lineHeight: 14, color: "#bbb" },
    ],
  };
}
