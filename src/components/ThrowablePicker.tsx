import { memo, useCallback, useRef, useState } from "react"
import type { SavedElement, SceneElement } from "../scene/types"
import {
	candidateOutlineStyle,
	DeleteBadge,
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

interface ThrowablePickerProps {
	elements: SceneElement[]
	savedElements: SavedElement[]
	onToggle: (id: string) => void
	onSave: (el: SceneElement) => void
	onUnsave: (id: string) => void
	onDelete: (id: string) => void
	onClose: () => void
}

export const ThrowablePicker = memo(function ThrowablePicker({
	elements,
	savedElements,
	onToggle,
	onSave,
	onUnsave,
	onDelete,
	onClose,
}: ThrowablePickerProps) {
	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const [flashId, setFlashId] = useState<string | null>(null)
	const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map())
	const { flyBadges, triggerFly } = useFlyAnimation()

	useEscClose(onClose)

	const pickable = elements.filter(
		(el) =>
			el.type !== "divider" &&
			!(el.type === "paragraph" && !el.throwable) &&
			!(el.type === "heading" && !el.throwable),
	)

	const savedIds = new Set(savedElements.map((s) => s.element.id))

	const handleSave = useCallback(
		(el: SceneElement) => {
			onSave(el)
			setFlashId(el.id)
			setTimeout(() => setFlashId(null), 800)
			const ref = elementRefs.current.get(el.id)
			if (ref) {
				triggerFly(ref, el.text?.trim().slice(0, 20) || el.type)
			}
		},
		[onSave, triggerFly],
	)

	return (
		<>
			<div style={overlayBackdropStyle} />

			<PickerBanner
				icon={<PickerIcon />}
				iconBg="rgba(59, 130, 246, 0.18)"
				iconColor="#93bbfd"
				title="Component picker"
				subtitle={`${pickable.length} elements · ${pickable.filter((e) => e.throwable).length} physics`}
				onClose={onClose}
			/>

			{pickable.map((el) => {
				const isHovered = hoveredId === el.id
				const isSaved = savedIds.has(el.id)
				const isFlash = flashId === el.id
				const wide = el.rect.width >= 80

				return (
					<div
						key={`pick-${el.id}`}
						ref={(ref) => {
							if (ref) elementRefs.current.set(el.id, ref)
							else elementRefs.current.delete(el.id)
						}}
						onMouseEnter={() => setHoveredId(el.id)}
						onMouseLeave={() => setHoveredId(null)}
						style={{
							position: "absolute",
							left: el.rect.x - PICKER_HALO,
							top: el.rect.y - PICKER_HALO,
							width: el.rect.width + PICKER_HALO * 2,
							height: el.rect.height + PICKER_HALO * 2,
							zIndex: 205,
							pointerEvents: "auto",
						}}
					>
						<div
							style={{
								...candidateOutlineStyle(el.throwable, isHovered, el.borderRadius ?? 0),
								width: el.rect.width + 4,
								height: el.rect.height + 4,
							}}
						/>

						{(el.throwable || isHovered) && (
							<PhysicsBadge
								active={el.throwable}
								wide={wide}
								isHovered={isHovered}
								onClick={(e) => {
									e.stopPropagation()
									onToggle(el.id)
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, right: PICKER_HALO - 8 }}
							/>
						)}

						{isSaved ? (
							<SaveBadge
								saved
								wide={wide}
								isHovered={isHovered}
								isFlash={isFlash}
								onClick={(e) => {
									e.stopPropagation()
									onUnsave(el.id)
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
									handleSave(el)
								}}
								style={{ position: "absolute", top: PICKER_HALO - 10, left: PICKER_HALO - 8 }}
							/>
						) : null}

						{isHovered && (
							<DeleteBadge
								onClick={(e) => {
									e.stopPropagation()
									onDelete(el.id)
								}}
								style={{ position: "absolute", bottom: PICKER_HALO - 10, right: PICKER_HALO - 8 }}
							/>
						)}
					</div>
				)
			})}

			<FlyBadges badges={flyBadges} />
			<style>{pickerKeyframes}</style>
		</>
	)
})
