import { useCallback, useState } from "react"
import type { CustomPage } from "../../App"
import type { PresetKey } from "../../scene/presets"
import { PRESET_LIST } from "../../scene/presets"

const WEBSITE_PRESETS = [
	{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page" },
	{ label: "NYTimes", url: "https://www.nytimes.com" },
] as const

interface PagesPanelProps {
	currentPreset: PresetKey | "custom"
	activeCustomId: string | null
	onSelectPreset: (key: PresetKey) => void
	onFetchUrl: (url: string) => Promise<void>
	onImportHtml: (html: string, name: string) => void
	customPages: CustomPage[]
	onSelectCustomPage: (id: string) => void
	onClose: () => void
}

export function PagesPanel({
	currentPreset,
	activeCustomId,
	onSelectPreset,
	onFetchUrl,
	onImportHtml,
	customPages,
	onSelectCustomPage,
	onClose,
}: PagesPanelProps) {
	const [importTab, setImportTab] = useState<"url" | "html">("url")
	const [urlInput, setUrlInput] = useState("")
	const [htmlInput, setHtmlInput] = useState("")
	const [importName, setImportName] = useState("Custom Page")
	const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "error">("idle")
	const [fetchError, setFetchError] = useState("")

	const handleFetchUrl = useCallback(async () => {
		if (!urlInput.trim()) return
		setFetchStatus("loading")
		setFetchError("")
		try {
			await onFetchUrl(urlInput.trim())
			setFetchStatus("idle")
			onClose()
			setUrlInput("")
		} catch (e) {
			setFetchStatus("error")
			setFetchError(e instanceof Error ? e.message : "Could not fetch page.")
		}
	}, [urlInput, onFetchUrl, onClose])

	const handlePasteImport = useCallback(() => {
		if (!htmlInput.trim()) return
		onImportHtml(htmlInput, importName)
		setHtmlInput("")
		onClose()
	}, [htmlInput, importName, onImportHtml, onClose])

	return (
		<div
			data-domino-toolbar-root="true"
			style={{ ...flyoutBase, bottom: 56, right: 16, width: 340 }}
		>
			<div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
				<div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Pages</div>
				<div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
					{PRESET_LIST.map(({ key, label }) => (
						<button
							key={key}
							onClick={() => {
								onSelectPreset(key)
								onClose()
							}}
							style={{
								...chipStyle,
								...(currentPreset === key && !activeCustomId ? chipActiveStyle : {}),
							}}
						>
							{label}
						</button>
					))}
					{WEBSITE_PRESETS.map(({ label, url }) => {
						const existing = customPages.find(
							(cp) => cp.kind === "snapshot" && cp.sourceUrl === url,
						)
						return (
							<button
								key={label}
								onClick={async () => {
									if (existing) {
										onSelectCustomPage(existing.id)
										onClose()
										return
									}
									setFetchStatus("loading")
									setFetchError("")
									try {
										await onFetchUrl(url)
										setFetchStatus("idle")
										onClose()
									} catch (e) {
										setFetchStatus("error")
										setFetchError(e instanceof Error ? e.message : "Could not fetch.")
									}
								}}
								disabled={fetchStatus === "loading"}
								style={{
									...chipStyle,
									...(existing && activeCustomId === existing.id ? chipActiveStyle : {}),
								}}
							>
								{label}
							</button>
						)
					})}
					{customPages
						.filter(
							(cp) =>
								cp.kind !== "snapshot" || !WEBSITE_PRESETS.some((wp) => wp.url === cp.sourceUrl),
						)
						.map((cp) => (
							<button
								key={cp.id}
								onClick={() => {
									onSelectCustomPage(cp.id)
									onClose()
								}}
								style={{
									...chipStyle,
									...(activeCustomId === cp.id ? chipActiveStyle : {}),
									maxWidth: 140,
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{cp.name}
							</button>
						))}
				</div>
			</div>
			<div style={{ padding: "8px 14px 6px" }}>
				<div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
					{(["url", "html"] as const).map((tab) => (
						<button
							key={tab}
							onClick={() => setImportTab(tab)}
							style={{
								flex: 1,
								padding: "5px 0",
								border: "none",
								borderBottom: importTab === tab ? "2px solid #a78bfa" : "2px solid transparent",
								backgroundColor: "transparent",
								color: importTab === tab ? "#fff" : "#666",
								fontSize: 10,
								fontWeight: 600,
								fontFamily: '"DM Sans", sans-serif',
								cursor: "pointer",
								textTransform: "uppercase",
								letterSpacing: "0.06em",
							}}
						>
							{tab === "url" ? "Fetch URL" : "Paste HTML"}
						</button>
					))}
				</div>
				{importTab === "url" ? (
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<input
							value={urlInput}
							onChange={(e) => setUrlInput(e.target.value)}
							placeholder="example.com"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleFetchUrl()
							}}
							style={{
								...inputStyle,
								fontFamily: '"JetBrains Mono", monospace',
								fontSize: 11,
							}}
						/>
						{fetchStatus === "error" && (
							<div style={{ fontSize: 10, color: "#f87171" }}>
								{fetchError || "Could not fetch."}
							</div>
						)}
						<button
							onClick={handleFetchUrl}
							disabled={!urlInput.trim() || fetchStatus === "loading"}
							style={{
								...primaryBtnStyle,
								opacity: urlInput.trim() ? 1 : 0.4,
								cursor: urlInput.trim() ? "pointer" : "not-allowed",
							}}
						>
							{fetchStatus === "loading" ? "Fetching..." : "Import"}
						</button>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<input
							value={importName}
							onChange={(e) => setImportName(e.target.value)}
							placeholder="Name"
							style={{ ...inputStyle, fontSize: 11 }}
						/>
						<textarea
							value={htmlInput}
							onChange={(e) => setHtmlInput(e.target.value)}
							placeholder={"<h1>Hello</h1>\n<p>Content</p>"}
							style={{
								...inputStyle,
								height: 90,
								resize: "vertical",
								fontFamily: '"JetBrains Mono", monospace',
								fontSize: 10,
								lineHeight: 1.5,
							}}
						/>
						<button
							onClick={handlePasteImport}
							disabled={!htmlInput.trim()}
							style={{
								...primaryBtnStyle,
								opacity: htmlInput.trim() ? 1 : 0.4,
								cursor: htmlInput.trim() ? "pointer" : "not-allowed",
							}}
						>
							Import
						</button>
					</div>
				)}
			</div>
			<div style={{ height: 6 }} />
		</div>
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
const chipStyle: React.CSSProperties = {
	padding: "5px 12px",
	borderRadius: 6,
	border: "1px solid rgba(255,255,255,0.06)",
	backgroundColor: "transparent",
	color: "#999",
	fontSize: 11,
	fontWeight: 400,
	fontFamily: '"DM Sans", sans-serif',
	cursor: "pointer",
}
const chipActiveStyle: React.CSSProperties = {
	border: "1px solid rgba(255,255,255,0.2)",
	backgroundColor: "rgba(255,255,255,0.1)",
	color: "#fff",
	fontWeight: 600,
}
const inputStyle: React.CSSProperties = {
	width: "100%",
	padding: "6px 8px",
	borderRadius: 6,
	border: "1px solid rgba(255,255,255,0.08)",
	backgroundColor: "rgba(255,255,255,0.04)",
	color: "#ddd",
	fontSize: 11,
	fontFamily: '"DM Sans", sans-serif',
	outline: "none",
	boxSizing: "border-box",
}
const primaryBtnStyle: React.CSSProperties = {
	padding: "6px 0",
	borderRadius: 6,
	border: "none",
	backgroundColor: "#7c3aed",
	color: "#fff",
	fontSize: 11,
	fontWeight: 600,
	fontFamily: '"DM Sans", sans-serif',
	transition: "opacity 0.12s",
}
