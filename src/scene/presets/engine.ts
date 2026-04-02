import type { SceneDescription } from "../types";

const PAL_SERIF = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
const UI_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const COL1_TEXT = `he web renders text through a pipeline that was designed thirty years ago for static documents. A browser loads a font, shapes the text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step depends on the previous one. Every step requires the rendering engine to consult its internal layout tree \u2014 a structure so expensive to maintain that browsers guard access behind synchronous barriers that can freeze the main thread for tens of milliseconds at a time. For a paragraph in a blog post, this pipeline is invisible. The browser loads, lays out, and paints before the reader\u2019s eye has traveled from the address bar to the first word. But the web is no longer a collection of static documents. It is a platform for applications, and those applications need to know about text in ways the original pipeline never anticipated. A messaging application needs to know the exact height of every message bubble before rendering a virtualized list. A masonry layout needs the height of every card to position them without overlap. An editorial page needs text to flow around images, advertisements, and interactive elements. A responsive dashboard needs to resize and reflow text in real time as the user drags a panel divider. Every one of these operations requires text measurement. And every text measurement on the web today requires a synchronous layout reflow. The cost is devastating. Measuring the height of a single text block forces the browser to recalculate the position of every element on the page. When you measure five hundred text blocks in sequence, you trigger five hundred full layout passes. This pattern, known as layout thrashing, is the single largest source of jank on the modern web. Chrome DevTools will flag it with angry red bars.`;

const COL2_TEXT = `Lighthouse will dock your performance score. But the developer has no alternative \u2014 CSS provides no API for computing text height without rendering it. The information is locked behind the DOM, and the DOM makes you pay for every answer. Developers have invented increasingly desperate workarounds. Estimated heights replace real measurements with guesses, causing content to visibly jump when the guess is wrong. ResizeObserver watches elements for size changes, but it fires asynchronously and always at least one frame too late. IntersectionObserver tracks visibility but says nothing about dimensions. Content-visibility allows the browser to skip rendering off-screen elements, but it breaks scroll position and accessibility. Each workaround addresses one symptom while introducing new problems. The CSS Shapes specification, finalized in 2014, was supposed to bring magazine-style text wrap to the web. It allows text to flow around a defined shape \u2014 a circle, an ellipse, a polygon, even an image alpha channel. On paper, it was the answer. In practice, it is remarkably limited. CSS Shapes only works with floated elements. Text can only wrap on one side of the shape. The shape must be defined statically in CSS \u2014 you cannot animate it or change it dynamically without triggering a full layout reflow. And because it operates within the browser\u2019s layout engine, you have no access to the resulting line geometry. You cannot determine where each line of text starts and ends, how many lines were generated, or what the total height of the shaped text block is. The editorial layouts we see in print magazines \u2014 text flowing around photographs, pull quotes interrupting the column, multiple columns with seamless text handoff \u2014 have remained out of reach for the web.`;

const COL3_TEXT = `Not because they are conceptually difficult, but because the performance cost of implementing them with DOM measurement makes them impractical. A two-column editorial layout that reflows text around three obstacle shapes requires measuring and positioning hundreds of text lines. At thirty milliseconds per measurement, this would take seconds \u2014 an eternity for a render frame. What if text measurement did not require the DOM at all? What if you could compute exactly where every line of text would break, exactly how wide each line would be, and exactly how tall the entire text block would be, using nothing but arithmetic? This is the core insight of pretext. The browser\u2019s canvas API includes a measureText method that returns the width of any string in any font without triggering a layout reflow. Canvas measurement uses the same font engine as DOM rendering \u2014 the results are identical. But because it operates outside the layout tree, it carries no reflow penalty. Pretext exploits this asymmetry. When text first appears, pretext measures every word once via canvas and caches the widths. After this preparation phase, layout is pure arithmetic: walk the cached widths, track the running line width, insert line breaks when the width exceeds the maximum, and sum the line heights. No DOM. No reflow. No layout tree access. The performance improvement is not incremental. Measuring five hundred text blocks with DOM methods costs fifteen to thirty milliseconds and triggers five hundred layout reflows. With pretext, the same operation costs 0.05 milliseconds and triggers zero reflows. This is a three hundred to six hundred times improvement. But even that number understates the impact, because pretext\u2019s cost does not scale with page complexity \u2014 it is independent of how many other elements exist on the page. With DOM-free text measurement, an entire class of previously impractical interfaces becomes trivial.`;

