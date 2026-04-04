import type { LayoutCursor } from "@chenglou/pretext"
import { memo, useEffect, useMemo } from "react"
import type { ObstacleRect } from "../scene/types"
import type { FlowLine, TextFlowResult } from "../textflow/useTextFlow"
import { computeTextFlow } from "../textflow/useTextFlow"
import { parseFontShorthand } from "../utils/fonts"
import type { InlineStyleRun } from "./snapshotHelpers"

interface TextFlowRegionProps {
	text: string
	font: string
	fontSize: number
	lineHeight: number
	color: string
	opacity?: number
	letterSpacing?: string
	textAlign?: string
	containerX: number
	containerY: number
	containerWidth: number
	containerMaxHeight: number
	obstacles: ObstacleRect[]
	flow?: TextFlowResult
	inlineStyles?: InlineStyleRun[]
	showDebug?: boolean
	generation: number
	onLineCount?: (count: number) => void
	minSegmentWidth?: number
	allowWordBreaks?: boolean
	startCursor?: LayoutCursor
	onEndCursor?: (cursor: LayoutCursor) => void
}

function renderStyledLine(line: FlowLine, inlineStyles?: InlineStyleRun[]): React.ReactNode {
	if (!inlineStyles || inlineStyles.length === 0) return line.text

	const lineStart = line.charOffset
	const lineEnd = lineStart + line.text.length

	// Find runs that overlap this line
	const overlapping = inlineStyles.filter((r) => r.start < lineEnd && r.end > lineStart)
	if (overlapping.length === 0) return line.text

	// Build segments: split the line text at run boundaries
	const cuts = new Set<number>()
	cuts.add(0)
	cuts.add(line.text.length)
	for (const run of overlapping) {
		const s = Math.max(0, run.start - lineStart)
		const e = Math.min(line.text.length, run.end - lineStart)
		cuts.add(s)
		cuts.add(e)
	}
	const sorted = Array.from(cuts).sort((a, b) => a - b)

	const parts: React.ReactNode[] = []
	for (let j = 0; j < sorted.length - 1; j++) {
		const s = sorted[j]
		const e = sorted[j + 1]
		const substr = line.text.slice(s, e)
		if (!substr) continue

		const absStart = lineStart + s
		const absEnd = lineStart + e
		// Find the most specific (innermost/last) run covering this segment
		const run = overlapping.findLast((r) => r.start <= absStart && r.end >= absEnd)

		if (!run) {
			parts.push(substr)
		} else {
			const spanStyle: React.CSSProperties = {}
			if (run.fontWeight) spanStyle.fontWeight = run.fontWeight
			if (run.fontStyle) spanStyle.fontStyle = run.fontStyle
			if (run.fontFamily) spanStyle.fontFamily = run.fontFamily
			if (run.color) spanStyle.color = run.color
			if (run.textDecoration) spanStyle.textDecoration = run.textDecoration
			parts.push(
				<span key={j} style={spanStyle}>
					{substr}
				</span>,
			)
		}
	}
	return parts
}

export const TextFlowRegion = memo(function TextFlowRegion({
	text,
	font,
	fontSize,
	lineHeight,
	color,
	opacity,
	letterSpacing,
	textAlign,
	containerX,
	containerY,
	containerWidth,
	containerMaxHeight,
	obstacles,
	flow: providedFlow,
	inlineStyles,
	showDebug,
	generation,
	onLineCount,
	minSegmentWidth = 8,
	allowWordBreaks = true,
	startCursor,
	onEndCursor,
}: TextFlowRegionProps) {
	const flow = useMemo(() => {
		if (providedFlow) return providedFlow
		return computeTextFlow(
			text,
			font,
			lineHeight,
			containerX,
			containerY,
			containerWidth,
			containerMaxHeight,
			obstacles,
			8,
			minSegmentWidth,
			allowWordBreaks,
			startCursor,
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		providedFlow,
		text,
		font,
		lineHeight,
		containerX,
		containerY,
		containerWidth,
		containerMaxHeight,
		obstacles,
		generation,
		minSegmentWidth,
		allowWordBreaks,
		startCursor,
	])

	useEffect(() => {
		onLineCount?.(flow.lines.length)
	}, [flow, onLineCount])

	useEffect(() => {
		onEndCursor?.(flow.endCursor)
	}, [flow, onEndCursor])

	const { style, weight, family } = useMemo(() => parseFontShorthand(font), [font])

	return (
		<>
			{flow.lines.map((line: FlowLine, i: number) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: line.x,
						top: line.y,
						width: textAlign ? line.maxWidth : undefined,
						height: lineHeight,
						fontSize,
						lineHeight: `${lineHeight}px`,
						fontFamily: family,
						fontStyle: style,
						fontWeight: weight,
						color,
						opacity,
						letterSpacing,
						textAlign: textAlign as React.CSSProperties["textAlign"] | undefined,
						whiteSpace: "pre",
						overflow: "visible",
						pointerEvents: "none",
						zIndex: 11,
					}}
				>
					{renderStyledLine(line, inlineStyles)}
				</div>
			))}
			{showDebug &&
				flow.lines.map((line: FlowLine, i: number) => (
					<div
						key={`dbg-${i}`}
						style={{
							position: "absolute",
							left: line.x,
							top: line.y,
							width: line.maxWidth,
							height: lineHeight,
							border: "1px solid rgba(59, 130, 246, 0.3)",
							backgroundColor: "rgba(59, 130, 246, 0.04)",
							pointerEvents: "none",
							boxSizing: "border-box",
							zIndex: 50,
						}}
					/>
				))}
		</>
	)
})
