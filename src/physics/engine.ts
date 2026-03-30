import Matter from "matter-js";
import type { SceneElement, SceneDescription } from "../scene/types";

const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events, Runner } =
  Matter;

export interface PhysicsBody {
  elementId: string;
  body: Matter.Body;
  originalX: number;
  originalY: number;
  originalW: number;
  originalH: number;
}

export interface PhysicsEngine {
  engine: Matter.Engine;
  runner: Matter.Runner;
  bodies: Map<string, PhysicsBody>;
  walls: Matter.Body[];
  mouseConstraint: Matter.MouseConstraint | null;
  destroy: () => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  explode: () => void;
  setGravity: (x: number, y: number) => void;
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  getBodyPositions: () => Map<
    string,
    { x: number; y: number; angle: number; w: number; h: number }
  >;
}

export function createPhysicsEngine(
  scene: SceneDescription,
  container: HTMLElement
): PhysicsEngine {
  const engine = Engine.create({
    gravity: { x: 0, y: 0 },
    enableSleeping: true,
  });

  const runner = Runner.create({ delta: 1000 / 60 });

  const bodies = new Map<string, PhysicsBody>();
  const walls: Matter.Body[] = [];

  const wallThickness = 80;
  const W = scene.width;
  const H = scene.height;

  const wallProps = { isStatic: true, friction: 0.8, restitution: 0.15 };

  const floor = Bodies.rectangle(W / 2, H + wallThickness / 2, W + 200, wallThickness, { ...wallProps, label: "wall-floor" });
  const ceiling = Bodies.rectangle(W / 2, -wallThickness / 2, W + 200, wallThickness, { ...wallProps, label: "wall-ceiling" });
  const leftWall = Bodies.rectangle(-wallThickness / 2, H / 2, wallThickness, H + 200, { ...wallProps, label: "wall-left" });
  const rightWall = Bodies.rectangle(W + wallThickness / 2, H / 2, wallThickness, H + 200, { ...wallProps, label: "wall-right" });

  walls.push(floor, ceiling, leftWall, rightWall);
  World.add(engine.world, walls);

  for (const el of scene.elements) {
    if (el.type === "paragraph" || el.type === "heading" || el.type === "divider") continue;

    const cx = el.rect.x + el.rect.width / 2;
    const cy = el.rect.y + el.rect.height / 2;

    if (el.throwable) {
      const mass = el.mass ?? 1;
      const body = Bodies.rectangle(cx, cy, el.rect.width, el.rect.height, {
        isStatic: false,
        friction: 0.5,
        frictionAir: 0.025,
        restitution: 0.3,
        density: 0.002 * mass,
        chamfer: { radius: Math.min(el.borderRadius ?? 0, 6) },
        label: el.id,
        sleepThreshold: 50,
      });
      bodies.set(el.id, { elementId: el.id, body, originalX: el.rect.x, originalY: el.rect.y, originalW: el.rect.width, originalH: el.rect.height });
      World.add(engine.world, body);
    } else {
      // Static body so thrown items collide with non-throwable elements
      const body = Bodies.rectangle(cx, cy, el.rect.width, el.rect.height, {
        isStatic: true,
        friction: 0.6,
        restitution: 0.2,
        label: `static-${el.id}`,
      });
      bodies.set(el.id, { elementId: el.id, body, originalX: el.rect.x, originalY: el.rect.y, originalW: el.rect.width, originalH: el.rect.height });
      World.add(engine.world, body);
    }
  }

  // Mouse constraint for drag interactions
  // IMPORTANT: pixelRatio must be 1 for DOM-based (non-canvas) rendering.
  // Setting it to devicePixelRatio would divide coords by 2 on retina displays,
  // making it impossible to grab bodies.
  const mouse = Mouse.create(container);
  mouse.pixelRatio = 1;

  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.6,
      damping: 0.12,
      render: { visible: false },
    },
  });

  World.add(engine.world, mouseConstraint);

  const syncMouseOffset = () => {
    const rect = container.getBoundingClientRect();
    Mouse.setOffset(mouse, { x: -rect.left, y: -rect.top });
  };

  window.addEventListener("scroll", syncMouseOffset, { passive: true });
  window.addEventListener("resize", syncMouseOffset, { passive: true });
  syncMouseOffset();

  Events.on(engine, "afterUpdate", () => {
    for (const [, pb] of bodies) {
      const b = pb.body;
      if (b.isStatic) continue;
      const pos = b.position;
      const hw = pb.originalW / 2;
      const hh = pb.originalH / 2;
      let clamped = false;
      let nx = pos.x, ny = pos.y;

      if (nx - hw < 0) { nx = hw; clamped = true; }
      if (nx + hw > W) { nx = W - hw; clamped = true; }
      if (ny - hh < 0) { ny = hh; clamped = true; }
      if (ny + hh > H) { ny = H - hh; clamped = true; }

      if (clamped) {
        Body.setPosition(b, { x: nx, y: ny });
        Body.setVelocity(b, { x: b.velocity.x * 0.5, y: b.velocity.y * 0.5 });
      }
    }
  });

  Runner.run(runner, engine);

  return {
    engine, runner, bodies, walls, mouseConstraint,

    destroy() {
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      window.removeEventListener("scroll", syncMouseOffset);
      window.removeEventListener("resize", syncMouseOffset);
    },

    reset() {
      for (const [, pb] of bodies) {
        if (pb.body.isStatic) continue;
        Body.setPosition(pb.body, { x: pb.originalX + pb.originalW / 2, y: pb.originalY + pb.originalH / 2 });
        Body.setAngle(pb.body, 0);
        Body.setVelocity(pb.body, { x: 0, y: 0 });
        Body.setAngularVelocity(pb.body, 0);
        (pb.body as Matter.Body & { isSleeping: boolean }).isSleeping = false;
      }
    },

    pause() { runner.enabled = false; },
    resume() { runner.enabled = true; },

    explode() {
      for (const [, pb] of bodies) {
        if (pb.body.isStatic) continue;
        Body.setVelocity(pb.body, { x: (Math.random() - 0.5) * 35, y: -(Math.random() * 25 + 8) });
        Body.setAngularVelocity(pb.body, (Math.random() - 0.5) * 0.4);
        (pb.body as Matter.Body & { isSleeping: boolean }).isSleeping = false;
      }
    },

    setGravity(x: number, y: number) {
      engine.gravity.x = x;
      engine.gravity.y = y;
      for (const [, pb] of bodies) {
        if (!pb.body.isStatic) (pb.body as Matter.Body & { isSleeping: boolean }).isSleeping = false;
      }
    },

    togglePin(id: string) {
      const pb = bodies.get(id);
      if (!pb) return;
      Body.setStatic(pb.body, !pb.body.isStatic);
      if (!pb.body.isStatic) (pb.body as Matter.Body & { isSleeping: boolean }).isSleeping = false;
    },

    isPinned(id: string) { return bodies.get(id)?.body.isStatic ?? false; },

    getBodyPositions() {
      const positions = new Map<string, { x: number; y: number; angle: number; w: number; h: number }>();
      for (const [id, pb] of bodies) {
        if (pb.body.isStatic) continue;
        positions.set(id, {
          x: pb.body.position.x - pb.originalW / 2,
          y: pb.body.position.y - pb.originalH / 2,
          angle: pb.body.angle,
          w: pb.originalW,
          h: pb.originalH,
        });
      }
      return positions;
    },
  };
}
