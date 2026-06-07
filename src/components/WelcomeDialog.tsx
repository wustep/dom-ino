import { useEffect, useRef } from "react"
import "./WelcomeDialog.css"
import { PageIcon, PickerIcon } from "./toolbar/icons"

function MoveIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<line x1="8" y1="2" x2="8" y2="14" />
			<line x1="2" y1="8" x2="14" y2="8" />
			<polyline points="6,4 8,2 10,4" />
			<polyline points="6,12 8,14 10,12" />
			<polyline points="4,6 2,8 4,10" />
			<polyline points="12,6 14,8 12,10" />
		</svg>
	)
}

const SWIPE_DISMISS_PX = 110

/** Onboarding dialog styled after the wustep.me cover. */
export function WelcomeDialog({ onClose }: { onClose: () => void }) {
	const ctaRef = useRef<HTMLButtonElement>(null)
	const cardRef = useRef<HTMLDivElement>(null)
	const dragRef = useRef({ active: false, startY: 0, delta: 0 })

	useEffect(() => {
		ctaRef.current?.focus()
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [onClose])

	// Lock background scroll while the dialog is open (mobile especially).
	useEffect(() => {
		const prev = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = prev
		}
	}, [])

	// Swipe-down-to-dismiss for the mobile bottom sheet. Only engages from the
	// top of the card's scroll so it never fights the inner content scroll.
	const isSheet = () =>
		typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches
	const onCardTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		const card = cardRef.current
		if (!card || !isSheet() || card.scrollTop > 0) return
		dragRef.current = { active: true, startY: e.touches[0].clientY, delta: 0 }
	}
	const onCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
		const drag = dragRef.current
		const card = cardRef.current
		if (!drag.active || !card) return
		const dy = e.touches[0].clientY - drag.startY
		if (dy <= 0) {
			// Swiping up — let the content scroll; cancel the sheet drag.
			drag.delta = 0
			card.style.transform = ""
			card.style.transition = ""
			return
		}
		drag.delta = dy
		card.style.transition = "none"
		card.style.transform = `translateY(${dy}px)`
	}
	const onCardTouchEnd = () => {
		const drag = dragRef.current
		const card = cardRef.current
		if (!drag.active || !card) return
		drag.active = false
		card.style.transition = ""
		if (drag.delta > SWIPE_DISMISS_PX) {
			onClose()
			return
		}
		card.style.transform = ""
	}

	return (
		<div
			className="dw-backdrop"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dw-title"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="dw-glow" aria-hidden="true" />
			<div
				className="dw-card"
				ref={cardRef}
				onTouchStart={onCardTouchStart}
				onTouchMove={onCardTouchMove}
				onTouchEnd={onCardTouchEnd}
				onTouchCancel={onCardTouchEnd}
			>
				<div className="dw-wordmark" id="dw-title">
					<span>DOM</span>
					<span className="dw-block">ino</span>
				</div>

				<p className="dw-tagline">A physics playground for living text.</p>
				<p className="dw-desc">
					Grab any card, badge, image, or button and fling it across the page. The text reflows
					around everything in real time — Matter.js physics meets Pretext layout.
				</p>

				<ul className="dw-list">
					<li>
						<span className="dw-ico">
							<MoveIcon />
						</span>
						<div>
							<b>Drag &amp; throw</b>
							<span>Grab the floating elements and watch text flow around them.</span>
						</div>
					</li>
					<li>
						<span className="dw-ico">
							<PageIcon />
						</span>
						<div>
							<b>Swap the page</b>
							<span>Pick a scene or drop in any URL from the toolbar.</span>
						</div>
					</li>
					<li>
						<span className="dw-ico">
							<PickerIcon />
						</span>
						<div>
							<b>Make anything physical</b>
							<span>Use the component picker to fling any element on the page.</span>
						</div>
					</li>
				</ul>

				<button ref={ctaRef} className="dw-cta" type="button" onClick={onClose}>
					Start playing
				</button>

				<a className="dw-byline" href="https://wustep.me" target="_blank" rel="noopener noreferrer">
					by Stephen Wu
				</a>
			</div>
		</div>
	)
}
