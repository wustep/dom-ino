import type { SceneDescription } from "../types";
import { MONO, SANS, SERIF } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const LOREM_1 = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris suscipit, nunc ac posuere vulputate, odio mi pellentesque odio, quis fringilla velit tortor sed arcu. Integer faucibus nibh et sem dictum, eu facilisis tortor imperdiet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed at luctus nisi. Pellentesque nec nisl turpis. Curabitur faucibus viverra lacus, a interdum arcu dapibus non. Quisque mollis, libero nec feugiat fermentum, justo libero auctor lectus, vitae volutpat arcu turpis ac urna. Aliquam placerat semper mauris, non tincidunt metus gravida id. Nam auctor augue et nibh placerat, nec dapibus erat tempor.`;

const LOREM_2 = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis cursus, enim id dignissim tincidunt, nibh justo feugiat dui, vel ornare libero neque a erat. Nulla facilisi. Aenean ornare, nibh ut feugiat ullamcorper, tellus lectus tempor nunc, vitae pellentesque arcu justo non augue. In hac habitasse platea dictumst. Integer pretium suscipit sem, vel finibus sem tincidunt ut. In in elementum sem. Proin suscipit commodo diam, vitae interdum turpis luctus nec. Suspendisse eget augue dignissim, posuere libero sed, aliquam justo. Praesent pharetra mi ut nisi feugiat, sed facilisis sem hendrerit.`;

const LOREM_3 = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam pellentesque venenatis sapien, nec posuere justo feugiat in. Donec tincidunt, arcu in consequat tincidunt, nunc nibh eleifend augue, et volutpat turpis velit et sem. Fusce posuere velit a lectus tristique, quis tincidunt tellus pretium. Morbi dignissim mauris sed lacus iaculis, sit amet efficitur justo lacinia. Integer feugiat eu sem non placerat. Sed in efficitur nisl. Cras non lectus ut magna fermentum faucibus. Ut egestas, lectus sed vulputate posuere, mauris dolor congue nibh, non efficitur velit purus vitae neque. Donec volutpat, nibh at fringilla volutpat, mauris sapien porttitor odio, sed dictum arcu risus vel nisi.`;

const RABBIT_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" fill="none">
  <defs>
    <filter id="rabbit-shadow" x="12" y="2" width="286" height="230" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#C9B59A" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#rabbit-shadow)">
    <ellipse cx="152" cy="156" rx="70" ry="42" fill="#FFFDF8"/>
    <ellipse cx="128" cy="82" rx="18" ry="52" fill="#FFFDF8"/>
    <ellipse cx="184" cy="76" rx="18" ry="58" fill="#FFFDF8"/>
    <ellipse cx="128" cy="80" rx="8" ry="35" fill="#FFC7DE"/>
    <ellipse cx="184" cy="74" rx="8" ry="39" fill="#FFC7DE"/>
    <circle cx="154" cy="118" r="34" fill="#FFFDF8"/>
    <ellipse cx="216" cy="176" rx="24" ry="19" fill="#FFFDF8"/>
    <ellipse cx="84" cy="178" rx="24" ry="13" fill="#FFD9A8"/>
  </g>
  <circle cx="142" cy="116" r="4.2" fill="#48352A"/>
  <circle cx="170" cy="116" r="4.2" fill="#48352A"/>
  <circle cx="156" cy="130" r="5.2" fill="#F18FAA"/>
  <path d="M156 135C150 141 145 143 139 143" stroke="#C77A86" stroke-width="3" stroke-linecap="round"/>
  <path d="M156 135C162 141 167 143 173 143" stroke="#C77A86" stroke-width="3" stroke-linecap="round"/>
  <path d="M84 178C98 168 112 165 128 168" stroke="#E6A756" stroke-width="6" stroke-linecap="round"/>
</svg>
`);

