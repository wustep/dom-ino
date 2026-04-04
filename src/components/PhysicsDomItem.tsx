import { memo } from "react"
import type { AlphaRowInterval, AlphaTightBounds, SceneElement, TextStyle } from "../scene/types"
import { getBackgroundStyle } from "../utils/styles"

interface PhysicsDomItemProps {
	element: SceneElement
	x: number
	y: number
	angle: number
	isPhysicsEnabled: boolean
	showDebug: boolean
	/** Live alpha bounds for transparent/animated images */
	alphaBounds?: AlphaTightBounds | null
	/** Per-row alpha intervals for debug visualization */
	alphaRows?: AlphaRowInterval[] | null
}

/** Build a CSS text style from a TextStyle-bearing element (or child). */
function textStyleOf(
	el: TextStyle,
	defaults?: { fontSize?: number; fontWeight?: number; color?: string; lineHeight?: string },
): React.CSSProperties {
	return {
		fontSize: el.fontSize ?? defaults?.fontSize ?? 16,
		fontWeight: el.fontWeight ?? defaults?.fontWeight ?? 400,
		fontStyle: el.fontStyle ?? "normal",
		fontFamily: el.fontFamily,
		color: el.color ?? defaults?.color ?? "#333",
		lineHeight: el.lineHeight ? `${el.lineHeight}px` : (defaults?.lineHeight ?? "1.5"),
		letterSpacing: el.letterSpacing,
		textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined,
	}
}

