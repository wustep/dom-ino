import { memo, useCallback, useRef, useState } from "react"
import {
	candidateOutlineStyle,
	FlyBadges,
	overlayBackdropStyle,
	PhysicsBadge,
	PICKER_HALO,
	PickerBanner,
	PickerIcon,
	pickerKeyframes,
	SaveBadge,
	useEscClose,
	useFlyAnimation,
} from "./pickerShared"
import type { SnapshotCandidate } from "./snapshotHelpers"

interface SnapshotPickerOverlayProps {
	selectableCandidates: SnapshotCandidate[]
	selectedIds: Set<string>
	onToggleSelected: (id: string) => void
	onSaveNode: (id: string) => void
	onUnsaveNode: (id: string) => void
	onClose: () => void
}

export const SnapshotPickerOverlay = memo(function SnapshotPickerOverlay({
	selectableCandidates,
	selectedIds,
	onToggleSelected,
	onSaveNode,
	onUnsaveNode,
	onClose,
}: SnapshotPickerOverlayProps) {
	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const [flashId, setFlashId] = useState<string | null>(null)
	const candidateRefs = useRef<Map<string, HTMLDivElement>>(new Map())
	const { flyBadges, triggerFly } = useFlyAnimation()

	useEscClose(onClose)

	const handleSave = useCallback(
		(id: string) => {
			onSaveNode(id)
			setFlashId(id)
			setTimeout(() => setFlashId(null), 800)
			const el = candidateRefs.current.get(id)
			const candidate = selectableCandidates.find((c) => c.id === id)
			if (el) {
				const label = candidate?.node.textContent?.trim().slice(0, 20) || "Component"
				triggerFly(el, label)
			}
		},
		[onSaveNode, triggerFly, selectableCandidates],
	)

	return (
		<>
			<div style={overlayBackdropStyle} />

			<PickerBanner
				icon={<PickerIcon />}
				iconBg="rgba(59, 130, 246, 0.18)"
				iconColor="#93bbfd"
				title="Component picker"
				subtitle={`${selectableCandidates.length} selectable · ${selectedIds.size} selected`}
				onClose={onClose}
			/>

			{selectableCandidates.map((c) => {
				const wide = c.width >= 80
				const selected = selectedIds.has(c.id)
				const isHovered = hoveredId === c.id
				const isFlash = flashId === c.id

				return (
					<div
						key={c.id}
						ref={(el) => {
							if (el) candidateRefs.current.set(c.id, el)
							else candidateRefs.current.delete(c.id)
						}}
						data-picker-candidate={c.id}
						onMouseEnter={() => setHoveredId(c.id)}
						onMouseLeave={() => setHoveredId(null)}
						style={{
							position: "absolute",
							left: c.x - PICKER_HALO,
							top: c.y - PICKER_HALO,
							width: c.width + PICKER_HALO * 2,
							height: c.height + PICKER_HALO * 2,
							zIndex: 205,
							pointerEvents: "auto",
						}}
					>
						<div
							style={{
								...candidateOutlineStyle(selected, isHovered, c.borderRadius ?? 0),
								width: c.width + 4,
								height: c.height + 4,
							}}
						/>

						{(selected || isHovered) && (
							<PhysicsBadge
								active={selected}
								wide={wide}
								isHovered={isHovered}
								onClick={(e) => {
									e.stopPropagation()
									onToggleSelected(c.id)
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, right: PICKER_HALO - 8 }}
							/>
						)}

						{c.saved ? (
							<SaveBadge
								saved
								wide={wide}
								isHovered={isHovered}
								isFlash={isFlash}
								onClick={(e) => {
									e.stopPropagation()
									onUnsaveNode(c.id)
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, left: PICKER_HALO - 8 }}
							/>
						) : isHovered ? (
							<SaveBadge
								saved={false}
								wide={wide}
								isHovered
								onClick={(e) => {
									e.stopPropagation()
									handleSave(c.id)
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, left: PICKER_HALO - 8 }}
							/>
						) : null}
					</div>
				)
			})}

			<FlyBadges badges={flyBadges} />
			<style>{pickerKeyframes}</style>
		</>
	)
})
