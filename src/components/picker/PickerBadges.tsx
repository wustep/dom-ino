import { CheckIcon, DeleteIcon } from "./PickerIcons"
import { PILL_FONT, pillBase } from "./pickerStyles"
import type { FlyBadge } from "./useFlyAnimation"

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

const FLY_MS = 520
