import { memo, useCallback, useRef, useState } from "react"
import type { SceneElement } from "../../scene/types"
import { FlyBadges, SaveBadge } from "./PickerBadges"
import { PickerBanner } from "./PickerBanner"
import { EyedropperIcon } from "./PickerIcons"
import {
	overlayBackdropStyle,
	PICKER_HALO,
	PICKER_OUTLINE_INSET,
	pickerKeyframes,
} from "./pickerStyles"
import { useEscClose } from "./useEscClose"
import { useFlyAnimation } from "./useFlyAnimation"

export interface SavePickerCandidate {
	id: string
	element: SceneElement
	x: number
	y: number
	width: number
	height: number
	borderRadius?: number
	saved: boolean
}

interface QuickSavePickerProps {
	candidates: SavePickerCandidate[]
	onSave: (el: SceneElement) => void
	onUnsave?: (id: string) => void
	onClose: () => void
}

export const QuickSavePicker = memo(function QuickSavePicker({
	candidates,
	onSave,
	onUnsave,
	onClose,
}: QuickSavePickerProps) {
	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const candidateRefs = useRef<Map<string, HTMLDivElement>>(new Map())
	const { flyBadges, triggerFly } = useFlyAnimation()

	useEscClose(onClose)

	const handleSave = useCallback(
		(candidate: SavePickerCandidate) => {
			if (candidate.saved) return
			onSave(candidate.element)
			const ref = candidateRefs.current.get(candidate.id)
			if (ref) {
				const label = candidate.element.text?.trim().slice(0, 20) || candidate.element.type
				triggerFly(ref, label)
			}
		},
		[onSave, triggerFly],
	)

	return (
		<>
			<div style={overlayBackdropStyle} />

			<PickerBanner
				icon={<EyedropperIcon />}
				iconBg="rgba(124, 58, 237, 0.18)"
				iconColor="#c4b5fd"
				title="Stash picker"
				subtitle="Click to save or unsave components"
				onClose={onClose}
			/>

			{candidates.map((candidate) => {
				const hovered = hoveredId === candidate.id
				const saved = candidate.saved
				const wide = candidate.width >= 80
				return (
					<div
						key={candidate.id}
						ref={(el) => {
							if (el) candidateRefs.current.set(candidate.id, el)
							else candidateRefs.current.delete(candidate.id)
						}}
						onMouseEnter={() => setHoveredId(candidate.id)}
						onMouseLeave={() =>
							setHoveredId((current) => (current === candidate.id ? null : current))
						}
						onClick={() => handleSave(candidate)}
						style={{
							position: "absolute",
							left: candidate.x - PICKER_HALO,
							top: candidate.y - PICKER_HALO,
							width: candidate.width + PICKER_HALO * 2,
							height: candidate.height + PICKER_HALO * 2,
							zIndex: 205,
							cursor: saved ? "default" : "crosshair",
						}}
					>
						<div
							style={{
								position: "absolute",
								left: PICKER_OUTLINE_INSET,
								top: PICKER_OUTLINE_INSET,
								width: candidate.width + 4,
								height: candidate.height + 4,
								borderRadius: (candidate.borderRadius ?? 0) + 2,
								border: saved
									? "2px solid rgba(124, 58, 237, 0.72)"
									: hovered
										? "2px solid rgba(59, 130, 246, 0.8)"
										: "2px dashed rgba(59, 130, 246, 0.28)",
								background: saved
									? "rgba(124, 58, 237, 0.08)"
									: hovered
										? "rgba(59, 130, 246, 0.10)"
										: "rgba(59, 130, 246, 0.03)",
								boxSizing: "border-box",
								pointerEvents: "none",
								transition:
									"border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
								boxShadow: hovered && !saved ? "0 10px 26px rgba(59, 130, 246, 0.14)" : undefined,
							}}
						/>

						<SaveBadge
							saved={saved}
							wide={wide}
							isHovered={hovered}
							onClick={
								saved && onUnsave
									? (e) => {
											e.stopPropagation()
											onUnsave(candidate.id)
										}
									: undefined
							}
							style={{
								position: "absolute",
								left: PICKER_HALO - 8,
								top: PICKER_HALO - 10,
								opacity: hovered || saved ? 1 : 0.92,
							}}
						/>
					</div>
				)
			})}

			<FlyBadges badges={flyBadges} />
			<style>{pickerKeyframes}</style>
		</>
	)
})
