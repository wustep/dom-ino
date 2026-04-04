import { useCallback, useState } from "react"
import type { PhysicsEngine } from "../physics/engine"

interface UsePickerPauseOptions {
	physicsRef: React.RefObject<PhysicsEngine | null>
	isPaused: boolean
}

interface UsePickerPauseResult {
	pickerMode: boolean
	savePickerMode: boolean
	handleTogglePicker: () => void
	handleToggleSavePicker: () => void
	handleClosePicker: () => void
	handleCloseSavePicker: () => void
}

/**
 * Manages picker and save-picker mode state, automatically pausing physics
 * when a picker opens and resuming when it closes (unless manually paused).
 *
 * Used by both DominoScene and SnapshotPageView.
 */
export function usePickerPause({
	physicsRef,
	isPaused,
}: UsePickerPauseOptions): UsePickerPauseResult {
	const [pickerMode, setPickerMode] = useState(false)
	const [savePickerMode, setSavePickerMode] = useState(false)

	const handleTogglePicker = useCallback(() => {
		setPickerMode((prev) => {
			if (!prev) {
				setSavePickerMode(false)
				physicsRef.current?.pause()
			} else if (!isPaused) {
				physicsRef.current?.resume()
			}
			return !prev
		})
	}, [isPaused, physicsRef])

	const handleToggleSavePicker = useCallback(() => {
		setSavePickerMode((prev) => {
			if (!prev) {
				setPickerMode(false)
				physicsRef.current?.pause()
			} else if (!isPaused) {
				physicsRef.current?.resume()
			}
			return !prev
		})
	}, [isPaused, physicsRef])

	const handleClosePicker = useCallback(() => {
		setPickerMode(false)
		if (!isPaused) physicsRef.current?.resume()
	}, [isPaused, physicsRef])

	const handleCloseSavePicker = useCallback(() => {
		setSavePickerMode(false)
		if (!isPaused) physicsRef.current?.resume()
	}, [isPaused, physicsRef])

	return {
		pickerMode,
		savePickerMode,
		handleTogglePicker,
		handleToggleSavePicker,
		handleClosePicker,
		handleCloseSavePicker,
	}
}
