import { memo } from "react"
import type { AlphaRowInterval, AlphaTightBounds, SceneElement } from "../scene/types"
import type { GifAlphaController } from "../utils/gifFrames"
import { ElementRenderer } from "./ElementRenderer"

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
	/** Shared controller for manual animated GIF playback */
	animatedGifController?: GifAlphaController
	isAnimationPaused?: boolean
}

/** Positions a scene element at its physics-driven coordinates with rotation, wrapping ElementRenderer for visuals. */
export const PhysicsDomItem = memo(function PhysicsDomItem({
	element,
	x,
	y,
	angle,
	isPhysicsEnabled,
	showDebug,
	alphaBounds,
	alphaRows,
	animatedGifController,
	isAnimationPaused = false,
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

	const inner = (
		<ElementRenderer
			element={element}
			animatedGifController={animatedGifController}
			isAnimationPaused={isAnimationPaused}
		/>
	)

	return (
		<>
			{element.href ? (
				<a
					href={element.href}
					target="_blank"
					rel="noopener noreferrer"
					style={{ ...wrapStyle, pointerEvents: "auto", textDecoration: "none", color: "inherit" }}
				>
					{inner}
				</a>
			) : (
				<div style={wrapStyle}>{inner}</div>
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
