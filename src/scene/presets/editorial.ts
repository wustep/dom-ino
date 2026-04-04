import type { SceneDescription } from "../types"
import { MONO, SERIF } from "./fonts"

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const LEAD_1 = `In 1945, Vannevar Bush imagined the Memex: a desk that let a researcher trace associative trails through a vast archive. The vision was prescient but the medium was wrong. It took forty-five years and a physicist at CERN before the idea found its true form. In 1990, Tim Berners-Lee wrote the first browser on a NeXT cube, defining the pillars still holding the web today: URLs to name things, HTTP to fetch them, HTML to describe them.`

const LEAD_2 = `For its first decade the document behaved exactly as designed — inert, self-contained, perfectly still. What Berners-Lee built was deliberately simple. An HTML page was headings, paragraphs, and links rendered top to bottom by a browser that acted more like an obedient librarian than a platform. There were no layers, no animation, no notion that an element might move.`

const LEAD_3 = `The Document Object Model — the tree that browsers build to represent a page — was not standardized until 1998, when the W3C published DOM Level 1. Before that, Netscape and Internet Explorer maintained incompatible interfaces, and rearranging a page after it loaded was considered exotic. The document was meant to be read, not touched.`

const SEC2_1 = `Cascading Style Sheets arrived in 1996, proposed by Håkon Wium Lie at CERN. The insight was separation: structure in HTML, presentation in CSS. Early adoption was glacial — browsers implemented the spec unevenly, and developers resorted to table layouts and spacer GIFs. It was not until CSS Zen Garden in 2003 that the community saw a single document styled into radically different forms. Today CSS handles grids, animations, container queries, and responsive typography — a language born to change font colors now drives the web's entire visual layer.`

const SEC2_2 = `Brendan Eich wrote JavaScript in ten days in May 1995, a language that looked like Java but behaved like Scheme. It was dismissed as a toy for form validation. That changed slowly, then all at once. Crockford's "The Good Parts" argued a real language hid inside the mess. Node.js proved it ran on servers. React reimagined the DOM as a function of state. TypeScript added types. Today JavaScript is the most widely deployed platform in history, running in every browser and on every server.`

const SEC2_3 = `Pretext, by Cheng Lou, measures and lays out text without triggering browser reflows. It reads glyph widths via Canvas, then performs layout in pure arithmetic — no DOM reads, no jank. Matter.js, by Liam Brummitt, is a rigid-body physics engine running entirely in the browser at sixty frames per second. DOMino combines these two into something neither was built for: a page where thrown objects displace text in real time, and the words reflow around them as naturally as water around a stone.`

const DISPATCH = `From Bush's Memex to a page whose lines reroute around whatever you throw at them is a long arc. HTML holds structure. CSS holds the look. JavaScript holds behavior. The DOM sits between document and program. Pretext keeps measurement off the layout hot path. Matter.js keeps bodies honest at frame rate. DOMino is one answer to a stubborn question: what if the page were allowed to move? Pick something up and find out.`

// ── SVG throwable assets ──────────────────────────────────

