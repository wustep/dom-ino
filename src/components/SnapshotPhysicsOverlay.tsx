import { memo } from "react"
import type { AnimatedAlphaMap } from "../hooks/useAnimatedAlpha"
import type { SnapshotCandidate } from "../scene/snapshotHelpers"
import type { SceneElement } from "../scene/types"
import { ImportedPhysicsClone } from "./ImportedPhysicsClone"
import { PhysicsDomItem } from "./PhysicsDomItem"

interface SnapshotPhysicsOverlayProps {
	selectedElements: SceneElement[]
	droppedElements: SceneElement[]
	selectableCandidateMap: Map<string, SnapshotCandidate>
	bodyPositions: Map<string, { x: number; y: number; w: number; h: number; angle: number }>
	animatedAlpha: AnimatedAlphaMap
	gifPlaybackPaused: boolean
	iframeWindow: Window
	showDebug: boolean
	hidden: boolean
}

/** Physics clones of selected snapshot elements + dropped stash elements. */
export const SnapshotPhysicsOverlay = memo(function SnapshotPhysicsOverlay({
	selectedElements,
	droppedElements,
	selectableCandidateMap,
	bodyPositions,
	animatedAlpha,
	gifPlaybackPaused,
	iframeWindow,
	showDebug,
	hidden,
}: SnapshotPhysicsOverlayProps) {
	if (hidden) return null

	return (
		<>
			{selectedElements.map((el) => {
				const pos = bodyPositions.get(el.id)
				const candidate = selectableCandidateMap.get(el.id)
				if (!candidate) return null
				return (
					<ImportedPhysicsClone
						key={el.id}
						sourceNode={candidate.node}
						sourceWindow={iframeWindow}
						x={pos?.x ?? el.rect.x}
						y={pos?.y ?? el.rect.y}
						angle={pos?.angle ?? 0}
						width={pos?.w ?? el.rect.width}
						height={pos?.h ?? el.rect.height}
						showDebug={showDebug}
					/>
				)
			})}
			{droppedElements.map((el) => {
				const pos = bodyPositions.get(el.id)
				const alphaEntry = animatedAlpha[el.id]
				return (
					<PhysicsDomItem
						key={el.id}
						element={el}
						x={pos?.x ?? el.rect.x}
						y={pos?.y ?? el.rect.y}
						angle={pos?.angle ?? 0}
						isPhysicsEnabled={true}
						showDebug={showDebug}
						alphaBounds={alphaEntry?.bounds}
						alphaRows={alphaEntry?.rows ?? el.alphaRows}
						animatedGifController={alphaEntry?.controller}
						isAnimationPaused={gifPlaybackPaused}
					/>
				)
			})}
		</>
	)
})
