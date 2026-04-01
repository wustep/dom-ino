import type { SceneDescription } from "../types";

const PAL_SERIF = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
const UI_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const LEDE = `he web renders text through a pipeline that was designed thirty years ago for static documents. A browser loads a font, shapes the text into glyphs, measures their combined width, determines where lines break, and positions each line vertically.`;
const BODY_1 = `For a paragraph in a blog post, this pipeline is invisible. But the web is no longer a collection of static documents. It is a platform for applications, and those applications need to know about text in ways the original pipeline never anticipated. A messaging application needs exact bubble heights. A masonry layout needs card heights. An editorial page needs text flowing around images, advertisements, and interactive elements.`;
const BODY_2 = `Every one of these operations requires text measurement. And every text measurement on the web today requires a synchronous layout reflow. The cost is devastating. Measuring the height of a single text block forces the browser to recalculate the position of every element on the page. When you measure five hundred text blocks in sequence, you trigger five hundred full layout passes.`;
const BODY_3 = `The CSS Shapes specification, finalized in 2014, was supposed to bring magazine-style text wrap to the web. On paper, it was the answer. In practice, it is remarkably limited. Text can only wrap on one side of the shape, the shape must be defined statically in CSS, and you have no access to the resulting line geometry.`;
const BODY_4 = `What if text measurement did not require the DOM at all? What if you could compute exactly where every line of text would break, exactly how wide each line would be, and exactly how tall the entire text block would be, using nothing but arithmetic? This is the core insight of pretext.`;
const BODY_5 = `With DOM-free text measurement, an entire class of previously impractical interfaces becomes trivial. Text can flow around arbitrary shapes, not because the browser's layout engine supports it, but because you control the line widths directly. Obstacles can move, animate, or be dragged by the user, and the text reflows instantly because the layout computation takes less than a millisecond.`;
const BODY_6 = `The glowing orbs drifting across this page are not decorative - they are the demonstration. Each orb is a circular obstacle. For every line of text, the engine checks whether the line's vertical band intersects each orb, computes the blocked horizontal interval, and fills every viable slot, flowing text on both sides of the obstacle simultaneously.`;

type OrbDefinition = {
  id: string;
  fx: number;
  fy: number;
  size: number;
  mass: number;
  vx: number;
  vy: number;
  color: [number, number, number];
};

const ORBS: OrbDefinition[] = [
  { id: "gold", fx: 0.52, fy: 0.22, size: 220, mass: 1.5, vx: 0.4, vy: 0.267, color: [196, 163, 90] },
  { id: "blue", fx: 0.18, fy: 0.48, size: 170, mass: 1.0, vx: -0.316, vy: 0.433, color: [100, 140, 255] },
  { id: "pink", fx: 0.74, fy: 0.58, size: 190, mass: 1.2, vx: 0.267, vy: -0.35, color: [232, 100, 130] },
  { id: "green", fx: 0.38, fy: 0.72, size: 150, mass: 0.8, vx: -0.433, vy: -0.233, color: [80, 200, 140] },
  { id: "purple", fx: 0.86, fy: 0.18, size: 130, mass: 0.7, vx: -0.217, vy: 0.317, color: [150, 100, 220] },
];

function orbGradient(color: [number, number, number]): string {
  const [r, g, b] = color;
  return `radial-gradient(circle at 35% 35%, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.12) 55%, transparent 72%)`;
}

function orbShadow(color: [number, number, number]): string {
  const [r, g, b] = color;
  return `0 0 60px 15px rgba(${r},${g},${b},0.18), 0 0 120px 40px rgba(${r},${g},${b},0.07)`;
}