const QUOTE_1 = "\u201CThe performance improvement is not incremental \u2014 it is categorical. 0.05ms versus 30ms. Zero reflows versus five hundred.\u201D";
const QUOTE_2 = "\u201CText becomes a first-class participant in the visual composition \u2014 not a static block, but a fluid material that adapts in real time.\u201D";

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
  const narrow = vw < 900;
  const gutter = narrow ? 20 : 48;
  const contentW = Math.min(vw - gutter * 2, narrow ? 680 : 1160);
  const mx = Math.max(gutter, (vw - contentW) / 2);

  const headlineY = narrow ? 42 : 44;
  const headlineSize = narrow ? 42 : vw > 1200 ? 72 : 60;
  const headlineLineHeight = narrow ? 44 : Math.round(headlineSize * 1.05);
  const headlineH = headlineLineHeight * 2 + 12;
  const bodyY = headlineY + headlineH + (narrow ? 30 : 40);
  const bodyFontSize = narrow ? 16 : 15;
  const bodyLH = narrow ? 26 : 24;

  const bodyH = narrow ? 1300 : 950;
  const H = Math.max(vh, bodyY + bodyH + 50);
  const orbFieldH = Math.min(H - 80, Math.max(vh, bodyY + (narrow ? 1000 : 700)));
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

  const dropCapSize = narrow ? 62 : 72;
  const dropCapW = narrow ? 36 : 42;
  const dropCapH = narrow ? 70 : 80;
  elements.push({
    id: "de-dropcap",
    type: "card",
    rect: { x: mx - 2, y: bodyY - 6, width: dropCapW, height: dropCapH },
    throwable: false,
    pinned: true,
    text: "T",
    fontSize: dropCapSize,
    fontWeight: 700,
    fontFamily: PAL_SERIF,
    lineHeight: dropCapSize,
    color: "#c4a35a",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    borderRadius: 0,
    padding: 0,
    affectsTextFlow: true,
  });

  const colGap = narrow ? 20 : 30;
  const colCount = narrow ? 1 : 3;
  const colW = colCount === 1 ? contentW : (contentW - colGap * (colCount - 1)) / colCount;
  const col2X = mx + colW + colGap;
  const col3X = mx + (colW + colGap) * 2;

  const fullText = COL1_TEXT + " " + COL2_TEXT + " " + COL3_TEXT;

  if (colCount === 1) {
    const q1W = Math.min(colW * 0.65, 320);
    const q1Y = bodyY + 480;

    elements.push(
      {
        id: "de-pq1",
        type: "card",
        rect: { x: mx, y: q1Y, width: q1W, height: 155 },
        throwable: false,
        pinned: true,
        text: QUOTE_1,
        fontSize: 17,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 25,
        color: "#b8a070",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "inset 3px 0 0 0 #6b5a3d",
        borderRadius: 0,
        padding: 14,
        affectsTextFlow: true,
      },
      {
        id: "de-col1",
        type: "paragraph",
        rect: { x: mx, y: bodyY, width: colW, height: bodyH },
        throwable: false,
        pinned: true,
        text: fullText,
        fontSize: bodyFontSize,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: bodyLH,
        color: "#e8e4dc",
      },
    );
  } else {
    const q1W = Math.round(colW * 0.62);
    const q1Y = bodyY + 440;
    const q2W = Math.round(colW * 0.58);
    const q2Y = bodyY + 280;

    elements.push(
      {
        id: "de-pq1",
        type: "card",
        rect: { x: mx, y: q1Y, width: q1W, height: 165 },
        throwable: false,
        pinned: true,
        text: QUOTE_1,
        fontSize: 17,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 25,
        color: "#b8a070",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "inset 3px 0 0 0 #6b5a3d",
        borderRadius: 0,
        padding: 14,
        affectsTextFlow: true,
      },
      {
        id: "de-pq2",
        type: "card",
        rect: { x: col2X, y: q2Y, width: q2W, height: 175 },
        throwable: false,
        pinned: true,
        text: QUOTE_2,
        fontSize: 17,
        fontWeight: 400,
        fontStyle: "italic",
        fontFamily: PAL_SERIF,
        lineHeight: 25,
        color: "#b8a070",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "inset 3px 0 0 0 #6b5a3d",
        borderRadius: 0,
        padding: 14,
        affectsTextFlow: true,
      },
      {
        id: "de-col1",
        type: "paragraph",
        rect: { x: mx, y: bodyY, width: colW, height: bodyH },
        throwable: false,
        pinned: true,
        text: fullText,
        fontSize: bodyFontSize,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: bodyLH,
        color: "#e8e4dc",
      },
      {
        id: "de-col2",
        type: "paragraph",
        rect: { x: col2X, y: bodyY, width: colW, height: bodyH },
        throwable: false,
        pinned: true,
        text: fullText,
        textContinuationId: "de-col1",
        fontSize: bodyFontSize,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: bodyLH,
        color: "#e8e4dc",
      },
      {
        id: "de-col3",
        type: "paragraph",
        rect: { x: col3X, y: bodyY, width: colW, height: bodyH },
        throwable: false,
        pinned: true,
        text: fullText,
        textContinuationId: "de-col2",
        fontSize: bodyFontSize,
        fontWeight: 400,
        fontFamily: PAL_SERIF,
        lineHeight: bodyLH,
        color: "#e8e4dc",
      },
    );
  }

  elements.push({
    id: "de-credit",
    type: "link",
    rect: { x: (vw - 240) / 2, y: H - 30, width: 240, height: 14 },
    throwable: false,
    pinned: true,
    text: "Original by @somnai_dreams",
    fontSize: 11,
    fontWeight: 400,
    fontFamily: UI_SANS,
    color: "rgba(255,255,255,0.28)",
    backgroundColor: "transparent",
    borderRadius: 0,
    textAlign: "center",
    href: "https://x.com/somnai_dreams",
  });

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
      return {
        ...element,
        allowWordBreaks: false,
        minSegmentWidth: element.id === "de-headline" ? 110 : 50,
      };
    }),
  };
}
