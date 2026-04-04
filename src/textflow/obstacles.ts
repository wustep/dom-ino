import type {
	AlphaRowInterval,
	AvailableSegment,
	BlockedInterval,
	ObstacleRect,
	ScenePoint,
} from "../scene/types"

type Point = ScenePoint
const EPSILON = 0.001

/**
 * Obstacle → row exclusion algorithm:
 *
 * For each text row, check which obstacles overlap vertically.
 * For circular obstacles (borderRadius >= width/2 && width === height),
 * compute the exact horizontal chord intersection — much tighter than
 * the bounding box. For rotated rectangles, clip the polygon against the
 * current row band and use that slice's x-extent.
 */

function isCircular(obs: ObstacleRect): boolean {
	if (!obs.borderRadius) return false
	const minDim = Math.min(obs.width, obs.height)
	return obs.borderRadius >= minDim / 2 - 1 && Math.abs(obs.width - obs.height) < 4
}

/**
 * For a circle centered at (cx, cy) with radius r, compute the
 * horizontal interval blocked at a given row band [bandTop, bandBottom].
 * Returns the chord intersection — much narrower than the full width
 * near the top and bottom of the circle.
 */
function circleIntervalForBand(
	cx: number,
	cy: number,
	r: number,
	bandTop: number,
	bandBottom: number,
): BlockedInterval | null {
	if (bandTop >= cy + r || bandBottom <= cy - r) return null
	// Find the closest vertical distance from circle center to the band
	const minDy =
		cy >= bandTop && cy <= bandBottom ? 0 : cy < bandTop ? bandTop - cy : cy - bandBottom
	if (minDy >= r) return null
	const halfChord = Math.sqrt(r * r - minDy * minDy)
	return { left: cx - halfChord, right: cx + halfChord }
}

function getRotatedRectPoints(obs: ObstacleRect): Point[] {
	if (Math.abs(obs.angle) < EPSILON) {
		return [
			{ x: obs.x, y: obs.y },
			{ x: obs.x + obs.width, y: obs.y },
			{ x: obs.x + obs.width, y: obs.y + obs.height },
			{ x: obs.x, y: obs.y + obs.height },
		]
	}

	const cx = obs.x + obs.width / 2
	const cy = obs.y + obs.height / 2
	const hw = obs.width / 2
	const hh = obs.height / 2
	const cos = Math.cos(obs.angle)
	const sin = Math.sin(obs.angle)

	return [
		{ x: -hw, y: -hh },
		{ x: hw, y: -hh },
		{ x: hw, y: hh },
		{ x: -hw, y: hh },
	].map((p) => ({
		x: cx + p.x * cos - p.y * sin,
		y: cy + p.x * sin + p.y * cos,
	}))
}

function getPolygonPoints(obs: ObstacleRect): Point[] {
	if (!obs.polygonPoints || obs.polygonPoints.length < 3) return getRotatedRectPoints(obs)

	const cx = obs.x + obs.width / 2
	const cy = obs.y + obs.height / 2
	const cos = Math.cos(obs.angle)
	const sin = Math.sin(obs.angle)

	return obs.polygonPoints.map((point) => {
		const px = obs.x + point.x * obs.width
		const py = obs.y + point.y * obs.height

		if (Math.abs(obs.angle) < EPSILON) return { x: px, y: py }

		const dx = px - cx
		const dy = py - cy
		return {
			x: cx + dx * cos - dy * sin,
			y: cy + dx * sin + dy * cos,
		}
	})
}

function intersectSegmentWithHorizontalLine(a: Point, b: Point, clipY: number): Point {
	const dy = b.y - a.y
	if (Math.abs(dy) < EPSILON) return { x: b.x, y: clipY }
	const t = (clipY - a.y) / dy
	return {
		x: a.x + (b.x - a.x) * t,
		y: clipY,
	}
}

function clipPolygon(
	points: Point[],
	isInside: (p: Point) => boolean,
	intersect: (a: Point, b: Point) => Point,
): Point[] {
	if (points.length === 0) return []

	const clipped: Point[] = []
	let prev = points[points.length - 1]
	let prevInside = isInside(prev)

	for (const curr of points) {
		const currInside = isInside(curr)

		if (currInside) {
			if (!prevInside) clipped.push(intersect(prev, curr))
			clipped.push(curr)
		} else if (prevInside) {
			clipped.push(intersect(prev, curr))
		}

		prev = curr
		prevInside = currInside
	}

	return clipped
}