export const PhysicsDomItem = memo(function PhysicsDomItem({
	element,
	x,
	y,
	angle,
	isPhysicsEnabled,
	showDebug,
	alphaBounds,
	alphaRows,
}: PhysicsDomItemProps) {
	const isThrowable = element.throwable
	const live = isPhysicsEnabled && isThrowable
	const px = live ? x : element.rect.x
	const py = live ? y : element.rect.y
	const pa = live && !element.lockRotation ? angle : 0

	const wrapStyle: React.CSSProperties = {
		position: "absolute",
		left: px,
		top: py,
		width: element.rect.width,
		height: element.rect.height,
		transform: pa !== 0 ? `rotate(${pa}rad)` : undefined,
		transformOrigin: "center center",
		zIndex: element.zIndex ?? (isThrowable ? 10 : 1),
		pointerEvents: "none",
		userSelect: "none",
		transition: live ? undefined : "left 0.35s ease, top 0.35s ease, transform 0.35s ease",
		borderRadius: element.borderRadius ?? 0,
		opacity: element.opacity,
	}

	const renderInner = () => {
		switch (element.type) {
			case "card":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor ?? "#fff"),
							borderRadius: element.borderRadius ?? 8,
							paddingLeft: element.padding ?? 16,
							paddingRight: element.padding ?? 16,
							paddingTop: element.paddingVertical ?? element.padding ?? 16,
							paddingBottom: element.paddingVertical ?? element.padding ?? 16,
							border: element.border ?? "1px solid #e5e5e5",
							boxShadow: element.boxShadow ?? "0 1px 4px rgba(0,0,0,0.06)",
							...(element.backdropFilter
								? {
										backdropFilter: element.backdropFilter,
										WebkitBackdropFilter: element.backdropFilter,
									}
								: {}),
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							boxSizing: "border-box",
							position: "relative",
							color: element.color ?? "#1a1a1a",
							fontFamily: element.fontFamily,
							textAlign: element.textAlign as React.CSSProperties["textAlign"] | undefined,
						}}
					>
						{element.text && (
							<div
								style={textStyleOf(element, {
									fontWeight: 600,
									color: "#1a1a1a",
									lineHeight: "1.3",
								})}
							>
								{element.text}
							</div>
						)}
						{element.children?.map((child) => (
							<div
								key={child.id}
								style={{
									marginTop: child.rect.y > 0 ? child.rect.y : 8,
									opacity: child.opacity,
									...textStyleOf(child, { fontSize: 13, color: "#777", lineHeight: "1.5" }),
								}}
							>
								{child.text}
							</div>
						))}
					</div>
				)

			case "button":
			case "link":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor ?? "#1a1a1a"),
							borderRadius: element.borderRadius ?? 6,
							border: element.border,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: element.boxShadow,
							boxSizing: "border-box",
							...textStyleOf(element, { fontSize: 14, fontWeight: 500, color: "#fff" }),
						}}
					>
						{element.text}
					</div>
				)

			case "badge":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor ?? "#333"),
							borderRadius: element.borderRadius ?? 12,
							border: element.border,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: element.boxShadow,
							boxSizing: "border-box",
							...textStyleOf(element, { fontSize: 11, fontWeight: 700, color: "#fff" }),
							letterSpacing: element.letterSpacing ?? "0.05em",
						}}
					>
						{element.text}
					</div>
				)

			case "image":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor),
							borderRadius: element.borderRadius ?? 0,
							overflow: "hidden",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: element.boxShadow,
						}}
					>
						{element.imageSrc ? (
							<img
								src={element.imageSrc}
								alt={element.imageAlt ?? ""}
								data-domino-image-id={element.id}
								style={{ width: "100%", height: "100%", objectFit: "cover" }}
								draggable={false}
							/>
						) : (
							<svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.25 }}>
								<rect
									x="6"
									y="10"
									width="36"
									height="28"
									rx="3"
									stroke="#888"
									strokeWidth="2"
									fill="none"
								/>
								<circle cx="16" cy="20" r="4" fill="#888" />
								<path
									d="M6 32L18 22L26 28L34 18L42 26V35C42 36.66 40.66 38 39 38H9C7.34 38 6 36.66 6 35Z"
									fill="#888"
									opacity="0.35"
								/>
							</svg>
						)}
					</div>
				)

			case "input":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor ?? "#fff"),
							borderRadius: element.borderRadius ?? 6,
							border: element.border ?? "1px solid #ddd",
							display: "flex",
							alignItems: "center",
							padding: element.padding ?? 8,
							boxSizing: "border-box",
							...textStyleOf(element, { fontSize: 14, color: "#999" }),
						}}
					>
						{element.text ?? "Input..."}
					</div>
				)

			case "glyph":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							backgroundColor: "transparent",
							overflow: "visible",
							whiteSpace: "pre",
							...textStyleOf(element, {
								fontSize: element.fontSize ?? 16,
								color: element.color ?? "#333",
								lineHeight: element.lineHeight
									? `${element.lineHeight}px`
									: `${Math.max(element.rect.height, element.fontSize ?? 16)}px`,
							}),
						}}
					>
						{element.text}
					</div>
				)

			case "container":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor),
							borderRadius: element.borderRadius ?? 0,
							border: element.border,
							boxShadow: element.boxShadow,
							overflow: "hidden",
							boxSizing: "border-box",
						}}
					/>
				)

			case "divider":
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							backgroundColor: element.backgroundColor,
						}}
					/>
				)

			default:
				return (
					<div
						style={{
							width: "100%",
							height: "100%",
							...getBackgroundStyle(element.backgroundColor),
							borderRadius: element.borderRadius ?? 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxSizing: "border-box",
							border: element.border,
							...textStyleOf(element, { fontSize: 12, color: "#888" }),
						}}
					>
						{element.text}
					</div>
				)
		}
	}

	return (
		<>
			{element.href ? (
				<a
					href={element.href}
					target="_blank"
					rel="noopener noreferrer"
					style={{ ...wrapStyle, pointerEvents: "auto", textDecoration: "none", color: "inherit" }}
				>
					{renderInner()}
				</a>
			) : (
				<div style={wrapStyle}>{renderInner()}</div>
			)}
			{showDebug && isThrowable && (
				<>
					{/* Full element bounds (red dashed) */}
					<div
						style={{
							position: "absolute",
							left: px - 1,
							top: py - 1,
							width: element.rect.width + 2,
							height: element.rect.height + 2,
							transform: pa !== 0 ? `rotate(${pa}rad)` : undefined,
							transformOrigin: "center center",
							border: "2px dashed rgba(231,76,60,0.45)",
							backgroundColor: "rgba(231,76,60,0.04)",
							pointerEvents: "none",
							zIndex: 100,
							boxSizing: "border-box",
							borderRadius: element.borderRadius ?? 0,
						}}
					/>
					{/* Per-row alpha intervals (green bars) */}
					{alphaRows && alphaRows.length > 0 && (
						<div
							style={{
								position: "absolute",
								left: px,
								top: py,
								width: element.rect.width,
								height: element.rect.height,
								transform: pa !== 0 ? `rotate(${pa}rad)` : undefined,
								transformOrigin: "center center",
								pointerEvents: "none",
								zIndex: 101,
								overflow: "hidden",
							}}
						>
							{alphaRows
								.filter((_, i) => i % 3 === 0)
								.map((row, i) => {
									const rowHeight = element.rect.height / alphaRows.length
									return (
										<div
											key={i}
											style={{
												position: "absolute",
												left: row.left * element.rect.width,
												top: row.y * element.rect.height,
												width: (row.right - row.left) * element.rect.width,
												height: Math.max(2, rowHeight * 3),
												backgroundColor: "rgba(46,204,113,0.5)",
												pointerEvents: "none",
											}}
										/>
									)
								})}
						</div>
					)}
					{/* Alpha tight bounds outline (green border) */}
					{alphaBounds && (
						<div
							style={{
								position: "absolute",
								left: px + alphaBounds.left * element.rect.width - 1,
								top: py + alphaBounds.top * element.rect.height - 1,
								width: (alphaBounds.right - alphaBounds.left) * element.rect.width + 2,
								height: (alphaBounds.bottom - alphaBounds.top) * element.rect.height + 2,
								transform: pa !== 0 ? `rotate(${pa}rad)` : undefined,
								transformOrigin: "center center",
								border: "2px solid rgba(46,204,113,0.9)",
								pointerEvents: "none",
								zIndex: 102,
								boxSizing: "border-box",
							}}
						/>
					)}
				</>
			)}
		</>
	)
})