const BIRD_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" fill="none">
  <defs>
    <filter id="bird-shadow" x="24" y="46" width="252" height="160" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#B1C7D8" flood-opacity="0.36"/>
    </filter>
  </defs>
  <g filter="url(#bird-shadow)">
    <path d="M74 148C102 116 134 100 172 100C196 100 220 110 242 132C226 150 206 162 176 166C136 172 104 166 74 148Z" fill="#FF8F5A"/>
    <path d="M164 102C146 118 138 136 136 154C156 152 174 146 192 136C182 122 174 112 164 102Z" fill="#F56E32"/>
    <path d="M86 146C62 130 48 118 42 104C68 106 88 116 106 132" fill="#FFC29A"/>
    <path d="M198 110C214 114 226 124 234 138C220 138 208 134 198 126" fill="#FFE8C7"/>
  </g>
  <circle cx="208" cy="128" r="4.2" fill="#1E293B"/>
  <path d="M224 132L244 139L224 146" fill="#F5C157"/>
  <path d="M122 176C142 166 162 164 184 168" stroke="#5B9279" stroke-width="6" stroke-linecap="round"/>
  <path d="M190 168C212 160 230 160 250 168" stroke="#5B9279" stroke-width="6" stroke-linecap="round"/>
</svg>
`);

const FISH_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" fill="none">
  <defs>
    <filter id="fish-shadow" x="34" y="54" width="256" height="150" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#A7CFC7" flood-opacity="0.36"/>
    </filter>
  </defs>
  <g filter="url(#fish-shadow)">
    <ellipse cx="150" cy="126" rx="66" ry="40" fill="#FFB167"/>
    <path d="M206 126L270 88V164L206 126Z" fill="#FF9451"/>
    <path d="M126 116C142 100 156 92 176 92C190 92 204 98 218 110" fill="#FFF2DD"/>
    <path d="M126 138C144 152 158 158 176 158C192 158 206 152 220 142" fill="#F2747B"/>
    <path d="M148 106L166 78L184 106" fill="#FFC98E"/>
    <path d="M152 148L170 172L188 148" fill="#F7A671"/>
  </g>
  <circle cx="126" cy="120" r="5" fill="#17324D"/>
  <path d="M116 168C138 156 160 152 188 156" stroke="#4BA6B2" stroke-width="6" stroke-linecap="round"/>
</svg>
`);

const KITE_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="260" viewBox="0 0 220 260" fill="none">
  <defs>
    <filter id="kite-shadow" x="28" y="8" width="164" height="244" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#B88CE8" flood-opacity="0.28"/>
    </filter>
  </defs>
  <g filter="url(#kite-shadow)">
    <path d="M110 28L170 104L110 178L50 104L110 28Z" fill="#B88CE8"/>
    <path d="M110 44L154 104L110 160L66 104L110 44Z" fill="#FDF7FF"/>
  </g>
  <path d="M110 178C114 194 124 204 138 212C124 218 118 228 122 242C108 236 98 224 100 208C88 212 76 208 66 198" stroke="#7C5ACB" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="142" cy="212" r="7" fill="#FFB5D1"/>
  <circle cx="122" cy="242" r="7" fill="#86D8C1"/>
  <circle cx="66" cy="198" r="7" fill="#FFDB7A"/>
</svg>
`);

const PLANE_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="170" viewBox="0 0 260 170" fill="none">
  <defs>
    <filter id="plane-shadow" x="16" y="18" width="228" height="126" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#9CB4C9" flood-opacity="0.32"/>
    </filter>
  </defs>
  <g filter="url(#plane-shadow)">
    <path d="M32 90L228 40L154 86L228 120L32 90Z" fill="#F8FBFF"/>
    <path d="M154 86L98 130L116 92" fill="#DBE9F4"/>
    <path d="M228 40L148 82" stroke="#B1C6D9" stroke-width="5" stroke-linecap="round"/>
  </g>
  <path d="M28 92C18 98 12 106 10 118" stroke="#8FB0C9" stroke-width="5" stroke-linecap="round"/>
  <path d="M40 102C28 112 24 122 28 136" stroke="#8FB0C9" stroke-width="5" stroke-linecap="round"/>
</svg>
`);

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
  { id: "peach", fx: 0.14, fy: 0.22, size: 150, mass: 0.75, vx: 0.52, vy: 0.24, color: [255, 171, 145] },
  { id: "sky", fx: 0.82, fy: 0.18, size: 132, mass: 0.68, vx: -0.36, vy: 0.42, color: [104, 192, 255] },
  { id: "lilac", fx: 0.64, fy: 0.36, size: 174, mass: 0.92, vx: -0.28, vy: 0.3, color: [176, 140, 248] },
  { id: "mint", fx: 0.22, fy: 0.56, size: 164, mass: 0.88, vx: 0.34, vy: -0.24, color: [125, 226, 177] },
  { id: "sun", fx: 0.9, fy: 0.62, size: 144, mass: 0.7, vx: -0.22, vy: -0.3, color: [251, 207, 87] },
  { id: "rose", fx: 0.46, fy: 0.82, size: 154, mass: 0.8, vx: 0.24, vy: -0.28, color: [251, 146, 196] },
];

