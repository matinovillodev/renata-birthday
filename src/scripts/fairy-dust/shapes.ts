/**
 * Custom tsParticles shapes drawn with the exact V3 SVG curves, so the burst
 * matches the design without the star/path shape packages.
 *
 * Paths come from the 24x24 V3 icons, re-centered on (0, 0). The engine has
 * already translated/rotated the context to the particle and fills the
 * current path with the particle color after `draw`.
 */
import type { Engine, IShapeDrawData } from '@tsparticles/engine';

type Point = readonly [number, number];
type Curve = readonly [Point, Point, Point]; // cubic bezier: control, control, end

interface Outline {
  start: Point;
  curves: readonly Curve[];
}

const ICON_HALF = 12; // V3 icons use a 24x24 viewBox

/** V3 sparkle: "M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 ... 12 0Z". */
const SPARKLE: Outline = {
  start: [0, -12],
  curves: [
    [[0.9, -4.8], [4.8, -0.9], [12, 0]],
    [[4.8, 0.9], [0.9, 4.8], [0, 12]],
    [[-0.9, 4.8], [-4.8, 0.9], [-12, 0]],
    [[-4.8, -0.9], [-0.9, -4.8], [0, -12]],
  ],
};

/** V3 butterfly upper wings (filled with the particle color, #E7B8C0). */
const UPPER_WINGS: readonly Outline[] = [
  { start: [0, 0], curves: [[[-3, -7], [-9, -8], [-9, -4]], [[-9, -1], [-5, 0], [0, 0]]] },
  { start: [0, 0], curves: [[[3, -7], [9, -8], [9, -4]], [[9, -1], [5, 0], [0, 0]]] },
];

/** V3 butterfly lower wings, a darker pink (#D8A7B1). */
const LOWER_WINGS: readonly Outline[] = [
  { start: [0, 0], curves: [[[-3, 3], [-7, 7], [-5, 8]], [[-3, 9], [-1, 4], [0, 0]]] },
  { start: [0, 0], curves: [[[3, 3], [7, 7], [5, 8]], [[3, 9], [1, 4], [0, 0]]] },
];
const LOWER_WING_RGB = '216, 167, 177';

function trace(context: OffscreenCanvasRenderingContext2D, outline: Outline, scale: number): void {
  context.moveTo(outline.start[0] * scale, outline.start[1] * scale);
  for (const [[c1x, c1y], [c2x, c2y], [x, y]] of outline.curves) {
    context.bezierCurveTo(c1x * scale, c1y * scale, c2x * scale, c2y * scale, x * scale, y * scale);
  }
}

const sparkleDrawer = {
  draw({ context, radius }: IShapeDrawData): void {
    trace(context, SPARKLE, radius / ICON_HALF);
  },
};

const butterflyDrawer = {
  draw({ context, radius }: IShapeDrawData): void {
    const scale = radius / ICON_HALF;
    for (const wing of UPPER_WINGS) trace(context, wing, scale);
  },
  afterDraw({ context, radius, opacity }: IShapeDrawData): void {
    const scale = radius / ICON_HALF;
    context.beginPath();
    for (const wing of LOWER_WINGS) trace(context, wing, scale);
    context.fillStyle = `rgba(${LOWER_WING_RGB}, ${opacity})`;
    context.fill();
  },
};

/** Registers the `sparkle` and `butterfly` particle shapes. */
export async function loadFairyShapes(engine: Engine): Promise<void> {
  await engine.pluginManager.register((e: Engine) => {
    e.pluginManager.addShape(['sparkle'], () => Promise.resolve(sparkleDrawer));
    e.pluginManager.addShape(['butterfly'], () => Promise.resolve(butterflyDrawer));
  });
}
