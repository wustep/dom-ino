function Spinner() {
	return (
		<svg className="domino-spinner" width="24" height="24" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="10" fill="none" stroke="#e0deda" strokeWidth="2.5" />
			<circle
				cx="12"
				cy="12"
				r="10"
				fill="none"
				stroke="#999"
				strokeWidth="2.5"
				strokeDasharray="20 43"
				strokeLinecap="round"
			/>
		</svg>
	)
}

export function FetchOverlay({ url }: { url: string }) {
	const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
	return (
		<div className="domino-overlay domino-overlay--fetch">
			<Spinner />
			<div className="domino-overlay-status">
				Fetching {displayUrl.length > 40 ? `${displayUrl.slice(0, 40)}...` : displayUrl}
			</div>
		</div>
	)
}

export function PageReloadOverlay({
	url,
	error,
	onRetry,
	onBack,
}: {
	url?: string
	error: string | null
	onRetry: () => void
	onBack: () => void
}) {
	const displayUrl = url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "page"
	return (
		<div className="domino-overlay domino-overlay--reload">
			{!error ? (
				<>
					<Spinner />
					<div className="domino-overlay-status">Fetching {displayUrl}</div>
				</>
			) : (
				<>
					<div className="domino-overlay-error">{error}</div>
					<div className="domino-overlay-actions">
						<button onClick={onRetry} className="domino-overlay-btn domino-overlay-btn--primary">
							Retry
						</button>
						<button onClick={onBack} className="domino-overlay-btn domino-overlay-btn--secondary">
							Go back
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export function Hint() {
	return (
		<div className="domino-hint">
			<span className="domino-hint-arrow">&#8597;</span>
			Grab any card, badge, or button and throw it
		</div>
	)
}
