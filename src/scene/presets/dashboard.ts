import type { SceneDescription } from "../types";
import { SANS, MONO } from "./fonts";

export function createDashboardScene(vw: number, vh: number): SceneDescription {
  const w = Math.min(vw - 40, 1100);
  const mx = Math.max(20, (vw - w) / 2);
  const H = Math.max(vh, 1000);
  const cW = (w - 24) / 3;
  const sideW = w * 0.34;
  const mainW = w - sideW - 20;

  return {
    id: "dashboard", name: "Dashboard", width: vw, height: H, backgroundColor: "#f8fafc",
    elements: [
      // Top bar
      { id: "d-logo", type: "badge", rect: { x: mx, y: 18, width: 36, height: 36 }, throwable: true, pinned: false, text: "A", fontSize: 16, fontWeight: 800, fontFamily: SANS, color: "#fff", backgroundColor: "#3b82f6", borderRadius: 10, padding: 8, mass: 0.3 },
      { id: "d-title", type: "heading", rect: { x: mx + 46, y: 22, width: 120, height: 28 }, throwable: false, pinned: true, text: "Analytics", fontSize: 18, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#0f172a" },
      { id: "d-nav1", type: "button", rect: { x: mx + 200, y: 24, width: 80, height: 28 }, throwable: true, pinned: false, text: "Overview", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)", borderRadius: 6, mass: 0.15 },
      { id: "d-nav2", type: "button", rect: { x: mx + 288, y: 24, width: 80, height: 28 }, throwable: true, pinned: false, text: "Reports", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "transparent", borderRadius: 6, mass: 0.15 },
      { id: "d-nav3", type: "button", rect: { x: mx + 376, y: 24, width: 80, height: 28 }, throwable: true, pinned: false, text: "Settings", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "transparent", borderRadius: 6, mass: 0.15 },
      { id: "d-avatar", type: "badge", rect: { x: mx + w - 36, y: 18, width: 36, height: 36 }, throwable: true, pinned: false, text: "JS", fontSize: 12, fontWeight: 700, fontFamily: SANS, color: "#fff", backgroundColor: "#6366f1", borderRadius: 18, padding: 8, mass: 0.2 },
      { id: "d-search", type: "input", rect: { x: mx + w - 240, y: 22, width: 190, height: 32 }, throwable: true, pinned: false, text: "Search...", fontSize: 13, fontFamily: SANS, color: "#94a3b8", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 8, mass: 0.3 },
      { id: "d-div", type: "divider", rect: { x: mx, y: 62, width: w, height: 1 }, throwable: false, pinned: true, backgroundColor: "#e2e8f0" },

      // Page title
      { id: "d-page-title", type: "heading", rect: { x: mx, y: 78, width: 200, height: 28 }, throwable: false, pinned: true, text: "Dashboard", fontSize: 22, fontWeight: 700, fontFamily: SANS, lineHeight: 28, color: "#0f172a" },
      { id: "d-period", type: "badge", rect: { x: mx + w - 130, y: 80, width: 130, height: 28 }, throwable: true, pinned: false, text: "Last 30 days ▾", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#475569", backgroundColor: "#fff", borderRadius: 6, border: "1px solid #e2e8f0", padding: 6, mass: 0.15 },

      // KPI row
      { id: "kpi-1", type: "card", rect: { x: mx, y: 120, width: cW, height: 100 }, throwable: true, pinned: false, text: "Revenue", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0", mass: 1.2,
        children: [{ id: "kpi-1-v", type: "paragraph", rect: { x: 0, y: 28, width: cW - 32, height: 30 }, throwable: false, pinned: true, text: "$142,580", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#0f172a" }] },
      { id: "kpi-2", type: "card", rect: { x: mx + cW + 12, y: 120, width: cW, height: 100 }, throwable: true, pinned: false, text: "Active Users", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0", mass: 1.2,
        children: [{ id: "kpi-2-v", type: "paragraph", rect: { x: 0, y: 28, width: cW - 32, height: 30 }, throwable: false, pinned: true, text: "23,847", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#0f172a" }] },
      { id: "kpi-3", type: "card", rect: { x: mx + (cW + 12) * 2, y: 120, width: cW, height: 100 }, throwable: true, pinned: false, text: "Conversion", fontSize: 12, fontWeight: 500, fontFamily: SANS, color: "#64748b", backgroundColor: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0", mass: 1.2,
        children: [{ id: "kpi-3-v", type: "paragraph", rect: { x: 0, y: 28, width: cW - 32, height: 30 }, throwable: false, pinned: true, text: "4.28%", fontSize: 28, fontWeight: 700, fontFamily: SANS, lineHeight: 32, color: "#16a34a" }] },

      // Trend badges next to KPIs
      { id: "d-trend-1", type: "badge", rect: { x: mx + cW - 62, y: 170, width: 52, height: 20 }, throwable: true, pinned: false, text: "↑ 12%", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#16a34a", backgroundColor: "rgba(22,163,106,0.08)", borderRadius: 10, padding: 4, mass: 0.06 },
      { id: "d-trend-2", type: "badge", rect: { x: mx + cW + 12 + cW - 54, y: 170, width: 48, height: 20 }, throwable: true, pinned: false, text: "↑ 8%", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#16a34a", backgroundColor: "rgba(22,163,106,0.08)", borderRadius: 10, padding: 4, mass: 0.06 },
      { id: "d-trend-3", type: "badge", rect: { x: mx + (cW + 12) * 2 + cW - 60, y: 170, width: 56, height: 20 }, throwable: true, pinned: false, text: "↑ 0.3%", fontSize: 10, fontWeight: 700, fontFamily: MONO, color: "#16a34a", backgroundColor: "rgba(22,163,106,0.08)", borderRadius: 10, padding: 4, mass: 0.06 },

      // Chart placeholder
      { id: "d-chart", type: "image", rect: { x: mx, y: 236, width: mainW, height: 280 }, throwable: true, pinned: false, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", mass: 3 },

      // Sidebar
      { id: "d-side-h", type: "heading", rect: { x: mx + mainW + 20, y: 236, width: sideW, height: 22 }, throwable: false, pinned: true, text: "Recent Activity", fontSize: 14, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0f172a" },
      { id: "d-side-p", type: "paragraph", rect: { x: mx + mainW + 20, y: 268, width: sideW, height: 200 }, throwable: false, pinned: true,
        text: "User signups increased by 12% this week compared to the previous period. The marketing campaign launched on Monday contributed to a significant spike in traffic from social media channels. Mobile users now account for 67% of all sessions, up from 58% last quarter. Server response times improved 23% after the infrastructure migration.",
        fontSize: 13, fontWeight: 400, fontFamily: SANS, lineHeight: 20, color: "#475569" },

      // Status badges
      { id: "d-live", type: "badge", rect: { x: mx + mainW + 20, y: 480, width: 52, height: 22 }, throwable: true, pinned: false, text: "LIVE", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#16a34a", borderRadius: 11, padding: 4, mass: 0.08 },
      { id: "d-alert", type: "badge", rect: { x: mx + mainW + 80, y: 480, width: 72, height: 22 }, throwable: true, pinned: false, text: "2 ALERTS", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#ef4444", borderRadius: 11, padding: 4, mass: 0.08 },
      { id: "d-pending", type: "badge", rect: { x: mx + mainW + 160, y: 480, width: 72, height: 22 }, throwable: true, pinned: false, text: "PENDING", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: "#fff", backgroundColor: "#f59e0b", borderRadius: 11, padding: 4, mass: 0.08 },

      // Action buttons
      { id: "d-export", type: "button", rect: { x: mx, y: 532, width: 110, height: 34 }, throwable: true, pinned: false, text: "Export CSV", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#fff", backgroundColor: "#3b82f6", borderRadius: 8, mass: 0.4 },
      { id: "d-filter", type: "button", rect: { x: mx + 118, y: 532, width: 90, height: 34 }, throwable: true, pinned: false, text: "Filters", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#475569", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", mass: 0.3 },
      { id: "d-refresh", type: "button", rect: { x: mx + 216, y: 532, width: 90, height: 34 }, throwable: true, pinned: false, text: "Refresh", fontSize: 13, fontWeight: 500, fontFamily: SANS, color: "#475569", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", mass: 0.3 },

      // Summary section
      { id: "d-table-h", type: "heading", rect: { x: mx, y: 586, width: w, height: 22 }, throwable: false, pinned: true, text: "Summary", fontSize: 16, fontWeight: 700, fontFamily: SANS, lineHeight: 22, color: "#0f172a" },
      { id: "d-table-p", type: "paragraph", rect: { x: mx, y: 620, width: w, height: 200 }, throwable: false, pinned: true,
        text: "The platform continues to show strong growth across all key metrics. Customer satisfaction scores remain at an all-time high of 4.8 out of 5 stars. The engineering team is on track to deliver the next major release by the end of the quarter, which will include enhanced reporting capabilities, a redesigned onboarding flow, and improved real-time collaboration features for enterprise teams.",
        fontSize: 14, fontWeight: 400, fontFamily: SANS, lineHeight: 22, color: "#64748b" },

      // Notification card
      { id: "d-notif", type: "card", rect: { x: mx + mainW + 20, y: 532, width: sideW, height: 80 }, throwable: true, pinned: false, text: "🔔  New milestone", fontSize: 13, fontWeight: 600, fontFamily: SANS, color: "#0f172a", backgroundColor: "#fff", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", mass: 0.6,
        children: [{ id: "d-notif-d", type: "paragraph", rect: { x: 0, y: 24, width: sideW - 28, height: 30 }, throwable: false, pinned: true, text: "You've crossed 20K monthly active users!", fontSize: 12, fontWeight: 400, fontFamily: SANS, lineHeight: 16, color: "#64748b" }] },
    ],
  };
}
