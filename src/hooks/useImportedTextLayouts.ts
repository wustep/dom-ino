import { useMemo, useRef } from "react"
import type { InlineStyleRun, SnapshotTextBlock } from "../scene/snapshotHelpers"
import {
	extractInlineStyles,
	restoreRevealedAncestors,
	revealHiddenAncestors,
} from "../scene/snapshotHelpers"
import type { ObstacleRect, SceneElement } from "../scene/types"
import { getObstacleAABB } from "../textflow/obstacles"
import { computeTextFlow, type TextFlowResult } from "../textflow/useTextFlow"
import { buildFontString, DEFAULT_SANS } from "../utils/fonts"

/** Layout result for a single imported text block: position, dimensions, text flow, and optional inline styles. */
export type ImportedTextLayout = {
	id: string
	sceneElement: SceneElement
	containerX: number
	containerY: number
	containerWidth: number
	containerMaxHeight: number
	flow: TextFlowResult
	inlineStyles?: InlineStyleRun[]
}

type CachedLayout = {
	layout: ImportedTextLayout
	inputs: string
	obstacleSignature: string
}

/**
 * Obstacles are snapped to whole pixels (and ~0.6° of rotation) before
 * layout. Sub-pixel drift of a settling body otherwise invalidates every
 * nearby block each frame for no visible change.
 */
function quantizeObstacle(obs: ObstacleRect): ObstacleRect {
	return {
		...obs,
		x: Math.round(obs.x),
		y: Math.round(obs.y),
		width: Math.round(obs.width),
		height: Math.round(obs.height),
		angle: Math.round(obs.angle * 100) / 100,
	}
}

const alphaRowIds = new WeakMap<object, number>()
let nextAlphaRowId = 1
function alphaRowsKey(rows: ObstacleRect["alphaRows"]): number {
	if (!rows) return 0
	let id = alphaRowIds.get(rows)
	if (id === undefined) {
		id = nextAlphaRowId++
		alphaRowIds.set(rows, id)
	}
	return id
}

type PreparedObstacle = {
	obstacle: ObstacleRect
	left: number
	right: number
	top: number
	bottom: number
	signature: string
}

function prepareObstacles(obstacles: ObstacleRect[]): PreparedObstacle[] {
	return obstacles.map((raw) => {
		const obstacle = quantizeObstacle(raw)
		const box = getObstacleAABB(obstacle)
		return {
			obstacle,
			...box,
			signature: `${obstacle.id}:${obstacle.x},${obstacle.y},${obstacle.width},${obstacle.height},${obstacle.angle},${obstacle.borderRadius ?? 0},${alphaRowsKey(obstacle.alphaRows)}`,
		}
	})
}

/**
 * Computes text flow layouts for imported snapshot text blocks, positioning
 * each block below any previously placed blocks that overlap horizontally.
 *
 * Runs every physics frame, so work is cached per block: a block is only
 * re-laid out when its own inputs change or an obstacle overlapping the rows
 * it occupied last time moves (a block's layout only depends on obstacles
 * intersecting the rows it walks). Inline style runs depend only on the DOM
 * and are extracted once per block set rather than per frame.
 */
