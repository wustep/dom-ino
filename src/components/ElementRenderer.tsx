import { memo, useEffect, useRef } from "react"
import type { SceneElement, TextStyle } from "../scene/types"
import type { GifAlphaController } from "../utils/gifFrames"
import { isAnimatedImageSrc } from "../utils/imageAlpha"
import { isVideoMediaSrc } from "../utils/stashImageFromFile"
import { getBackgroundStyle } from "../utils/styles"

interface ElementRendererProps {
	element: SceneElement
	/** Shared controller for manual animated GIF playback */
	animatedGifController?: GifAlphaController
	isAnimationPaused?: boolean
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

function drawAnimatedGifFrame(
	canvas: HTMLCanvasElement,
	frameSurface: HTMLCanvasElement,
	displayWidth: number,
	displayHeight: number,
): void {
	const pixelRatio = window.devicePixelRatio || 1
	const targetWidth = Math.max(1, Math.round(displayWidth * pixelRatio))
	const targetHeight = Math.max(1, Math.round(displayHeight * pixelRatio))

	if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
		canvas.width = targetWidth
		canvas.height = targetHeight
	}

	const ctx = canvas.getContext("2d")
	if (!ctx) return

	ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
	ctx.clearRect(0, 0, displayWidth, displayHeight)

	const scale = Math.max(displayWidth / frameSurface.width, displayHeight / frameSurface.height)
	const drawWidth = frameSurface.width * scale
	const drawHeight = frameSurface.height * scale
	const drawX = (displayWidth - drawWidth) / 2
	const drawY = (displayHeight - drawHeight) / 2

	ctx.drawImage(frameSurface, drawX, drawY, drawWidth, drawHeight)
}

const AnimatedGifCanvas = memo(function AnimatedGifCanvas({
	elementId,
	controller,
	alt,
	width,
	height,
	paused = false,
}: {
	elementId: string
	controller: GifAlphaController
	alt?: string
	width: number
	height: number
	paused?: boolean
}) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const prevFrameIndexRef = useRef<number | null>(null)

	useEffect(() => {
		let running = true
		let rafId: number | null = null
		let timeoutId: number | null = null

		const renderFrame = () => {
			if (!running) return
			const canvas = canvasRef.current
			if (canvas) {
				const frameState = controller.getCurrentFrameState()
				if (prevFrameIndexRef.current !== frameState.frameIndex) {
					const frameSurface = controller.getRenderSurface(frameState.frameIndex)
					if (frameSurface) {
						drawAnimatedGifFrame(canvas, frameSurface, width, height)
						prevFrameIndexRef.current = frameState.frameIndex
					}
				}
				if (!paused) {
					const nextDelay = Math.max(0, controller.getFrameDelay(frameState.frameIndex))
					timeoutId = window.setTimeout(() => {
						rafId = requestAnimationFrame(renderFrame)
					}, nextDelay)
				}
			}
		}

		rafId = requestAnimationFrame(renderFrame)

		return () => {
			running = false
			if (rafId !== null) {
				cancelAnimationFrame(rafId)
			}
			if (timeoutId !== null) {
				window.clearTimeout(timeoutId)
			}
		}
	}, [controller, width, height, paused])

	return (
		<canvas
			ref={canvasRef}
			data-domino-image-id={elementId}
			aria-label={alt}
			role={alt ? "img" : undefined}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	)
})

/** Renders the visual content of a SceneElement based on its type. */
export const ElementRenderer = memo(function ElementRenderer({
	element,
	animatedGifController,
	isAnimationPaused = false,
}: ElementRendererProps) {
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

		case "image": {
			const isVideo = isVideoMediaSrc(element.imageSrc)
			const shouldManuallyAnimate =
				!isVideo &&
				!!animatedGifController &&
				!!element.imageSrc &&
				isAnimatedImageSrc(element.imageSrc)
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
						isVideo ? (
							<video
								src={element.imageSrc}
								aria-label={element.imageAlt}
								data-domino-image-id={element.id}
								style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
								autoPlay
								loop
								muted
								playsInline
								preload="auto"
							/>
						) : shouldManuallyAnimate ? (
							<AnimatedGifCanvas
								elementId={element.id}
								controller={animatedGifController}
								alt={element.imageAlt}
								width={element.rect.width}
								height={element.rect.height}
								paused={isAnimationPaused}
							/>
						) : (
							<img
								src={element.imageSrc}
								alt={element.imageAlt ?? ""}
								data-domino-image-id={element.id}
								style={{ width: "100%", height: "100%", objectFit: "cover" }}
								draggable={false}
							/>
						)
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
		}

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
})
