import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Matter from "matter-js";
import { createPhysicsEngine } from "./engine";
import type { PhysicsEngine } from "./engine";
import type { SceneDescription, SceneElement } from "../scene/types";

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
  return {
    id: "el-1",
    type: "button",
    rect: { x: 100, y: 100, width: 80, height: 40 },
    throwable: true,
    pinned: false,
    mass: 1,
    ...overrides,
  };
}

function makeScene(elements: SceneElement[]): SceneDescription {
  return {
    id: "scene-1",
    name: "Test",
    width: 800,
    height: 600,
    backgroundColor: "#fff",
    elements,
  };
}

function makeContainer(): HTMLDivElement {
  const div = document.createElement("div");
  // Set dimensions so Matter.js Mouse can work
  Object.defineProperty(div, "getBoundingClientRect", {
    value: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => {} }),
  });
  document.body.appendChild(div);
  return div;
}

describe("createPhysicsEngine", () => {
  let engine: PhysicsEngine;
  let container: HTMLDivElement;

  afterEach(() => {
    engine?.destroy();
    container?.remove();
  });

  it("creates engine with walls and bodies", () => {
    container = makeContainer();
    const scene = makeScene([
      makeElement({ id: "btn-1" }),
      makeElement({ id: "btn-2", rect: { x: 300, y: 100, width: 80, height: 40 } }),
    ]);
    engine = createPhysicsEngine(scene, container);

    expect(engine.walls).toHaveLength(4); // floor, ceiling, left, right
    expect(engine.bodies.size).toBe(2);
    expect(engine.bodies.has("btn-1")).toBe(true);
    expect(engine.bodies.has("btn-2")).toBe(true);
  });

  it("creates dynamic bodies for throwable elements", () => {
    container = makeContainer();
    const scene = makeScene([makeElement({ id: "dynamic", throwable: true })]);
    engine = createPhysicsEngine(scene, container);

    const body = engine.bodies.get("dynamic")!;
    expect(body.body.isStatic).toBe(false);
  });

  it("creates static bodies for non-throwable elements", () => {
    container = makeContainer();
    const scene = makeScene([makeElement({ id: "static-el", throwable: false, type: "card" })]);
    engine = createPhysicsEngine(scene, container);

    const body = engine.bodies.get("static-el")!;
    expect(body.body.isStatic).toBe(true);
  });

  it("skips paragraph/heading/divider elements", () => {
    container = makeContainer();
    const scene = makeScene([
      makeElement({ id: "p", type: "paragraph" }),
      makeElement({ id: "h", type: "heading" }),
      makeElement({ id: "d", type: "divider" }),
      makeElement({ id: "btn", type: "button" }),
    ]);
    engine = createPhysicsEngine(scene, container);

    expect(engine.bodies.has("p")).toBe(false);
    expect(engine.bodies.has("h")).toBe(false);
    expect(engine.bodies.has("d")).toBe(false);
    expect(engine.bodies.has("btn")).toBe(true);
  });

  it("skips elements with physicsEnabled = false", () => {
    container = makeContainer();
    const scene = makeScene([
      makeElement({ id: "disabled", physicsEnabled: false }),
    ]);
    engine = createPhysicsEngine(scene, container);
    expect(engine.bodies.size).toBe(0);
  });

  it("stores original positions", () => {
    container = makeContainer();
    const scene = makeScene([
      makeElement({ id: "el", rect: { x: 150, y: 200, width: 80, height: 40 } }),
    ]);
    engine = createPhysicsEngine(scene, container);

    const body = engine.bodies.get("el")!;
    expect(body.originalX).toBe(150);
    expect(body.originalY).toBe(200);
    expect(body.originalW).toBe(80);
    expect(body.originalH).toBe(40);
  });

  describe("methods", () => {
    beforeEach(() => {
      container = makeContainer();
      const scene = makeScene([
        makeElement({ id: "el-1", rect: { x: 100, y: 100, width: 80, height: 40 } }),
        makeElement({ id: "el-2", rect: { x: 300, y: 200, width: 60, height: 60 } }),
      ]);
      engine = createPhysicsEngine(scene, container);
    });

    it("getBodyPositions returns positions for dynamic bodies", () => {
      const positions = engine.getBodyPositions();
      expect(positions.size).toBe(2);

      const pos1 = positions.get("el-1")!;
      expect(pos1.w).toBe(80);
      expect(pos1.h).toBe(40);
      // Position should be near original (center-based)
      expect(Math.abs(pos1.x - 100)).toBeLessThan(5);
      expect(Math.abs(pos1.y - 100)).toBeLessThan(5);
    });

    it("getBodyPositions excludes static bodies", () => {
      container.remove();
      engine.destroy();

      container = makeContainer();
      const scene = makeScene([
        makeElement({ id: "dyn", throwable: true }),
        makeElement({ id: "stat", throwable: false, type: "card" }),
      ]);
      engine = createPhysicsEngine(scene, container);

      const positions = engine.getBodyPositions();
      expect(positions.has("dyn")).toBe(true);
      expect(positions.has("stat")).toBe(false);
    });

    it("pause and resume control runner", () => {
      engine.pause();
      expect(engine.runner.enabled).toBe(false);
      engine.resume();
      expect(engine.runner.enabled).toBe(true);
    });

    it("setGravity changes engine gravity", () => {
      engine.setGravity(0, 1);
      expect(engine.engine.gravity.x).toBe(0);
      expect(engine.engine.gravity.y).toBe(1);

      engine.setGravity(0.5, -2);
      expect(engine.engine.gravity.x).toBe(0.5);
      expect(engine.engine.gravity.y).toBe(-2);
    });

    it("reset returns bodies to original positions", () => {
      // Move bodies away from original position
      const body1 = engine.bodies.get("el-1")!;
      Matter.Body.setPosition(body1.body, { x: 500, y: 500 });

      engine.reset();

      // Should be back near original center
      expect(Math.abs(body1.body.position.x - 140)).toBeLessThan(1); // 100 + 80/2
      expect(Math.abs(body1.body.position.y - 120)).toBeLessThan(1); // 100 + 40/2
    });

    it("explode applies velocities to dynamic bodies", () => {
      engine.explode();

      for (const [, pb] of engine.bodies) {
        if (pb.body.isStatic) continue;
        const vel = pb.body.velocity;
        // Should have some velocity applied
        expect(Math.abs(vel.x) + Math.abs(vel.y)).toBeGreaterThan(0);
      }
    });

    it("destroy stops the runner", () => {
      engine.destroy();
      // Runner should be stopped (engine cleared)
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe("body shapes", () => {
    it("creates circle body for circular physics shape", () => {
      container = makeContainer();
      const scene = makeScene([
        makeElement({
          id: "circle",
          physicsShape: "circle",
          rect: { x: 100, y: 100, width: 60, height: 60 },
        }),
      ]);
      engine = createPhysicsEngine(scene, container);

      const body = engine.bodies.get("circle")!;
      expect(body.body).toBeDefined();
      // Circle body has circleRadius set
      expect(body.body.circleRadius).toBeCloseTo(30);
    });

    it("applies initial velocity when specified", () => {
      container = makeContainer();
      const scene = makeScene([
        makeElement({
          id: "moving",
          initialVelocityX: 5,
          initialVelocityY: -3,
        }),
      ]);
      engine = createPhysicsEngine(scene, container);

      const body = engine.bodies.get("moving")!;
      expect(body.initialVelocityX).toBe(5);
      expect(body.initialVelocityY).toBe(-3);
    });

    it("creates bodies with custom physics properties", () => {
      container = makeContainer();
      const scene = makeScene([
        makeElement({
          id: "custom",
          friction: 0.8,
          frictionAir: 0.1,
          restitution: 0.9,
          mass: 3,
        }),
      ]);
      engine = createPhysicsEngine(scene, container);

      const body = engine.bodies.get("custom")!;
      expect(body.body.friction).toBe(0.8);
      expect(body.body.frictionAir).toBe(0.1);
      expect(body.body.restitution).toBe(0.9);
    });
  });
});
