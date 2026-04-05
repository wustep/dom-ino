import { useEffect } from "react"
import type { SceneSettings } from "../contexts/SettingsContext"
import type { PhysicsEngine } from "../physics/engine"
import type { SceneElement } from "../scene/types"
import { useAnimatedAlpha } from "./useAnimatedAlpha"
import { usePhysicsLoop } from "./usePhysicsLoop"
import { usePickerPause } from "./usePickerPause"

interface UseScenePhysicsOptions {
	physicsRef: React.RefObject<PhysicsEngine | null>
	settings: SceneSettings
	/** Elements to track for animated GIF alpha (effectiveElements in DominoScene, droppedElements in SnapshotPageView) */
	animatedElements: SceneElement[]
}

/**
 * Composes picker mode, physics loop, and animated alpha tracking — the
 * three hooks that are always used together in both scene components.
 */
export function useScenePhysics({
	physicsRef,
	settings,
	animatedElements,
}: UseScenePhysicsOptions) {
	const { pickerMode, handleTogglePicker, handleToggleSavePicker, handleClosePicker } =
		usePickerPause({ physicsRef, isPaused: settings.paused })

	const { bodyPositions, fps } = usePhysicsLoop({
		physicsRef,
		physicsEnabled: settings.physicsEnabled,
		gravityX: settings.gravityX,
		gravityY: settings.gravityY,
		restitution: settings.restitution,
		allowRotation: settings.allowRotation,
	})

	const gifPlaybackPaused = settings.paused || pickerMode !== null
	const animatedAlpha = useAnimatedAlpha(animatedElements, gifPlaybackPaused)

	// Sync alpha bounds with physics engine
	useEffect(() => {
		const physics = physicsRef.current
		if (!physics) return

		for (const [id, entry] of Object.entries(animatedAlpha)) {
			physics.updateAlphaBounds(id, entry.bounds)
		}
	}, [animatedAlpha, physicsRef])

	return {
		pickerMode,
		handleTogglePicker,
		handleToggleSavePicker,
		handleClosePicker,
		bodyPositions,
		fps,
		animatedAlpha,
		gifPlaybackPaused,
	}
}
