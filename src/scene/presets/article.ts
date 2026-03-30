import type { SceneDescription } from "../types";
import { SERIF, SANS, MONO } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const P1 = `The most convincing editorial pages do more than deliver copy. They establish a pace. The opening lines arrive with space to breathe, the supporting material enters with restraint, and every interruption feels placed by an editor rather than by a template. That is why most interactive storytelling still looks unfinished when it begins to move: motion is added after hierarchy has already been frozen into a static mockup.`;

const P2 = `On a real feature spread, the side rail does not exist to decorate the margins. It carries the briefing notes, the provenance of the reporting, the references an attentive reader will reach for after the headline lands. Once those pieces become movable objects, the article stops behaving like a screenshot and starts behaving like a page. The composition has to remain legible even while its evidence cards, pull quotes, and diagrams drift through the body text.`;

const P3 = `DOMino works because it treats each of those supporting blocks as first-class citizens in the composition. A note card can be grabbed and tossed. A diagram can slide into a paragraph. The copy surrounding them does not collapse into overlap or wait for a browser reflow pass. It recomputes immediately, line by line, as though the publication had been typeset for motion from the beginning.`;

const P4 = `That changes the editorial brief. Designers can place denser context next to the story because the layout can negotiate around whatever the reader disturbs. Engineers can build richer pages because measurement happens outside the DOM and the available segments for each line are computed as geometry, not as a chain of synchronous reads. The resulting experience feels less like a demo and more like a magazine page that has quietly become interactive.`;

const P5 = `The goal is not spectacle for its own sake. It is to make sophisticated pages feel robust under motion: full of citations, timing, metadata, and visual rhythm, yet still readable when the reader starts rearranging the evidence. That is the difference between a preset that proves a mechanic and a preset that feels like a real publication.`;

const ARTICLE_DIAGRAM = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="240" viewBox="0 0 420 240" fill="none">
  <rect width="420" height="240" rx="18" fill="#F4EFE8"/>
  <rect x="22" y="22" width="376" height="196" rx="14" fill="#FFFDFC" stroke="#DED6CB"/>
  <rect x="42" y="46" width="130" height="14" rx="7" fill="#201A17"/>
  <rect x="42" y="74" width="146" height="8" rx="4" fill="#CFC5B8"/>
  <rect x="42" y="92" width="160" height="8" rx="4" fill="#DDD3C8"/>
  <rect x="42" y="120" width="154" height="70" rx="12" fill="#ECE4DA"/>
  <rect x="220" y="46" width="152" height="110" rx="14" fill="#1F1A17"/>
  <path d="M240 128C262 100 276 94 296 94C322 94 326 126 346 126C357 126 364 118 372 110" stroke="#8B5CF6" stroke-width="4" stroke-linecap="round"/>
  <circle cx="262" cy="120" r="10" fill="#8B5CF6"/>
  <circle cx="326" cy="126" r="8" fill="#F59E0B"/>
  <rect x="220" y="172" width="68" height="12" rx="6" fill="#CFC5B8"/>
  <rect x="296" y="172" width="76" height="12" rx="6" fill="#DDD3C8"/>
  <rect x="220" y="192" width="104" height="8" rx="4" fill="#E7DED3"/>
  <rect x="42" y="202" width="148" height="8" rx="4" fill="#D5CCBF"/>
  <text x="42" y="155" fill="#6B5D4F" font-size="13" font-family="Arial, sans-serif">line bands</text>
  <text x="240" y="68" fill="#FFFFFF" font-size="13" font-family="Arial, sans-serif">available width per row</text>