function polygonIntervalForBand(
	obs: ObstacleRect,
	bandTop: number,
	bandBottom: number,
): BlockedInterval | null {
	if (obs.physicsShape !== "polygon" && Math.abs(obs.angle) < EPSILON) {
		if (obs.y >= bandBottom || obs.y + obs.height <= bandTop) return null
		return { left: obs.x, right: obs.x + obs.width }
	}

	let clipped = getPolygonPoints(obs)
	clipped = clipPolygon(
		clipped,
		(p) => p.y >= bandTop - EPSILON,
		(a, b) => intersectSegmentWithHorizontalLine(a, b, bandTop),
	)
	clipped = clipPolygon(
		clipped,
		(p) => p.y <= bandBottom + EPSILON,
		(a, b) => intersectSegmentWithHorizontalLine(a, b, bandBottom),
	)

	if (clipped.length === 0) return null

	let left = clipped[0].x
	let right = clipped[0].x
	for (let i = 1; i < clipped.length; i++) {
		left = Math.min(left, clipped[i].x)
		right = Math.max(right, clipped[i].x)
	}

	return left < right ? { left, right } : null
}

export function getObstacleAABB(obs: ObstacleRect): {
	left: number
	top: number
	right: number
	bottom: number
} {
	if (obs.physicsShape !== "polygon" && Math.abs(obs.angle) < 0.001) {
		return { left: obs.x, top: obs.y, right: obs.x + obs.width, bottom: obs.y + obs.height }
	}

	const points = getPolygonPoints(obs)
	let left = points[0].x
	let right = points[0].x
	let top = points[0].y
	let bottom = points[0].y

	for (let i = 1; i < points.length; i++) {
		left = Math.min(left, points[i].x)
		right = Math.max(right, points[i].x)
		top = Math.min(top, points[i].y)
		bottom = Math.max(bottom, points[i].y)
	}

	return { left, top, right, bottom }
}

/**
 * For an obstacle with alpha row data, compute the blocked interval at a given row band.
 * Only blocks where there are actual opaque pixels - transparent areas let text through.
 * Handles rotation by transforming the row band into the image's local coordinate space.
 */
function alphaIntervalForBand(
	obs: ObstacleRect,
	alphaRows: AlphaRowInterval[],
	bandTop: number,
	bandBottom: number,
): BlockedInterval | null {
	if (alphaRows.length === 0) return null

	const cx = obs.x + obs.width / 2
	const cy = obs.y + obs.height / 2
	const cos = Math.cos(-obs.angle)
	const sin = Math.sin(-obs.angle)

	// For rotated images, we need to check multiple sample points along the row band
	// and transform them into the image's local coordinate space
	const isRotated = Math.abs(obs.angle) > EPSILON

	if (!isRotated) {
		// Simple case: no rotation
		if (bandTop >= obs.y + obs.height || bandBottom <= obs.y) return null

		const normalizedTop = Math.max(0, (bandTop - obs.y) / obs.height)
		const normalizedBottom = Math.min(1, (bandBottom - obs.y) / obs.height)

		return getAlphaIntervalForNormalizedBand(obs, alphaRows, normalizedTop, normalizedBottom)
	}

	// Rotated case: sample points across the row band width and find the x-extent
	// that intersects with opaque pixels
	const aabb = getObstacleAABB(obs)
	if (bandTop >= aabb.bottom || bandBottom <= aabb.top) return null

	let minX = Infinity
	let maxX = -Infinity
	let foundAny = false

	// Sample across the AABB width
	const sampleCount = Math.max(10, Math.ceil((aabb.right - aabb.left) / 5))
	for (let i = 0; i <= sampleCount; i++) {
		const worldX = aabb.left + (i / sampleCount) * (aabb.right - aabb.left)
		const bandMidY = (bandTop + bandBottom) / 2

		// Transform world point to local image coordinates
		const dx = worldX - cx
		const dy = bandMidY - cy
		const localX = dx * cos - dy * sin
		const localY = dx * sin + dy * cos

		// Convert to normalized coordinates (0-1)
		const normX = (localX / obs.width) + 0.5
		const normY = (localY / obs.height) + 0.5

		if (normX < 0 || normX > 1 || normY < 0 || normY > 1) continue

		// Check if this point is in an opaque region
		const row = findAlphaRowForY(alphaRows, normY)
		if (row && normX >= row.left && normX <= row.right) {
			minX = Math.min(minX, worldX)
			maxX = Math.max(maxX, worldX)
			foundAny = true
		}
	}

	if (!foundAny) return null

	return { left: minX, right: maxX }
}

/**
 * Find the alpha row closest to a normalized Y position.
 */
