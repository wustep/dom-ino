import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NavigationContext, type NavigationContextValue } from "../contexts/NavigationContext"
import {
	SavedElementsContext,
	type SavedElementsContextValue,
} from "../contexts/SavedElementsContext"
import {
	type SceneSettings,
	SettingsContext,
	type SettingsContextValue,
} from "../contexts/SettingsContext"
import type { SavedElement } from "../scene/types"
import { Toolbar } from "./Toolbar"

function defaultSettings(): SceneSettings {
	return {
		physicsEnabled: true,
		showObstacleBounds: false,
		showLineBounds: false,
		gravityX: 0,
		gravityY: 0,
		paused: false,
		pretextEnabled: true,
		textBodiesEnabled: false,
		maxAutoSelectComponents: 500,
		allowWordBreaks: true,
		restitution: 0.3,
	}
}

function defaultSavedElementsCtx(
	overrides: Partial<SavedElementsContextValue> = {},
): SavedElementsContextValue {
	return {
		savedElements: [],
		saveElement: vi.fn(),
		unsaveElement: vi.fn(),
		removeSaved: vi.fn(),
		saveStashImageFiles: vi.fn(),
		...overrides,
	}
}

function defaultSettingsCtx(overrides: Partial<SettingsContextValue> = {}): SettingsContextValue {
	return {
		settings: defaultSettings(),
		setSettings: vi.fn(),
		fps: 60,
		bodyCount: 5,
		lineCount: 100,
		onResetAll: vi.fn(),
		...overrides,
	}
}

function defaultNavigationCtx(
	overrides: Partial<NavigationContextValue> = {},
): NavigationContextValue {
	return {
		currentPreset: "editorial",
		customPages: [],
		activeCustomId: null,
		onSelectPreset: vi.fn(),
		onSelectCustomPage: vi.fn(),
		onImportHtml: vi.fn(),
		onFetchUrl: vi.fn().mockResolvedValue(undefined),
		...overrides,
	}
}

function defaultProps(overrides: Record<string, unknown> = {}) {
	return {
		onExplode: vi.fn(),
		onReset: vi.fn(),
		onTogglePicker: vi.fn(),
		pickerMode: null as null | "throwable" | "save",
		onToggleSavePicker: vi.fn(),
		onDropSaved: vi.fn(),
		...overrides,
	}
}

function renderToolbar(
	props?: Parameters<typeof defaultProps>[0],
	ctxOverrides?: {
		savedElements?: Partial<SavedElementsContextValue>
		settings?: Partial<SettingsContextValue>
		navigation?: Partial<NavigationContextValue>
	},
) {
	return render(
		<NavigationContext value={defaultNavigationCtx(ctxOverrides?.navigation)}>
			<SavedElementsContext value={defaultSavedElementsCtx(ctxOverrides?.savedElements)}>
				<SettingsContext value={defaultSettingsCtx(ctxOverrides?.settings)}>
					<Toolbar {...defaultProps(props)} />
				</SettingsContext>
			</SavedElementsContext>
		</NavigationContext>,
	)
}

beforeEach(() => {
	localStorage.clear()
})

afterEach(() => {
	vi.restoreAllMocks()
	cleanup()
})

function mockToolbarDockRect() {
	const dock = document.querySelector('[data-domino-toolbar-dock="true"]')
	if (!(dock instanceof HTMLDivElement)) {
		throw new Error("Toolbar dock not found")
	}

	vi.spyOn(dock, "getBoundingClientRect").mockReturnValue({
		x: 1000,
		y: 700,
		left: 1000,
		top: 700,
		right: 1036,
		bottom: 736,
		width: 36,
		height: 36,
		toJSON: () => ({}),
	} as DOMRect)
}