</svg>
`);

export function createArticleScene(vw: number, vh: number): SceneDescription {
  const maxW = Math.min(vw - 48, 1160);
  const mx = Math.max(24, (vw - maxW) / 2);
  const contentW = maxW;
  const mainW = Math.min(contentW * 0.6, 660);
  const sX = mx + mainW + 44;
  const sW = contentW - mainW - 44;
  const H = Math.max(vh, 1820);

  return {
    id: "article", name: "Article", width: vw, height: H, backgroundColor: "#FAF8F3",
    elements: [
      { id: "logo", type: "badge", rect: { x: mx, y: 24, width: 114, height: 32 }, throwable: true, pinned: false, text: "DOMino Review", fontSize: 12, fontWeight: 700, fontFamily: MONO, color: "#FAF8F3", backgroundColor: "#171412", borderRadius: 8, padding: 6, mass: 0.42 },
      { id: "nav-1", type: "button", rect: { x: mx + 130, y: 27, width: 62, height: 26 }, throwable: true, pinned: false, text: "Essays", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#6B645E", backgroundColor: "transparent", borderRadius: 4, mass: 0.15 },
      { id: "nav-2", type: "button", rect: { x: mx + 198, y: 27, width: 64, height: 26 }, throwable: true, pinned: false, text: "Studio", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#6B645E", backgroundColor: "transparent", borderRadius: 4, mass: 0.15 },
      { id: "nav-3", type: "button", rect: { x: mx + 270, y: 27, width: 66, height: 26 }, throwable: true, pinned: false, text: "Archive", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#6B645E", backgroundColor: "transparent", borderRadius: 4, mass: 0.15 },
      { id: "nav-subscribe", type: "button", rect: { x: mx + contentW - 124, y: 22, width: 124, height: 34 }, throwable: true, pinned: false, text: "Join the issue", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#171412", borderRadius: 10, mass: 0.32 },
      { id: "divider-top", type: "divider", rect: { x: mx, y: 70, width: contentW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#E3DDD3" },

      { id: "cat-badge", type: "badge", rect: { x: mx, y: 92, width: 98, height: 24 }, throwable: true, pinned: false, text: "FEATURE", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#7C3AED", backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 5, padding: 4, mass: 0.1 },
      { id: "issue-badge", type: "badge", rect: { x: mx + 110, y: 92, width: 108, height: 24 }, throwable: true, pinned: false, text: "SPRING ISSUE", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#8A5A21", backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 5, padding: 4, mass: 0.1 },
      { id: "read-badge", type: "badge", rect: { x: mx + 230, y: 92, width: 100, height: 24 }, throwable: true, pinned: false, text: "11 MIN READ", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#4B5563", backgroundColor: "rgba(75,85,99,0.08)", borderRadius: 5, padding: 4, mass: 0.1 },

      { id: "hero-title", type: "heading", rect: { x: mx, y: 128, width: contentW, height: 128 }, throwable: false, pinned: true, text: "A Magazine Layout\nThat Refuses To Sit Still", fontSize: 56, fontWeight: 700, fontFamily: SERIF, lineHeight: 64, color: "#171412" },
      { id: "hero-sub", type: "paragraph", rect: { x: mx, y: 272, width: mainW + 54, height: 78 }, throwable: false, pinned: true, text: "A fuller preset needs more than paragraphs and a lonely image slot. It needs reporting notes, visual evidence, and enough supporting structure that the page still feels authored after the reader starts throwing pieces around.", fontSize: 18, fontWeight: 400, fontFamily: SANS, lineHeight: 29, color: "#6E6761" },
      { id: "hero-byline", type: "heading", rect: { x: mx, y: 362, width: mainW, height: 20 }, throwable: false, pinned: true, text: "By Mina Corwin  |  Design systems editor  |  Updated March 2026", fontSize: 13, fontWeight: 500, fontFamily: SANS, lineHeight: 20, color: "#8D857D" },
      { id: "divider-hero", type: "divider", rect: { x: mx, y: 398, width: mainW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#E6E0D7" },

      { id: "p1", type: "paragraph", rect: { x: mx, y: 424, width: mainW, height: 214 }, throwable: false, pinned: true, text: P1, fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 30, color: "#2B2622" },
      { id: "note-1", type: "card", rect: { x: mx + mainW - 186, y: 486, width: 186, height: 126 }, throwable: true, pinned: false, text: "Field notes", fontSize: 13, fontWeight: 700, fontFamily: SANS, color: "#171412", backgroundColor: "#FFFDF9", borderRadius: 14, padding: 16, border: "1px solid #E6DED4", boxShadow: "0 12px 32px rgba(23,20,18,0.06)", mass: 1.05,
        children: [
          { id: "note-1-a", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Readers keep grabbing the cards in the right rail first.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 17, color: "#6E6761" },
          { id: "note-1-b", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "The page still needs to hold its hierarchy afterward.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 17, color: "#6E6761" },
        ] },
      { id: "p2", type: "paragraph", rect: { x: mx, y: 662, width: mainW, height: 214 }, throwable: false, pinned: true, text: P2, fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 30, color: "#2B2622" },

      { id: "pullquote", type: "card", rect: { x: mx, y: 904, width: mainW, height: 94 }, throwable: true, pinned: false, text: '"A real article carries evidence in the margins, not just decoration."', fontSize: 21, fontWeight: 500, fontFamily: SERIF, color: "#7C3AED", backgroundColor: "transparent", borderRadius: 0, padding: 18, border: "none", boxShadow: "none", mass: 0.82, children: [] },

      { id: "mid-h", type: "heading", rect: { x: mx, y: 1032, width: mainW, height: 38 }, throwable: false, pinned: true, text: "Designing for disturbance", fontSize: 31, fontWeight: 700, fontFamily: SERIF, lineHeight: 38, color: "#171412" },
      { id: "p3", type: "paragraph", rect: { x: mx, y: 1088, width: mainW, height: 220 }, throwable: false, pinned: true, text: P3, fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 30, color: "#2B2622" },
      { id: "process-card", type: "card", rect: { x: mx + 40, y: 1198, width: 214, height: 136 }, throwable: true, pinned: false, text: "What gets measured", fontSize: 13, fontWeight: 700, fontFamily: SANS, color: "#171412", backgroundColor: "#FFF9EF", borderRadius: 14, padding: 16, border: "1px solid #F2DEC0", boxShadow: "0 10px 28px rgba(143,90,18,0.08)", mass: 1.12,
        children: [
          { id: "process-a", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Glyph widths cached on canvas", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 17, color: "#8A5A21" },
          { id: "process-b", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "Blocked intervals per line band", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 17, color: "#8A5A21" },
          { id: "process-c", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "Remaining segments filled in order", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 17, color: "#8A5A21" },
        ] },
      { id: "p4", type: "paragraph", rect: { x: mx, y: 1328, width: mainW, height: 220 }, throwable: false, pinned: true, text: P4, fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 30, color: "#2B2622" },

      { id: "end-h", type: "heading", rect: { x: mx, y: 1572, width: mainW, height: 34 }, throwable: false, pinned: true, text: "From prototype to publication", fontSize: 27, fontWeight: 700, fontFamily: SERIF, lineHeight: 34, color: "#171412" },
      { id: "p5", type: "paragraph", rect: { x: mx, y: 1620, width: mainW, height: 118 }, throwable: false, pinned: true, text: P5, fontSize: 18, fontWeight: 400, fontFamily: SERIF, lineHeight: 30, color: "#2B2622" },

      { id: "side-label", type: "heading", rect: { x: sX, y: 424, width: sW, height: 18 }, throwable: false, pinned: true, text: "ARTICLE RAIL", fontSize: 11, fontWeight: 700, fontFamily: MONO, lineHeight: 18, color: "#A59B8F" },
      { id: "author-card", type: "card", rect: { x: sX, y: 452, width: sW, height: 136 }, throwable: true, pinned: false, text: "Mina Corwin", fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#171412", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 18, border: "1px solid #E6DED4", boxShadow: "0 10px 28px rgba(23,20,18,0.05)", mass: 1.22,
        children: [
          { id: "author-a", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Design systems editor covering layout engines, browser mechanics, and interactive reading.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18, color: "#6E6761" },
          { id: "author-b", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Based in London. Files reported essays and product teardowns.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18, color: "#6E6761" },
        ] },
      { id: "toc-card", type: "card", rect: { x: sX, y: 604, width: sW, height: 144 }, throwable: true, pinned: false, text: "In this piece", fontSize: 14, fontWeight: 700, fontFamily: SANS, color: "#171412", backgroundColor: "#F6F1E8", borderRadius: 14, padding: 18, border: "1px solid #E6DED4", mass: 1.14,
        children: [
          { id: "toc-a", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "01  Why static article presets feel unfinished", fontSize: 12, fontWeight: 500, fontFamily: MONO, lineHeight: 18, color: "#8A5A21" },
          { id: "toc-b", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "02  How movable side matter changes the brief", fontSize: 12, fontWeight: 500, fontFamily: MONO, lineHeight: 18, color: "#8A5A21" },
          { id: "toc-c", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "03  What a real editorial page needs to carry", fontSize: 12, fontWeight: 500, fontFamily: MONO, lineHeight: 18, color: "#8A5A21" },
        ] },
      { id: "img-1", type: "image", rect: { x: sX, y: 772, width: sW, height: 190 }, throwable: true, pinned: false, backgroundColor: "#EEE7DC", borderRadius: 16, imageAlt: "Layout diagram", imageSrc: ARTICLE_DIAGRAM, boxShadow: "0 12px 30px rgba(23,20,18,0.06)", mass: 2.1 },
      { id: "img-caption", type: "paragraph", rect: { x: sX, y: 978, width: sW, height: 52 }, throwable: false, pinned: true, text: "Diagram: the side rail now carries a real visual artifact instead of a blank image slot, so the preset reads like an authored spread before anything moves.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18, color: "#8D857D" },
      { id: "stats-card", type: "card", rect: { x: sX, y: 1048, width: sW, height: 124 }, throwable: true, pinned: false, text: "Runtime snapshot", fontSize: 11, fontWeight: 700, fontFamily: MONO, color: "#8D857D", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, border: "1px solid #E6DED4", boxShadow: "0 8px 24px rgba(23,20,18,0.05)", mass: 1.05,
        children: [
          { id: "stats-a", type: "paragraph", rect: { x: 0, y: 14, width: 0, height: 0 }, throwable: false, pinned: true, text: "14 movable blocks", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#171412" },
          { id: "stats-b", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "3 flowing text regions  |  0 DOM reads in the layout loop", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 18, color: "#6E6761" },
        ] },
      { id: "related-card", type: "card", rect: { x: sX, y: 1190, width: sW, height: 130 }, throwable: true, pinned: false, text: "Further reading", fontSize: 14, fontWeight: 700, fontFamily: SANS, color: "#171412", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 18, border: "1px solid #E6DED4", boxShadow: "0 8px 24px rgba(23,20,18,0.05)", mass: 1.08,
        children: [
          { id: "related-a", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Real-time reflow for editorial surfaces", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 18, color: "#171412" },
          { id: "related-b", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "Designing side matter that survives motion", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 18, color: "#171412" },
          { id: "related-c", type: "paragraph", rect: { x: 0, y: 8, width: 0, height: 0 }, throwable: false, pinned: true, text: "Pretext and the end of synchronous measurement", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 18, color: "#171412" },
        ] },
      { id: "cta-1", type: "button", rect: { x: sX, y: 1340, width: 152, height: 42 }, throwable: true, pinned: false, text: "Open demo", fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#171412", borderRadius: 10, mass: 0.5 },
      { id: "cta-2", type: "button", rect: { x: sX + 160, y: 1340, width: 122, height: 42 }, throwable: true, pinned: false, text: "View source", fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#171412", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #D5CEC3", mass: 0.5 },
      { id: "newsletter", type: "card", rect: { x: sX, y: 1400, width: sW, height: 138 }, throwable: true, pinned: false, text: "Notes from the layout desk", fontSize: 14, fontWeight: 700, fontFamily: SANS, color: "#171412", backgroundColor: "#F6F1E8", borderRadius: 14, padding: 18, border: "1px solid #E6DED4", mass: 1.04,
        children: [
          { id: "nl-a", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "A monthly digest of experiments, browser notes, and pages worth dissecting.", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 18, color: "#6E6761" },
          { id: "nl-b", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Next issue: annotated dashboards and movable footnotes.", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 18, color: "#8A5A21" },
        ] },
      { id: "tag-1", type: "badge", rect: { x: sX, y: 1556, width: 72, height: 24 }, throwable: true, pinned: false, text: "EDITED", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#B45309", borderRadius: 12, padding: 5, mass: 0.1 },
      { id: "tag-2", type: "badge", rect: { x: sX + 80, y: 1556, width: 78, height: 24 }, throwable: true, pinned: false, text: "LAYOUT", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#7C3AED", borderRadius: 12, padding: 5, mass: 0.1 },
      { id: "tag-3", type: "badge", rect: { x: sX + 166, y: 1556, width: 72, height: 24 }, throwable: true, pinned: false, text: "MOTION", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#0F766E", borderRadius: 12, padding: 5, mass: 0.1 },

      { id: "divider-bottom", type: "divider", rect: { x: mx, y: 1758, width: contentW, height: 1 }, throwable: false, pinned: true, backgroundColor: "#E3DDD3" },
      { id: "footer-note", type: "heading", rect: { x: mx, y: 1772, width: contentW, height: 16 }, throwable: false, pinned: true, text: "Issue 07  |  DOMino Review  |  Built with Pretext and Matter.js", fontSize: 10, fontWeight: 500, fontFamily: MONO, lineHeight: 16, color: "#A59B8F" },
    ],
  };
}