function findAlphaRowForY(alphaRows: AlphaRowInterval[], normY: number): AlphaRowInterval | null {
	if (alphaRows.length === 0) return null

	// Binary search for closest row
	let closest = alphaRows[0]
	let closestDist = Math.abs(closest.y - normY)

	for (const row of alphaRows) {
		const dist = Math.abs(row.y - normY)
		if (dist < closestDist) {
			closest = row
			closestDist = dist
		}
	}

	// Only return if we're reasonably close (within one row height)
	const rowHeight = 1 / alphaRows.length
	if (closestDist > rowHeight * 1.5) return null

	return closest
}

/**
 * Get alpha interval for a non-rotated obstacle given normalized Y band.
 */
function getAlphaIntervalForNormalizedBand(
	obs: ObstacleRect,
	alphaRows: AlphaRowInterval[],
	normalizedTop: number,
	normalizedBottom: number,
): BlockedInterval | null {
	// Find the actual content bounds from alpha rows
	const minRowY = alphaRows[0].y
	const maxRowY = alphaRows[alphaRows.length - 1].y

	// If the band is entirely outside the opaque content, no blocking
	if (normalizedBottom < minRowY || normalizedTop > maxRowY) return null

	let minLeft = 1
	let maxRight = 0
	let foundAny = false

	// Find all rows that overlap with this band
	for (const row of alphaRows) {
		const rowHeight = 1 / alphaRows.length
		if (row.y + rowHeight >= normalizedTop && row.y <= normalizedBottom + rowHeight) {
			minLeft = Math.min(minLeft, row.left)
			maxRight = Math.max(maxRight, row.right)
			foundAny = true
		}
	}

	// If no direct overlap, interpolate only if we're between opaque rows
	if (!foundAny) {
		const closestAbove = alphaRows
			.filter((r) => r.y < normalizedTop)
			.sort((a, b) => b.y - a.y)[0]
		const closestBelow = alphaRows
			.filter((r) => r.y > normalizedBottom)
			.sort((a, b) => a.y - b.y)[0]

		if (closestAbove && closestBelow) {
			const t = (normalizedTop - closestAbove.y) / (closestBelow.y - closestAbove.y)
			minLeft = closestAbove.left + t * (closestBelow.left - closestAbove.left)
			maxRight = closestAbove.right + t * (closestBelow.right - closestAbove.right)
			foundAny = true
		}
	}

	if (!foundAny || maxRight <= minLeft) return null

	return {
		left: obs.x + minLeft * obs.width,
		right: obs.x + maxRight * obs.width,
	}
}

export function getBlockedIntervalsForRow(
	obstacles: ObstacleRect[],
	rowY: number,
	rowHeight: number,
	containerLeft: number,
	containerRight: number,
): BlockedInterval[] {
	const rowTop = rowY
	const rowBottom = rowY + rowHeight
	const intervals: BlockedInterval[] = []

	for (const obs of obstacles) {
		let interval: BlockedInterval | null = null

		if (obs.alphaRows && obs.alphaRows.length > 0) {
			interval = alphaIntervalForBand(obs, obs.alphaRows, rowTop, rowBottom)
		} else if (isCircular(obs)) {
			const cx = obs.x + obs.width / 2
			const cy = obs.y + obs.height / 2
			const r = obs.width / 2
			interval = circleIntervalForBand(cx, cy, r, rowTop, rowBottom)
		} else {
			interval = polygonIntervalForBand(obs, rowTop, rowBottom)
		}

		if (interval) {
			const left = Math.max(interval.left, containerLeft)
			const right = Math.min(interval.right, containerRight)
			if (left < right) intervals.push({ left, right })
		}
	}

	return mergeIntervals(intervals)
}

function mergeIntervals(intervals: BlockedInterval[]): BlockedInterval[] {
	if (intervals.length <= 1) return intervals
	intervals.sort((a, b) => a.left - b.left)
	const merged: BlockedInterval[] = [intervals[0]]
	for (let i = 1; i < intervals.length; i++) {
		const last = merged[merged.length - 1]
		const curr = intervals[i]
		if (curr.left <= last.right) {
			last.right = Math.max(last.right, curr.right)
		} else {
			merged.push(curr)
		}
	}
	return merged
}

export function getAvailableSegments(
	blocked: BlockedInterval[],
	containerLeft: number,
	containerRight: number,
	minSegmentWidth: number = 40,
): AvailableSegment[] {
	const segments: AvailableSegment[] = []
	let cursor = containerLeft
	for (const interval of blocked) {
		if (interval.left > cursor) {
			const w = interval.left - cursor
			if (w >= minSegmentWidth) segments.push({ left: cursor, width: w })
		}
		cursor = Math.max(cursor, interval.right)
	}
	if (containerRight > cursor) {
		const w = containerRight - cursor
		if (w >= minSegmentWidth) segments.push({ left: cursor, width: w })
	}
	return segments
}
