import type { Polygon } from './polygon';

/**
 * A solid 3D shape: an immutable collection of polygons.
 *
 * `Solid` is the primary value type primitives (Stage 3) produce and
 * transforms (Stage 4) operate on. Unlike the rest of the geometry kernel
 * (which favors plain interfaces + free functions), `Solid` is a class so
 * that Stage 4 can add chainable instance methods, e.g.
 * `cube(10).translate([5, 0, 0]).rotate([0, 0, 45])`.
 */
export class Solid {
  readonly polygons: readonly Polygon[];

  constructor(polygons: readonly Polygon[]) {
    this.polygons = polygons;
  }
}
