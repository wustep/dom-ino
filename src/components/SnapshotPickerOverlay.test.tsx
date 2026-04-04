import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SnapshotPickerOverlay, type SnapshotPickerOverlayItem } from "./SnapshotPickerOverlay"

function makeItem(overrides: Partial<SnapshotPickerOverlayItem> = {}): SnapshotPickerOverlayItem {
	return {
		id: `item-${Math.random().toString(36).slice(2, 6)}`,
		x: 10,
		y: 20,
		width: 200,
		height: 60,
		borderRadius: 0,
		saved: false,
		active: false,
		label: "Component",
		onToggle: vi.fn(),
		onSave: vi.fn(),
		onUnsave: vi.fn(),
		...overrides,
	}
}

function defaultProps(overrides: Record<string, unknown> = {}) {
	return {
		items: [] as SnapshotPickerOverlayItem[],
		onClose: vi.fn(),
		...overrides,
	}
}

afterEach(() => {
	cleanup()
})

describe("SnapshotPickerOverlay", () => {
	describe("rendering", () => {
		it("renders correct number of candidate overlays", () => {
			const items = [makeItem({ id: "a" }), makeItem({ id: "b" }), makeItem({ id: "c" })]
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items })} />)
			const candidateOverlays = container.querySelectorAll("[data-picker-candidate]")
			expect(candidateOverlays.length).toBe(3)
		})

		it("renders no candidate overlays when list is empty", () => {
			const { container } = render(<SnapshotPickerOverlay {...defaultProps()} />)
			const candidateOverlays = container.querySelectorAll("[data-picker-candidate]")
			expect(candidateOverlays.length).toBe(0)
		})
	})

	describe("active state display", () => {
		it('shows check icon and "Physics" for active wide items', () => {
			const item = makeItem({ id: "wide-active", width: 200, active: true })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const physicsPill = container.querySelector('[data-pill="physics"]')
			expect(physicsPill).not.toBeNull()
			expect(physicsPill!.querySelector("svg")).not.toBeNull()
			expect(physicsPill!.textContent).toContain("Physics")
		})

		it("does not show Physics text for narrow active items", () => {
			const item = makeItem({ id: "narrow-active", width: 60, active: true })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const physicsPill = container.querySelector('[data-pill="physics"]')
			expect(physicsPill).not.toBeNull()
			expect(physicsPill!.querySelector("svg")).not.toBeNull()
			expect(physicsPill!.textContent).not.toContain("Physics")
		})

		it("hides physics pill for inactive unhovered items", () => {
			const item = makeItem({ id: "inactive", width: 200, active: false })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const physicsPill = container.querySelector('[data-pill="physics"]')
			expect(physicsPill).toBeNull()
		})
	})

	describe("toggle interactions", () => {
		it("clicking the physics pill on hover calls onToggle", async () => {
			const user = userEvent.setup()
			const onToggle = vi.fn()
			const item = makeItem({ id: "click-me", onToggle })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const itemEl = container.querySelector("[data-picker-candidate]") as HTMLElement
			fireEvent.mouseEnter(itemEl)
			const pill = container.querySelector('[data-pill="physics"]') as HTMLElement
			await user.click(pill)
			expect(onToggle).toHaveBeenCalledOnce()
		})

		it("clicking the physics pill for an active item calls onToggle", async () => {
			const user = userEvent.setup()
			const onToggle = vi.fn()
			const item = makeItem({ id: "toggle-me", active: true, onToggle })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const pill = container.querySelector('[data-pill="physics"]') as HTMLElement
			await user.click(pill)
			expect(onToggle).toHaveBeenCalledOnce()
		})
	})

	describe("save button interactions", () => {
		it("calls onSave for unsaved items on hover", async () => {
			const user = userEvent.setup()
			const onSave = vi.fn()
			const onUnsave = vi.fn()
			const item = makeItem({ id: "save-me", saved: false, onSave, onUnsave })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const itemEl = container.querySelector("[data-picker-candidate]") as HTMLElement
			fireEvent.mouseEnter(itemEl)
			const savePill = container.querySelector('[data-pill="save"]') as HTMLElement
			expect(savePill).not.toBeNull()
			await user.click(savePill)
			expect(onSave).toHaveBeenCalledOnce()
			expect(onUnsave).not.toHaveBeenCalled()
		})

		it("calls onUnsave for saved items", async () => {
			const user = userEvent.setup()
			const onSave = vi.fn()
			const onUnsave = vi.fn()
			const item = makeItem({ id: "unsave-me", saved: true, onSave, onUnsave })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const savePill = container.querySelector('[data-pill="save"]') as HTMLElement
			expect(savePill).not.toBeNull()
			await user.click(savePill)
			expect(onUnsave).toHaveBeenCalledOnce()
			expect(onSave).not.toHaveBeenCalled()
		})

		it("save pill click does not trigger onToggle", async () => {
			const user = userEvent.setup()
			const onToggle = vi.fn()
			const onSave = vi.fn()
			const item = makeItem({ id: "no-toggle", onToggle, onSave })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const itemEl = container.querySelector("[data-picker-candidate]") as HTMLElement
			fireEvent.mouseEnter(itemEl)
			const savePill = container.querySelector('[data-pill="save"]') as HTMLElement
			await user.click(savePill)
			expect(onSave).toHaveBeenCalledOnce()
			expect(onToggle).not.toHaveBeenCalled()
		})

		it("save pill is hidden when not hovered for unsaved items", () => {
			const item = makeItem({ id: "hidden-save", saved: false })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const savePill = container.querySelector('[data-pill="save"]')
			expect(savePill).toBeNull()
		})
	})

	describe("count badge", () => {
		it('shows "N selectable · M active" count', () => {
			const items = [
				makeItem({ id: "a", active: true }),
				makeItem({ id: "b", active: false }),
				makeItem({ id: "c", active: true }),
			]
			render(<SnapshotPickerOverlay {...defaultProps({ items })} />)
			expect(screen.getByText(/3 selectable/)).toBeInTheDocument()
			expect(screen.getByText(/2 active/)).toBeInTheDocument()
		})

		it("shows zero counts when empty", () => {
			render(<SnapshotPickerOverlay {...defaultProps()} />)
			expect(screen.getByText(/0 selectable/)).toBeInTheDocument()
			expect(screen.getByText(/0 active/)).toBeInTheDocument()
		})
	})

	describe("save pill labels for wide vs narrow", () => {
		it('shows "Save" text for wide unsaved item on hover', () => {
			const item = makeItem({ id: "wide", width: 100, saved: false })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const itemEl = container.querySelector("[data-picker-candidate]") as HTMLElement
			fireEvent.mouseEnter(itemEl)
			const savePill = container.querySelector('[data-pill="save"]')
			expect(savePill).not.toBeNull()
			expect(savePill!.textContent).toContain("Save")
		})

		it('shows "Saved" text with check icon for wide saved item', () => {
			const item = makeItem({ id: "wide-saved", width: 100, saved: true })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const savePill = container.querySelector('[data-pill="save"]')
			expect(savePill).not.toBeNull()
			expect(savePill!.textContent).toContain("Saved")
			expect(savePill!.querySelector("svg")).not.toBeNull()
		})

		it("shows save pill on hover for narrow unsaved item", () => {
			const item = makeItem({ id: "narrow", width: 60, saved: false })
			const { container } = render(<SnapshotPickerOverlay {...defaultProps({ items: [item] })} />)
			const itemEl = container.querySelector("[data-picker-candidate]") as HTMLElement
			fireEvent.mouseEnter(itemEl)
			const savePill = container.querySelector('[data-pill="save"]')
			expect(savePill).not.toBeNull()
		})
	})

	describe("done button", () => {
		it("calls onClose when Done clicked", async () => {
			const user = userEvent.setup()
			const props = defaultProps()
			render(<SnapshotPickerOverlay {...props} />)
			await user.click(screen.getByText("Done"))
			expect(props.onClose).toHaveBeenCalledOnce()
		})
	})
})
