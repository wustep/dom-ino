import { useCallback, useEffect, useRef, useState } from "react"

export interface FlyBadge {
	id: string
	left: number
	top: number
	width: number
	height: number
	dx: number
	dy: number
	label: string
}

const FLY_MS = 520

/** Manages fly-to-stash animations when elements are saved from a picker. */
export function useFlyAnimation() {
	const [flyBadges, setFlyBadges] = useState<FlyBadge[]>([])
	const timeoutsRef = useRef<number[]>([])

	useEffect(() => {
		return () => {
			timeoutsRef.current.forEach((id) => {
				window.clearTimeout(id)
			})
			timeoutsRef.current = []
		}
	}, [])

	const triggerFly = useCallback((sourceEl: HTMLElement, label: string) => {
		const from = sourceEl.getBoundingClientRect()
		const stashTrigger = document.querySelector(
			"[data-domino-stash-trigger='true']",
		) as HTMLElement | null
		const to = stashTrigger?.getBoundingClientRect()
		if (!to) return

		const flyId = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
		const badge: FlyBadge = {
			id: flyId,
			left: from.left,
			top: from.top,
			width: Math.min(Math.max(from.width, 56), 160),
			height: Math.min(Math.max(from.height, 24), 56),
			dx: to.left + to.width / 2 - (from.left + from.width / 2),
			dy: to.top + to.height / 2 - (from.top + from.height / 2),
			label,
		}
		setFlyBadges((prev) => [...prev, badge])
		const tid = window.setTimeout(() => {
			setFlyBadges((prev) => prev.filter((b) => b.id !== flyId))
			timeoutsRef.current = timeoutsRef.current.filter((id) => id !== tid)
		}, FLY_MS + 80)
		timeoutsRef.current.push(tid)
	}, [])

	return { flyBadges, triggerFly }
}
