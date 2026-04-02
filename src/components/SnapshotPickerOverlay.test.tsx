import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SnapshotPickerOverlay } from "./SnapshotPickerOverlay";
import type { SnapshotCandidate } from "./snapshotHelpers";

function makeCandidate(overrides: Partial<SnapshotCandidate> = {}): SnapshotCandidate {
  return {
    id: `cand-${Math.random().toString(36).slice(2, 6)}`,
    x: 10,
    y: 20,
    width: 200,
    height: 60,
    saved: false,
    node: document.createElement("div"),
    sceneElement: null,
    display: "block",
    ...overrides,
  };
}

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    selectableCandidates: [] as SnapshotCandidate[],
    selectedIds: new Set<string>(),
    onToggleSelected: vi.fn(),
    onSaveNode: vi.fn(),
    onUnsaveNode: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("SnapshotPickerOverlay", () => {
  describe("rendering", () => {
    it("renders correct number of candidate overlays", () => {
      const candidates = [
        makeCandidate({ id: "a" }),
        makeCandidate({ id: "b" }),
        makeCandidate({ id: "c" }),
      ];
      const { container } = render(
        <SnapshotPickerOverlay {...defaultProps({ selectableCandidates: candidates })} />
      );
      const candidateOverlays = container.querySelectorAll(
        "[data-picker-candidate]"
      );
      expect(candidateOverlays.length).toBe(3);
    });

    it("renders no candidate overlays when list is empty", () => {
      const { container } = render(
        <SnapshotPickerOverlay {...defaultProps()} />
      );
      const candidateOverlays = container.querySelectorAll(
        "[data-picker-candidate]"
      );
      expect(candidateOverlays.length).toBe(0);
    });
  });

  describe("selected state display", () => {
    it('shows check icon and "Physics" for selected wide candidates', () => {
      const candidate = makeCandidate({ id: "wide-selected", width: 200 });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({
            selectableCandidates: [candidate],
            selectedIds: new Set(["wide-selected"]),
          })}
        />
      );
      const physicsPill = container.querySelector('[data-pill="physics"]');
      expect(physicsPill).not.toBeNull();
      // CheckIcon renders as an SVG
      expect(physicsPill!.querySelector("svg")).not.toBeNull();
      expect(physicsPill!.textContent).toContain("Physics");
    });

    it("does not show Physics text for narrow selected candidates", () => {
      const candidate = makeCandidate({ id: "narrow-selected", width: 60 });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({
            selectableCandidates: [candidate],
            selectedIds: new Set(["narrow-selected"]),
          })}
        />
      );
      const physicsPill = container.querySelector('[data-pill="physics"]');
      expect(physicsPill).not.toBeNull();
      expect(physicsPill!.querySelector("svg")).not.toBeNull();
      expect(physicsPill!.textContent).not.toContain("Physics");
    });

    it("hides physics pill for unselected unhovered candidates", () => {
      const candidate = makeCandidate({ id: "unselected", width: 200 });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({
            selectableCandidates: [candidate],
            selectedIds: new Set(),
          })}
        />
      );
      const physicsPill = container.querySelector('[data-pill="physics"]');
      expect(physicsPill).toBeNull();
    });
  });

  describe("toggle interactions", () => {
    it("clicking the physics pill on hover calls onToggleSelected", async () => {
      const user = userEvent.setup();
      const candidate = makeCandidate({ id: "click-me" });
      const props = defaultProps({ selectableCandidates: [candidate] });
      const { container } = render(<SnapshotPickerOverlay {...props} />);
      // Physics pill only appears on hover
      const candidateEl = container.querySelector('[data-picker-candidate]') as HTMLElement;
      fireEvent.mouseEnter(candidateEl);
      const pill = container.querySelector('[data-pill="physics"]') as HTMLElement;
      await user.click(pill);
      expect(props.onToggleSelected).toHaveBeenCalledWith("click-me");
    });

    it("clicking the physics pill for a selected candidate calls onToggleSelected", async () => {
      const user = userEvent.setup();
      const candidate = makeCandidate({ id: "toggle-me", width: 200 });
      const props = defaultProps({
        selectableCandidates: [candidate],
        selectedIds: new Set(["toggle-me"]),
      });
      const { container } = render(<SnapshotPickerOverlay {...props} />);
      const pill = container.querySelector('[data-pill="physics"]') as HTMLElement;
      await user.click(pill);
      expect(props.onToggleSelected).toHaveBeenCalledWith("toggle-me");
    });
  });

  describe("save button interactions", () => {
    it("calls onSaveNode for unsaved candidates on hover", async () => {
      const user = userEvent.setup();
      const candidate = makeCandidate({ id: "save-me", saved: false, width: 200 });
      const props = defaultProps({ selectableCandidates: [candidate] });
      const { container } = render(<SnapshotPickerOverlay {...props} />);
      // Save pill only appears on hover
      const candidateEl = container.querySelector('[data-picker-candidate]') as HTMLElement;
      fireEvent.mouseEnter(candidateEl);
      const savePill = container.querySelector('[data-pill="save"]') as HTMLElement;
      expect(savePill).not.toBeNull();
      await user.click(savePill);
      expect(props.onSaveNode).toHaveBeenCalledWith("save-me");
      expect(props.onUnsaveNode).not.toHaveBeenCalled();
    });

    it("calls onUnsaveNode for saved candidates", async () => {
      const user = userEvent.setup();
      const candidate = makeCandidate({ id: "unsave-me", saved: true, width: 200 });
      const props = defaultProps({ selectableCandidates: [candidate] });
      const { container } = render(<SnapshotPickerOverlay {...props} />);
      // Saved pill is always visible (no hover needed)
      const savePill = container.querySelector('[data-pill="save"]') as HTMLElement;
      expect(savePill).not.toBeNull();
      await user.click(savePill);
      expect(props.onUnsaveNode).toHaveBeenCalledWith("unsave-me");
      expect(props.onSaveNode).not.toHaveBeenCalled();
    });

    it("save pill click does not trigger onToggleSelected", async () => {
      const user = userEvent.setup();
      const candidate = makeCandidate({ id: "no-toggle", saved: false, width: 200 });
      const props = defaultProps({ selectableCandidates: [candidate] });
      const { container } = render(<SnapshotPickerOverlay {...props} />);
      const candidateEl = container.querySelector('[data-picker-candidate]') as HTMLElement;
      fireEvent.mouseEnter(candidateEl);
      const savePill = container.querySelector('[data-pill="save"]') as HTMLElement;
      await user.click(savePill);
      expect(props.onSaveNode).toHaveBeenCalledWith("no-toggle");
      expect(props.onToggleSelected).not.toHaveBeenCalled();
    });

    it("save pill is hidden when not hovered for unsaved candidates", () => {
      const candidate = makeCandidate({ id: "hidden-save", saved: false, width: 200 });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({ selectableCandidates: [candidate] })}
        />
      );
      const savePill = container.querySelector('[data-pill="save"]');
      expect(savePill).toBeNull();
    });
  });

  describe("count badge", () => {
    it('shows "N selectable · M selected" count', () => {
      const candidates = [
        makeCandidate({ id: "a" }),
        makeCandidate({ id: "b" }),
        makeCandidate({ id: "c" }),
      ];
      render(
        <SnapshotPickerOverlay
          {...defaultProps({
            selectableCandidates: candidates,
            selectedIds: new Set(["a", "c"]),
          })}
        />
      );
      expect(screen.getByText(/3 selectable/)).toBeInTheDocument();
      expect(screen.getByText(/2 selected/)).toBeInTheDocument();
    });

    it("shows zero counts when empty", () => {
      render(<SnapshotPickerOverlay {...defaultProps()} />);
      expect(screen.getByText(/0 selectable/)).toBeInTheDocument();
      expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    });
  });

  describe("save pill labels for wide vs narrow", () => {
    it('shows "Save" text for wide unsaved candidate on hover', () => {
      const candidate = makeCandidate({ id: "wide", width: 100, saved: false });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({ selectableCandidates: [candidate] })}
        />
      );
      const candidateEl = container.querySelector('[data-picker-candidate]') as HTMLElement;
      fireEvent.mouseEnter(candidateEl);
      const savePill = container.querySelector('[data-pill="save"]');
      expect(savePill).not.toBeNull();
      expect(savePill!.textContent).toContain("Save");
    });

    it('shows "Saved" text with check icon for wide saved candidate', () => {
      const candidate = makeCandidate({ id: "wide-saved", width: 100, saved: true });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({ selectableCandidates: [candidate] })}
        />
      );
      const savePill = container.querySelector('[data-pill="save"]');
      expect(savePill).not.toBeNull();
      expect(savePill!.textContent).toContain("Saved");
      expect(savePill!.querySelector("svg")).not.toBeNull();
    });

    it("shows save pill on hover for narrow unsaved candidate", () => {
      const candidate = makeCandidate({ id: "narrow", width: 60, saved: false });
      const { container } = render(
        <SnapshotPickerOverlay
          {...defaultProps({ selectableCandidates: [candidate] })}
        />
      );
      const candidateEl = container.querySelector('[data-picker-candidate]') as HTMLElement;
      fireEvent.mouseEnter(candidateEl);
      const savePill = container.querySelector('[data-pill="save"]');
      expect(savePill).not.toBeNull();
    });
  });

  describe("done button", () => {
    it("calls onClose when Done clicked", async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      render(<SnapshotPickerOverlay {...props} />);
      await user.click(screen.getByText("Done"));
      expect(props.onClose).toHaveBeenCalledOnce();
    });
  });
});
