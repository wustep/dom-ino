import type { SceneDescription } from "../types";
import { SANS, MONO } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const DASHBOARD_CHART = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360" fill="none">
  <rect width="720" height="360" rx="20" fill="#FFFFFF"/>
  <rect x="28" y="28" width="664" height="304" rx="16" fill="#F8FBFF" stroke="#D9E5F7"/>
  <text x="52" y="62" fill="#0F172A" font-size="20" font-family="Arial, sans-serif" font-weight="700">Net revenue</text>
  <text x="52" y="88" fill="#64748B" font-size="13" font-family="Arial, sans-serif">Quarter to date · compared with forecast</text>
  <text x="52" y="126" fill="#0F172A" font-size="36" font-family="Arial, sans-serif" font-weight="700">$3.84M</text>
  <rect x="196" y="103" width="82" height="26" rx="13" fill="#DCFCE7"/>
  <text x="218" y="121" fill="#15803D" font-size="12" font-family="Arial, sans-serif" font-weight="700">+18.4%</text>
  <path d="M58 246H454" stroke="#D8E2F0"/>
  <path d="M58 208H454" stroke="#E8EFF8"/>
  <path d="M58 170H454" stroke="#E8EFF8"/>
  <path d="M58 132H454" stroke="#E8EFF8"/>
  <path d="M72 224C108 210 130 198 162 206C194 214 220 144 260 150C302 156 326 180 360 174C394 168 420 116 446 104" stroke="#2563EB" stroke-width="4" stroke-linecap="round"/>
  <path d="M72 236C110 232 132 220 168 224C204 228 228 196 258 194C298 192 336 214 366 208C396 202 420 188 446 170" stroke="#93C5FD" stroke-width="4" stroke-linecap="round"/>
  <circle cx="162" cy="206" r="6" fill="#2563EB"/>
  <circle cx="260" cy="150" r="6" fill="#2563EB"/>
  <circle cx="446" cy="104" r="7" fill="#2563EB"/>
  <text x="64" y="276" fill="#94A3B8" font-size="12" font-family="Arial, sans-serif">Jan</text>
  <text x="170" y="276" fill="#94A3B8" font-size="12" font-family="Arial, sans-serif">Feb</text>
  <text x="276" y="276" fill="#94A3B8" font-size="12" font-family="Arial, sans-serif">Mar</text>
  <text x="382" y="276" fill="#94A3B8" font-size="12" font-family="Arial, sans-serif">Apr</text>
  <rect x="500" y="78" width="160" height="220" rx="14" fill="#0F172A"/>
  <text x="524" y="112" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="700">Mix shift</text>
  <text x="524" y="138" fill="#CBD5E1" font-size="12" font-family="Arial, sans-serif">Enterprise</text>
  <rect x="524" y="148" width="108" height="10" rx="5" fill="#2563EB"/>
  <text x="640" y="157" fill="#CBD5E1" font-size="11" font-family="Arial, sans-serif">52%</text>
  <text x="524" y="182" fill="#CBD5E1" font-size="12" font-family="Arial, sans-serif">Mid-market</text>
  <rect x="524" y="192" width="78" height="10" rx="5" fill="#38BDF8"/>
  <text x="610" y="201" fill="#CBD5E1" font-size="11" font-family="Arial, sans-serif">31%</text>
  <text x="524" y="226" fill="#CBD5E1" font-size="12" font-family="Arial, sans-serif">Self-serve</text>
  <rect x="524" y="236" width="46" height="10" rx="5" fill="#A5B4FC"/>
  <text x="578" y="245" fill="#CBD5E1" font-size="11" font-family="Arial, sans-serif">17%</text>
  <rect x="524" y="262" width="98" height="12" rx="6" fill="#1E293B"/>
  <text x="524" y="292" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Forecast beat driven by renewals and expansion.</text>
