import type { SceneDescription } from "../types";
import { MONO, SANS, SERIF } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const LEDE = `Weather pages often pretend the atmosphere is settled before the reader arrives. The map is static, the alert rail is tidy, and the forecast reads like a finished verdict. A better preset should feel closer to the thing it describes: unsettled, directional, full of systems that brush past one another and force every line to renegotiate its route.`;

const BODY_1 = `That is what makes meteorology such a good stress test for dynamic layout. Forecasting is not just a table of temperatures. It is a choreography of fronts, pressure pockets, warning zones, and short-lived windows of calm. When those objects can drift, collide, and be dragged through the copy, the bulletin stops feeling like a screenshot of a dashboard and starts behaving like live weather intelligence.`;

const BODY_2 = `The strongest weather pages also carry several reading speeds at once. At a glance, the viewer should catch the dominant system and the most urgent warning. A slower pass should reveal local notes, timing, and city-level nuance. That layered hierarchy is exactly what DOMino is good at: big signals for the room, smaller cards for the desk, and text that can keep its shape while the forecast furniture gets tossed around.`;

const BODY_3 = `In this preset, the moving cells are not decoration. They are pressure systems, heat pockets, and rain bands encoded as bodies in the scene. The copy has to work around them immediately. The radar plate can be pushed into the middle of the bulletin. The city cards can be stacked into a temporary blockade. The paragraph still recalculates line by line, as if the page were drafted for disturbance from the start.`;

const OUTLOOK = `That is the core idea: build presets whose mood is inseparable from their mechanics. A forecast page should move like weather. An editorial page should feel composed. A playground should invite improvisation. The more each preset commits to its own physical metaphor, the more the whole system stops feeling like a single demo skin and starts reading as a library of distinct dynamic formats.`;

const RADAR_PANEL = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280" fill="none">
  <rect width="420" height="280" rx="22" fill="#071726"/>
  <rect x="18" y="18" width="384" height="244" rx="18" fill="#0C2236" stroke="#193754"/>
  <path d="M64 70C104 50 144 42 180 54C214 64 252 56 286 42C318 30 346 30 372 46" stroke="#2C5A7E" stroke-width="2" stroke-linecap="round"/>
  <path d="M54 124C102 104 134 100 166 108C202 118 234 114 274 96C312 78 346 76 372 88" stroke="#244B6C" stroke-width="2" stroke-linecap="round"/>
  <path d="M48 184C90 160 134 152 180 166C224 180 264 178 306 152C336 134 360 132 378 140" stroke="#214461" stroke-width="2" stroke-linecap="round"/>
  <circle cx="148" cy="152" r="52" fill="url(#rain-1)" fill-opacity="0.92"/>
  <circle cx="234" cy="110" r="38" fill="url(#rain-2)" fill-opacity="0.88"/>
  <circle cx="306" cy="162" r="44" fill="url(#rain-3)" fill-opacity="0.9"/>
  <circle cx="148" cy="152" r="16" fill="#B5F6FF" fill-opacity="0.92"/>
  <circle cx="234" cy="110" r="12" fill="#FDF08C" fill-opacity="0.86"/>
  <circle cx="306" cy="162" r="14" fill="#9AF7CA" fill-opacity="0.88"/>
  <path d="M70 222H352" stroke="#1E3B57" stroke-width="1.5"/>
  <text x="38" y="46" fill="#E6F4FF" font-size="16" font-family="Arial, sans-serif" font-weight="700">Atlantic radar mosaic</text>
  <text x="38" y="66" fill="#7FA7C7" font-size="11" font-family="Arial, sans-serif">Composite reflectivity · last 12 minutes</text>
  <text x="52" y="238" fill="#84A9C8" font-size="11" font-family="Arial, sans-serif">Bands are densest just offshore and bending north.</text>
  <defs>
    <radialGradient id="rain-1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(148 152) rotate(90) scale(52)">
      <stop stop-color="#B5F6FF"/>
      <stop offset="0.34" stop-color="#4FD1F2"/>
      <stop offset="0.72" stop-color="#1D4ED8" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#0B1324" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rain-2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(234 110) rotate(90) scale(38)">
      <stop stop-color="#FFF4A3"/>
      <stop offset="0.38" stop-color="#F59E0B"/>
      <stop offset="0.76" stop-color="#B45309" stop-opacity="0.68"/>
      <stop offset="1" stop-color="#0B1324" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rain-3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(306 162) rotate(90) scale(44)">
      <stop stop-color="#B8FFDF"/>
      <stop offset="0.34" stop-color="#34D399"/>
      <stop offset="0.72" stop-color="#0F766E" stop-opacity="0.74"/>
      <stop offset="1" stop-color="#0B1324" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>
