import type { LayoutCursor } from "@chenglou/pretext"
import { memo } from "react"
import type { SceneSettings } from "../contexts/SettingsContext"
import type { ObstacleRect, SceneElement } from "../scene/types"
import { buildFontString } from "../utils/fonts"
import { PhysicsDomItem } from "./PhysicsDomItem"
import { TextFlowRegion } from "./TextFlowRegion"

interface SceneTextLayerProps {
	settings: SceneSettings
	textElements: SceneElement[]
	textBodyElements: SceneElement[]
	bodyPositions: Map<string, { x: number; y: number; w: number; h: number; angle: number }>
	obstacles: ObstacleRect[]
	textMaxHeights: Map<string, number>
	continuationCursors: Map<string, LayoutCursor>
	textMeasureRefs: React.RefObject<Map<string, HTMLDivElement>>
	onLineCount: (count: number) => void
}

/**
 * Renders the text layer of a DominoScene in one of three modes:
 * - Letter bodies: invisible measurement divs + individual glyph PhysicsDomItems
 * - Pretext reflow: TextFlowRegion components that wrap around obstacles
 * - Plain text: static positioned divs (when pretext is disabled)
 */
export const SceneTextLayer = memo(function SceneTextLayer({
	settings,
	textElements,
	textBodyElements,
	bodyPositions,
	obstacles,
	textMaxHeights,
	continuationCursors,
	textMeasureRefs,
	onLineCount,
}: SceneTextLayerProps) {
	if (settings.textBodiesEnabled) {
		return (
			<>
				{/* Invisible measurement layer for glyph body positioning */}
				<div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
					{textElements.map((el) => {
						const pad = el.padding ?? 0
						return (
							<div
								key={`measure-${el.id}`}
								ref={(node) => {
									if (node) textMeasureRefs.current.set(el.id, node)
									else textMeasureRefs.current.delete(el.id)
								}}
								style={{
									position: "absolute",
									left: el.rect.x + pad,
									top: el.rect.y + pad,
									width: el.rect.width - pad * 2,
									fontSize: el.fontSize ?? 16,
									fontWeight: el.fontWeight ?? 400,
									fontStyle: el.fontStyle ?? "normal",
									fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif',
									lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6",
									color: "transparent",
									letterSpacing: el.letterSpacing,
									textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined,
									whiteSpace: "pre-wrap",
									overflowWrap: "break-word",
								}}
							>
								{el.text}
							</div>
						)
					})}
				</div>

				{/* Letter bodies — one PhysicsDomItem per glyph */}
				{textBodyElements.map((el) => {
					const pos = bodyPositions.get(el.id)
					return (
						<PhysicsDomItem
							key={el.id}
							element={el}
							x={pos?.x ?? el.rect.x}
							y={pos?.y ?? el.rect.y}
							angle={pos?.angle ?? 0}
							isPhysicsEnabled={settings.physicsEnabled}
							showDebug={settings.showObstacleBounds}
						/>
					)
				})}
			</>
		)
	}

	if (settings.pretextEnabled) {
		return (
			<>
				{textElements.map((el) => {
					const fs = el.fontSize ?? 16
					const font = buildFontString(fs, el.fontWeight, el.fontFamily, el.fontStyle)
					const pad = el.padding ?? 0
					const flowMinSegmentWidth = el.minSegmentWidth ?? (el.type === "heading" ? 80 : 8)
					const allowWordBreaks =
						el.allowWordBreaks ?? (el.type === "heading" ? false : settings.allowWordBreaks)
					const startCursor = continuationCursors.get(el.id)
					return (
						<TextFlowRegion
							key={el.id}
							text={el.text!}
							font={font}
							fontSize={fs}
							lineHeight={el.lineHeight ?? 28}
							color={el.color ?? "#333"}
							opacity={el.opacity}
							letterSpacing={el.letterSpacing}
							textAlign={el.textAlign}
							containerX={el.rect.x + pad}
							containerY={el.rect.y + pad}
							containerWidth={el.rect.width - pad * 2}
							containerMaxHeight={(textMaxHeights.get(el.id) ?? el.rect.height) - pad * 2}
							obstacles={obstacles}
							showDebug={settings.showLineBounds}
							onLineCount={onLineCount}
							minSegmentWidth={flowMinSegmentWidth}
							allowWordBreaks={allowWordBreaks}
							startCursor={startCursor}
						/>
					)
				})}
			</>
		)
	}

	// Plain text fallback
	return (
		<>
			{textElements.map((el) => {
				const pad = el.padding ?? 0
				return (
					<div
						key={el.id}
						style={{
							position: "absolute",
							left: el.rect.x + pad,
							top: el.rect.y + pad,
							width: el.rect.width - pad * 2,
							fontSize: el.fontSize ?? 16,
							fontWeight: el.fontWeight ?? 400,
							fontStyle: el.fontStyle ?? "normal",
							fontFamily: el.fontFamily ?? '"Source Serif 4", Georgia, serif',
							lineHeight: el.lineHeight ? `${el.lineHeight}px` : "1.6",
							color: el.color ?? "#333",
							opacity: el.opacity,
							letterSpacing: el.letterSpacing,
							textAlign: el.textAlign as React.CSSProperties["textAlign"] | undefined,
							pointerEvents: "none",
							zIndex: 2,
						}}
					>
						{el.text}
					</div>
				)
			})}
		</>
	)
})
