import { memo, useState } from "react"
import {
	candidateOutlineStyle,
	overlayBackdropStyle,
	PhysicsBadge,
	PICKER_HALO,
	PickerBanner,
	PickerIcon,
	pickerKeyframes,
	SaveBadge,
	useEscClose,
} from "./pickerShared"

export interface SnapshotPickerOverlayItem {
	id: string
	x: number
	y: number
	width: number
	height: number
	borderRadius?: number
	saved: boolean
	active: boolean
	label: string
	onToggle: () => void
	onSave: () => void
	onUnsave: () => void
}

interface SnapshotPickerOverlayProps {
	items: SnapshotPickerOverlayItem[]
	onClose: () => void
}

export const SnapshotPickerOverlay = memo(function SnapshotPickerOverlay({
	items,
	onClose,
}: SnapshotPickerOverlayProps) {
	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const [flashId, setFlashId] = useState<string | null>(null)

	useEscClose(onClose)

	const activeCount = items.filter((item) => item.active).length

	return (
		<>
			<div style={overlayBackdropStyle} />

			<PickerBanner
				icon={<PickerIcon />}
				iconBg="rgba(59, 130, 246, 0.18)"
				iconColor="#93bbfd"
				title="Component picker"
				subtitle={`${items.length} selectable · ${activeCount} active`}
				onClose={onClose}
			/>

			{items.map((item) => {
				const wide = item.width >= 80
				const isHovered = hoveredId === item.id
				const isFlash = flashId === item.id

				return (
					<div
						key={item.id}
						data-picker-candidate={item.id}
						onMouseEnter={() => setHoveredId(item.id)}
						onMouseLeave={() => setHoveredId(null)}
						style={{
							position: "absolute",
							left: item.x - PICKER_HALO,
							top: item.y - PICKER_HALO,
							width: item.width + PICKER_HALO * 2,
							height: item.height + PICKER_HALO * 2,
							zIndex: 205,
							pointerEvents: "auto",
						}}
					>
						<div
							style={{
								...candidateOutlineStyle(item.active, isHovered, item.borderRadius ?? 0),
								width: item.width + 4,
								height: item.height + 4,
							}}
						/>

						{(item.active || isHovered) && (
							<PhysicsBadge
								active={item.active}
								wide={wide}
								isHovered={isHovered}
								onClick={(e) => {
									e.stopPropagation()
									item.onToggle()
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, right: PICKER_HALO - 8 }}
							/>
						)}

						{item.saved ? (
							<SaveBadge
								saved
								wide={wide}
								isHovered={isHovered}
								isFlash={isFlash}
								onClick={(e) => {
									e.stopPropagation()
									item.onUnsave()
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
									item.onSave()
									setFlashId(item.id)
									window.setTimeout(
										() => setFlashId((prev) => (prev === item.id ? null : prev)),
										800,
									)
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, left: PICKER_HALO - 8 }}
							/>
						) : null}
					</div>
				)
			})}

			<style>{pickerKeyframes}</style>
		</>
	)
})
