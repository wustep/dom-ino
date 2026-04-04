import { useCallback, useState } from "react"
import type { PhysicsEngine } from "../physics/engine"

export type PickerMode = null | "throwable" | "save"

interface UsePickerPauseOptions {
	physicsRef: React.RefObject<PhysicsEngine | null>
	isPaused: boolean
}

interface UsePickerPauseResult {
	pickerMode: PickerMode
	handleTogglePicker: () => void
	handleToggleSavePicker: () => void
	handleClosePicker: () => void
}

/**
 * Manages picker mode state, automatically pausing physics when a picker
 * opens and resuming when it closes (unless manually paused).
 *
 * Used by both DominoScene and SnapshotPageView.
 */
export function usePickerPause({
	physicsRef,
	isPaused,
}: UsePickerPauseOptions): UsePickerPauseResult {
	const [pickerMode, setPickerMode] = useState<PickerMode>(null)

	const handleTogglePicker = useCallback(() => {
		setPickerMode((prev) => {
			const next: PickerMode = prev === "throwable" ? null : "throwable"
			if (next) physicsRef.current?.pause()
			else if (!isPaused) physicsRef.current?.resume()
			return next
		})
	}, [isPaused, physicsRef])

	const handleToggleSavePicker = useCallback(() => {
		setPickerMode((prev) => {
			const next: PickerMode = prev === "save" ? null : "save"
			if (next) physicsRef.current?.pause()
			else if (!isPaused) physicsRef.current?.resume()
			return next
		})
	}, [isPaused, physicsRef])

	const handleClosePicker = useCallback(() => {
		setPickerMode(null)
		if (!isPaused) physicsRef.current?.resume()
	}, [isPaused, physicsRef])

	return {
		pickerMode,
		handleTogglePicker,
		handleToggleSavePicker,
		handleClosePicker,
	}
}