</svg>
`);

export function createDashboardScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 1160);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1320);
  const gap = 12;
  const kW = (w - gap * 3) / 4;
  const sideW = Math.min(340, w * 0.31);
  const mainW = w - sideW - 20;
  const sideX = mx + mainW + 20;

  return {
    id: "dashboard", name: "Dashboard", width: vw, height: H, backgroundColor: "#F4F7FB",
    elements: [
      { id: "d-logo", type: "badge", rect: { x: mx, y: 18, width: 48, height: 48 }, throwable: true, pinned: false, text: "NO", fontSize: 15, fontWeight: 800, fontFamily: MONO, color: "#fff", backgroundColor: "#2563EB", borderRadius: 14, padding: 8, mass: 0.3 },
      { id: "d-title", type: "heading", rect: { x: mx + 60, y: 20, width: 260, height: 30 }, throwable: false, pinned: true, text: "Northstar Ops", fontSize: 24, fontWeight: 700, fontFamily: SANS, lineHeight: 30, color: "#0F172A" },
      { id: "d-title-sub", type: "heading", rect: { x: mx + 60, y: 48, width: 200, height: 16 }, throwable: false, pinned: true, text: "Revenue operations board", fontSize: 11, fontWeight: 600, fontFamily: MONO, lineHeight: 16, color: "#8AA0BE" },
      { id: "d-workspace", type: "badge", rect: { x: mx + 210, y: 24, width: 126, height: 24 }, throwable: true, pinned: false, text: "Revenue team", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#1D4ED8", backgroundColor: "rgba(37,99,235,0.08)", borderRadius: 12, padding: 5, mass: 0.08 },
      { id: "d-nav1", type: "button", rect: { x: mx + 372, y: 26, width: 84, height: 28 }, throwable: true, pinned: false, text: "Overview", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#2563EB", backgroundColor: "rgba(37,99,235,0.08)", borderRadius: 7, mass: 0.15 },
      { id: "d-nav2", type: "button", rect: { x: mx + 464, y: 26, width: 84, height: 28 }, throwable: true, pinned: false, text: "Pipeline", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#64748B", backgroundColor: "transparent", borderRadius: 7, mass: 0.15 },
      { id: "d-nav3", type: "button", rect: { x: mx + 556, y: 26, width: 72, height: 28 }, throwable: true, pinned: false, text: "Ops", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#64748B", backgroundColor: "transparent", borderRadius: 7, mass: 0.15 },
      { id: "d-search", type: "input", rect: { x: mx + w - 276, y: 22, width: 220, height: 34 }, throwable: true, pinned: false, text: "Search accounts, campaigns, owners...", fontSize: 13, fontFamily: SANS, color: "#94A3B8", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #DCE5F1", padding: 10, mass: 0.3 },
      { id: "d-avatar", type: "badge", rect: { x: mx + w - 42, y: 18, width: 40, height: 40 }, throwable: true, pinned: false, text: "JS", fontSize: 12, fontWeight: 700, fontFamily: SANS, color: "#fff", backgroundColor: "#6366F1", borderRadius: 20, padding: 8, mass: 0.2 },
      { id: "d-div", type: "divider", rect: { x: mx, y: 68, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#DCE5F1" },

      { id: "d-page-title", type: "heading", rect: { x: mx, y: 96, width: 440, height: 36 }, throwable: false, pinned: true, text: "Revenue command center", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 36, color: "#0F172A" },
      { id: "d-subtitle", type: "paragraph", rect: { x: mx, y: 142, width: 610, height: 76 }, throwable: false, pinned: true, text: "This preset should read like a working board, not a stack of placeholder modules. The story is spread across typography, dense annotations, and a few concise panels: what changed, what is healthy, what needs a decision, and what the team is about to ship.", fontSize: 15, fontWeight: 400, fontFamily: SANS, lineHeight: 24, color: "#64748B" },
      { id: "d-kicker", type: "heading", rect: { x: mx, y: 224, width: 180, height: 18 }, throwable: false, pinned: true, text: "Quarter summary", fontSize: 11, fontWeight: 700, fontFamily: MONO, lineHeight: 18, color: "#8AA0BE" },
      { id: "d-period", type: "badge", rect: { x: mx + w - 330, y: 102, width: 118, height: 30 }, throwable: true, pinned: false, text: "This quarter", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#475569", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #DCE5F1", padding: 6, mass: 0.15 },
      { id: "d-live", type: "badge", rect: { x: mx + w - 202, y: 106, width: 64, height: 22 }, throwable: true, pinned: false, text: "LIVE", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#16A34A", borderRadius: 11, padding: 4, mass: 0.08 },
      { id: "d-export", type: "button", rect: { x: mx + w - 126, y: 100, width: 126, height: 34 }, throwable: true, pinned: false, text: "Export board", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#2563EB", borderRadius: 9, mass: 0.4 },

      { id: "kpi-1", type: "card", rect: { x: mx, y: 250, width: kW, height: 114 }, throwable: true, pinned: false, text: "Net revenue", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#64748B", backgroundColor: "#fff", borderRadius: 16, padding: 18, border: "1px solid #DCE5F1", boxShadow: "0 8px 24px rgba(15,23,42,0.04)", mass: 1.18,
        children: [
          { id: "kpi-1-v", type: "paragraph", rect: { x: 0, y: 18, width: 0, height: 0 }, throwable: false, pinned: true, text: "$3.84M", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#0F172A" },
          { id: "kpi-1-n", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "+18.4% vs forecast", fontSize: 12, fontWeight: 600, fontFamily: SANS, lineHeight: 18, color: "#16A34A" },
        ] },
      { id: "kpi-2", type: "card", rect: { x: mx + kW + gap, y: 250, width: kW, height: 114 }, throwable: true, pinned: false, text: "Expansion pipeline", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#64748B", backgroundColor: "#fff", borderRadius: 16, padding: 18, border: "1px solid #DCE5F1", boxShadow: "0 8px 24px rgba(15,23,42,0.04)", mass: 1.18,
        children: [
          { id: "kpi-2-v", type: "paragraph", rect: { x: 0, y: 18, width: 0, height: 0 }, throwable: false, pinned: true, text: "$912K", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#0F172A" },
          { id: "kpi-2-n", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "22 accounts in play", fontSize: 12, fontWeight: 500, fontFamily: SANS, lineHeight: 18, color: "#475569" },
        ] },
      { id: "kpi-3", type: "card", rect: { x: mx + (kW + gap) * 2, y: 250, width: kW, height: 114 }, throwable: true, pinned: false, text: "Net retention", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#64748B", backgroundColor: "#fff", borderRadius: 16, padding: 18, border: "1px solid #DCE5F1", boxShadow: "0 8px 24px rgba(15,23,42,0.04)", mass: 1.18,
        children: [
          { id: "kpi-3-v", type: "paragraph", rect: { x: 0, y: 18, width: 0, height: 0 }, throwable: false, pinned: true, text: "117.2%", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#0F172A" },
          { id: "kpi-3-n", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "Best in 5 quarters", fontSize: 12, fontWeight: 600, fontFamily: SANS, lineHeight: 18, color: "#16A34A" },
        ] },
      { id: "kpi-4", type: "card", rect: { x: mx + (kW + gap) * 3, y: 250, width: kW, height: 114 }, throwable: true, pinned: false, text: "Critical blockers", fontSize: 12, fontWeight: 600, fontFamily: SANS, color: "#64748B", backgroundColor: "#fff", borderRadius: 16, padding: 18, border: "1px solid #DCE5F1", boxShadow: "0 8px 24px rgba(15,23,42,0.04)", mass: 1.18,
        children: [
          { id: "kpi-4-v", type: "paragraph", rect: { x: 0, y: 18, width: 0, height: 0 }, throwable: false, pinned: true, text: "3", fontSize: 32, fontWeight: 700, fontFamily: SANS, lineHeight: 34, color: "#0F172A" },
          { id: "kpi-4-n", type: "paragraph", rect: { x: 0, y: 10, width: 0, height: 0 }, throwable: false, pinned: true, text: "1 legal, 2 rollout", fontSize: 12, fontWeight: 600, fontFamily: SANS, lineHeight: 18, color: "#DC2626" },
        ] },

      { id: "d-chart", type: "image", rect: { x: mx, y: 388, width: mainW, height: 328 }, throwable: true, pinned: false, backgroundColor: "#fff", borderRadius: 20, imageAlt: "Quarter revenue chart", imageSrc: DASHBOARD_CHART, boxShadow: "0 16px 40px rgba(15,23,42,0.07)", mass: 3.1 },

      { id: "d-side-1-bg", type: "container", rect: { x: sideX, y: 388, width: sideW, height: 142 }, throwable: false, pinned: true, backgroundColor: "#FFFFFF", borderRadius: 18, border: "1px solid #DCE5F1", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" },
      { id: "d-side-2-bg", type: "container", rect: { x: sideX, y: 546, width: sideW, height: 170 }, throwable: false, pinned: true, backgroundColor: "#FFFFFF", borderRadius: 18, border: "1px solid #DCE5F1", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" },
      { id: "d-side-3-bg", type: "container", rect: { x: sideX, y: 732, width: sideW, height: 144 }, throwable: false, pinned: true, backgroundColor: "#FFFFFF", borderRadius: 18, border: "1px solid #DCE5F1", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" },

      { id: "d-side-1-h", type: "heading", rect: { x: sideX + 20, y: 408, width: sideW - 40, height: 22 }, throwable: false, pinned: true, text: "Quarter at a glance", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0F172A" },
      { id: "d-side-1-p", type: "paragraph", rect: { x: sideX + 20, y: 442, width: sideW - 40, height: 72 }, throwable: false, pinned: true, text: "Renewals are covering slower new business in EMEA. The pricing test is still the clearest expansion lever, and implementation capacity remains the one constraint that could turn a strong quarter into a merely good one.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#64748B" },

      { id: "d-side-2-h", type: "heading", rect: { x: sideX + 20, y: 566, width: sideW - 40, height: 22 }, throwable: false, pinned: true, text: "Recent activity", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0F172A" },
      { id: "d-side-2-a", type: "paragraph", rect: { x: sideX + 20, y: 600, width: sideW - 40, height: 18 }, throwable: false, pinned: true, text: "08:12  Beacon Bank expanded to 1,240 seats", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#1D4ED8" },
      { id: "d-side-2-b", type: "paragraph", rect: { x: sideX + 20, y: 624, width: sideW - 40, height: 18 }, throwable: false, pinned: true, text: "09:40  Alpine implementation flagged yellow", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#DC2626" },
      { id: "d-side-2-c", type: "paragraph", rect: { x: sideX + 20, y: 648, width: sideW - 40, height: 18 }, throwable: false, pinned: true, text: "10:05  LATAM pricing experiment expanded", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#0F766E" },
      { id: "d-side-2-d", type: "paragraph", rect: { x: sideX + 20, y: 672, width: sideW - 40, height: 18 }, throwable: false, pinned: true, text: "10:44  Pineworks renewal packet sent", fontSize: 12, fontWeight: 600, fontFamily: MONO, lineHeight: 18, color: "#475569" },

      { id: "d-side-3-h", type: "heading", rect: { x: sideX + 20, y: 752, width: sideW - 40, height: 22 }, throwable: false, pinned: true, text: "Risks to watch", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0F172A" },
      { id: "d-side-3-p", type: "paragraph", rect: { x: sideX + 20, y: 786, width: sideW - 40, height: 64 }, throwable: false, pinned: true, text: "Norland legal review could slip $140K into next month. Support load for new enterprise rollouts is also above target for week 14.", fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#64748B" },

      { id: "d-strip-bg", type: "container", rect: { x: mx, y: 748, width: mainW, height: 128 }, throwable: false, pinned: true, backgroundColor: "#FFFFFF", borderRadius: 18, border: "1px solid #DCE5F1", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" },
      { id: "d-strip-l-h", type: "heading", rect: { x: mx + 24, y: 774, width: 180, height: 20 }, throwable: false, pinned: true, text: "Decision note", fontSize: 12, fontWeight: 700, fontFamily: MONO, lineHeight: 20, color: "#8AA0BE" },
      { id: "d-strip-l-p", type: "paragraph", rect: { x: mx + 24, y: 804, width: 250, height: 50 }, throwable: false, pinned: true, text: "Push more spend into partner-assisted expansion. That is where the board is showing the healthiest leverage right now.", fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#334155" },
      { id: "d-strip-m-h", type: "heading", rect: { x: mx + 312, y: 774, width: 180, height: 20 }, throwable: false, pinned: true, text: "Channel read", fontSize: 12, fontWeight: 700, fontFamily: MONO, lineHeight: 20, color: "#8AA0BE" },
      { id: "d-strip-m-p", type: "paragraph", rect: { x: mx + 312, y: 804, width: 250, height: 50 }, throwable: false, pinned: true, text: "Partner and lifecycle programs are compact but efficient. Paid search is still the biggest line, just not the cleanest one.", fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#334155" },
      { id: "d-strip-r-h", type: "heading", rect: { x: mx + 600, y: 774, width: 180, height: 20 }, throwable: false, pinned: true, text: "Momentum", fontSize: 12, fontWeight: 700, fontFamily: MONO, lineHeight: 20, color: "#8AA0BE" },
      { id: "d-strip-r-p", type: "paragraph", rect: { x: mx + 600, y: 804, width: 220, height: 50 }, throwable: false, pinned: true, text: "Retention and expansion are carrying the quarter. The board should look calm, but not passive.", fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#334155" },

      { id: "d-launch-bg", type: "container", rect: { x: mx, y: 906, width: w, height: 270 }, throwable: false, pinned: true, backgroundColor: "#FFFFFF", borderRadius: 18, border: "1px solid #DCE5F1", boxShadow: "0 16px 40px rgba(15,23,42,0.05)" },
      { id: "d-launch-h", type: "heading", rect: { x: mx + 24, y: 932, width: w - 48, height: 24 }, throwable: false, pinned: true, text: "Weekly launches and commitments", fontSize: 22, fontWeight: 700, fontFamily: SANS, lineHeight: 24, color: "#0F172A" },
      { id: "d-launch-sub", type: "paragraph", rect: { x: mx + 24, y: 966, width: w - 48, height: 24 }, throwable: false, pinned: true, text: "Shorter lines and more whitespace make the lower half feel like a real board instead of a single stuffed card.", fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#64748B" },
      { id: "d-launch-a", type: "paragraph", rect: { x: mx + 24, y: 1010, width: w - 48, height: 20 }, throwable: false, pinned: true, text: "Mon  Beacon Bank expansion live  |  Janet  |  $188K ARR  |  complete", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#1D4ED8" },
      { id: "d-launch-b", type: "paragraph", rect: { x: mx + 24, y: 1040, width: w - 48, height: 20 }, throwable: false, pinned: true, text: "Tue  LATAM pricing experiment      |  Diego  |  +4pt win rate  |  monitoring", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#0F766E" },
      { id: "d-launch-c", type: "paragraph", rect: { x: mx + 24, y: 1070, width: w - 48, height: 20 }, throwable: false, pinned: true, text: "Wed  Pineworks renewal packet      |  Nora   |  $92K ARR  |  review", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#475569" },
      { id: "d-launch-d", type: "paragraph", rect: { x: mx + 24, y: 1100, width: w - 48, height: 20 }, throwable: false, pinned: true, text: "Thu  Alpine implementation kickoff |  Sam    |  staffing gap  |  yellow", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#D97706" },
      { id: "d-launch-e", type: "paragraph", rect: { x: mx + 24, y: 1130, width: w - 48, height: 20 }, throwable: false, pinned: true, text: "Fri  Norland procurement review    |  Miri   |  legal redlines |  blocked", fontSize: 13, fontWeight: 600, fontFamily: MONO, lineHeight: 20, color: "#DC2626" },

      { id: "d-footer", type: "heading", rect: { x: mx, y: 1200, width: w, height: 16 }, throwable: false, pinned: true, text: "Synced 2 min ago  |  Forecast confidence: 0.82  |  Scenario model: Spring board v4", fontSize: 10, fontWeight: 600, fontFamily: MONO, lineHeight: 16, color: "#94A3B8" },
    ],
  };
}
