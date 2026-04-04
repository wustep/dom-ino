import { useEffect, useRef, useState } from "react"
import type { PhysicsEngine } from "../physics/engine"
import { type BodyPos, bodyPositionsChanged } from "../utils/physics"

interface UsePhysicsLoopOptions {
	physicsRef: React.RefObject<PhysicsEngine | null>
	physicsEnabled: boolean
	gravityX: number
	gravityY: number
	restitution: number
	/** Called when body positions change. Use for side effects like bumping a generation counter. */
	onPositionsChanged?: () => void
}

interface UsePhysicsLoopResult {
	bodyPositions: Map<string, BodyPos>
	fps: number
}

/**
 * Shared RAF loop that syncs Matter.js body positions into React state,
 * tracks FPS, and applies gravity/restitution settings. Used by both
 * DominoScene (preset scenes) and SnapshotPageView (imported pages).
 */
export function usePhysicsLoop({
	physicsRef,
	physicsEnabled,
	gravityX,
	gravityY,
	restitution,
	onPositionsChanged,
}: UsePhysicsLoopOptions): UsePhysicsLoopResult {
	const rafRef = useRef<number>(0)
	const fpsTimestamps = useRef<number[]>([])
	const prevBodyPositionsRef = useRef<Map<string, BodyPos>>(new Map())

	const [bodyPositions, setBodyPositions] = useState<Map<string, BodyPos>>(new Map())
	const [fps, setFps] = useState(60)

	// Stash the callback in a ref so the RAF loop always sees the latest
	// without being a dependency that restarts the loop.
	const onChangedRef = useRef(onPositionsChanged)
	useEffect(() => {
		onChangedRef.current = onPositionsChanged
	}, [onPositionsChanged])

	useEffect(() => {
		let lastFpsUpdate = 0
		const loop = () => {
			rafRef.current = requestAnimationFrame(loop)
			const engine = physicsRef.current
			if (!engine || !physicsEnabled) return
			const now = performance.now()
			fpsTimestamps.current.push(now)
			while (fpsTimestamps.current.length > 0 && fpsTimestamps.current[0] < now - 1000)
				fpsTimestamps.current.shift()
			if (now - lastFpsUpdate > 250) {
				setFps(fpsTimestamps.current.length)
				lastFpsUpdate = now
			}
			const positions = engine.getBodyPositions() as Map<string, BodyPos>
			if (bodyPositionsChanged(prevBodyPositionsRef.current, positions)) {
				prevBodyPositionsRef.current = positions
				setBodyPositions(positions)
				onChangedRef.current?.()
			}
		}
		rafRef.current = requestAnimationFrame(loop)
		return () => cancelAnimationFrame(rafRef.current)
	}, [physicsEnabled, physicsRef])

	// Sync gravity
	useEffect(() => {
		physicsRef.current?.setGravity(gravityX, gravityY)
	}, [gravityX, gravityY, physicsRef])

	// Sync restitution
	useEffect(() => {
		physicsRef.current?.setRestitution(restitution)
	}, [restitution, physicsRef])

	return { bodyPositions, fps }
}
