import { memo, useCallback, useEffect, useRef, useState } from "react"

// ─── Constants ───

export const PICKER_HALO = 18
export const PICKER_OUTLINE_INSET = PICKER_HALO - 2

export const PILL_FONT: React.CSSProperties = {
	fontFamily: '"DM Sans", sans-serif',
	fontWeight: 700,
	letterSpacing: "0.02em",
}

const pillBase: React.CSSProperties = {
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

// ─── Icons ───

export function CheckIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M2.5 6.3L4.9 8.7L9.5 3.9" />
		</svg>
	)
}

export function PickerIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 14 14"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.4"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" />
			<rect x="8" y="1.5" width="4.5" height="4.5" rx="1" />
			<rect x="1.5" y="8" width="4.5" height="4.5" rx="1" />
			<circle cx="10.25" cy="10.25" r="2" />
		</svg>
	)
}

export function EyedropperIcon() {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M10.5 2.5L13.5 5.5" />
			<path d="M6.5 12.5L12.5 6.5C13.1 5.9 13.1 4.9 12.5 4.3L11.7 3.5C11.1 2.9 10.1 2.9 9.5 3.5L3.5 9.5" />
			<path d="M2.5 13.5L6 10" />
			<path d="M2.5 13.5H5.5" />
		</svg>
	)
}

function DeleteIcon() {
	return (
		<svg
			width="8"
			height="8"
			viewBox="0 0 10 10"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		>
			<line x1="2" y1="2" x2="8" y2="8" />
			<line x1="8" y1="2" x2="2" y2="8" />
		</svg>
	)
}

// ─── Hook ───

export function useEscClose(onClose: () => void) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose()
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [onClose])
}

// ─── Banner ───