const EDITORIAL_PLATE = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="340" viewBox="0 0 300 340" fill="none">
  <defs>
    <linearGradient id="platePaper" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFCF7"/>
      <stop offset="100%" stop-color="#F5EFE4"/>
    </linearGradient>
    <linearGradient id="plateDiagram" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#252018"/>
      <stop offset="100%" stop-color="#14110e"/>
    </linearGradient>
  </defs>
  <rect width="300" height="340" rx="14" fill="#EDE6DA"/>
  <rect x="16" y="16" width="268" height="308" rx="10" fill="url(#platePaper)" stroke="#D4C9B8" stroke-width="0.85"/>
  <rect x="32" y="28" width="72" height="20" rx="10" fill="#E8E0D2"/>
  <text x="48" y="42" fill="#6B5C48" font-size="10" font-family="Georgia, serif" font-weight="700" letter-spacing="0.08em">PLATE I</text>
  <text x="112" y="42" fill="#7A6F62" font-size="10" font-family="Georgia, serif" font-style="italic">The Document Object Model</text>
  <rect x="32" y="58" width="236" height="156" rx="8" fill="url(#plateDiagram)"/>
  <rect x="32" y="58" width="236" height="156" rx="8" fill="none" stroke="#000" stroke-opacity="0.15"/>
  <text x="132" y="82" fill="#C4A574" font-size="8" font-family="ui-monospace, monospace" opacity="0.55">document</text>
  <circle cx="150" cy="92" r="7" fill="none" stroke="#8B5CF6" stroke-width="1.5"/>
  <circle cx="150" cy="92" r="3.2" fill="#8B5CF6" opacity="0.55"/>
  <line x1="150" y1="99" x2="100" y2="127" stroke="#B8956A" stroke-width="1" stroke-dasharray="3 2" opacity="0.75"/>
  <line x1="150" y1="99" x2="200" y2="127" stroke="#B8956A" stroke-width="1" stroke-dasharray="3 2" opacity="0.75"/>
  <rect x="82" y="124" width="36" height="14" rx="3" fill="none" stroke="#C2410C" stroke-width="1" opacity="0.85"/>
  <text x="88" y="134" fill="#D4C4A8" font-size="7" font-family="ui-monospace, monospace">&lt;head&gt;</text>
  <rect x="182" y="124" width="36" height="14" rx="3" fill="none" stroke="#C2410C" stroke-width="1" opacity="0.85"/>
  <text x="188" y="134" fill="#D4C4A8" font-size="7" font-family="ui-monospace, monospace">&lt;body&gt;</text>
  <line x1="100" y1="138" x2="72" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="100" y1="138" x2="128" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="172" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="200" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="228" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <rect x="58" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="62" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;meta&gt;</text>
  <rect x="114" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="118" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;title&gt;</text>
  <rect x="158" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="164" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;h1&gt;</text>
  <rect x="191" y="160" width="18" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="195" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;p&gt;</text>
  <rect x="214" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="218" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;div&gt;</text>
  <line x1="228" y1="172" x2="218" y2="186" stroke="#8F8578" stroke-width="0.5" opacity="0.4"/>
  <line x1="228" y1="172" x2="238" y2="186" stroke="#8F8578" stroke-width="0.5" opacity="0.4"/>
  <circle cx="218" cy="189" r="2.5" fill="#8F8578" opacity="0.3"/>
  <circle cx="238" cy="189" r="2.5" fill="#8F8578" opacity="0.3"/>
  <circle cx="72" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <circle cx="78" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <circle cx="84" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <text x="32" y="234" fill="#2C241F" font-size="11" font-family="Georgia, serif" font-weight="700" letter-spacing="0.02em">The DOM tree</text>
  <line x1="32" y1="242" x2="168" y2="242" stroke="#C9BFB0" stroke-width="0.75"/>
  <text x="32" y="256" fill="#6B6258" font-size="9" font-family="Georgia, serif">The browser parses markup into a tree:</text>
  <text x="32" y="268" fill="#6B6258" font-size="9" font-family="Georgia, serif">each node is an object with children,</text>
  <text x="32" y="280" fill="#6B6258" font-size="9" font-family="Georgia, serif">properties, and methods you can call.</text>
  <circle cx="40" cy="302" r="4" fill="none" stroke="#8B5CF6" stroke-width="1"/>
  <text x="50" y="305" fill="#6B6258" font-size="8" font-family="Georgia, serif">Root</text>
  <rect x="76" y="298" width="8" height="8" rx="1.5" fill="none" stroke="#C2410C" stroke-width="0.75"/>
  <text x="90" y="305" fill="#6B6258" font-size="8" font-family="Georgia, serif">Branch</text>
  <rect x="128" y="298" width="8" height="8" rx="1.5" fill="#0D9488" opacity="0.85"/>
  <text x="142" y="305" fill="#6B6258" font-size="8" font-family="Georgia, serif">Leaf</text>
