import { useCallback, useState } from "react"
import { useNavigation } from "../../contexts/NavigationContext"
import { PRESET_LIST } from "../../scene/presets"

const WEBSITE_PRESETS = [
	{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page" },
	{ label: "NYTimes", url: "https://www.nytimes.com" },
] as const

interface PagesPanelProps {
	onClose: () => void
}

export function PagesPanel({ onClose }: PagesPanelProps) {
	const {
		currentPreset,
		activeCustomId,
		customPages,
		onSelectPreset,
		onSelectCustomPage,
		onFetchUrl,
		onImportHtml,
	} = useNavigation()
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
		<div data-domino-toolbar-root="true" className="dt-flyout" style={{ width: 340 }}>
			<div className="dt-flyout-header">
				<div className="dt-flyout-title">Pages</div>
				<div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
					{PRESET_LIST.map(({ key, label }) => (
						<button
							key={key}
							onClick={() => {
								onSelectPreset(key)
								onClose()
							}}
							className={`dt-chip${currentPreset === key && !activeCustomId ? " dt-chip--active" : ""}`}
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
								className={`dt-chip${existing && activeCustomId === existing.id ? " dt-chip--active" : ""}`}
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
								className={`dt-chip${activeCustomId === cp.id ? " dt-chip--active" : ""}`}
								style={{
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
							className={`dt-tab${importTab === tab ? " dt-tab--active" : ""}`}
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
							autoFocus
							className="dt-input dt-input--mono"
						/>
						{fetchStatus === "error" && (
							<div style={{ fontSize: 10, color: "var(--dt-danger)" }}>
								{fetchError || "Could not fetch."}
							</div>
						)}
						<button
							onClick={handleFetchUrl}
							disabled={!urlInput.trim() || fetchStatus === "loading"}
							className="dt-btn-primary"
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
							className="dt-input"
						/>
						<textarea
							value={htmlInput}
							onChange={(e) => setHtmlInput(e.target.value)}
							placeholder={"<h1>Hello</h1>\n<p>Content</p>"}
							className="dt-input dt-input--mono"
							style={{
								height: 90,
								resize: "vertical",
								fontSize: 10,
								lineHeight: 1.5,
							}}
						/>
						<button
							onClick={handlePasteImport}
							disabled={!htmlInput.trim()}
							className="dt-btn-primary"
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