export function useImportedTextLayouts(
	active: boolean,
	sortedTextBlocks: SnapshotTextBlock[],
	obstacles: ObstacleRect[],
	iframeHeight: number,
	iframeRef: React.RefObject<HTMLIFrameElement | null>,
): ImportedTextLayout[] {
	const inlineStylesByBlock = useMemo(() => {
		const byBlock = new Map<string, InlineStyleRun[] | undefined>()
		const win = active ? iframeRef.current?.contentWindow : null
		if (!win) return byBlock
		for (const block of sortedTextBlocks) {
			const revealedNodes = revealHiddenAncestors(block.node)
			try {
				const runs = extractInlineStyles(block.node, win)
				byBlock.set(block.id, runs.length > 0 ? runs : undefined)
			} catch {
				/* style lookup can fail inside the sandboxed iframe */
			} finally {
				restoreRevealedAncestors(revealedNodes)
			}
		}
		return byBlock
	}, [active, sortedTextBlocks, iframeRef])

	const cacheRef = useRef(new Map<string, CachedLayout>())

	return useMemo(() => {
		const cache = cacheRef.current
		if (!active) {
			cache.clear()
			return []
		}

		const prepared = prepareObstacles(obstacles)
		const nextCache = new Map<string, CachedLayout>()
		const placed: Array<{ textBottom: number; contentLeft: number; contentRight: number }> = []
		const layouts: ImportedTextLayout[] = []

		for (const block of sortedTextBlocks) {
			const el = block.sceneElement
			const paddingX = el.padding ?? 0
			const paddingY = el.paddingVertical ?? paddingX
			const fs = el.fontSize ?? 16
			const font = buildFontString(fs, el.fontWeight, el.fontFamily ?? DEFAULT_SANS, el.fontStyle)
			const lineHeight = el.lineHeight ?? Math.round(fs * 1.5)
			const contentLeft = el.rect.x + paddingX
			const contentRight = el.rect.x + el.rect.width - paddingX
			const originalTextTop = el.rect.y + paddingY

			let shiftedTextTop = originalTextTop
			const currentWidth = contentRight - contentLeft
			for (const prev of placed) {
				const overlapWidth =
					Math.min(contentRight, prev.contentRight) - Math.max(contentLeft, prev.contentLeft)
				// Require the overlap to cover at least half of the narrower block so
				// that blocks in separate columns (e.g. left vs right on Wikipedia's
				// main page) don't cascade-push each other down.
				const minWidth = Math.min(currentWidth, prev.contentRight - prev.contentLeft)
				if (overlapWidth < minWidth * 0.5) continue
				if (prev.textBottom + 4 > shiftedTextTop) {
					shiftedTextTop = prev.textBottom + 4
				}
			}

			const remainingHeight = Math.max(0, iframeHeight - shiftedTextTop - paddingY - 24)
			if (remainingHeight < fs) continue
			const containerWidth = Math.max(0, el.rect.width - paddingX * 2)
			const inlineStyles = inlineStylesByBlock.get(block.id)

			// Only obstacles that can block this block's rows matter.
			const reachable = prepared.filter(
				(o) =>
					o.right > contentLeft &&
					o.left < contentRight &&
					o.bottom > shiftedTextTop &&
					o.top < shiftedTextTop + remainingHeight,
			)
			const inputs = `${shiftedTextTop}|${remainingHeight}|${containerWidth}|${contentLeft}|${font}|${lineHeight}`
			const previous = cache.get(block.id)
			const occupiedBottom = shiftedTextTop + (previous?.layout.flow.totalHeight ?? remainingHeight)
			const obstacleSignature = reachable
				.filter((o) => o.top < occupiedBottom + lineHeight)
				.map((o) => o.signature)
				.join(";")

			let layout: ImportedTextLayout
			if (
				previous &&
				previous.layout.sceneElement === el &&
				previous.layout.inlineStyles === inlineStyles &&
				previous.inputs === inputs &&
				previous.obstacleSignature === obstacleSignature
			) {
				layout = previous.layout
			} else {
				const flow = computeTextFlow(
					el.text ?? "",
					font,
					lineHeight,
					contentLeft,
					shiftedTextTop,
					containerWidth,
					remainingHeight,
					reachable.map((o) => o.obstacle),
				)
				layout = {
					id: block.id,
					sceneElement: el,
					containerX: contentLeft,
					containerY: shiftedTextTop,
					containerWidth,
					containerMaxHeight: remainingHeight,
					flow,
					inlineStyles,
				}
			}
			// Key the signature to the rows actually used by the (new) layout.
			const usedBottom = shiftedTextTop + layout.flow.totalHeight
			nextCache.set(block.id, {
				layout,
				inputs,
				obstacleSignature:
					layout === previous?.layout
						? obstacleSignature
						: reachable
								.filter((o) => o.top < usedBottom + lineHeight)
								.map((o) => o.signature)
								.join(";"),
			})

			layouts.push(layout)
			placed.push({ textBottom: usedBottom, contentLeft, contentRight })
		}

		cacheRef.current = nextCache
		return layouts
	}, [active, iframeHeight, inlineStylesByBlock, obstacles, sortedTextBlocks])
}