</svg>
`)

const WAX_SEAL = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="136" height="136" viewBox="0 0 136 136">
  <defs>
    <radialGradient id="wg" cx="38%" cy="36%" r="54%">
      <stop offset="0%" stop-color="#C44133"/>
      <stop offset="55%" stop-color="#962C22"/>
      <stop offset="100%" stop-color="#5E1A12"/>
    </radialGradient>
    <filter id="wf">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#12080a" flood-opacity="0.35"/>
    </filter>
  </defs>
  <path d="M68 8 C92 6, 116 22, 124 48 C132 74, 126 102, 106 118 C86 134, 54 136, 32 120 C10 104, 2 74, 10 48 C18 22, 44 6, 68 8Z" fill="url(#wg)" filter="url(#wf)"/>
  <circle cx="68" cy="70" r="50" fill="none" stroke="#6E201A" stroke-width="2.5" opacity="0.4"/>
  <circle cx="68" cy="70" r="44" fill="none" stroke="#7E2820" stroke-width="1" opacity="0.3"/>
  <circle cx="68" cy="70" r="38" fill="none" stroke="#8E3028" stroke-width="0.6" opacity="0.2"/>
  <ellipse cx="52" cy="48" rx="24" ry="16" fill="#D85848" opacity="0.12" transform="rotate(-20 52 48)"/>
  <text x="68" y="85" text-anchor="middle" fill="#D4A574" font-size="40" font-family="Georgia, serif" font-weight="700" opacity="0.72">D</text>
  <path d="M68 8 C92 6, 116 22, 124 48 C132 74, 126 102, 106 118 C86 134, 54 136, 32 120 C10 104, 2 74, 10 48 C18 22, 44 6, 68 8Z" fill="none" stroke="#E8A880" stroke-width="0.6" opacity="0.2"/>
</svg>
`)

const COMPASS = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
  <defs>
    <filter id="cf">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0e0a06" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g transform="translate(70,70)" filter="url(#cf)">
    <circle r="60" fill="none" stroke="#B8A898" stroke-width="1.2"/>
    <circle r="56" fill="none" stroke="#D4C9B8" stroke-width="0.4" opacity="0.5"/>
    <polygon points="0,-56 6,-12 0,0 -6,-12" fill="#2c1f14" opacity="0.85"/>
    <polygon points="56,0 12,6 0,0 12,-6" fill="#2c1f14" opacity="0.7"/>
    <polygon points="0,56 6,12 0,0 -6,12" fill="#2c1f14" opacity="0.55"/>
    <polygon points="-56,0 -12,6 0,0 -12,-6" fill="#2c1f14" opacity="0.7"/>
    <polygon points="0,-40 3,-10 0,0 -3,-10" fill="#B8860B" opacity="0.5" transform="rotate(45)"/>
    <polygon points="0,-40 3,-10 0,0 -3,-10" fill="#B8860B" opacity="0.5" transform="rotate(135)"/>
    <polygon points="0,-40 3,-10 0,0 -3,-10" fill="#B8860B" opacity="0.5" transform="rotate(225)"/>
    <polygon points="0,-40 3,-10 0,0 -3,-10" fill="#B8860B" opacity="0.5" transform="rotate(315)"/>
    <circle r="7" fill="#EDE6DA" stroke="#2c1f14" stroke-width="1.2"/>
    <circle r="2.5" fill="#B8860B" opacity="0.8"/>
    <text x="0" y="-63" text-anchor="middle" fill="#2c1f14" font-size="8" font-family="Georgia, serif" font-weight="700" opacity="0.6">N</text>
  </g>
</svg>
`)

const BROWSER = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="100" viewBox="0 0 120 100">
  <defs>
    <filter id="bf">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0e0a06" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="120" height="100" rx="8" fill="#FFFCF7" filter="url(#bf)"/>
  <rect y="0" width="120" height="24" rx="8" fill="#F0E8DA"/>
  <rect y="12" width="120" height="12" fill="#F0E8DA"/>
  <line x1="0" y1="24" x2="120" y2="24" stroke="#D4C9B8" stroke-width="0.5"/>
  <circle cx="14" cy="12" r="3.5" fill="#E2574C" opacity="0.75"/>
  <circle cx="26" cy="12" r="3.5" fill="#F5C242" opacity="0.75"/>
  <circle cx="38" cy="12" r="3.5" fill="#4BC84B" opacity="0.75"/>
  <rect x="52" y="7" width="56" height="10" rx="3" fill="#E8E0D2" opacity="0.7"/>
  <rect x="14" y="36" width="64" height="3" rx="1.5" fill="#C9BFB0" opacity="0.45"/>
  <rect x="14" y="46" width="92" height="3" rx="1.5" fill="#C9BFB0" opacity="0.45"/>
  <rect x="14" y="56" width="50" height="3" rx="1.5" fill="#C9BFB0" opacity="0.45"/>
  <rect x="14" y="66" width="78" height="3" rx="1.5" fill="#C9BFB0" opacity="0.45"/>
  <rect x="14" y="76" width="36" height="3" rx="1.5" fill="#C9BFB0" opacity="0.45"/>
</svg>
`)

