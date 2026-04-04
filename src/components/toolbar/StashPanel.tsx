import { type DragEvent as ReactDragEvent, useCallback, useState } from "react"
import type { SavedElement } from "../../scene/types"
import { isAcceptableStashImageFile } from "../../utils/stashImageFromFile"

interface StashPanelProps {
	savedElements: SavedElement[]
	onDropSaved: (saved: SavedElement, x?: number, y?: number) => void
	onRemoveSaved: (index: number) => void
	onSaveStashImageFiles?: (files: File[]) => void
	savePickerMode: boolean
	onToggleSavePicker: () => void
	onClose: () => void
}

export function StashPanel({
	savedElements,
	onDropSaved,
	onRemoveSaved,
	onSaveStashImageFiles,
	savePickerMode,
	onToggleSavePicker,
	onClose,
}: StashPanelProps) {
	const [hoveredStash, setHoveredStash] = useState<{ index: number; top: number } | null>(null)

	const handleStashImageDragOver = useCallback((e: ReactDragEvent) => {
		if (![...e.dataTransfer.types].includes("Files")) return
		e.preventDefault()
		e.dataTransfer.dropEffect = "copy"
	}, [])

	const handleStashImageDrop = useCallback(
		(e: ReactDragEvent) => {
			e.preventDefault()
			const files = [...(e.dataTransfer.files ?? [])].filter((f) => isAcceptableStashImageFile(f))
			if (files.length) onSaveStashImageFiles?.(files)
		},
		[onSaveStashImageFiles],
	)

	return (
		<>
			<div
				data-domino-toolbar-root="true"
				style={{ ...flyoutBase, bottom: 56, right: 16, width: 300 }}
				onDragOver={handleStashImageDragOver}
				onDrop={handleStashImageDrop}
			>
				<div
					style={{
						padding: "10px 14px 6px",
						borderBottom: "1px solid rgba(255,255,255,0.06)",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Saved Components</div>
					<button
						onClick={() => {
							onClose()
							onToggleSavePicker()
						}}
						style={{
							...tinyBtnStyle,
							color: savePickerMode ? "#c4b5fd" : "#a78bfa",
							borderColor: savePickerMode ? "rgba(196,181,253,0.35)" : undefined,
						}}
					>
						{savePickerMode ? "Done picking" : "Pick from page"}
					</button>
				</div>
				<div style={{ padding: "6px 10px", maxHeight: 260, overflowY: "auto" }}>
					{savedElements.length === 0 ? (
						<div
							style={{
								padding: "14px 4px",
								color: "#555",
								fontSize: 10,
								fontFamily: '"DM Sans", sans-serif',
								lineHeight: 1.6,
							}}
						>
							Drop image files here, or use `Pick from page` or the component picker.
						</div>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
							{savedElements.map((s, i) => (
								<div
									key={i}
									draggable
									onDragStart={(e) => {
										e.dataTransfer.setData("application/domino-saved", JSON.stringify(s))
										e.dataTransfer.effectAllowed = "copy"
										const pw = Math.min(s.element.rect.width, 200)
										const ph = Math.min(s.element.rect.height, 120)
										const preview = document.createElement("div")
										preview.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${pw}px;height:${ph}px;background:${s.element.backgroundColor || "transparent"};border-radius:${s.element.borderRadius ?? 0}px;border:${s.element.border || "none"};box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;font-size:${Math.min(s.element.fontSize ?? 13, 14)}px;font-family:${s.element.fontFamily || "sans-serif"};color:${s.element.color || "#333"};padding:8px;box-sizing:border-box;overflow:hidden;`
										if (s.element.type === "image" && s.element.imageSrc) {
											const im = document.createElement("img")
											im.src = s.element.imageSrc
											im.alt = ""
											im.draggable = false
											im.style.cssText = `width:100%;height:100%;object-fit:cover;display:block;border-radius:${Math.max(0, (s.element.borderRadius ?? 0) - 2)}px`
											preview.textContent = ""
											preview.appendChild(im)
										} else {
											preview.textContent = s.element.text?.slice(0, 30) || s.element.type
										}
										document.body.appendChild(preview)
										e.dataTransfer.setDragImage(
											preview,
											preview.offsetWidth / 2,
											preview.offsetHeight / 2,
										)
										requestAnimationFrame(() => document.body.removeChild(preview))
									}}
									onMouseEnter={(e) =>
										setHoveredStash({
											index: i,
											top: e.currentTarget.getBoundingClientRect().top,
										})
									}
									onMouseLeave={() => setHoveredStash(null)}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										padding: "5px 6px",
										borderRadius: 6,
										backgroundColor: "rgba(255,255,255,0.03)",
										border: "1px solid rgba(255,255,255,0.04)",
										cursor: "grab",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											minWidth: 0,
										}}
									>
										<div
											style={{
												width: 22,
												height: 22,
												borderRadius: 4,
												flexShrink: 0,
												backgroundColor: s.element.backgroundColor ?? "transparent",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 7,
												color: s.element.color ?? "#999",
												fontFamily: '"JetBrains Mono", monospace',
												overflow: "hidden",
											}}
										>
											{s.element.type === "image" && s.element.imageSrc ? (
												<img
													src={s.element.imageSrc}
													alt=""
													draggable={false}
													style={{
														width: "100%",
														height: "100%",
														objectFit: "cover",
													}}
												/>
											) : (
												s.element.type.slice(0, 3)
											)}
										</div>
										<div style={{ minWidth: 0 }}>
											<div
												style={{
													fontSize: 10,
													color: "#ddd",
													fontWeight: 500,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{s.element.type === "image"
													? (s.element.imageAlt || "Image").slice(0, 24)
													: s.element.text?.slice(0, 20) || s.element.type}
											</div>
											<div style={{ fontSize: 8, color: "#666" }}>{s.sourceScene}</div>
										</div>
									</div>
									<div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
										<button
											onClick={() => onDropSaved(s)}
											style={{ ...tinyBtnStyle, color: "#a78bfa" }}
										>
											Drop
										</button>
										<button
											onClick={() => onRemoveSaved(i)}
											style={{ ...tinyBtnStyle, color: "#666" }}
										>
											&times;
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
				<div style={{ height: 4 }} />
			</div>
			{/* Stash preview tooltip — rendered outside flyout to avoid backdropFilter containing block clipping */}
			{hoveredStash !== null &&
				hoveredStash.index < savedElements.length &&
				(() => {
					const el = savedElements[hoveredStash.index].element
					const maxW = 160
					const maxH = 120
					const scale = Math.min(1, maxW / el.rect.width, maxH / el.rect.height)
					const previewW = Math.round(el.rect.width * scale)
					const previewH = Math.round(el.rect.height * scale)
					return (
						<div
							style={{
								position: "fixed",
								right: 326,
								top: Math.max(
									12,
									Math.min(hoveredStash.top - 10, window.innerHeight - previewH - 50),
								),
								zIndex: 10000,
								padding: 8,
								borderRadius: 8,
								backgroundColor: "rgba(20,20,24,0.95)",
								backdropFilter: "blur(20px)",
								border: "1px solid rgba(255,255,255,0.08)",
								boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
								pointerEvents: "none",
								fontFamily: '"DM Sans", sans-serif',
							}}
						>
							<div
								style={{
									width: previewW,
									height: previewH,
									backgroundColor: el.backgroundColor || "transparent",
									borderRadius: Math.round((el.borderRadius ?? 0) * scale),
									border: el.border,
									overflow: "hidden",
									display: "flex",
									alignItems: el.text ? "flex-start" : "center",
									justifyContent: "center",
									fontSize: Math.max(6, Math.round((el.fontSize ?? 14) * scale)),
									fontFamily: el.fontFamily || "sans-serif",
									color: el.color || "#333",
									boxSizing: "border-box",
									lineHeight: 1.3,
								}}
							>
								{el.imageSrc ? (
									<img
										src={el.imageSrc}
										alt=""
										style={{
											width: "100%",
											height: "100%",
											objectFit: "cover",
										}}
									/>
								) : el.text ? (
									<div
										style={{
											padding: Math.max(2, Math.round((el.padding ?? 8) * scale)),
											overflow: "hidden",
											wordBreak: "break-word",
										}}
									>
										{el.text.slice(0, 80)}
									</div>
								) : (
									<div style={{ color: "#999", fontSize: 9 }}>{el.type}</div>
								)}
							</div>
							<div
								style={{
									marginTop: 4,
									fontSize: 8,
									color: "#555",
									textAlign: "center",
								}}
							>
								{Math.round(el.rect.width)} × {Math.round(el.rect.height)}
							</div>
						</div>
					)
				})()}
		</>
	)
}

// ─── Styles ───
const flyoutBase: React.CSSProperties = {
	position: "fixed",
	zIndex: 9998,
	maxHeight: "calc(100vh - 80px)",
	overflowY: "auto",
	borderRadius: 12,
	border: "1px solid rgba(255,255,255,0.08)",
	backgroundColor: "rgba(20,20,24,0.95)",
	backdropFilter: "blur(20px)",
	boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
	fontFamily: '"DM Sans", sans-serif',
	color: "#ccc",
	animation: "flyUp 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
}
const tinyBtnStyle: React.CSSProperties = {
	padding: "2px 6px",
	borderRadius: 4,
	border: "1px solid rgba(255,255,255,0.08)",
	backgroundColor: "transparent",
	fontSize: 9,
	fontWeight: 600,
	fontFamily: '"DM Sans", sans-serif',
	cursor: "pointer",
	whiteSpace: "nowrap" as const,
}
