import type React from "react"

// ─── Constants ───

export const PICKER_HALO = 18
export const PICKER_OUTLINE_INSET = PICKER_HALO - 2

export const PILL_FONT: React.CSSProperties = {
	fontFamily: '"DM Sans", sans-serif',
	fontWeight: 700,
	letterSpacing: "0.02em",
}

export const pillBase: React.CSSProperties = {
	height: 20,
	borderRadius: 999,
	border: "1px solid rgba(255,255,255,0.14)",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	gap: 4,
	fontSize: 10,
	color: "#fff",
	...PILL_FONT,
	boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
	whiteSpace: "nowrap" as const,
	minWidth: 20,
}

// ─── Shared styles ───

export const overlayBackdropStyle: React.CSSProperties = {
	position: "absolute",
	inset: 0,
	backgroundColor: "rgba(17,24,39,0.08)",
	zIndex: 200,
	pointerEvents: "none",
}

export const pickerKeyframes = `
  @keyframes savedFlash { 0% { transform: scale(1.2); } 100% { transform: scale(1); } }
  @keyframes stashFly {
    0% { transform: translate(0, 0) scale(1); opacity: 0.96; }
    72% { opacity: 0.84; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0.16); opacity: 0; }
  }
`

export function candidateOutlineStyle(
	active: boolean,
	isHovered: boolean,
	borderRadius: number,
): React.CSSProperties {
	return {
		position: "absolute",
		left: PICKER_OUTLINE_INSET,
		top: PICKER_OUTLINE_INSET,
		borderRadius: borderRadius + 2,
		border: active
			? "2px solid rgba(59,130,246,0.7)"
			: isHovered
				? "2px dashed rgba(59,130,246,0.4)"
				: "2px dashed rgba(150,150,150,0.2)",
		backgroundColor: active
			? "rgba(59,130,246,0.06)"
			: isHovered
				? "rgba(59,130,246,0.03)"
				: "transparent",
		transition: "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
		boxShadow: isHovered && !active ? "0 10px 26px rgba(59,130,246,0.10)" : undefined,
		boxSizing: "border-box",
		pointerEvents: "none",
	}
}
