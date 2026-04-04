import React, { memo } from "react"
import type { ImportedTextLayout } from "../hooks/useImportedTextLayouts"
import type { ObstacleRect, SceneElement } from "../scene/types"
import { buildFontString, DEFAULT_SANS } from "../utils/fonts"
import { PhysicsDomItem } from "./PhysicsDomItem"
import { TextFlowRegion } from "./TextFlowRegion"

interface SnapshotTextLayerProps {
	importedTextFlowActive: boolean
	importedTextLayouts: ImportedTextLayout[]
	importedObstacles: ObstacleRect[]
	showLineBounds: boolean
	/** Letter-body mode */
	importedTextBodiesActive: boolean
	importedTextBodyElements: SceneElement[]
	bodyPositions: Map<string, { x: number; y: number; w: number; h: number; angle: number }>
	physicsEnabled: boolean
	showObstacleBounds: boolean
	hidden: boolean
}

/** Renders imported-page text: either as Pretext reflow or as letter-body glyphs. */
export const SnapshotTextLayer = memo(function SnapshotTextLayer({
	importedTextFlowActive,
	importedTextLayouts,
	importedObstacles,
	showLineBounds,
	importedTextBodiesActive,
	importedTextBodyElements,
	bodyPositions,
	physicsEnabled,
	showObstacleBounds,
	hidden,
}: SnapshotTextLayerProps) {
	if (hidden) return null

	return (
		<>
			{/* Pretext text overlay */}
			{importedTextFlowActive &&
				importedTextLayouts.map((layout) => {
					const el = layout.sceneElement
					const fs = el.fontSize ?? 16
					const font = buildFontString(fs, el.fontWeight, el.fontFamily ?? DEFAULT_SANS)
					const hasContainerVisuals = el.backgroundColor || el.border || el.boxShadow
					return (
						<React.Fragment key={`imported-text-${layout.id}`}>
							{hasContainerVisuals && (
								<div
									style={{
										position: "absolute",
										left: el.rect.x,
										top: el.rect.y,
										width: el.rect.width,
										height: el.rect.height,
										backgroundColor: el.backgroundColor,
										border: el.border,
										borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
										boxShadow: el.boxShadow,
										boxSizing: "border-box",
										pointerEvents: "none",
										zIndex: 10,
									}}
								/>
							)}
							<TextFlowRegion
								text={el.text ?? ""}
								font={font}
								fontSize={fs}
								lineHeight={el.lineHeight ?? Math.round(fs * 1.5)}
								color={el.color ?? "#333"}
								opacity={el.opacity}
								letterSpacing={el.letterSpacing}
								containerX={layout.containerX}
								containerY={layout.containerY}
								containerWidth={layout.containerWidth}
								containerMaxHeight={layout.containerMaxHeight}
								textAlign={el.textAlign}
								obstacles={importedObstacles}
								flow={layout.flow}
								inlineStyles={layout.inlineStyles}
								showDebug={showLineBounds}
							/>
						</React.Fragment>
					)
				})}

			{/* Letter-body overlay: one glyph-body PhysicsDomItem per character */}
			{importedTextBodiesActive &&
				importedTextBodyElements.map((el) => {
					const pos = bodyPositions.get(el.id)
					return (
						<PhysicsDomItem
							key={el.id}
							element={el}
							x={pos?.x ?? el.rect.x}
							y={pos?.y ?? el.rect.y}
							angle={pos?.angle ?? 0}
							isPhysicsEnabled={physicsEnabled}
							showDebug={showObstacleBounds}
						/>
					)
				})}
		</>
	)
})