`);

const SATELLITE_PANEL = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220" fill="none">
  <rect width="360" height="220" rx="20" fill="#0B1523"/>
  <rect x="16" y="16" width="328" height="188" rx="16" fill="#101F31" stroke="#20354D"/>
  <path d="M48 150C78 122 112 102 150 96C188 92 214 100 242 124C266 144 290 152 316 150" fill="url(#cloud-a)" fill-opacity="0.92"/>
  <path d="M32 132C58 116 82 108 116 112C154 116 180 106 212 90C242 74 272 72 320 82" fill="url(#cloud-b)" fill-opacity="0.82"/>
  <path d="M56 72C82 54 108 46 142 50C174 54 200 48 226 36C252 24 278 24 314 38" stroke="#355173" stroke-width="2" stroke-linecap="round"/>
  <path d="M42 178C88 160 134 160 174 170C214 180 254 178 308 158" stroke="#274664" stroke-width="2" stroke-linecap="round"/>
  <circle cx="246" cy="102" r="24" fill="#FDE68A" fill-opacity="0.2"/>
  <text x="32" y="42" fill="#E6F4FF" font-size="15" font-family="Arial, sans-serif" font-weight="700">Satellite sweep</text>
  <text x="32" y="60" fill="#80A8CA" font-size="11" font-family="Arial, sans-serif">Cloud deck thickening over the eastern shelf</text>
  <defs>
    <radialGradient id="cloud-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(186 126) rotate(90) scale(56 152)">
      <stop stop-color="#EEF7FF"/>
      <stop offset="0.5" stop-color="#A7D7FF" stop-opacity="0.76"/>
      <stop offset="1" stop-color="#1A3550" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cloud-b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(178 102) rotate(90) scale(70 176)">
      <stop stop-color="#9CE7FF"/>
      <stop offset="0.52" stop-color="#3182CE" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#0B1523" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>
`);

type StormCellDefinition = {
  id: string;
  fx: number;
  fy: number;
  size: number;
  mass: number;
  vx: number;
  vy: number;
  label: string;
  tint: [number, number, number];
  core: [number, number, number];
};

const CELLS: StormCellDefinition[] = [
  { id: "marine", fx: 0.78, fy: 0.26, size: 172, mass: 1.18, vx: -0.32, vy: 0.22, label: "LOW", tint: [56, 189, 248], core: [191, 242, 255] },
  { id: "heat", fx: 0.24, fy: 0.48, size: 146, mass: 1.02, vx: 0.28, vy: -0.2, label: "HEAT", tint: [251, 146, 60], core: [255, 233, 161] },
  { id: "ridge", fx: 0.62, fy: 0.62, size: 188, mass: 1.26, vx: 0.22, vy: -0.26, label: "HIGH", tint: [129, 140, 248], core: [223, 228, 255] },
  { id: "spray", fx: 0.84, fy: 0.78, size: 128, mass: 0.84, vx: -0.18, vy: -0.24, label: "RAIN", tint: [16, 185, 129], core: [190, 255, 228] },
];

function cellGradient(
  tint: [number, number, number],
  core: [number, number, number],
): string {
  const [tr, tg, tb] = tint;
  const [cr, cg, cb] = core;
  return `radial-gradient(circle at 34% 32%, rgba(${cr},${cg},${cb},0.92), rgba(${tr},${tg},${tb},0.78) 28%, rgba(${tr},${tg},${tb},0.28) 64%, rgba(${tr},${tg},${tb},0.04) 82%, transparent 100%)`;
}

function cellShadow(tint: [number, number, number]): string {
  const [r, g, b] = tint;
  return `0 18px 48px rgba(${r},${g},${b},0.28), 0 0 72px rgba(${r},${g},${b},0.18)`;
}

