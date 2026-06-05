import Matter from "matter-js"
import type { AlphaTightBounds, SceneDescription, SceneElement } from "../scene/types"

const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events, Runner, Query } = Matter

function getPolygonVertices(el: SceneElement): Matter.Vector[] | null {
	if (!el.polygonPoints || el.polygonPoints.length < 3) return null
	return el.polygonPoints.map((point) => ({
		x: el.rect.x + point.x * el.rect.width,
		y: el.rect.y + point.y * el.rect.height,
	}))
}

/** A tracked Matter.js body with its associated scene element metadata. */
export interface PhysicsBody {
	elementId: string
	body: Matter.Body
	originalX: number
	originalY: number
	originalW: number
	originalH: number
	initialVelocityX: number
	initialVelocityY: number
	/** Offset from visual rect to physics body center (for alpha-aware bounds) */
	alphaBoundsOffset?: { dx: number; dy: number; physicsW: number; physicsH: number }
}

/** Public API for the Matter.js physics world: body management, mouse control, simulation. */
export interface PhysicsEngine {
	engine: Matter.Engine
	runner: Matter.Runner
	bodies: Map<string, PhysicsBody>
	walls: Matter.Body[]
	mouseConstraint: Matter.MouseConstraint | null
	destroy: () => void
	reset: () => void
	pause: () => void
	resume: () => void
	explode: () => void
	setGravity: (x: number, y: number) => void
	setRestitution: (value: number) => void
	setAllowRotation: (value: boolean) => void
	resize: (width: number, height: number) => void
	addBody: (el: SceneElement) => void
	removeBody: (id: string) => void
	updateAlphaBounds: (id: string, bounds: AlphaTightBounds | null) => void
	getBodyPositions: () => Map<string, { x: number; y: number; angle: number; w: number; h: number }>
}