export function createEngineScene(vw: number, vh: number): SceneDescription {
  const narrow = vw < 760;
  const gutter = narrow ? 20 : 48;
  const contentW = Math.min(vw - gutter * 2, narrow ? 680 : 1160);
  const mx = Math.max(gutter, (vw - contentW) / 2);
  const colGap = narrow ? 20 : 40;
  const colCount = narrow ? 1 : 2;
  const colW = colCount === 1 ? contentW : (contentW - colGap) / 2;
  const col2X = mx + colW + colGap;

  const headlineY = narrow ? 42 : 44;
  const headlineSize = narrow ? 36 : vw > 1200 ? 54 : 48;
  const headlineLineHeight = narrow ? 38 : Math.round(headlineSize * 0.93);
  const headlineH = narrow ? headlineLineHeight * 2 + 6 : headlineLineHeight + 8;
  const bodyY = narrow ? 176 : 210;

  const wideContentBottom = bodyY + 1110;
  const narrowContentBottom = bodyY + 1940;
  const H = Math.max(vh, narrow ? narrowContentBottom : wideContentBottom);
  const orbFieldH = Math.min(H - 80, Math.max(vh, bodyY + (narrow ? 1100 : 760)));
  const orbScale = narrow ? 0.72 : 1;

  const elements: SceneDescription["elements"] = [
    {
      id: "de-bg",
      type: "container",
      rect: { x: 0, y: 0, width: vw, height: H },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      backgroundColor: "radial-gradient(ellipse at 50% 8%, #121218 0%, #0a0a0c 58%, #070709 100%)",
    },
    {
      id: "de-atmosphere",
      type: "container",
      rect: { x: 0, y: 0, width: vw, height: H },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      backgroundColor: "radial-gradient(circle at 18% 24%, rgba(196,163,90,0.08) 0%, transparent 34%), radial-gradient(circle at 82% 12%, rgba(150,100,220,0.08) 0%, transparent 32%), radial-gradient(circle at 70% 56%, rgba(232,100,130,0.07) 0%, transparent 30%)",
      opacity: 0.9,
    },
    {
      id: "de-headline",
      type: "heading",
      rect: { x: mx, y: headlineY, width: contentW, height: headlineH },
      throwable: false,
      pinned: true,
      text: "THE FUTURE OF TEXT LAYOUT IS NOT CSS",
      fontSize: headlineSize,
      fontWeight: 700,
      fontFamily: PAL_SERIF,
      lineHeight: headlineLineHeight,
      letterSpacing: "-0.03em",
      color: "#ffffff",
    },
  ];

  if (colCount === 1) {
    const quoteW = Math.min(colW * 0.88, 420);

    elements.push(
      {
        id: "de-dropcap",
        type: "heading",
        rect: { x: mx - 2, y: bodyY - 10, width: 40, height: 96 },
        throwable: false,
        pinned: true,
        text: "T",
        fontSize: 86,
        fontWeight: 700,
        fontFamily: PAL_SERIF,
        lineHeight: 82,
        color: "#c4a35a",
      },
      {
        id: "de-lede",
        type: "paragraph",
        rect: { x: mx + 38, y: bodyY + 8, width: colW - 38, height: 120 },
        throwable: false,
        pinned: true,
        text: LEDE,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
      {
        id: "de-p1",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 148, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_1,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
      {
        id: "de-p2",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 434, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_2,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
      { id: "de-pq1-rule", type: "divider", rect: { x: mx, y: bodyY + 716, width: 3, height: 96 }, throwable: false, pinned: true, backgroundColor: "#6b5a3d" },
      {
        id: "de-pq1",
        type: "paragraph",
        rect: { x: mx + 18, y: bodyY + 708, width: quoteW, height: 108 },
        throwable: false,
        pinned: true,
        text: "“The performance improvement is not incremental — it is categorical. 0.05ms versus 30ms. Zero reflows versus five hundred.”",
        fontSize: 18,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 27,
        color: "#b8a070",
      },
      {
        id: "de-p3",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 860, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_3,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
      {
        id: "de-p4",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 1140, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_4,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
      { id: "de-pq2-rule", type: "divider", rect: { x: mx, y: bodyY + 1426, width: 3, height: 96 }, throwable: false, pinned: true, backgroundColor: "#6b5a3d" },
      {
        id: "de-pq2",
        type: "paragraph",
        rect: { x: mx + 18, y: bodyY + 1418, width: quoteW, height: 112 },
        throwable: false,
        pinned: true,
        text: "“Text becomes a first-class participant in the visual composition — not a static block, but a fluid material that adapts in real time.”",
        fontSize: 18,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 27,
        color: "#b8a070",
      },
      {
        id: "de-p5",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 1572, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_5,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
      {
        id: "de-p6",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 1864, width: colW, height: 240 },
        throwable: false,
        pinned: true,
        text: BODY_6,
        fontSize: 17,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 28,
        color: "#e8e4dc",
      },
    );
  } else {
    const quote1X = col2X;
    const quote1W = colW * 0.5;
    const quote2W = colW * 0.46;
    const quote2X = mx + colW - quote2W;

    elements.push(
      {
        id: "de-dropcap",
        type: "heading",
        rect: { x: mx - 3, y: bodyY - 10, width: 44, height: 102 },
        throwable: false,
        pinned: true,
        text: "T",
        fontSize: 92,
        fontWeight: 700,
        fontFamily: PAL_SERIF,
        lineHeight: 88,
        color: "#c4a35a",
      },
      {
        id: "de-lede",
        type: "paragraph",
        rect: { x: mx + 42, y: bodyY + 6, width: colW - 42, height: 112 },
        throwable: false,
        pinned: true,
        text: LEDE,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      {
        id: "de-p1",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 136, width: colW, height: 228 },
        throwable: false,
        pinned: true,
        text: BODY_1,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      {
        id: "de-p2",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 388, width: colW, height: 236 },
        throwable: false,
        pinned: true,
        text: BODY_2,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      { id: "de-pq2-rule", type: "divider", rect: { x: quote2X, y: bodyY + 652, width: 3, height: 98 }, throwable: false, pinned: true, backgroundColor: "#6b5a3d" },
      {
        id: "de-pq2",
        type: "paragraph",
        rect: { x: quote2X + 18, y: bodyY + 644, width: quote2W - 18, height: 110 },
        throwable: false,
        pinned: true,
        text: "“The performance improvement is not incremental — it is categorical. 0.05ms versus 30ms. Zero reflows versus five hundred.”",
        fontSize: 19,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 27,
        color: "#b8a070",
      },
      {
        id: "de-p5",
        type: "paragraph",
        rect: { x: mx, y: bodyY + 796, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_5,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      {
        id: "de-p3",
        type: "paragraph",
        rect: { x: col2X, y: bodyY + 24, width: colW, height: 270 },
        throwable: false,
        pinned: true,
        text: BODY_3,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      { id: "de-pq1-rule", type: "divider", rect: { x: quote1X, y: bodyY + 332, width: 3, height: 104 }, throwable: false, pinned: true, backgroundColor: "#6b5a3d" },
      {
        id: "de-pq1",
        type: "paragraph",
        rect: { x: quote1X + 18, y: bodyY + 326, width: quote1W - 18, height: 116 },
        throwable: false,
        pinned: true,
        text: "“Text becomes a first-class participant in the visual composition — not a static block, but a fluid material that adapts in real time.”",
        fontSize: 19,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 27,
        color: "#b8a070",
      },
      {
        id: "de-p4",
        type: "paragraph",
        rect: { x: col2X, y: bodyY + 490, width: colW, height: 250 },
        throwable: false,
        pinned: true,
        text: BODY_4,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      {
        id: "de-p6",
        type: "paragraph",
        rect: { x: col2X, y: bodyY + 812, width: colW, height: 264 },
        throwable: false,
        pinned: true,
        text: BODY_6,
        fontSize: 18,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: 30,
        color: "#e8e4dc",
      },
      {
        id: "de-credit",
        type: "heading",
        rect: { x: vw - 256, y: H - 30, width: 240, height: 14 },
        throwable: false,
        pinned: true,
        text: "Made by @somnai_dreams · Powered by @chenglou/pretext",
        fontSize: 11,
        fontWeight: 400,
        fontFamily: UI_SANS,
        lineHeight: 14,
        color: "rgba(255,255,255,0.28)",
        textAlign: "right",
      },
    );
  }

  for (const orb of ORBS) {
    const size = orb.size * orbScale;
    elements.push({
      id: `de-orb-${orb.id}`,
      type: "badge",
      rect: {
        x: orb.fx * vw - size / 2,
        y: orb.fy * orbFieldH - size / 2,
        width: size,
        height: size,
      },
      throwable: true,
      pinned: false,
      text: "",
      fontSize: 1,
      fontWeight: 400,
      fontFamily: UI_SANS,
      color: "transparent",
      backgroundColor: orbGradient(orb.color),
      borderRadius: size / 2,
      boxShadow: orbShadow(orb.color),
      mass: orb.mass,
      physicsShape: "circle",
      initialVelocityX: orb.vx,
      initialVelocityY: orb.vy,
      friction: 0,
      frictionAir: 0.001,
      restitution: 0.98,
    });
  }

  return {
    id: "engine",
    name: "Engine",
    width: vw,
    height: H,
    backgroundColor: "#0a0a0c",
    elements: elements.map((element) => {
      if (element.type !== "paragraph" && element.type !== "heading") return element;
      if (element.id === "de-dropcap") {
        return {
          ...element,
          allowWordBreaks: false,
          minSegmentWidth: 1,
        };
      }
      return {
        ...element,
        allowWordBreaks: false,
        minSegmentWidth: element.id === "de-headline" ? 110 : 50,
      };
    }),
  };
}