function orbGradient(color: [number, number, number]): string {
  const [r, g, b] = color;
  return `radial-gradient(circle at 34% 34%, rgba(${r},${g},${b},0.68), rgba(${r},${g},${b},0.28) 48%, rgba(${r},${g},${b},0.1) 68%, transparent 78%)`;
}

function orbShadow(color: [number, number, number]): string {
  const [r, g, b] = color;
  return `0 18px 42px rgba(${r},${g},${b},0.26), 0 0 54px rgba(${r},${g},${b},0.18)`;
}

export function createPlaygroundScene(vw: number, vh: number): SceneDescription {
  const narrow = vw < 900;
  const gutter = narrow ? 18 : 36;
  const contentW = vw - gutter * 2;
  const mx = gutter;
  const titleY = narrow ? 34 : 42;
  const titleSize = narrow ? 46 : vw > 1400 ? 86 : 72;
  const titleLineHeight = narrow ? 50 : Math.round(titleSize * 0.94);
  const titleH = narrow ? titleLineHeight * 2 + 6 : titleLineHeight + 8;
  const deckY = titleY + titleH + 14;
  const bodyY = deckY + 62;
  const copySize = narrow ? 21 : 24;
  const copyLineHeight = narrow ? 34 : 38;
  const regionH = narrow ? 430 : 410;
  const regionGap = narrow ? 34 : 36;
  const footerY = bodyY + regionH * 3 + regionGap * 2 + 34;
  const H = Math.max(vh, footerY + 210);
  const animalScale = narrow ? 0.84 : 1;
  const placeX = (fx: number, width: number) => Math.max(mx, Math.min(mx + contentW * fx, mx + contentW - width));

  const elements: SceneDescription["elements"] = [
    {
      id: "pg-bg",
      type: "container",
      rect: { x: 0, y: 0, width: vw, height: H },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      backgroundColor: "linear-gradient(180deg, #fff8ef 0%, #fffdf8 38%, #fff6ea 100%)",
    },
    {
      id: "pg-atmosphere",
      type: "container",
      rect: { x: 0, y: 0, width: vw, height: H },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      backgroundColor: "radial-gradient(circle at 12% 16%, rgba(255, 196, 148, 0.22) 0%, transparent 24%), radial-gradient(circle at 82% 14%, rgba(153, 205, 255, 0.18) 0%, transparent 24%), radial-gradient(circle at 74% 72%, rgba(251, 146, 196, 0.14) 0%, transparent 28%), radial-gradient(circle at 28% 84%, rgba(125, 226, 177, 0.16) 0%, transparent 24%)",
      opacity: 0.95,
    },
    {
      id: "pg-title",
      type: "heading",
      rect: { x: mx, y: titleY, width: contentW, height: titleH },
      throwable: false,
      pinned: true,
      text: "Welcome to the playground",
      fontSize: titleSize,
      fontWeight: 700,
      fontFamily: SERIF,
      lineHeight: titleLineHeight,
      letterSpacing: "-0.035em",
      color: "#3d271c",
      minSegmentWidth: 140,
      allowWordBreaks: false,
    },
    {
      id: "pg-deck",
      type: "paragraph",
      rect: { x: mx, y: deckY, width: Math.min(contentW, narrow ? contentW : 860), height: 54 },
      throwable: false,
      pinned: true,
      text: "A drifting field of serif copy, illustrated animals, and soft-glow orbs scattered across the page.",
      fontSize: narrow ? 19 : 21,
      fontWeight: 400,
      fontStyle: "italic",
      fontFamily: SERIF,
      lineHeight: narrow ? 28 : 30,
      color: "rgba(79, 51, 38, 0.82)",
      minSegmentWidth: 72,
      allowWordBreaks: false,
    },
    {
      id: "pg-hint-pill",
      type: "button",
      rect: { x: mx + contentW - (narrow ? 230 : 290), y: narrow ? 18 : 24, width: narrow ? 212 : 274, height: 32 },
      throwable: false,
      pinned: true,
      physicsEnabled: false,
      text: "Toss stickers · Herd animals · Build tunnels",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: MONO,
      color: "#805741",
      backgroundColor: "rgba(255,255,255,0.64)",
      borderRadius: 999,
      border: "1px solid rgba(128, 87, 65, 0.12)",
      letterSpacing: "0.02em",
    },
    {
      id: "pg-copy-1",
      type: "paragraph",
      rect: { x: mx, y: bodyY, width: contentW, height: regionH },
      throwable: false,
      pinned: true,
      text: LOREM_1,
      fontSize: copySize,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: copyLineHeight,
      color: "#4d3428",
      minSegmentWidth: 42,
      allowWordBreaks: false,
    },
    {
      id: "pg-copy-2",
      type: "paragraph",
      rect: { x: mx, y: bodyY + regionH + regionGap, width: contentW, height: regionH },
      throwable: false,
      pinned: true,
      text: LOREM_2,
      fontSize: copySize,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: copyLineHeight,
      color: "#4d3428",
      minSegmentWidth: 42,
      allowWordBreaks: false,
    },
    {
      id: "pg-copy-3",
      type: "paragraph",
      rect: { x: mx, y: bodyY + (regionH + regionGap) * 2, width: contentW, height: regionH },
      throwable: false,
      pinned: true,
      text: LOREM_3,
      fontSize: copySize,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: copyLineHeight,
      color: "#4d3428",
      minSegmentWidth: 42,
      allowWordBreaks: false,
    },
    {
      id: "pg-footer-kicker",
      type: "heading",
      rect: { x: mx, y: footerY, width: 180, height: 18 },
      throwable: false,
      pinned: true,
      text: "PLAY IDEAS",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: MONO,
      lineHeight: 18,
      color: "#b36b53",
      letterSpacing: "0.08em",
    },
    {
      id: "pg-footer-note",
      type: "paragraph",
      rect: { x: mx, y: footerY + 26, width: Math.min(contentW, 720), height: 54 },
      throwable: false,
      pinned: true,
      text: "Make a bottleneck. Build a parade. Hide a sentence behind the rabbit. Turn the paper plane into punctuation and see how the copy reroutes itself.",
      fontSize: narrow ? 17 : 18,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: 28,
      color: "rgba(79, 51, 38, 0.84)",
      minSegmentWidth: 60,
      allowWordBreaks: false,
    },
  ];

  const animals = [
    {
      id: "rabbit",
      imageSrc: RABBIT_SVG,
      imageAlt: "Rabbit illustration",
      fx: narrow ? 0.28 : 0.2,
      fy: narrow ? 0.28 : 0.25,
      width: 254 * animalScale,
      height: 190 * animalScale,
      backgroundColor: "transparent",
      mass: 1.8,
      polygonPoints: [
        { x: 0.43, y: 0.02 },
        { x: 0.49, y: 0.0 },
        { x: 0.55, y: 0.28 },
        { x: 0.64, y: 0.04 },
        { x: 0.72, y: 0.02 },
        { x: 0.78, y: 0.3 },
        { x: 0.8, y: 0.52 },
        { x: 0.92, y: 0.72 },
        { x: 0.9, y: 0.84 },
        { x: 0.76, y: 0.92 },
        { x: 0.56, y: 0.96 },
        { x: 0.34, y: 0.94 },
        { x: 0.12, y: 0.86 },
        { x: 0.06, y: 0.7 },
        { x: 0.08, y: 0.54 },
        { x: 0.16, y: 0.4 },
        { x: 0.28, y: 0.3 },
        { x: 0.34, y: 0.12 },
      ],
    },
    {
      id: "bird",
      imageSrc: BIRD_SVG,
      imageAlt: "Bird illustration",
      fx: narrow ? 0.72 : 0.77,
      fy: narrow ? 0.44 : 0.42,
      width: 244 * animalScale,
      height: 183 * animalScale,
      backgroundColor: "transparent",
      mass: 1.72,
      polygonPoints: [
        { x: 0.02, y: 0.56 },
        { x: 0.08, y: 0.44 },
        { x: 0.18, y: 0.28 },
        { x: 0.38, y: 0.14 },
        { x: 0.58, y: 0.16 },
        { x: 0.78, y: 0.28 },
        { x: 0.94, y: 0.46 },
        { x: 1.0, y: 0.56 },
        { x: 0.9, y: 0.64 },
        { x: 0.98, y: 0.7 },
        { x: 0.82, y: 0.78 },
        { x: 0.6, y: 0.84 },
        { x: 0.4, y: 0.82 },
        { x: 0.2, y: 0.76 },
        { x: 0.04, y: 0.64 },
      ],
    },
    {
      id: "fish",
      imageSrc: FISH_SVG,
      imageAlt: "Fish illustration",
      fx: narrow ? 0.5 : 0.48,
      fy: narrow ? 0.75 : 0.74,
      width: 262 * animalScale,
      height: 196 * animalScale,
      backgroundColor: "transparent",
      mass: 1.94,
      polygonPoints: [
        { x: 0.0, y: 0.5 },
        { x: 0.1, y: 0.3 },
        { x: 0.26, y: 0.18 },
        { x: 0.44, y: 0.14 },
        { x: 0.64, y: 0.2 },
        { x: 0.8, y: 0.24 },
        { x: 0.98, y: 0.08 },
        { x: 1.0, y: 0.26 },
        { x: 0.9, y: 0.5 },
        { x: 1.0, y: 0.74 },
        { x: 0.98, y: 0.92 },
        { x: 0.8, y: 0.76 },
        { x: 0.64, y: 0.8 },
        { x: 0.44, y: 0.86 },
        { x: 0.26, y: 0.82 },
        { x: 0.1, y: 0.7 },
      ],
    },
  ];

  for (const animal of animals) {
    elements.push({
      id: `pg-animal-${animal.id}`,
      type: "image",
      rect: {
        x: mx + contentW * animal.fx - animal.width / 2,
        y: H * animal.fy - animal.height / 2,
        width: animal.width,
        height: animal.height,
      },
      throwable: true,
      pinned: false,
      backgroundColor: animal.backgroundColor,
      borderRadius: 0,
      imageSrc: animal.imageSrc,
      imageAlt: animal.imageAlt,
      physicsShape: "polygon",
      polygonPoints: animal.polygonPoints,
      mass: animal.mass,
      lockRotation: true,
      frictionAir: 0.02,
      restitution: 0.78,
    });
  }

  const orbScale = narrow ? 0.8 : 1;
  for (const orb of ORBS) {
    const size = orb.size * orbScale;
    elements.push({
      id: `pg-orb-${orb.id}`,
      type: "badge",
      rect: {
        x: mx + contentW * orb.fx - size / 2,
        y: H * orb.fy - size / 2,
        width: size,
        height: size,
      },
      throwable: true,
      pinned: false,
      text: "",
      fontSize: 1,
      fontWeight: 400,
      fontFamily: SERIF,
      color: "transparent",
      backgroundColor: orbGradient(orb.color),
      borderRadius: size / 2,
      boxShadow: orbShadow(orb.color),
      mass: orb.mass,
      physicsShape: "circle",
      initialVelocityX: orb.vx,
      initialVelocityY: orb.vy,
      friction: 0,
      frictionAir: 0.002,
      restitution: 0.96,
    });
  }

  const ideaCards = [
    {
      id: "pg-idea-corridor",
      width: narrow ? 180 : 208,
      x: placeX(narrow ? 0.04 : 0.08, narrow ? 180 : 208),
      y: bodyY + 240,
      height: 116,
      text: "Make a corridor",
      body: "Push the stickers together until the serif copy squeezes through a single narrow lane.",
      backgroundColor: "#fff2cf",
      border: "1px solid rgba(179, 119, 62, 0.14)",
      color: "#5a3a1f",
    },
    {
      id: "pg-idea-herd",
      width: narrow ? 182 : 214,
      x: placeX(narrow ? 0.56 : 0.74, narrow ? 182 : 214),
      y: bodyY + 520,
      height: 116,
      text: "Herd the animals",
      body: "Group the rabbit, bird, and fish into a parade and watch the paragraphs learn a new route.",
      backgroundColor: "#e9fbf4",
      border: "1px solid rgba(68, 144, 115, 0.14)",
      color: "#245641",
    },
    {
      id: "pg-idea-punctuation",
      width: narrow ? 188 : 220,
      x: placeX(narrow ? 0.2 : 0.42, narrow ? 188 : 220),
      y: footerY + 74,
      height: 118,
      text: "Turn toys into punctuation",
      body: "Drop the kite, plane, and orbs into the last block until the page feels annotated by motion.",
      backgroundColor: "#f7ecff",
      border: "1px solid rgba(124, 90, 203, 0.14)",
      color: "#533285",
    },
  ];

  for (const idea of ideaCards) {
    elements.push({
      id: idea.id,
      type: "card",
      rect: { x: idea.x, y: idea.y, width: idea.width, height: idea.height },
      throwable: true,
      pinned: false,
      text: idea.text,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: SANS,
      color: idea.color,
      backgroundColor: idea.backgroundColor,
      borderRadius: 18,
      padding: 16,
      border: idea.border,
      boxShadow: "0 12px 30px rgba(92, 68, 52, 0.08)",
      mass: 1.04,
      frictionAir: 0.02,
      restitution: 0.72,
      children: [
        {
          id: `${idea.id}-body`,
          type: "paragraph",
          rect: { x: 0, y: 10, width: 0, height: 0 },
          throwable: false,
          pinned: true,
          text: idea.body,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: SANS,
          lineHeight: 18,
          color: "rgba(57, 40, 31, 0.78)",
        },
      ],
    });
  }

  const stickers = [
    { id: "pg-sticker-boing", width: 106, x: placeX(0.12, 106), y: bodyY + 112, height: 40, text: "boing", backgroundColor: "#ffb3b8", color: "#6b2230" },
    { id: "pg-sticker-orbit", width: 118, x: placeX(0.78, 118), y: bodyY + 170, height: 42, text: "orbit me", backgroundColor: "#bde2ff", color: "#1f4b6d" },
    { id: "pg-sticker-shuffle", width: 128, x: placeX(0.66, 128), y: bodyY + 668, height: 42, text: "shuffle sky", backgroundColor: "#d7c2ff", color: "#543a8f" },
    { id: "pg-sticker-hide", width: 118, x: placeX(0.06, 118), y: bodyY + 820, height: 40, text: "hide me", backgroundColor: "#ffe2a8", color: "#7a4b0e" },
    { id: "pg-sticker-splash", width: 118, x: placeX(0.84, 118), y: footerY + 84, height: 40, text: "splash text", backgroundColor: "#c2f2df", color: "#1e5f48" },
  ];

  for (const sticker of stickers) {
    elements.push({
      id: sticker.id,
      type: "button",
      rect: { x: sticker.x, y: sticker.y, width: sticker.width, height: sticker.height },
      throwable: true,
      pinned: false,
      text: sticker.text,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: SANS,
      color: sticker.color,
      backgroundColor: sticker.backgroundColor,
      borderRadius: 999,
      border: "1px solid rgba(61, 39, 28, 0.08)",
      boxShadow: "0 10px 24px rgba(92, 68, 52, 0.08)",
      mass: 0.54,
      frictionAir: 0.022,
      restitution: 0.78,
    });
  }

  const toyImages = [
    {
      id: "pg-kite",
      imageSrc: KITE_SVG,
      imageAlt: "Kite toy",
      rect: {
        x: placeX(narrow ? 0.74 : 0.84, narrow ? 112 : 132),
        y: bodyY + 874,
        width: narrow ? 112 : 132,
        height: narrow ? 142 : 164,
      },
      physicsShape: "polygon" as const,
      polygonPoints: [
        { x: 0.5, y: 0.08 },
        { x: 0.86, y: 0.38 },
        { x: 0.5, y: 0.72 },
        { x: 0.14, y: 0.38 },
      ],
      mass: 0.82,
    },
    {
      id: "pg-plane",
      imageSrc: PLANE_SVG,
      imageAlt: "Paper plane",
      rect: {
        x: placeX(narrow ? 0.18 : 0.28, narrow ? 134 : 164),
        y: footerY + 84,
        width: narrow ? 134 : 164,
        height: narrow ? 88 : 106,
      },
      physicsShape: "polygon" as const,
      polygonPoints: [
        { x: 0.02, y: 0.52 },
        { x: 0.96, y: 0.18 },
        { x: 0.62, y: 0.5 },
        { x: 0.96, y: 0.78 },
      ],
      mass: 0.74,
    },
  ];

  for (const toy of toyImages) {
    elements.push({
      id: toy.id,
      type: "image",
      rect: toy.rect,
      throwable: true,
      pinned: false,
      backgroundColor: "transparent",
      imageSrc: toy.imageSrc,
      imageAlt: toy.imageAlt,
      physicsShape: toy.physicsShape,
      polygonPoints: toy.polygonPoints,
      mass: toy.mass,
      frictionAir: 0.02,
      restitution: 0.8,
    });
  }

  return {
    id: "playground",
    name: "Playground",
    width: vw,
    height: H,
    backgroundColor: "#fff8ef",
    elements,
  };
}