/** Creates a Matter.js physics world with walls, mouse constraint, and body management for a scene. */
export function createPhysicsEngine(
	scene: SceneDescription,
	container: HTMLElement,
): PhysicsEngine {
	type InternalMouse = Matter.Mouse & {
		mousemove: (event: MouseEvent | TouchEvent) => void
		mousedown: (event: MouseEvent | TouchEvent) => void
		mouseup: (event: MouseEvent | TouchEvent) => void
		mousewheel?: EventListenerOrEventListenerObject
	}
	const ownerWindow = container.ownerDocument.defaultView ?? window
	const engine = Engine.create({
		gravity: { x: 0, y: 0 },
		// Sleeping disabled — with zero gravity, bodies only move when
		// thrown, and sleeping can make them unresponsive to MouseConstraint
		enableSleeping: false,
	})

	const runner = Runner.create({ delta: 1000 / 60 })

	const bodies = new Map<string, PhysicsBody>()
	const elementsById = new Map(scene.elements.map((el) => [el.id, el]))
	const walls: Matter.Body[] = []

	const wallThickness = 80
	let W = scene.width
	let H = scene.height
	let rotationAllowed = true

	const wallProps = { isStatic: true, friction: 0.8, restitution: 0.15 }

	function createWalls(width: number, height: number) {
		return [
			Bodies.rectangle(width / 2, height + wallThickness / 2, width + 200, wallThickness, {
				...wallProps,
				label: "wall-floor",
			}),
			Bodies.rectangle(width / 2, -wallThickness / 2, width + 200, wallThickness, {
				...wallProps,
				label: "wall-ceiling",
			}),
			Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 200, {
				...wallProps,
				label: "wall-left",
			}),
			Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 200, {
				...wallProps,
				label: "wall-right",
			}),
		]
	}

	function replaceWalls(width: number, height: number) {
		for (const wall of walls) {
			World.remove(engine.world, wall)
		}
		walls.splice(0, walls.length, ...createWalls(width, height))
		World.add(engine.world, walls)
	}

	replaceWalls(W, H)

	function createBody(el: SceneElement): PhysicsBody | null {
		if (el.physicsEnabled === false) return null
		if (el.type === "divider") return null
		// Live text uses Pretext, not Matter; throwable headings/paragraphs are physics obstacles.
		if ((el.type === "paragraph" || el.type === "heading") && !el.throwable) {
			return null
		}

		const cx = el.rect.x + el.rect.width / 2
		const cy = el.rect.y + el.rect.height / 2
		const physicsShape = el.physicsShape ?? "rectangle"
		const polygonVertices = physicsShape === "polygon" ? getPolygonVertices(el) : null

		if (el.throwable) {
			const mass = el.mass ?? 1
			const bodyOptions = {
				isStatic: false,
				friction: el.friction ?? 0.5,
				frictionAir: el.frictionAir ?? 0.03,
				restitution: el.restitution ?? 0.3,
				density: 0.002 * mass,
				label: el.id,
			}
			const body =
				physicsShape === "circle"
					? Bodies.circle(cx, cy, Math.min(el.rect.width, el.rect.height) / 2, bodyOptions)
					: physicsShape === "polygon" && polygonVertices
						? Bodies.fromVertices(cx, cy, [polygonVertices], bodyOptions, true)
						: Bodies.rectangle(cx, cy, el.rect.width, el.rect.height, {
								...bodyOptions,
								chamfer: { radius: Math.min(el.borderRadius ?? 0, 6) },
							})
			if (el.lockRotation) {
				Body.setInertia(body, Infinity)
				Body.setAngularVelocity(body, 0)
				Body.setAngle(body, 0)
			}
			if (el.initialVelocityX !== undefined || el.initialVelocityY !== undefined) {
				Body.setVelocity(body, {
					x: el.initialVelocityX ?? 0,
					y: el.initialVelocityY ?? 0,
				})
			}
			return {
				elementId: el.id,
				body,
				originalX: el.rect.x,
				originalY: el.rect.y,
				originalW: el.rect.width,
				originalH: el.rect.height,
				initialVelocityX: el.initialVelocityX ?? 0,
				initialVelocityY: el.initialVelocityY ?? 0,
			}
		}

		const bodyOptions = {
			isStatic: true,
			friction: 0.6,
			restitution: 0.2,
			label: `static-${el.id}`,
		}
		const body =
			physicsShape === "circle"
				? Bodies.circle(cx, cy, Math.min(el.rect.width, el.rect.height) / 2, bodyOptions)
				: physicsShape === "polygon" && polygonVertices
					? Bodies.fromVertices(cx, cy, [polygonVertices], bodyOptions, true)
					: Bodies.rectangle(cx, cy, el.rect.width, el.rect.height, {
							...bodyOptions,
							chamfer: { radius: Math.min(el.borderRadius ?? 0, 6) },
						})
		return {
			elementId: el.id,
			body,
			originalX: el.rect.x,
			originalY: el.rect.y,
			originalW: el.rect.width,
			originalH: el.rect.height,
			initialVelocityX: 0,
			initialVelocityY: 0,
		}
	}

	function addElementBody(el: SceneElement) {
		const physicsBody = createBody(el)
		if (!physicsBody) return
		elementsById.set(el.id, el)
		bodies.set(el.id, physicsBody)
		World.add(engine.world, physicsBody.body)
	}

	for (const el of scene.elements) {
		addElementBody(el)
	}

	function clampBodyToBounds(pb: PhysicsBody, width: number, height: number) {
		const b = pb.body
		if (b.isStatic) return

		const pos = b.position
		const hw = pb.originalW / 2
		const hh = pb.originalH / 2
		const element = elementsById.get(pb.elementId)
		let clamped = false
		let nx = pos.x
		let ny = pos.y

		if (nx - hw < 0) {
			nx = hw
			clamped = true
		}
		if (nx + hw > width) {
			nx = width - hw
			clamped = true
		}
		if (ny - hh < 0) {
			ny = hh
			clamped = true
		}
		if (ny + hh > height) {
			ny = height - hh
			clamped = true
		}

		if (clamped) {
			Body.setPosition(b, { x: nx, y: ny })
			Body.setVelocity(b, { x: b.velocity.x * 0.5, y: b.velocity.y * 0.5 })
		}

		if (element?.lockRotation || !rotationAllowed) {
			if (Math.abs(b.angle) > 0.0001) Body.setAngle(b, 0)
			if (Math.abs(b.angularVelocity) > 0.0001) Body.setAngularVelocity(b, 0)
		}
	}

	const mouse = Mouse.create(container) as InternalMouse
	mouse.pixelRatio = 1
	const mouseWithWheel = mouse
	const isContainerEventTarget = (target: EventTarget | null): boolean =>
		target instanceof Node && (target === container || container.contains(target))
	const forwardMouseMove = (event: MouseEvent) => {
		if (isContainerEventTarget(event.target)) return
		mouse.mousemove(event)
	}
	const forwardMouseUp = (event: MouseEvent) => {
		if (isContainerEventTarget(event.target)) return
		mouse.mouseup(event)
	}

	// ─── Touch: drag a body vs. scroll the page ───
	// Matter's built-in touch handlers always call preventDefault(), which blocks
	// native page scrolling on mobile (scenes are often taller than the viewport).
	// Replace them so a touch only starts a drag when it lands on a throwable body;
	// otherwise the browser is free to scroll the page or pinch-zoom.
	let touchDragging = false
	const bodyUnderTouch = (touch: Touch): boolean => {
		// While paused (settings paused, picker mode, physics disabled) let the page scroll.
		if (!runner.enabled) return false
		const rect = container.getBoundingClientRect()
		const point = { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
		const draggable: Matter.Body[] = []
		for (const [, pb] of bodies) {
			if (!pb.body.isStatic) draggable.push(pb.body)
		}
		return Query.point(draggable, point).length > 0
	}
	const onTouchStart = (event: TouchEvent) => {
		// Let multi-touch gestures (pinch-zoom) pass through to the browser.
		if (event.touches.length !== 1 || !bodyUnderTouch(event.touches[0])) {
			touchDragging = false
			return
		}
		touchDragging = true
		event.preventDefault()
		mouse.mousedown(event)
	}
	const onTouchMove = (event: TouchEvent) => {
		if (!touchDragging) return
		event.preventDefault()
		mouse.mousemove(event)
	}
	const onTouchEnd = (event: TouchEvent) => {
		if (!touchDragging) return
		event.preventDefault()
		mouse.mouseup(event)
		touchDragging = false
	}

	// Remove Matter's default container touch + wheel listeners (added by Mouse.create).
	// The wheel listener is non-passive and calls preventDefault(), blocking page scroll.
	container.removeEventListener("touchmove", mouse.mousemove)
	container.removeEventListener("touchstart", mouse.mousedown)
	container.removeEventListener("touchend", mouse.mouseup)
	if (mouseWithWheel.mousewheel) {
		container.removeEventListener("wheel", mouseWithWheel.mousewheel)
	}

	const removeMouseListeners = () => {
		container.removeEventListener("mousemove", mouse.mousemove)
		container.removeEventListener("mousedown", mouse.mousedown)
		container.removeEventListener("mouseup", mouse.mouseup)
		container.removeEventListener("touchstart", onTouchStart)
	}

	container.addEventListener("touchstart", onTouchStart, { passive: false })
	ownerWindow.addEventListener("mousemove", forwardMouseMove, { passive: true })
	ownerWindow.addEventListener("mouseup", forwardMouseUp, { passive: true })
	ownerWindow.addEventListener("touchmove", onTouchMove, { passive: false })
	ownerWindow.addEventListener("touchend", onTouchEnd, { passive: false })
	ownerWindow.addEventListener("touchcancel", onTouchEnd, { passive: false })

	const mouseConstraint = MouseConstraint.create(engine, {
		mouse,
		constraint: {
			stiffness: 0.6,
			damping: 0.12,
			render: { visible: false },
		},
	})

	World.add(engine.world, mouseConstraint)
	// Matter's DOM mouse position is already computed in element-local coordinates.
	// Adding page-scroll-derived offsets here makes drag targeting drift the farther
	// down the page the stage is rendered.
	Mouse.setOffset(mouse, { x: 0, y: 0 })

	Events.on(engine, "afterUpdate", () => {
		for (const [, pb] of bodies) {
			clampBodyToBounds(pb, W, H)
		}
	})

	Runner.run(runner, engine)

	return {
		engine,
		runner,
		bodies,
		walls,
		mouseConstraint,

		destroy() {
			Runner.stop(runner)
			World.clear(engine.world, false)
			Engine.clear(engine)
			removeMouseListeners()
			ownerWindow.removeEventListener("mousemove", forwardMouseMove)
			ownerWindow.removeEventListener("mouseup", forwardMouseUp)
			ownerWindow.removeEventListener("touchmove", onTouchMove)
			ownerWindow.removeEventListener("touchend", onTouchEnd)
			ownerWindow.removeEventListener("touchcancel", onTouchEnd)
		},

		reset() {
			for (const [, pb] of bodies) {
				if (pb.body.isStatic) continue
				Body.setPosition(pb.body, {
					x: pb.originalX + pb.originalW / 2,
					y: pb.originalY + pb.originalH / 2,
				})
				Body.setAngle(pb.body, 0)
				Body.setVelocity(pb.body, { x: pb.initialVelocityX, y: pb.initialVelocityY })
				Body.setAngularVelocity(pb.body, 0)
			}
		},

		pause() {
			runner.enabled = false
		},
		resume() {
			runner.enabled = true
		},

		explode() {
			for (const [, pb] of bodies) {
				if (pb.body.isStatic) continue
				Body.setVelocity(pb.body, { x: (Math.random() - 0.5) * 35, y: -(Math.random() * 25 + 8) })
				Body.setAngularVelocity(pb.body, (Math.random() - 0.5) * 0.4)
			}
		},

		setGravity(x: number, y: number) {
			engine.gravity.x = x
			engine.gravity.y = y
		},

		setRestitution(value: number) {
			for (const [, pb] of bodies) {
				if (pb.body.isStatic) continue
				pb.body.restitution = value
			}
		},

		setAllowRotation(value: boolean) {
			rotationAllowed = value
			if (!value) {
				for (const [, pb] of bodies) {
					if (pb.body.isStatic) continue
					Body.setAngle(pb.body, 0)
					Body.setAngularVelocity(pb.body, 0)
				}
			}
		},

		resize(width: number, height: number) {
			if (width <= 0 || height <= 0) return

			const prevW = W
			const prevH = H
			W = width
			H = height
			replaceWalls(W, H)

			for (const [, pb] of bodies) {
				if (pb.body.isStatic) continue

				const originalCenterX = pb.originalX + pb.originalW / 2
				const originalCenterY = pb.originalY + pb.originalH / 2
				const snappedToOldRight = Math.abs(pb.body.position.x - (prevW - pb.originalW / 2)) < 0.5
				const snappedToOldBottom = Math.abs(pb.body.position.y - (prevH - pb.originalH / 2)) < 0.5
				const originalWasOutsideOldBounds =
					pb.originalX + pb.originalW > prevW || pb.originalY + pb.originalH > prevH
				const originalFitsNewBounds =
					pb.originalX >= 0 &&
					pb.originalY >= 0 &&
					pb.originalX + pb.originalW <= W &&
					pb.originalY + pb.originalH <= H

				if (
					originalWasOutsideOldBounds &&
					originalFitsNewBounds &&
					(snappedToOldRight || snappedToOldBottom)
				) {
					Body.setPosition(pb.body, { x: originalCenterX, y: originalCenterY })
					Body.setVelocity(pb.body, { x: 0, y: 0 })
					if (!elementsById.get(pb.elementId)?.lockRotation) {
						Body.setAngularVelocity(pb.body, 0)
					}
				}

				clampBodyToBounds(pb, W, H)
			}
		},

		addBody(el: SceneElement) {
			if (bodies.has(el.id)) return
			addElementBody(el)
		},

		removeBody(id: string) {
			const pb = bodies.get(id)
			if (!pb) return
			World.remove(engine.world, pb.body)
			bodies.delete(id)
			elementsById.delete(id)
		},

		updateAlphaBounds(id: string, bounds: AlphaTightBounds | null) {
			const pb = bodies.get(id)
			if (!pb || pb.body.isStatic) return

			const el = elementsById.get(id)
			if (!el) return

			if (!bounds) {
				// Reset to full element bounds
				if (pb.alphaBoundsOffset) {
					pb.alphaBoundsOffset = undefined
					const newW = pb.originalW
					const newH = pb.originalH
					// Scale the body vertices to match new size
					const scaleX = newW / (pb.body.bounds.max.x - pb.body.bounds.min.x)
					const scaleY = newH / (pb.body.bounds.max.y - pb.body.bounds.min.y)
					if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
						Body.scale(pb.body, scaleX, scaleY)
					}
				}
				return
			}

			// Compute physics body dimensions from alpha bounds
			const physicsW = (bounds.right - bounds.left) * pb.originalW
			const physicsH = (bounds.bottom - bounds.top) * pb.originalH

			// Offset from visual center to physics center
			const visualCenterX = pb.originalW / 2
			const visualCenterY = pb.originalH / 2
			const physicsCenterX = ((bounds.left + bounds.right) / 2) * pb.originalW
			const physicsCenterY = ((bounds.top + bounds.bottom) / 2) * pb.originalH
			const dx = physicsCenterX - visualCenterX
			const dy = physicsCenterY - visualCenterY

			// Store the offset for position calculations
			const prevOffset = pb.alphaBoundsOffset
			pb.alphaBoundsOffset = { dx, dy, physicsW, physicsH }

			// Scale the body to match new bounds
			const currentW = pb.body.bounds.max.x - pb.body.bounds.min.x
			const currentH = pb.body.bounds.max.y - pb.body.bounds.min.y
			const scaleX = physicsW / currentW
			const scaleY = physicsH / currentH

			if (Math.abs(scaleX - 1) > 0.02 || Math.abs(scaleY - 1) > 0.02) {
				Body.scale(pb.body, scaleX, scaleY)
			}

			// If offset changed significantly, adjust body position
			if (prevOffset) {
				const offsetDx = dx - prevOffset.dx
				const offsetDy = dy - prevOffset.dy
				if (Math.abs(offsetDx) > 1 || Math.abs(offsetDy) > 1) {
					Body.translate(pb.body, { x: offsetDx, y: offsetDy })
				}
			}
		},

		getBodyPositions() {
			const positions = new Map<
				string,
				{ x: number; y: number; angle: number; w: number; h: number }
			>()
			for (const [id, pb] of bodies) {
				if (pb.body.isStatic) continue
				// If we have alpha bounds offset, adjust the visual position
				const offset = pb.alphaBoundsOffset
				if (offset) {
					// Physics body is centered on alpha content, but we need to report
					// the visual element position (top-left of full image)
					positions.set(id, {
						x: pb.body.position.x - offset.dx - pb.originalW / 2,
						y: pb.body.position.y - offset.dy - pb.originalH / 2,
						angle: pb.body.angle,
						w: pb.originalW,
						h: pb.originalH,
					})
				} else {
					positions.set(id, {
						x: pb.body.position.x - pb.originalW / 2,
						y: pb.body.position.y - pb.originalH / 2,
						angle: pb.body.angle,
						w: pb.originalW,
						h: pb.originalH,
					})
				}
			}
			return positions
		},
	}
}