export const PickerBanner = memo(function PickerBanner({
	icon,
	iconBg,
	iconColor,
	title,
	subtitle,
	onClose,
}: {
	icon: React.ReactNode
	iconBg: string
	iconColor: string
	title: string
	subtitle: string
	onClose: () => void
}) {
	return (
		<div
			style={{
				position: "fixed",
				bottom: 16,
				left: 16,
				zIndex: 220,
				display: "flex",
				alignItems: "center",
				gap: 10,
				padding: "8px 12px",
				borderRadius: 999,
				background: "rgba(18, 18, 24, 0.92)",
				border: "1px solid rgba(255,255,255,0.1)",
				color: "#dce8ff",
				backdropFilter: "blur(14px)",
				boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
				fontFamily: '"DM Sans", sans-serif',
			}}
		>
			<div
				style={{
					width: 22,
					height: 22,
					borderRadius: 11,
					background: iconBg,
					color: iconColor,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				{icon}
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
				<div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>{title}</div>
				<div style={{ fontSize: 11, color: "rgba(220,232,255,0.72)" }}>{subtitle}</div>
			</div>
			<button
				onClick={onClose}
				style={{
					border: "1px solid rgba(255,255,255,0.12)",
					background: "rgba(255,255,255,0.06)",
					color: "#fff",
					fontSize: 11,
					fontWeight: 600,
					fontFamily: '"DM Sans", sans-serif',
					padding: "5px 10px",
					borderRadius: 999,
					cursor: "pointer",
				}}
			>
				Done
			</button>
		</div>
	)
})

// ─── Badges ───

export function PhysicsBadge({
	active,
	wide,
	isHovered,
	onClick,
	style,
}: {
	active: boolean
	wide: boolean
	isHovered?: boolean
	onClick: (e: React.MouseEvent) => void
	style?: React.CSSProperties
}) {
	return (
		<div
			data-pill="physics"
			onClick={onClick}
			style={{
				...pillBase,
				padding: wide ? "0 9px" : "0 5px",
				backgroundColor: active ? "rgba(20,20,24,0.9)" : "rgba(120,120,128,0.85)",
				cursor: "pointer",
				transition: "background-color 120ms ease, transform 120ms ease",
				transform: isHovered ? "translateY(-1px)" : "translateY(0)",
				...style,
			}}
		>
			{active ? <CheckIcon /> : ""}
			{wide && (active ? " Physics" : "")}
		</div>
	)
}

export function SaveBadge({
	saved,
	wide,
	isHovered,
	isFlash,
	onClick,
	style,
}: {
	saved: boolean
	wide: boolean
	isHovered?: boolean
	isFlash?: boolean
	onClick?: (e: React.MouseEvent) => void
	style?: React.CSSProperties
}) {
	return (
		<div
			data-pill="save"
			onClick={onClick}
			style={{
				...pillBase,
				padding: saved ? (wide ? "0 9px" : "0 5px") : "0 9px",
				backgroundColor: saved ? "rgba(124, 58, 237, 0.96)" : "#3b82f6",
				cursor: onClick ? "pointer" : "default",
				pointerEvents: onClick ? "auto" : "none",
				transition: "transform 120ms ease, opacity 120ms ease",
				transform: isHovered ? "translateY(-1px)" : "translateY(0)",
				animation: isFlash ? "savedFlash 0.3s ease" : undefined,
				...style,
			}}
		>
			{saved ? <CheckIcon /> : null}
			{saved ? (wide ? " Saved" : "") : "Save"}
		</div>
	)
}

export function DeleteBadge({
	onClick,
	style,
}: {
	onClick: (e: React.MouseEvent) => void
	style?: React.CSSProperties
}) {
	return (
		<div
			onClick={onClick}
			title="Remove element"
			style={{
				...pillBase,
				width: 20,
				padding: 0,
				backgroundColor: "rgba(220, 38, 38, 0.95)",
				cursor: "pointer",
				...style,
			}}
		>
			<DeleteIcon />
		</div>
	)
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

// ─── Fly animation ───

interface FlyBadge {
	id: string
	left: number
	top: number
	width: number
	height: number
	dx: number
	dy: number
	label: string
}

const FLY_MS = 520

export function useFlyAnimation() {
	const [flyBadges, setFlyBadges] = useState<FlyBadge[]>([])
	const timeoutsRef = useRef<number[]>([])

	useEffect(() => {
		return () => {
			timeoutsRef.current.forEach((id) => window.clearTimeout(id))
			timeoutsRef.current = []
		}
	}, [])

	const triggerFly = useCallback((sourceEl: HTMLElement, label: string) => {
		const from = sourceEl.getBoundingClientRect()
		const stashTrigger = document.querySelector(
			"[data-domino-stash-trigger='true']",
		) as HTMLElement | null
		const to = stashTrigger?.getBoundingClientRect()
		if (!to) return

		const flyId = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
		const badge: FlyBadge = {
			id: flyId,
			left: from.left,
			top: from.top,
			width: Math.min(Math.max(from.width, 56), 160),
			height: Math.min(Math.max(from.height, 24), 56),
			dx: to.left + to.width / 2 - (from.left + from.width / 2),
			dy: to.top + to.height / 2 - (from.top + from.height / 2),
			label,
		}
		setFlyBadges((prev) => [...prev, badge])
		const tid = window.setTimeout(() => {
			setFlyBadges((prev) => prev.filter((b) => b.id !== flyId))
			timeoutsRef.current = timeoutsRef.current.filter((id) => id !== tid)
		}, FLY_MS + 80)
		timeoutsRef.current.push(tid)
	}, [])

	return { flyBadges, triggerFly }
}

export function FlyBadges({ badges }: { badges: FlyBadge[] }) {
	if (badges.length === 0) return null
	return (
		<>
			{badges.map((badge) => (
				<div
					key={badge.id}
					style={{
						position: "fixed",
						left: badge.left,
						top: badge.top,
						width: badge.width,
						height: badge.height,
						zIndex: 230,
						pointerEvents: "none",
						borderRadius: Math.min(badge.height / 2, 16),
						border: "1px solid rgba(255,255,255,0.16)",
						background: "linear-gradient(135deg, rgba(59,130,246,0.96), rgba(99,160,255,0.9))",
						boxShadow: "0 16px 36px rgba(30,64,175,0.28)",
						color: "#fff",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "0 12px",
						boxSizing: "border-box",
						...PILL_FONT,
						fontSize: 11,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						animation: `stashFly ${FLY_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
						["--dx" as string]: `${badge.dx}px`,
						["--dy" as string]: `${badge.dy}px`,
					}}
				>
					{badge.label}
				</div>
			))}
		</>
	)
}

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