export function createStormScene(vw: number, vh: number): SceneDescription {
  const narrow = vw < 920;
  const gutter = narrow ? 18 : 34;
  const w = Math.min(vw - gutter * 2, 1180);
  const mx = Math.max(gutter, (vw - w) / 2);
  const titleSize = narrow ? 44 : vw > 1380 ? 82 : 70;
  const titleLineHeight = narrow ? 46 : Math.round(titleSize * 0.9);
  const titleY = narrow ? 88 : 94;
  const titleH = narrow ? titleLineHeight * 3 + 10 : titleLineHeight * 2 + 8;
  const deckY = titleY + titleH + 18;
  const deckW = narrow ? w : Math.min(w * 0.72, 880);
  const bodyY = deckY + 82;
  const region1H = narrow ? 320 : 282;
  const region2Y = bodyY + region1H + (narrow ? 160 : 118);
  const region2H = narrow ? 328 : 286;
  const region3Y = region2Y + region2H + (narrow ? 170 : 126);
  const region3H = narrow ? 312 : 276;
  const footerY = region3Y + region3H + 86;
  const H = Math.max(vh, footerY + 152);
  const copyWidth = w;

  const elements: SceneDescription["elements"] = [
    {
      id: "st-bg",
      type: "container",
      rect: { x: 0, y: 0, width: vw, height: H },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      backgroundColor: "linear-gradient(180deg, #07111B 0%, #0A1624 38%, #0C1B2D 100%)",
    },
    {
      id: "st-atmosphere",
      type: "container",
      rect: { x: 0, y: 0, width: vw, height: H },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      backgroundColor: "radial-gradient(circle at 14% 14%, rgba(56,189,248,0.14) 0%, transparent 28%), radial-gradient(circle at 82% 12%, rgba(129,140,248,0.16) 0%, transparent 28%), radial-gradient(circle at 68% 64%, rgba(16,185,129,0.11) 0%, transparent 26%), radial-gradient(circle at 24% 72%, rgba(251,146,60,0.12) 0%, transparent 30%)",
      opacity: 0.96,
    },
    {
      id: "st-brand",
      type: "badge",
      rect: { x: mx, y: 30, width: 126, height: 30 },
      throwable: true,
      pinned: false,
      text: "AURORA WX",
      fontSize: 11,
      fontWeight: 800,
      fontFamily: MONO,
      color: "#E6F4FF",
      backgroundColor: "rgba(14, 165, 233, 0.18)",
      borderRadius: 999,
      border: "1px solid rgba(125, 211, 252, 0.2)",
      boxShadow: "0 10px 24px rgba(2, 132, 199, 0.12)",
      mass: 0.22,
      lockRotation: true,
    },
    {
      id: "st-meta",
      type: "heading",
      rect: { x: mx + 144, y: 34, width: w - 380, height: 18 },
      throwable: false,
      pinned: true,
      text: "Atlantic basin desk  |  05:42 UTC  |  Forecast rebuilds around live systems",
      fontSize: 11,
      fontWeight: 600,
      fontFamily: MONO,
      lineHeight: 18,
      color: "#87A9C9",
      letterSpacing: "0.02em",
    },
    {
      id: "st-live",
      type: "button",
      rect: { x: mx + w - 144, y: 28, width: 64, height: 32 },
      throwable: true,
      pinned: false,
      text: "LIVE",
      fontSize: 11,
      fontWeight: 800,
      fontFamily: MONO,
      color: "#E8FFF8",
      backgroundColor: "rgba(16, 185, 129, 0.24)",
      borderRadius: 999,
      border: "1px solid rgba(110, 231, 183, 0.25)",
      mass: 0.18,
      lockRotation: true,
    },
    {
      id: "st-reset",
      type: "button",
      rect: { x: mx + w - 72, y: 28, width: 72, height: 32 },
      throwable: true,
      pinned: false,
      text: "Desk view",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: SANS,
      color: "#DCEBFA",
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 999,
      border: "1px solid rgba(191, 219, 254, 0.12)",
      mass: 0.2,
      lockRotation: true,
    },
    {
      id: "st-rule-top",
      type: "divider",
      rect: { x: mx, y: 74, width: w, height: 1 },
      throwable: false,
      pinned: true,
      backgroundColor: "rgba(122, 162, 200, 0.22)",
    },
    {
      id: "st-title",
      type: "heading",
      rect: { x: mx, y: titleY, width: w, height: titleH },
      throwable: false,
      pinned: true,
      text: "A FORECAST PAGE\nSHOULD MOVE LIKE WEATHER",
      fontSize: titleSize,
      fontWeight: 800,
      fontFamily: SANS,
      lineHeight: titleLineHeight,
      color: "#F4FBFF",
      letterSpacing: "-0.05em",
      minSegmentWidth: 130,
      allowWordBreaks: false,
    },
    {
      id: "st-deck",
      type: "paragraph",
      rect: { x: mx, y: deckY, width: deckW, height: narrow ? 88 : 62 },
      throwable: false,
      pinned: true,
      text: "An atmospheric bulletin built as a moving system: drifting pressure cells, live radar plates, and warning chips that physically reroute the forecast as they slide across the page.",
      fontSize: narrow ? 18 : 20,
      fontWeight: 400,
      fontFamily: SANS,
      lineHeight: narrow ? 28 : 30,
      color: "#A9C3DB",
      minSegmentWidth: 70,
      allowWordBreaks: false,
    },
    {
      id: "st-kicker-1",
      type: "heading",
      rect: { x: mx, y: bodyY - 34, width: 220, height: 18 },
      throwable: false,
      pinned: true,
      text: "NATIONAL BULLETIN",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: MONO,
      lineHeight: 18,
      color: "#67D5FF",
      letterSpacing: "0.08em",
    },
    {
      id: "st-copy-1",
      type: "paragraph",
      rect: { x: mx, y: bodyY, width: copyWidth, height: region1H },
      throwable: false,
      pinned: true,
      text: LEDE + " " + BODY_1,
      fontSize: narrow ? 17 : 18,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: narrow ? 29 : 31,
      color: "#E2EDF7",
      minSegmentWidth: 54,
      allowWordBreaks: false,
    },
    {
      id: "st-divider-mid",
      type: "divider",
      rect: { x: mx, y: region2Y - 48, width: w, height: 1 },
      throwable: false,
      pinned: true,
      backgroundColor: "rgba(122, 162, 200, 0.18)",
    },
    {
      id: "st-kicker-2",
      type: "heading",
      rect: { x: mx, y: region2Y - 34, width: 220, height: 18 },
      throwable: false,
      pinned: true,
      text: "REGIONAL DETAIL",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: MONO,
      lineHeight: 18,
      color: "#86FFD6",
      letterSpacing: "0.08em",
    },
    {
      id: "st-copy-2",
      type: "paragraph",
      rect: { x: mx, y: region2Y, width: copyWidth, height: region2H },
      throwable: false,
      pinned: true,
      text: BODY_2 + " " + BODY_3,
      fontSize: narrow ? 17 : 18,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: narrow ? 29 : 31,
      color: "#E2EDF7",
      minSegmentWidth: 54,
      allowWordBreaks: false,
    },
    {
      id: "st-divider-outlook",
      type: "divider",
      rect: { x: mx, y: region3Y - 46, width: w, height: 1 },
      throwable: false,
      pinned: true,
      backgroundColor: "rgba(122, 162, 200, 0.18)",
    },
    {
      id: "st-kicker-3",
      type: "heading",
      rect: { x: mx, y: region3Y - 32, width: 220, height: 18 },
      throwable: false,
      pinned: true,
      text: "TOMORROW'S SHAPE",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: MONO,
      lineHeight: 18,
      color: "#FFD68A",
      letterSpacing: "0.08em",
    },
    {
      id: "st-copy-3",
      type: "paragraph",
      rect: { x: mx, y: region3Y, width: copyWidth, height: region3H },
      throwable: false,
      pinned: true,
      text: OUTLOOK,
      fontSize: narrow ? 17 : 18,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: narrow ? 29 : 31,
      color: "#E2EDF7",
      minSegmentWidth: 54,
      allowWordBreaks: false,
    },
    {
      id: "st-footer-rule",
      type: "divider",
      rect: { x: mx, y: footerY, width: w, height: 1 },
      throwable: false,
      pinned: true,
      backgroundColor: "rgba(122, 162, 200, 0.2)",
    },
    {
      id: "st-footer",
      type: "heading",
      rect: { x: mx, y: footerY + 16, width: w, height: 16 },
      throwable: false,
      pinned: true,
      text: "Storm Desk preset  |  pressure cells drift on purpose  |  grab the map, stack the warnings, watch the bulletin re-route",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: MONO,
      lineHeight: 16,
      color: "#7FA7C7",
    },

    {
      id: "st-radar",
      type: "image",
      rect: {
        x: mx + w - (narrow ? 260 : 340),
        y: bodyY + 28,
        width: narrow ? 260 : 340,
        height: narrow ? 174 : 224,
      },
      throwable: true,
      pinned: false,
      backgroundColor: "#071726",
      borderRadius: 20,
      imageSrc: RADAR_PANEL,
      imageAlt: "Radar mosaic",
      border: "1px solid rgba(125, 211, 252, 0.12)",
      boxShadow: "0 18px 42px rgba(2, 12, 24, 0.38)",
      mass: 2.7,
      lockRotation: true,
      frictionAir: 0.02,
      restitution: 0.84,
    },
    {
      id: "st-satellite",
      type: "image",
      rect: {
        x: mx + (narrow ? 10 : 56),
        y: region2Y + (narrow ? 182 : 118),
        width: narrow ? 236 : 284,
        height: narrow ? 144 : 174,
      },
      throwable: true,
      pinned: false,
      backgroundColor: "#0B1523",
      borderRadius: 18,
      imageSrc: SATELLITE_PANEL,
      imageAlt: "Satellite sweep",
      boxShadow: "0 16px 38px rgba(2, 12, 24, 0.34)",
      mass: 2.1,
      lockRotation: true,
      frictionAir: 0.02,
      restitution: 0.82,
    },
    {
      id: "st-track-card",
      type: "card",
      rect: {
        x: mx + w - (narrow ? 224 : 258),
        y: region2Y + (narrow ? 194 : 148),
        width: narrow ? 224 : 258,
        height: narrow ? 128 : 142,
      },
      throwable: true,
      pinned: false,
      text: "System track",
      fontSize: 15,
      fontWeight: 700,
      fontFamily: SANS,
      color: "#EDF7FF",
      backgroundColor: "rgba(9, 24, 39, 0.88)",
      borderRadius: 18,
      padding: 18,
      border: "1px solid rgba(96, 165, 250, 0.16)",
      boxShadow: "0 16px 38px rgba(2, 12, 24, 0.3)",
      mass: 1.3,
      lockRotation: true,
      frictionAir: 0.03,
      restitution: 0.74,
      children: [
        {
          id: "st-track-a",
          type: "paragraph",
          rect: { x: 0, y: 10, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "06:10  rain line clips the shelf and turns north by noon",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: MONO,
          lineHeight: 18,
          color: "#67D5FF",
        },
        {
          id: "st-track-b",
          type: "paragraph",
          rect: { x: 0, y: 8, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "Best signal: marine gusts and surge, not inland accumulation",
          fontSize: 12,
          fontWeight: 400,
          fontFamily: SANS,
          lineHeight: 18,
          color: "#A9C3DB",
        },
      ],
    },
    {
      id: "st-city-harbor",
      type: "card",
      rect: {
        x: mx + (narrow ? 8 : 54),
        y: region3Y + (narrow ? 170 : 126),
        width: narrow ? 164 : 182,
        height: 116,
      },
      throwable: true,
      pinned: false,
      text: "Harbor City",
      fontSize: 15,
      fontWeight: 700,
      fontFamily: SANS,
      color: "#0C1B2D",
      backgroundColor: "#E6F7FF",
      borderRadius: 18,
      padding: 16,
      border: "1px solid rgba(56, 189, 248, 0.16)",
      boxShadow: "0 14px 30px rgba(4, 38, 66, 0.12)",
      mass: 1.02,
      lockRotation: true,
      frictionAir: 0.03,
      restitution: 0.7,
      children: [
        {
          id: "st-city-harbor-a",
          type: "paragraph",
          rect: { x: 0, y: 10, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "68 mph gust risk",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: MONO,
          lineHeight: 18,
          color: "#0369A1",
        },
        {
          id: "st-city-harbor-b",
          type: "paragraph",
          rect: { x: 0, y: 8, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "Move marinas by 09:00 and keep ferry routes flexible.",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: SANS,
          lineHeight: 18,
          color: "#36506A",
        },
      ],
    },
    {
      id: "st-city-ridge",
      type: "card",
      rect: {
        x: mx + (narrow ? 182 : 272),
        y: region3Y + (narrow ? 182 : 136),
        width: narrow ? 170 : 190,
        height: 118,
      },
      throwable: true,
      pinned: false,
      text: "Blue Ridge",
      fontSize: 15,
      fontWeight: 700,
      fontFamily: SANS,
      color: "#1B2430",
      backgroundColor: "#FFF1D8",
      borderRadius: 18,
      padding: 16,
      border: "1px solid rgba(245, 158, 11, 0.18)",
      boxShadow: "0 14px 30px rgba(83, 49, 8, 0.12)",
      mass: 1.04,
      lockRotation: true,
      frictionAir: 0.03,
      restitution: 0.7,
      children: [
        {
          id: "st-city-ridge-a",
          type: "paragraph",
          rect: { x: 0, y: 10, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "31 C by late afternoon",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: MONO,
          lineHeight: 18,
          color: "#B45309",
        },
        {
          id: "st-city-ridge-b",
          type: "paragraph",
          rect: { x: 0, y: 8, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "Dry ridge holds, but the night breeze breaks fast after sunset.",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: SANS,
          lineHeight: 18,
          color: "#6B4B1D",
        },
      ],
    },
    {
      id: "st-city-delta",
      type: "card",
      rect: {
        x: mx + w - (narrow ? 186 : 218),
        y: region3Y + (narrow ? 166 : 118),
        width: narrow ? 178 : 202,
        height: 118,
      },
      throwable: true,
      pinned: false,
      text: "Delta Plain",
      fontSize: 15,
      fontWeight: 700,
      fontFamily: SANS,
      color: "#EFFFF7",
      backgroundColor: "#0E2B29",
      borderRadius: 18,
      padding: 16,
      border: "1px solid rgba(52, 211, 153, 0.18)",
      boxShadow: "0 14px 30px rgba(5, 27, 24, 0.22)",
      mass: 1.06,
      lockRotation: true,
      frictionAir: 0.03,
      restitution: 0.7,
      children: [
        {
          id: "st-city-delta-a",
          type: "paragraph",
          rect: { x: 0, y: 10, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "Rain arrives after 16:00",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: MONO,
          lineHeight: 18,
          color: "#86FFD6",
        },
        {
          id: "st-city-delta-b",
          type: "paragraph",
          rect: { x: 0, y: 8, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: "Flooding is localized, but roads around the levee turn first.",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: SANS,
          lineHeight: 18,
          color: "#B6EAD8",
        },
      ],
    },
  ];

  const alerts = [
    {
      id: "st-alert-coast",
      text: "Coastal flood watch",
      x: mx + (narrow ? 14 : 90),
      y: bodyY + 104,
      width: narrow ? 176 : 192,
      backgroundColor: "rgba(56, 189, 248, 0.18)",
      border: "1px solid rgba(103, 213, 255, 0.26)",
      color: "#DFF5FF",
      vx: 0.22,
      vy: 0.04,
    },
    {
      id: "st-alert-heat",
      text: "Heat dome shift",
      x: mx + w - (narrow ? 202 : 304),
      y: region2Y + 28,
      width: narrow ? 150 : 164,
      backgroundColor: "rgba(251, 146, 60, 0.18)",
      border: "1px solid rgba(253, 186, 116, 0.24)",
      color: "#FFF0D8",
      vx: -0.18,
      vy: 0.06,
    },
    {
      id: "st-alert-night",
      text: "Overnight surge",
      x: mx + (narrow ? 130 : 450),
      y: region3Y + 56,
      width: narrow ? 156 : 168,
      backgroundColor: "rgba(129, 140, 248, 0.18)",
      border: "1px solid rgba(165, 180, 252, 0.24)",
      color: "#EEF0FF",
      vx: 0.16,
      vy: -0.04,
    },
  ];

  for (const alert of alerts) {
    elements.push({
      id: alert.id,
      type: "button",
      rect: { x: alert.x, y: alert.y, width: alert.width, height: 38 },
      throwable: true,
      pinned: false,
      text: alert.text,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: MONO,
      color: alert.color,
      backgroundColor: alert.backgroundColor,
      borderRadius: 999,
      border: alert.border,
      boxShadow: "0 10px 24px rgba(2, 12, 24, 0.18)",
      mass: 0.42,
      lockRotation: true,
      initialVelocityX: alert.vx,
      initialVelocityY: alert.vy,
      frictionAir: 0.028,
      restitution: 0.8,
    });
  }

  for (const cell of CELLS) {
    elements.push({
      id: `st-cell-${cell.id}`,
      type: "badge",
      rect: {
        x: mx + w * cell.fx - cell.size / 2,
        y: H * cell.fy - cell.size / 2,
        width: cell.size,
        height: cell.size,
      },
      throwable: true,
      pinned: false,
      text: cell.label,
      fontSize: cell.label.length > 4 ? 22 : 24,
      fontWeight: 800,
      fontFamily: MONO,
      color: "#F4FBFF",
      backgroundColor: cellGradient(cell.tint, cell.core),
      borderRadius: cell.size / 2,
      boxShadow: cellShadow(cell.tint),
      mass: cell.mass,
      physicsShape: "circle",
      initialVelocityX: cell.vx,
      initialVelocityY: cell.vy,
      friction: 0,
      frictionAir: 0.002,
      restitution: 0.98,
      letterSpacing: "0.08em",
    });
  }

  return {
    id: "storm",
    name: "Storm Desk",
    width: vw,
    height: H,
    backgroundColor: "#07111B",
    elements,
  };
}
