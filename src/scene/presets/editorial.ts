import type { SceneDescription } from "../types"
import { SERIF, SANS, MONO } from "./fonts"

const svgUri = (svg: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const LEAD_L = `In 1945, Vannevar Bush imagined the Memex: a desk that let a researcher trace associative trails through a vast archive. The vision was prescient but the medium was wrong. It took forty-five years and a physicist at CERN before the idea found its true form. In 1990, Tim Berners-Lee wrote the first browser on a NeXT cube, defining the pillars still holding the web today: URLs to name things, HTTP to fetch them, HTML to describe them. For its first decade the document behaved exactly as designed — inert, self-contained, perfectly still.`

const LEAD_R = `What Berners-Lee built was deliberately simple. An HTML page was headings, paragraphs, and links rendered top to bottom by a browser that acted more like an obedient librarian than a platform. There were no layers, no animation, no notion that an element might move. The Document Object Model — the tree that browsers build to represent a page — was not standardized until 1998, when the W3C published DOM Level 1. Before that, Netscape and Internet Explorer maintained incompatible interfaces, and rearranging a page after it loaded was considered exotic. The document was meant to be read, not touched.`

const SEC2_1 = `Cascading Style Sheets arrived in 1996, proposed by Håkon Wium Lie at CERN. The insight was separation: structure in HTML, presentation in CSS. Early adoption was glacial — browsers implemented the spec unevenly, and developers resorted to table layouts and spacer GIFs. It was not until CSS Zen Garden in 2003 that the community saw a single document styled into radically different forms. Today CSS handles grids, animations, container queries, and responsive typography — a language born to change font colors now drives the web's entire visual layer.`

const SEC2_2 = `Brendan Eich wrote JavaScript in ten days in May 1995, a language that looked like Java but behaved like Scheme. It was dismissed as a toy for form validation. That changed slowly, then all at once. Crockford's "The Good Parts" argued a real language hid inside the mess. Node.js proved it ran on servers. React reimagined the DOM as a function of state. TypeScript added types. Today JavaScript is the most widely deployed platform in history, running in every browser and on every server.`

const SEC2_3 = `Pretext, by Cheng Lou, measures and lays out text without triggering browser reflows. It reads glyph widths via Canvas, then performs layout in pure arithmetic — no DOM reads, no jank. Matter.js, by Liam Brummitt, is a rigid-body physics engine running entirely in the browser at sixty frames per second. DOMino combines these two into something neither was built for: a page where thrown objects displace text in real time, and the words reflow around them as naturally as water around a stone.`

const DISPATCH = `From Bush's Memex to a page whose lines reroute around whatever you throw at them is a long arc. HTML holds structure. CSS holds the look. JavaScript holds behavior. The DOM sits between document and program. Pretext keeps measurement off the layout hot path. Matter.js keeps bodies honest at frame rate. DOMino is one answer to a stubborn question: what if the page were allowed to move? Pick something up and find out.`

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

  <!-- Plate label -->
  <rect x="32" y="28" width="72" height="20" rx="10" fill="#E8E0D2"/>
  <text x="48" y="42" fill="#6B5C48" font-size="10" font-family="Georgia, serif" font-weight="700" letter-spacing="0.08em">PLATE I</text>
  <text x="112" y="42" fill="#7A6F62" font-size="10" font-family="Georgia, serif" font-style="italic">The Document Object Model</text>

  <!-- Diagram area -->
  <rect x="32" y="58" width="236" height="156" rx="8" fill="url(#plateDiagram)"/>
  <rect x="32" y="58" width="236" height="156" rx="8" fill="none" stroke="#000" stroke-opacity="0.15"/>

  <!-- Tree: document root -->
  <text x="132" y="82" fill="#C4A574" font-size="8" font-family="ui-monospace, monospace" opacity="0.55">document</text>
  <circle cx="150" cy="92" r="7" fill="none" stroke="#8B5CF6" stroke-width="1.5"/>
  <circle cx="150" cy="92" r="3.2" fill="#8B5CF6" opacity="0.55"/>

  <!-- Branches to head/body -->
  <line x1="150" y1="99" x2="100" y2="127" stroke="#B8956A" stroke-width="1" stroke-dasharray="3 2" opacity="0.75"/>
  <line x1="150" y1="99" x2="200" y2="127" stroke="#B8956A" stroke-width="1" stroke-dasharray="3 2" opacity="0.75"/>

  <!-- head node -->
  <rect x="82" y="124" width="36" height="14" rx="3" fill="none" stroke="#C2410C" stroke-width="1" opacity="0.85"/>
  <text x="88" y="134" fill="#D4C4A8" font-size="7" font-family="ui-monospace, monospace">&lt;head&gt;</text>

  <!-- body node -->
  <rect x="182" y="124" width="36" height="14" rx="3" fill="none" stroke="#C2410C" stroke-width="1" opacity="0.85"/>
  <text x="188" y="134" fill="#D4C4A8" font-size="7" font-family="ui-monospace, monospace">&lt;body&gt;</text>

  <!-- Leaf branches from head -->
  <line x1="100" y1="138" x2="72" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="100" y1="138" x2="128" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>

  <!-- Leaf branches from body -->
  <line x1="200" y1="138" x2="172" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="200" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="138" x2="228" y2="160" stroke="#8F8578" stroke-width="0.75" opacity="0.5"/>

  <!-- Leaf nodes from head -->
  <rect x="58" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="62" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;meta&gt;</text>
  <rect x="114" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="118" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;title&gt;</text>

  <!-- Leaf nodes from body -->
  <rect x="158" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="164" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;h1&gt;</text>
  <rect x="191" y="160" width="18" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="195" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;p&gt;</text>
  <rect x="214" y="160" width="28" height="12" rx="2" fill="#0D9488" opacity="0.82"/>
  <text x="218" y="169" fill="#ECFEFF" font-size="6" font-family="ui-monospace, monospace">&lt;div&gt;</text>

  <!-- Sub-branches from div -->
  <line x1="228" y1="172" x2="218" y2="186" stroke="#8F8578" stroke-width="0.5" opacity="0.4"/>
  <line x1="228" y1="172" x2="238" y2="186" stroke="#8F8578" stroke-width="0.5" opacity="0.4"/>
  <circle cx="218" cy="189" r="2.5" fill="#8F8578" opacity="0.3"/>
  <circle cx="238" cy="189" r="2.5" fill="#8F8578" opacity="0.3"/>

  <!-- Decorative dots -->
  <circle cx="72" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <circle cx="78" cy="196" r="1" fill="#8F8578" opacity="0.2"/>
  <circle cx="84" cy="196" r="1" fill="#8F8578" opacity="0.2"/>

  <!-- Caption area -->
  <text x="32" y="234" fill="#2C241F" font-size="11" font-family="Georgia, serif" font-weight="700" letter-spacing="0.02em">The DOM tree</text>
  <line x1="32" y1="242" x2="168" y2="242" stroke="#C9BFB0" stroke-width="0.75"/>
  <text x="32" y="256" fill="#6B6258" font-size="9" font-family="Georgia, serif">The browser parses markup into a tree:</text>
  <text x="32" y="268" fill="#6B6258" font-size="9" font-family="Georgia, serif">each node is an object with children,</text>
  <text x="32" y="280" fill="#6B6258" font-size="9" font-family="Georgia, serif">properties, and methods you can call.</text>

  <!-- Legend -->
  <circle cx="40" cy="302" r="4" fill="none" stroke="#8B5CF6" stroke-width="1"/>
  <text x="50" y="305" fill="#6B6258" font-size="8" font-family="Georgia, serif">Root</text>
  <rect x="76" y="298" width="8" height="8" rx="1.5" fill="none" stroke="#C2410C" stroke-width="0.75"/>
  <text x="90" y="305" fill="#6B6258" font-size="8" font-family="Georgia, serif">Branch</text>
  <rect x="128" y="298" width="8" height="8" rx="1.5" fill="#0D9488" opacity="0.85"/>
  <text x="142" y="305" fill="#6B6258" font-size="8" font-family="Georgia, serif">Leaf</text>
</svg>
`)

export function createEditorialScene(vw: number, vh: number): SceneDescription {
	const w = Math.min(vw - 40, 940)
	const mx = Math.max(20, (vw - w) / 2)
	const H = Math.max(vh, 1760)
	const col2W = (w - 28) / 2
	const col3W = (w - 48) / 3

	return {
		id: "editorial",
		name: "Editorial",
		width: vw,
		height: H,
		backgroundColor:
			"linear-gradient(180deg, #faf6ef 0%, #f3ede4 42%, #ebe4d8 100%), radial-gradient(ellipse 90% 40% at 50% 0%, rgba(255, 252, 245, 0.9) 0%, transparent 55%)",
		elements: [
			// ── Masthead ──────────────────────────────────────────
			{
				id: "e-r1",
				type: "divider",
				rect: { x: mx, y: 20, width: w, height: 3 },
				throwable: false,
				pinned: true,
				backgroundColor: "#14110e",
			},
			{
				id: "e-mast",
				type: "heading",
				rect: { x: mx, y: 28, width: w, height: 50 },
				throwable: false,
				pinned: true,
				text: "The Living Document",
				fontSize: 42,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 48,
				color: "#12100d",
			},
			{
				id: "e-vol",
				type: "heading",
				rect: { x: mx, y: 80, width: w / 2, height: 16 },
				throwable: false,
				pinned: true,
				text: "Vol. I  |  First edition  |  April 2026",
				fontSize: 10,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 14,
				color: "#7d7569",
			},
			{
				id: "e-weather",
				type: "heading",
				rect: { x: mx + w - 238, y: 80, width: 138, height: 16 },
				throwable: false,
				pinned: true,
				text: "W3C  ·  ECMA  ·  IETF",
				fontSize: 10,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 14,
				color: "#7d7569",
			},
			{
				id: "e-price",
				type: "badge",
				rect: { x: mx + w - 72, y: 74, width: 72, height: 22 },
				throwable: true,
				pinned: false,
				text: "v1.0",
				fontSize: 10,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#14110e",
				backgroundColor: "rgba(255, 252, 246, 0.92)",
				borderRadius: 2,
				border: "1px solid #c4b8a6",
				mass: 0.08,
			},
			{
				id: "e-r2",
				type: "divider",
				rect: { x: mx, y: 102, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#aea396",
			},
			{
				id: "e-r2b",
				type: "divider",
				rect: { x: mx, y: 105, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#aea396",
			},

			// ── Section tags ──────────────────────────────────────
			{
				id: "e-sec-1",
				type: "badge",
				rect: { x: mx, y: 110, width: 82, height: 24 },
				throwable: true,
				pinned: false,
				text: "HISTORY",
				fontSize: 9,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#9a3412",
				backgroundColor: "rgba(180, 83, 9, 0.1)",
				borderRadius: 4,
				border: "1px solid rgba(180, 83, 9, 0.22)",
				mass: 0.04,
			},
			{
				id: "e-sec-2",
				type: "badge",
				rect: { x: mx + 90, y: 110, width: 88, height: 24 },
				throwable: true,
				pinned: false,
				text: "SYSTEMS",
				fontSize: 9,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#5b21b6",
				backgroundColor: "rgba(124, 58, 237, 0.1)",
				borderRadius: 4,
				border: "1px solid rgba(124, 58, 237, 0.2)",
				mass: 0.04,
			},
			{
				id: "e-sec-3",
				type: "badge",
				rect: { x: mx + 186, y: 110, width: 68, height: 24 },
				throwable: true,
				pinned: false,
				text: "CRAFT",
				fontSize: 9,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#0d9488",
				backgroundColor: "rgba(15, 118, 110, 0.1)",
				borderRadius: 4,
				border: "1px solid rgba(15, 118, 110, 0.2)",
				mass: 0.04,
			},

			// ── Headline + deck ───────────────────────────────────
			{
				id: "e-hl",
				type: "heading",
				rect: { x: mx, y: 142, width: w, height: 42 },
				throwable: false,
				pinned: true,
				text: "How The Web Learned To Move",
				fontSize: 34,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 40,
				color: "#12100d",
			},
			{
				id: "e-deck",
				type: "paragraph",
				rect: { x: mx, y: 200, width: w, height: 92 },
				throwable: false,
				pinned: true,
				text: "From Vannevar Bush's Memex to a page whose lines reroute around whatever you throw at them: how HTML, CSS, JavaScript, the DOM, Pretext, and Matter.js rewrote what a document can be.",
				fontSize: 17,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 26,
				color: "#534d45",
			},
			{
				id: "e-by",
				type: "heading",
				rect: { x: mx, y: 302, width: w, height: 18 },
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
				rect: { x: mx, y: 332, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#D8CEC0",
			},

			// ── Two-column lead ───────────────────────────────────
			{
				id: "e-c1",
				type: "paragraph",
				rect: { x: mx, y: 354, width: col2W, height: 452 },
				throwable: false,
				pinned: true,
				text: LEAD_L,
				fontSize: 15,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 25,
				color: "#2a2622",
			},
			{
				id: "e-c2",
				type: "paragraph",
				rect: { x: mx + col2W + 28, y: 354, width: col2W, height: 452 },
				throwable: false,
				pinned: true,
				text: LEAD_R,
				fontSize: 15,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 25,
				color: "#2a2622",
			},
			{
				id: "e-plate",
				type: "image",
				rect: { x: mx + col2W - 78, y: 452, width: 184, height: 208 },
				throwable: true,
				pinned: false,
				backgroundColor: "#ECE5D8",
				borderRadius: 10,
				imageAlt: "DOM tree diagram",
				imageSrc: EDITORIAL_PLATE,
				boxShadow: "0 18px 40px rgba(26,22,18,0.1), 0 0 0 1px rgba(26,22,18,0.04)",
				mass: 1.6,
			},
			{
				id: "e-note",
				type: "card",
				rect: { x: mx + w - 148, y: 612, width: 148, height: 110 },
				throwable: true,
				pinned: false,
				text: "Technical note",
				fontSize: 12,
				fontWeight: 700,
				fontFamily: SANS,
				color: "#12100d",
				backgroundColor: "rgba(255, 253, 248, 0.88)",
				borderRadius: 12,
				padding: 14,
				border: "1px solid rgba(201, 191, 175, 0.65)",
				backdropFilter: "blur(10px)",
				boxShadow: "0 8px 24px rgba(26,22,18,0.06)",
				mass: 0.7,
				children: [
					{
						id: "e-note-a",
						type: "paragraph",
						rect: { x: 0, y: 8, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Pretext lays out hundreds of prepared strings in well under a millisecond — room to spare at 60fps.",
						fontSize: 11,
						fontWeight: 400,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#6A625A",
					},
				],
			},

			// ── Section 2 header ──────────────────────────────────
			{
				id: "e-r4",
				type: "divider",
				rect: { x: mx, y: 836, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#CDBFAF",
			},
			{
				id: "e-mid-h",
				type: "heading",
				rect: { x: mx, y: 856, width: w, height: 28 },
				throwable: false,
				pinned: true,
				text: "The languages that shaped the page",
				fontSize: 23,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 28,
				color: "#12100d",
			},
			{
				id: "e-r5",
				type: "divider",
				rect: { x: mx, y: 892, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#D8CEC0",
			},

			// ── Three columns ─────────────────────────────────────
			{
				id: "e-t1",
				type: "paragraph",
				rect: { x: mx, y: 910, width: col3W, height: 362 },
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
				rect: { x: mx + col3W + 24, y: 910, width: col3W, height: 362 },
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
				rect: { x: mx + (col3W + 24) * 2, y: 910, width: col3W, height: 362 },
				throwable: false,
				pinned: true,
				text: SEC2_3,
				fontSize: 13,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 22,
				color: "#38332e",
			},

			// ── Gap throwables ────────────────────────────────────
			{
				id: "e-seal",
				type: "badge",
				rect: { x: mx + 24, y: 1288, width: 54, height: 54 },
				throwable: true,
				pinned: false,
				text: "DOM",
				fontSize: 11,
				fontWeight: 700,
				fontFamily: MONO,
				color: "#fff",
				backgroundColor: "#B45309",
				borderRadius: 27,
				mass: 0.72,
			},
			{
				id: "e-pq",
				type: "card",
				rect: { x: mx + col3W + 48, y: 1284, width: 210, height: 128 },
				throwable: true,
				pinned: false,
				text: '"The document was meant to be read, not touched."',
				fontSize: 15,
				fontWeight: 500,
				fontFamily: SERIF,
				color: "#6d28d9",
				backgroundColor: "rgba(255, 253, 248, 0.92)",
				borderRadius: 12,
				padding: 14,
				border: "1px solid rgba(201, 191, 175, 0.55)",
				backdropFilter: "blur(8px)",
				boxShadow: "0 8px 26px rgba(26,22,18,0.06)",
				mass: 0.85,
				children: [
					{
						id: "e-pq-a",
						type: "paragraph",
						rect: { x: 0, y: 8, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Until JavaScript, CSS, and the DOM turned it into something alive.",
						fontSize: 11,
						fontWeight: 400,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#6A625A",
					},
				],
			},

			// ── Dispatch section ──────────────────────────────────
			{
				id: "e-r6",
				type: "divider",
				rect: { x: mx, y: 1400, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#CDBFAF",
			},
			{
				id: "e-disp-h",
				type: "heading",
				rect: { x: mx, y: 1420, width: w, height: 28 },
				throwable: false,
				pinned: true,
				text: "The physics of reading",
				fontSize: 23,
				fontWeight: 700,
				fontFamily: SERIF,
				lineHeight: 28,
				color: "#12100d",
			},
			{
				id: "e-r7",
				type: "divider",
				rect: { x: mx, y: 1456, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#D8CEC0",
			},
			{
				id: "e-dispatch",
				type: "paragraph",
				rect: { x: mx, y: 1474, width: w, height: 210 },
				throwable: false,
				pinned: true,
				text: DISPATCH,
				fontSize: 16,
				fontWeight: 400,
				fontFamily: SERIF,
				lineHeight: 27,
				color: "#2a2622",
			},
			{
				id: "e-briefs",
				type: "card",
				rect: { x: mx + w - 196, y: 1508, width: 196, height: 180 },
				throwable: true,
				pinned: false,
				text: "Also in this issue",
				fontSize: 13,
				fontWeight: 700,
				fontFamily: SANS,
				color: "#12100d",
				backgroundColor: "rgba(255, 253, 248, 0.9)",
				borderRadius: 12,
				padding: 14,
				border: "1px solid rgba(201, 191, 175, 0.55)",
				backdropFilter: "blur(8px)",
				boxShadow: "0 8px 26px rgba(26,22,18,0.06)",
				mass: 0.9,
				children: [
					{
						id: "briefs-a",
						type: "paragraph",
						rect: { x: 0, y: 8, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Timeline: from ARPANET to container queries",
						fontSize: 11,
						fontWeight: 500,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#12100d",
					},
					{
						id: "briefs-b",
						type: "paragraph",
						rect: { x: 0, y: 6, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Profile: Cheng Lou on measuring text without the DOM",
						fontSize: 11,
						fontWeight: 500,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#12100d",
					},
					{
						id: "briefs-c",
						type: "paragraph",
						rect: { x: 0, y: 6, width: 0, height: 0 },
						throwable: false,
						pinned: true,
						text: "Lab notes: rigid-body physics meets editorial layout",
						fontSize: 11,
						fontWeight: 500,
						fontFamily: SANS,
						lineHeight: 16,
						color: "#12100d",
					},
				],
			},

			// ── Footer ────────────────────────────────────────────
			{
				id: "e-r8",
				type: "divider",
				rect: { x: mx, y: 1714, width: w, height: 1 },
				throwable: false,
				pinned: true,
				backgroundColor: "#CDBFAF",
			},
			{
				id: "e-foot",
				type: "heading",
				rect: { x: mx, y: 1730, width: w, height: 14 },
				throwable: false,
				pinned: true,
				text: "Typeset in code  |  Measured by Pretext  |  Moved by Matter.js  |  Built with React + TypeScript",
				fontSize: 9,
				fontWeight: 500,
				fontFamily: MONO,
				lineHeight: 14,
				color: "#A19486",
			},
		],
	}
}
