import { memo } from "react"

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