// ── Scene builder ─────────────────────────────────────────

export function createEditorialScene(vw: number, vh: number): SceneDescription {
	const narrow = vw < 680
	const w = Math.min(vw - 40, 940)
	const mx = Math.max(20, (vw - w) / 2)
	const col3W = (w - 48) / 3

	// Estimate text block height based on character count and width
	const textH = (chars: number, fs: number, lh: number) => {
		const cpl = Math.max(10, Math.floor(w / (fs * 0.55)))
		return Math.ceil((chars / cpl) * 1.25) * lh + lh
	}

	// ── Cumulative Y positions ────────────────────────────
	let cy = 20
	const r1Y = cy
	cy += 8
	const mastY = cy
	cy += narrow ? 38 : 52
	const volY = cy
	cy += narrow ? 18 : 20
	const r2Y = cy
	cy += narrow ? 12 : 16
	const hlY = cy
	const hlH = narrow ? 66 : 42
	cy += hlH + 8
	const deckY = cy
	const deckH = narrow ? Math.max(100, textH(181, 15, 24)) : 92
	cy += deckH + 6
	const byY = cy
	const byH = narrow ? 34 : 18
	cy += byH + 6
	const r3Y = cy
	cy += narrow ? 10 : 14

	const leadY = cy
	const leadH = narrow ? textH(1125, 14, 23) + 200 : 420
	cy += leadH + 14

	const r4Y = cy
	cy += 10
	const midHY = cy
	cy += 24
	const r5Y = cy
	cy += 10

	const sec2Y = cy
	const sec2H = narrow ? textH(1490, 14, 23) + 100 : 420
	cy += sec2H + 14

	const r6Y = cy
	cy += 10
	const dispHY = cy
	cy += 24
	const r7Y = cy
	cy += 10

	const dispY = cy
	const dispH = narrow ? textH(590, 15, 25) + 80 : 240
	cy += dispH + 14

	const r8Y = cy
	cy += 12
	const footY = cy
	cy += narrow ? 28 : 14
	const H = Math.max(vh, cy + 20)

	const elements: SceneDescription["elements"] = [
		// ── Masthead ──────────────────────────────────────────
		{
			id: "e-r1",
			type: "divider",
			rect: { x: mx, y: r1Y, width: w, height: 3 },
			throwable: false,
			pinned: true,
			backgroundColor: "#14110e",
		},
		{
			id: "e-mast",
			type: "heading",
			rect: { x: mx, y: mastY, width: w, height: narrow ? 38 : 50 },
			throwable: false,
			pinned: true,
			text: "The Living Document",
			fontSize: narrow ? 28 : 42,
			fontWeight: 700,
			fontFamily: SERIF,
			lineHeight: narrow ? 34 : 48,
			color: "#12100d",
			textAlign: "center",
		},
		{
			id: "e-vol",
			type: "heading",
			rect: { x: mx, y: volY, width: w, height: 16 },
			throwable: false,
			pinned: true,
			text: "Vol. I  |  First edition  |  April 2026",
			fontSize: 10,
			fontWeight: 500,
			fontFamily: MONO,
			lineHeight: 14,
			color: "#7d7569",
			textAlign: "center",
		},
		{
			id: "e-r2",
			type: "divider",
			rect: { x: mx, y: r2Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#aea396",
		},
		{
			id: "e-r2b",
			type: "divider",
			rect: { x: mx, y: r2Y + 3, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#aea396",
		},

		// ── Headline + deck ───────────────────────────────────
		{
			id: "e-hl",
			type: "heading",
			rect: { x: mx, y: hlY, width: w, height: hlH },
			throwable: false,
			pinned: true,
			text: "How The Web Learned To Move",
			fontSize: narrow ? 24 : 34,
			fontWeight: 700,
			fontFamily: SERIF,
			lineHeight: narrow ? 30 : 40,
			color: "#12100d",
		},
		{
			id: "e-deck",
			type: "paragraph",
			rect: { x: mx, y: deckY, width: w, height: deckH },
			throwable: false,
			pinned: true,
			text: "From Vannevar Bush's Memex to a page whose lines reroute around whatever you throw at them: how HTML, CSS, JavaScript, the DOM, Pretext, and Matter.js rewrote what a document can be.",
			fontSize: narrow ? 15 : 17,
			fontWeight: 400,
			fontFamily: SERIF,
			lineHeight: narrow ? 24 : 26,
			color: "#534d45",
		},
		{
			id: "e-by",
			type: "heading",
			rect: { x: mx, y: byY, width: w, height: byH },
			throwable: false,
			pinned: true,
			text: "By the DOMino editorial desk  |  From vacuum tubes to physics engines  |  Text reflows in real time",
			fontSize: 11,
			fontWeight: 500,
			fontFamily: MONO,
			lineHeight: 16,
			color: "#7d7569",
		},
		{
			id: "e-r3",
			type: "divider",
			rect: { x: mx, y: r3Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#D8CEC0",
		},
	]

	// ── Three-column lead / single-column narrow ─────────
	if (narrow) {
		elements.push({
			id: "e-c1",
			type: "paragraph",
			rect: { x: mx, y: leadY, width: w, height: leadH },
			throwable: false,
			pinned: true,
			text: `${LEAD_1} ${LEAD_2} ${LEAD_3}`,
			fontSize: 14,
			fontWeight: 400,
			fontFamily: SERIF,
			lineHeight: 23,
			color: "#2a2622",
		})
	} else {
		elements.push(
			{
				id: "e-c1",
				type: "paragraph",
				rect: { x: mx, y: leadY, width: col3W, height: leadH },
				throwable: false,
				pinned: true,
				text: LEAD_1,
				fontSize: 14,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 23,
				color: "#2a2622",
			},
			{
				id: "e-c2",
				type: "paragraph",
				rect: { x: mx + col3W + 24, y: leadY, width: col3W, height: leadH },
				throwable: false,
				pinned: true,
				text: LEAD_2,
				fontSize: 14,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 23,
				color: "#2a2622",
			},
			{
				id: "e-c3",
				type: "paragraph",
				rect: { x: mx + (col3W + 24) * 2, y: leadY, width: col3W, height: leadH },
				throwable: false,
				pinned: true,
				text: LEAD_3,
				fontSize: 14,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 23,
				color: "#2a2622",
			},
		)
	}

	// ── Lead section throwables ───────────────────────────
	const plateW = narrow ? Math.min(160, Math.round(w * 0.45)) : 170
	const plateH = Math.round(plateW * (340 / 300))
	elements.push(
		{
			id: "e-seal",
			type: "image",
			rect: {
				x: narrow ? mx + 16 : mx + 16,
				y: leadY + (narrow ? 280 : 20),
				width: narrow ? 60 : 68,
				height: narrow ? 60 : 68,
			},
			throwable: true,
			pinned: false,
			imageSrc: WAX_SEAL,
			imageAlt: "Wax seal",
			backgroundColor: "transparent",
			borderRadius: 34,
			physicsShape: "circle",
			mass: 0.9,
			restitution: 0.6,
		},
		{
			id: "e-plate",
			type: "image",
			rect: {
				x: narrow ? mx + w - plateW - 8 : mx + (col3W + 24) * 2 - 40,
				y: leadY + (narrow ? 50 : 90),
				width: plateW,
				height: plateH,
			},
			throwable: true,
			pinned: false,
			backgroundColor: "#ECE5D8",
			borderRadius: 10,
			imageAlt: "DOM tree diagram",
			imageSrc: EDITORIAL_PLATE,
			boxShadow: "0 18px 40px rgba(26,22,18,0.1), 0 0 0 1px rgba(26,22,18,0.04)",
			mass: 1.6,
		},
	)

	// ── Section 2 header ──────────────────────────────────
	elements.push(
		{
			id: "e-r4",
			type: "divider",
			rect: { x: mx, y: r4Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#CDBFAF",
		},
		{
			id: "e-mid-h",
			type: "heading",
			rect: { x: mx, y: midHY, width: w, height: 28 },
			throwable: false,
			pinned: true,
			text: "The languages that shaped the page",
			fontSize: narrow ? 21 : 23,
			fontWeight: 700,
			fontFamily: SERIF,
			lineHeight: 28,
			color: "#12100d",
		},
		{
			id: "e-r5",
			type: "divider",
			rect: { x: mx, y: r5Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#D8CEC0",
		},
	)

	// ── Three columns / single column narrow ──────────────
	if (narrow) {
		elements.push({
			id: "e-t1",
			type: "paragraph",
			rect: { x: mx, y: sec2Y, width: w, height: sec2H },
			throwable: false,
			pinned: true,
			text: `${SEC2_1} ${SEC2_2} ${SEC2_3}`,
			fontSize: 14,
			fontWeight: 400,
			fontFamily: SERIF,
			lineHeight: 23,
			color: "#38332e",
		})
	} else {
		elements.push(
			{
				id: "e-t1",
				type: "paragraph",
				rect: { x: mx, y: sec2Y, width: col3W, height: sec2H },
				throwable: false,
				pinned: true,
				text: SEC2_1,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 22,
				color: "#38332e",
			},
			{
				id: "e-t2",
				type: "paragraph",
				rect: { x: mx + col3W + 24, y: sec2Y, width: col3W, height: sec2H },
				throwable: false,
				pinned: true,
				text: SEC2_2,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 22,
				color: "#38332e",
			},
			{
				id: "e-t3",
				type: "paragraph",
				rect: { x: mx + (col3W + 24) * 2, y: sec2Y, width: col3W, height: sec2H },
				throwable: false,
				pinned: true,
				text: SEC2_3,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 22,
				color: "#38332e",
			},
		)
	}

	// ── Section 2 throwables ──────────────────────────────
	elements.push(
		{
			id: "e-compass",
			type: "image",
			rect: {
				x: narrow ? mx + w - 100 : mx + col3W + 48,
				y: sec2Y + (narrow ? 60 : 80),
				width: narrow ? 80 : 90,
				height: narrow ? 80 : 90,
			},
			throwable: true,
			pinned: false,
			imageSrc: COMPASS,
			imageAlt: "Compass rose",
			backgroundColor: "transparent",
			borderRadius: 45,
			physicsShape: "circle",
			mass: 1.0,
			restitution: 0.5,
		},
		{
			id: "e-browser",
			type: "image",
			rect: {
				x: narrow ? mx + 8 : mx + 20,
				y: sec2Y + (narrow ? 200 : 180),
				width: narrow ? 90 : 100,
				height: narrow ? 75 : 84,
			},
			throwable: true,
			pinned: false,
			imageSrc: BROWSER,
			imageAlt: "Browser window",
			backgroundColor: "transparent",
			boxShadow: "0 10px 30px rgba(26,22,18,0.08)",
			mass: 0.5,
			restitution: 0.4,
		},
	)

	// ── Dispatch section ──────────────────────────────────
	elements.push(
		{
			id: "e-r6",
			type: "divider",
			rect: { x: mx, y: r6Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#CDBFAF",
		},
		{
			id: "e-disp-h",
			type: "heading",
			rect: { x: mx, y: dispHY, width: w, height: 28 },
			throwable: false,
			pinned: true,
			text: "The physics of reading",
			fontSize: narrow ? 21 : 23,
			fontWeight: 700,
			fontFamily: SERIF,
			lineHeight: 28,
			color: "#12100d",
		},
		{
			id: "e-r7",
			type: "divider",
			rect: { x: mx, y: r7Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#D8CEC0",
		},
		{
			id: "e-dispatch",
			type: "paragraph",
			rect: { x: mx, y: dispY, width: w, height: dispH },
			throwable: false,
			pinned: true,
			text: DISPATCH,
			fontSize: narrow ? 15 : 16,
			fontWeight: 400,
			fontFamily: SERIF,
			lineHeight: narrow ? 25 : 27,
			color: "#2a2622",
		},
	)

	// ── Dispatch throwable ────────────────────────────────
	const pqW = narrow ? Math.min(180, w - 80) : 190
	elements.push({
		id: "e-pq",
		type: "card",
		rect: {
			x: narrow ? mx + 10 : mx + w - pqW - 20,
			y: dispY + (narrow ? 16 : 20),
			width: pqW,
			height: 96,
		},
		throwable: true,
		pinned: false,
		text: "\u201CThe document was meant to be read, not touched.\u201D",
		fontSize: 16,
		fontWeight: 500,
		fontFamily: SERIF,
		color: "#5C3317",
		backgroundColor: "rgba(255, 252, 246, 0.94)",
		borderRadius: 6,
		padding: 20,
		border: "1.5px solid rgba(184, 134, 11, 0.18)",
		boxShadow: "0 6px 20px rgba(26,22,18,0.06)",
		mass: 0.7,
		restitution: 0.35,
	})

	// ── Footer ────────────────────────────────────────────
	elements.push(
		{
			id: "e-r8",
			type: "divider",
			rect: { x: mx, y: r8Y, width: w, height: 1 },
			throwable: false,
			pinned: true,
			backgroundColor: "#CDBFAF",
		},
		{
			id: "e-foot",
			type: "heading",
			rect: { x: mx, y: footY, width: w, height: narrow ? 28 : 14 },
			throwable: false,
			pinned: true,
			text: "Typeset in code  |  Measured by Pretext  |  Moved by Matter.js  |  Built with React + TypeScript",
			fontSize: 9,
			fontWeight: 500,
			fontFamily: MONO,
			lineHeight: 14,
			color: "#A19486",
		},
	)

	return {
		id: "editorial",
		name: "Editorial",
		width: vw,
		height: H,
		backgroundColor:
			"linear-gradient(180deg, #faf6ef 0%, #f3ede4 42%, #ebe4d8 100%), radial-gradient(ellipse 90% 40% at 50% 0%, rgba(255, 252, 245, 0.9) 0%, transparent 55%)",
		elements,
	}
}
