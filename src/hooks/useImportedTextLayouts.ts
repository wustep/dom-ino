import { useMemo } from "react"
import type { InlineStyleRun, SnapshotTextBlock } from "../components/snapshotHelpers"
import {
	extractInlineStyles,
	restoreRevealedAncestors,
	revealHiddenAncestors,
} from "../components/snapshotHelpers"
import type { ObstacleRect, SceneElement } from "../scene/types"
import { computeTextFlow, type TextFlowResult } from "../textflow/useTextFlow"
import { buildFontString, DEFAULT_SANS } from "../utils/fonts"

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

/**
 * Computes text flow layouts for imported snapshot text blocks, positioning
 * each block below any previously placed blocks that overlap horizontally.
 */
export function useImportedTextLayouts(
	active: boolean,
	sortedTextBlocks: SnapshotTextBlock[],
	obstacles: ObstacleRect[],
	iframeHeight: number,
	iframeRef: React.RefObject<HTMLIFrameElement | null>,
): ImportedTextLayout[] {
	return useMemo(() => {
		if (!active) return []

		const placed: Array<
			ImportedTextLayout & { textBottom: number; contentLeft: number; contentRight: number }
		> = []
		const layouts: ImportedTextLayout[] = []

		for (const block of sortedTextBlocks) {
			const el = block.sceneElement
			const paddingX = el.padding ?? 0
			const paddingY = el.paddingVertical ?? paddingX
			const fs = el.fontSize ?? 16
			const font = buildFontString(fs, el.fontWeight, el.fontFamily ?? DEFAULT_SANS, el.fontStyle)
			const contentLeft = el.rect.x + paddingX
			const contentRight = el.rect.x + el.rect.width - paddingX
			const originalTextTop = el.rect.y + paddingY

			let shiftedTextTop = originalTextTop
			for (const prev of placed) {
				const overlapsHorizontally =
					Math.min(contentRight, prev.contentRight) - Math.max(contentLeft, prev.contentLeft) > 12
				if (!overlapsHorizontally) continue
				if (prev.textBottom + 4 > shiftedTextTop) {
					shiftedTextTop = prev.textBottom + 4
				}
			}

			const remainingHeight = Math.max(0, iframeHeight - shiftedTextTop - paddingY - 24)
			if (remainingHeight < fs) continue

			const flow = computeTextFlow(
				el.text ?? "",
				font,
				el.lineHeight ?? Math.round(fs * 1.5),
				contentLeft,
				shiftedTextTop,
				Math.max(0, el.rect.width - paddingX * 2),
				remainingHeight,
				obstacles,
			)

			const containerWidth = Math.max(0, el.rect.width - paddingX * 2)
			const win = iframeRef.current?.contentWindow
			let inlineStyles: InlineStyleRun[] | undefined
			if (win) {
				const revealedNodes = revealHiddenAncestors(block.node)
				try {
					inlineStyles = extractInlineStyles(block.node, win)
				} catch {
					/* */
				} finally {
					restoreRevealedAncestors(revealedNodes)
				}
				if (inlineStyles && inlineStyles.length === 0) inlineStyles = undefined
			}
			const layout: ImportedTextLayout = {
				id: block.id,
				sceneElement: el,
				containerX: contentLeft,
				containerY: shiftedTextTop,
				containerWidth,
				containerMaxHeight: remainingHeight,
				flow,
				inlineStyles,
			}
			layouts.push(layout)
			placed.push({
				...layout,
				textBottom: shiftedTextTop + flow.totalHeight,
				contentLeft,
				contentRight,
			})
		}

		return layouts
	}, [active, iframeHeight, iframeRef, obstacles, sortedTextBlocks])
}
