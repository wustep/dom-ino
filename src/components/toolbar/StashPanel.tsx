import {
	type KeyboardEvent,
	type DragEvent as ReactDragEvent,
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useState,
} from "react"
import { useSavedElements } from "../../contexts/SavedElementsContext"
import type { PickerMode } from "../../hooks/usePickerPause"
import type { SavedElement } from "../../scene/types"
import { isAcceptableStashImageFile, isVideoMediaSrc } from "../../utils/stashImageFromFile"
import { LinkIcon, PickerIcon } from "./icons"

interface StashPanelProps {
	onDropSaved: (saved: SavedElement, x?: number, y?: number) => void
	pickerMode: PickerMode
	onTogglePicker: () => void
	onClose: () => void
}

/** Flyout panel for managing saved elements: drag to drop, remove, or pick more. */
export function StashPanel({ onDropSaved, pickerMode, onTogglePicker, onClose }: StashPanelProps) {
	const {
		savedElements,
		removeSaved: onRemoveSaved,
		saveStashImageFiles: onSaveStashImageFiles,
		saveStashImageUrl: onSaveStashImageUrl,
	} = useSavedElements()
	const [hoveredStash, setHoveredStash] = useState<{ index: number; top: number } | null>(null)
	const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null)
	const [showUrlInput, setShowUrlInput] = useState(false)

	const showTip = useCallback((label: string, e: ReactMouseEvent<HTMLButtonElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		setTooltip({ label, x: rect.left + rect.width / 2, y: rect.top })
	}, [])
	const hideTip = useCallback(() => setTooltip(null), [])
	const [urlInput, setUrlInput] = useState("")
	const [urlState, setUrlState] = useState<"idle" | "loading" | "error_invalid" | "error_load">(
		"idle",
	)

	const handleUrlSubmit = useCallback(async () => {
		const url = urlInput.trim()
		if (!url) return
		setUrlState("loading")
		const result = await onSaveStashImageUrl(url)
		if (result === "ok") {
			setUrlInput("")
			setUrlState("idle")
			setShowUrlInput(false)
		} else if (result === "invalid_url") {
			setUrlState("error_invalid")
		} else {
			setUrlState("error_load")
		}
	}, [urlInput, onSaveStashImageUrl])

	const handleUrlKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") void handleUrlSubmit()
		},
		[handleUrlSubmit],
	)

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
				className="dt-flyout"
				style={{ width: 300 }}
				onDragOver={handleStashImageDragOver}
				onDrop={handleStashImageDrop}
			>
				<div
					style={{
						padding: "10px 14px 6px",
						borderBottom: "1px solid var(--dt-border-divider)",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div style={{ fontSize: 11, fontWeight: 700, color: "var(--dt-text-primary)" }}>
						Saved Components
					</div>
					<div style={{ display: "flex", gap: 4, alignItems: "center" }}>
						<button
							type="button"
							onClick={() => {
								setShowUrlInput((v) => !v)
								setTooltip(null)
							}}
							onMouseEnter={(e) => showTip("Link media by URL", e)}
							onMouseLeave={hideTip}
							className="dt-btn-icon"
							style={{
								color: showUrlInput ? "var(--dt-accent-light)" : "var(--dt-text-secondary)",
								borderColor: showUrlInput ? "rgba(196,181,253,0.35)" : undefined,
							}}
							aria-label="Link media by URL"
						>
							<LinkIcon />
						</button>
						<button
							type="button"
							onClick={() => {
								onClose()
								onTogglePicker()
							}}
							onMouseEnter={(e) =>
								showTip(pickerMode === "throwable" ? "Done picking" : "Pick from page", e)
							}
							onMouseLeave={hideTip}
							className="dt-btn-icon"
							style={{
								color:
									pickerMode === "throwable"
										? "var(--dt-accent-light)"
										: "var(--dt-text-secondary)",
								borderColor: pickerMode === "throwable" ? "rgba(196,181,253,0.35)" : undefined,
							}}
							aria-label={pickerMode === "throwable" ? "Done picking" : "Pick from page"}
						>
							<PickerIcon />
						</button>
						<button type="button" className="dt-flyout-close" onClick={onClose} aria-label="Close">
							&times;
						</button>
					</div>
				</div>
				{showUrlInput && (
					<>
						<div
							style={{
								padding: "6px 10px",
								borderBottom: "1px solid var(--dt-border-divider)",
								display: "flex",
								gap: 5,
								alignItems: "center",
							}}
						>
							<input
								type="url"
								// biome-ignore lint/a11y/noAutofocus: intentional — row opens on user action
								autoFocus
								value={urlInput}
								onChange={(e) => {
									setUrlInput(e.target.value)
									if (urlState !== "idle") setUrlState("idle")
								}}
								onKeyDown={handleUrlKeyDown}
								placeholder="Paste gif / mp4 / image URL…"
								style={{
									flex: 1,
									fontSize: 11,
									padding: "4px 7px",
									borderRadius: 5,
									border: `1px solid ${urlState.startsWith("error") ? "rgba(220,80,80,0.6)" : "var(--dt-border-input, rgba(255,255,255,0.12))"}`,
									background: "rgba(255,255,255,0.06)",
									color: "var(--dt-text-primary)",
									outline: "none",
									minWidth: 0,
								}}
								disabled={urlState === "loading"}
							/>
							<button
								type="button"
								className="dt-btn-tiny"
								onClick={() => void handleUrlSubmit()}
								disabled={urlState === "loading" || !urlInput.trim()}
								style={{ color: "var(--dt-accent)", flexShrink: 0 }}
							>
								{urlState === "loading" ? "…" : "Add"}
							</button>
						</div>
						{urlState.startsWith("error") && (
							<div
								style={{
									padding: "4px 10px",
									fontSize: 10,
									color: "rgba(220,100,100,0.9)",
									borderBottom: "1px solid var(--dt-border-divider)",
								}}
							>
								{urlState === "error_invalid"
									? "Enter an http/https URL ending in .gif, .png, .jpg, .mp4, etc."
									: "Could not load that URL — check it's public and a supported media type."}
							</div>
						)}
					</>
				)}
				<div style={{ padding: "6px 6px", maxHeight: 260, overflowY: "auto" }}>
					{savedElements.length === 0 ? (
						<div className="dt-stash-empty">
							Drop image files or mp4s here, paste a URL above, or use `Pick from page` or the
							component picker.
						</div>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
							{savedElements.map((s, i) => (
								<div
									key={`${s.element.id}-${s.savedAt}`}
									draggable
									onDragStart={(e) => {
										e.dataTransfer.setData("application/domino-saved", JSON.stringify(s))
										e.dataTransfer.effectAllowed = "copy"
										const pw = Math.min(s.element.rect.width, 200)
										const ph = Math.min(s.element.rect.height, 120)
										const preview = document.createElement("div")
										preview.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${pw}px;height:${ph}px;background:${s.element.backgroundColor || "transparent"};border-radius:${s.element.borderRadius ?? 0}px;border:${s.element.border || "none"};box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;font-size:${Math.min(s.element.fontSize ?? 13, 14)}px;font-family:${s.element.fontFamily || "sans-serif"};color:${s.element.color || "#333"};padding:8px;box-sizing:border-box;overflow:hidden;`
										if (s.element.type === "image" && s.element.imageSrc) {
											preview.textContent = ""
											if (isVideoMediaSrc(s.element.imageSrc)) {
												const video = document.createElement("video")
												video.src = s.element.imageSrc
												video.muted = true
												video.loop = true
												video.autoplay = true
												video.playsInline = true
												video.style.cssText = `width:100%;height:100%;object-fit:cover;display:block;border-radius:${Math.max(0, (s.element.borderRadius ?? 0) - 2)}px`
												preview.appendChild(video)
											} else {
												const im = document.createElement("img")
												im.src = s.element.imageSrc
												im.alt = ""
												im.draggable = false
												im.style.cssText = `width:100%;height:100%;object-fit:cover;display:block;border-radius:${Math.max(0, (s.element.borderRadius ?? 0) - 2)}px`
												preview.appendChild(im)
											}
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
									className="dt-stash-item"
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
											className="dt-stash-swatch"
											style={{
												backgroundColor: s.element.backgroundColor ?? "transparent",
												color: s.element.color ?? "var(--dt-text-tertiary)",
											}}
										>
											{s.element.type === "image" && s.element.imageSrc ? (
												isVideoMediaSrc(s.element.imageSrc) ? (
													<video
														src={s.element.imageSrc}
														muted
														playsInline
														preload="metadata"
														style={{
															width: "100%",
															height: "100%",
															objectFit: "cover",
															display: "block",
														}}
													/>
												) : (
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
												)
											) : (
												s.element.type.slice(0, 3)
											)}
										</div>
										<div style={{ minWidth: 0 }}>
											<div className="dt-stash-name">
												{s.element.type === "image"
													? (
															s.element.imageAlt ||
															(isVideoMediaSrc(s.element.imageSrc) ? "Video" : "Image")
														).slice(0, 24)
													: s.element.text?.slice(0, 20) || s.element.type}
											</div>
											<div className="dt-stash-source">{s.sourceScene}</div>
										</div>
									</div>
									<div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
										<button
											onClick={() => onDropSaved(s)}
											className="dt-btn-tiny"
											style={{ color: "var(--dt-accent)" }}
										>
											Drop
										</button>
										<button
											onClick={() => onRemoveSaved(i)}
											className="dt-btn-tiny"
											style={{ color: "var(--dt-text-faint)" }}
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
							className="dt-stash-preview"
							style={{
								right: 326,
								top: Math.max(
									12,
									Math.min(hoveredStash.top - 10, window.innerHeight - previewH - 50),
								),
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
									isVideoMediaSrc(el.imageSrc) ? (
										<video
											src={el.imageSrc}
											muted
											autoPlay
											loop
											playsInline
											preload="metadata"
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
												display: "block",
											}}
										/>
									) : (
										<img
											src={el.imageSrc}
											alt=""
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
											}}
										/>
									)
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
									<div
										style={{
											color: "var(--dt-text-tertiary)",
											fontSize: 9,
										}}
									>
										{el.type}
									</div>
								)}
							</div>
							<div className="dt-stash-preview-size">
								{Math.round(el.rect.width)} × {Math.round(el.rect.height)}
							</div>
						</div>
					)
				})()}
			{tooltip && (
				<div
					className="dt-tooltip"
					style={{
						position: "fixed",
						left: tooltip.x,
						bottom: window.innerHeight - tooltip.y + 8,
						transform: "translateX(-50%)",
						pointerEvents: "none",
						zIndex: 100010,
					}}
				>
					{tooltip.label}
				</div>
			)}
		</>
	)
}