describe("Toolbar", () => {
	describe("rendering", () => {
		it("renders the toolbar buttons", () => {
			renderToolbar()
			expect(screen.getByLabelText("Pages")).toBeInTheDocument()
			expect(screen.getByLabelText("Explode scene")).toBeInTheDocument()
			expect(screen.getByLabelText("Reset scene (⌥ click to keep components)")).toBeInTheDocument()
			expect(screen.getByLabelText("Settings")).toBeInTheDocument()
			expect(screen.getByLabelText("Hide toolbar")).toBeInTheDocument()
		})

		it("shows picker as active when pickerMode is throwable", () => {
			renderToolbar({ pickerMode: "throwable" })
			expect(screen.getByLabelText("Exit component picker")).toBeInTheDocument()
		})
	})

	describe("button interactions", () => {
		it("calls onExplode when explode clicked", async () => {
			const props = defaultProps()
			render(
				<NavigationContext value={defaultNavigationCtx()}>
					<SavedElementsContext value={defaultSavedElementsCtx()}>
						<SettingsContext value={defaultSettingsCtx()}>
							<Toolbar {...props} />
						</SettingsContext>
					</SavedElementsContext>
				</NavigationContext>,
			)
			await userEvent.click(screen.getByLabelText("Explode scene"))
			expect(props.onExplode).toHaveBeenCalledOnce()
		})

		it("calls onReset when reset clicked", async () => {
			const props = defaultProps()
			render(
				<NavigationContext value={defaultNavigationCtx()}>
					<SavedElementsContext value={defaultSavedElementsCtx()}>
						<SettingsContext value={defaultSettingsCtx()}>
							<Toolbar {...props} />
						</SettingsContext>
					</SavedElementsContext>
				</NavigationContext>,
			)
			await userEvent.click(screen.getByLabelText("Reset scene (⌥ click to keep components)"))
			expect(props.onReset).toHaveBeenCalledOnce()
		})

		it("calls onTogglePicker when component picker clicked", async () => {
			const props = defaultProps()
			render(
				<NavigationContext value={defaultNavigationCtx()}>
					<SavedElementsContext value={defaultSavedElementsCtx()}>
						<SettingsContext value={defaultSettingsCtx()}>
							<Toolbar {...props} />
						</SettingsContext>
					</SavedElementsContext>
				</NavigationContext>,
			)
			await userEvent.click(screen.getByLabelText("Enter component picker"))
			expect(props.onTogglePicker).toHaveBeenCalledOnce()
		})
	})

	describe("collapse/expand", () => {
		it("hides toolbar content when collapsed", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Hide toolbar"))
			expect(screen.getByLabelText("Show toolbar")).toBeInTheDocument()
		})

		it("shows toolbar content when expanded", async () => {
			renderToolbar()
			// Collapse first
			await userEvent.click(screen.getByLabelText("Hide toolbar"))
			// Then expand
			await userEvent.click(screen.getByLabelText("Show toolbar"))
			expect(screen.getByLabelText("Explode scene")).toBeInTheDocument()
		})

		it("hides the collapsed reveal until the pointer returns near the dock", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Hide toolbar"))
			mockToolbarDockRect()

			const revealButton = screen.getByLabelText("Show toolbar")
			fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
			expect(revealButton).toHaveStyle({ opacity: "0", pointerEvents: "none" })

			fireEvent.pointerMove(window, { clientX: 930, clientY: 650 })
			expect(revealButton).toHaveStyle({ opacity: "0.86", pointerEvents: "auto" })
		})
	})

	describe("pages panel", () => {
		it("opens pages panel when Pages clicked", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.getByText("Editorial")).toBeInTheDocument()
			expect(screen.getByText("Landing")).toBeInTheDocument()
			expect(screen.getByText("Engine")).toBeInTheDocument()
			expect(screen.getByText("Alice")).toBeInTheDocument()
		})

		it("calls onSelectPreset when a preset is clicked", async () => {
			const onSelectPreset = vi.fn()
			renderToolbar({}, { navigation: { onSelectPreset } })
			await userEvent.click(screen.getByLabelText("Pages"))
			await userEvent.click(screen.getByText("Landing"))
			expect(onSelectPreset).toHaveBeenCalledWith("landing")
		})

		it("shows URL fetch tab by default", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.getByPlaceholderText("example.com")).toBeInTheDocument()
		})

		it("switches to HTML paste tab", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			await userEvent.click(screen.getByText("Paste HTML"))
			expect(screen.getByPlaceholderText("Name")).toBeInTheDocument()
		})

		it("calls onFetchUrl when fetch button clicked", async () => {
			const onFetchUrl = vi.fn().mockResolvedValue(undefined)
			renderToolbar({}, { navigation: { onFetchUrl } })
			await userEvent.click(screen.getByLabelText("Pages"))
			const input = screen.getByPlaceholderText("example.com")
			await userEvent.type(input, "test.com")
			await userEvent.click(screen.getByText("Import"))
			expect(onFetchUrl).toHaveBeenCalledWith("test.com")
		})

		it("shows fetch error on failure", async () => {
			renderToolbar(
				{},
				{ navigation: { onFetchUrl: vi.fn().mockRejectedValue(new Error("Network failed")) } },
			)
			await userEvent.click(screen.getByLabelText("Pages"))
			const input = screen.getByPlaceholderText("example.com")
			await userEvent.type(input, "bad.com")
			await userEvent.click(screen.getByText("Import"))
			expect(await screen.findByText("Network failed")).toBeInTheDocument()
		})

		it("calls onImportHtml when paste import button clicked", async () => {
			const onImportHtml = vi.fn()
			renderToolbar({}, { navigation: { onImportHtml } })
			await userEvent.click(screen.getByLabelText("Pages"))
			await userEvent.click(screen.getByText("Paste HTML"))
			// Two textboxes on the paste tab (Name input + HTML textarea); get the textarea
			const textboxes = screen.getAllByRole("textbox")
			const textarea = textboxes.find((el) => el.tagName === "TEXTAREA")!
			await userEvent.type(textarea, "<p>test</p>")
			await userEvent.click(screen.getByText("Import"))
			expect(onImportHtml).toHaveBeenCalledWith("<p>test</p>", "Custom Page")
		})
	})

	describe("settings panel", () => {
		it("opens settings panel", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Settings"))
			expect(screen.getByText("Physics")).toBeInTheDocument()
			expect(screen.getByText("Letter bodies")).toBeInTheDocument()
			expect(screen.getByText("Pretext reflow")).toBeInTheDocument()
			expect(screen.getByText("Break words")).toBeInTheDocument()
		})

		it("shows FPS, body count, and line count", async () => {
			renderToolbar({}, { settings: { fps: 58, bodyCount: 12, lineCount: 250 } })
			await userEvent.click(screen.getByLabelText("Settings"))
			expect(screen.getByText("58")).toBeInTheDocument()
			expect(screen.getByText(/12 bodies/)).toBeInTheDocument()
			expect(screen.getByText(/250 lines/)).toBeInTheDocument()
		})

		it("shows reset all button", async () => {
			const onResetAll = vi.fn()
			renderToolbar({}, { settings: { onResetAll } })
			await userEvent.click(screen.getByLabelText("Settings"))
			const resetBtn = screen.getByText("Reset all state")
			await userEvent.click(resetBtn)
			expect(onResetAll).toHaveBeenCalledOnce()
		})

		it("disables reflow controls when letter bodies are on", async () => {
			renderToolbar(
				{},
				{ settings: { settings: { ...defaultSettings(), textBodiesEnabled: true } } },
			)
			await userEvent.click(screen.getByLabelText("Settings"))
			expect(screen.getByRole("switch", { name: "Pretext reflow" })).toBeDisabled()
			expect(screen.getByRole("switch", { name: "Break words" })).toBeDisabled()
		})
	})

	describe("stash panel", () => {
		it("shows empty state when no saved elements", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Saved components"))
			// "Pick from page" appears as both a button and in help text; check the button
			expect(screen.getByText("Pick from page")).toBeInTheDocument()
		})

		it("shows saved elements with labels", async () => {
			const saved: SavedElement[] = [
				{
					element: {
						id: "el-1",
						type: "button",
						rect: { x: 0, y: 0, width: 100, height: 40 },
						throwable: true,
						pinned: false,
						text: "Click Me",
					},
					savedAt: Date.now(),
					sourceScene: "Editorial",
				},
			]
			renderToolbar({}, { savedElements: { savedElements: saved } })
			await userEvent.click(screen.getByLabelText("Saved components"))
			expect(screen.getByText("Click Me")).toBeInTheDocument()
		})

		it("shows saved element count badge", () => {
			const saved: SavedElement[] = [
				{
					element: {
						id: "el-1",
						type: "button",
						rect: { x: 0, y: 0, width: 100, height: 40 },
						throwable: true,
						pinned: false,
					},
					savedAt: Date.now(),
					sourceScene: "Test",
				},
			]
			renderToolbar({}, { savedElements: { savedElements: saved } })
			expect(screen.getByText("1")).toBeInTheDocument()
		})

		it("shows remove button for saved elements", async () => {
			const saved: SavedElement[] = [
				{
					element: {
						id: "el-1",
						type: "button",
						rect: { x: 0, y: 0, width: 100, height: 40 },
						throwable: true,
						pinned: false,
					},
					savedAt: Date.now(),
					sourceScene: "Test",
				},
			]
			renderToolbar({}, { savedElements: { savedElements: saved } })
			await userEvent.click(screen.getByLabelText("Saved components"))
			expect(screen.getByText("Drop")).toBeInTheDocument()
			expect(screen.getByText("×")).toBeInTheDocument()
		})
	})

	describe("panel toggling", () => {
		it("closes panel when same button clicked again", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.getByText("Editorial")).toBeInTheDocument()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.queryByText("Editorial")).not.toBeInTheDocument()
		})

		it("switches panels when different button clicked", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.getByText("Editorial")).toBeInTheDocument()
			await userEvent.click(screen.getByLabelText("Settings"))
			expect(screen.queryByText("Editorial")).not.toBeInTheDocument()
			expect(screen.getByText("Physics")).toBeInTheDocument()
		})

		it("closes panel on outside pointerdown", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.getByText("Editorial")).toBeInTheDocument()
			fireEvent.pointerDown(document.body)
			expect(screen.queryByText("Editorial")).not.toBeInTheDocument()
		})
	})

	describe("website presets", () => {
		it("shows website presets in pages panel", async () => {
			renderToolbar()
			await userEvent.click(screen.getByLabelText("Pages"))
			expect(screen.getByText("Wikipedia")).toBeInTheDocument()
			expect(screen.getByText("NYTimes")).toBeInTheDocument()
		})
	})
})
