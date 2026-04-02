import { describe, it, expect } from "vitest";
import { getBackgroundStyle } from "./styles";

describe("getBackgroundStyle", () => {
  it("returns empty object for undefined", () => {
    expect(getBackgroundStyle()).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(getBackgroundStyle("")).toEqual({});
  });

  it("returns backgroundColor for solid color", () => {
    expect(getBackgroundStyle("#ff0000")).toEqual({
      backgroundColor: "#ff0000",
    });
  });

  it("returns backgroundColor for rgb color", () => {
    expect(getBackgroundStyle("rgb(255, 0, 0)")).toEqual({
      backgroundColor: "rgb(255, 0, 0)",
    });
  });

  it("returns background for linear gradient", () => {
    const grad = "linear-gradient(to right, #000, #fff)";
    expect(getBackgroundStyle(grad)).toEqual({ background: grad });
  });

  it("returns background for radial gradient", () => {
    const grad = "radial-gradient(circle, #000, #fff)";
    expect(getBackgroundStyle(grad)).toEqual({ background: grad });
  });
});
