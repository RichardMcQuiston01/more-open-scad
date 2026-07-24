import { almostEqual } from '../math/epsilon';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';
import * as Polygon from '../geometry/polygon';
import type { Polygon as PolygonType } from '../geometry/polygon';
import * as Vertex from '../geometry/vertex';
import type { Vertex as VertexType } from '../geometry/vertex';
import { Solid } from '../geometry/solid';

/** Options accepted by {@link cylinder}. */
export interface CylinderOptions {
  /** Radius of both ends. Overridden by `r1`/`r2` when either is given. */
  readonly r?: number;
  /** Bottom (z = 0, or z = -h/2 when centered) radius. Defaults to `r`. */
  readonly r1?: number;
  /** Top (z = h, or z = h/2 when centered) radius. Defaults to `r`. */
  readonly r2?: number;
  /**
   * When `true`, the cylinder is centered on the z-axis (`z` from `-h/2` to
   * `h/2`); otherwise it spans `z` from `0` to `h`. Defaults to `false`.
   */
  readonly center?: boolean;
  /** Number of segments around the circumference. Defaults to `32`. */
  readonly fn?: number;
}

/** The outward face normal for the triangle `a`, `b`, `c` (right-hand rule). */
function faceNormal(a: Vec3Type, b: Vec3Type, c: Vec3Type): Vec3Type {
  return Vec3.normalize(Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a)));
}

/** Builds a flat-shaded triangular `Polygon` from three positions. */
function triangleFace(a: Vec3Type, b: Vec3Type, c: Vec3Type): PolygonType {
  const normal = faceNormal(a, b, c);
  return Polygon.polygon([
    Vertex.vertex(a, normal),
    Vertex.vertex(b, normal),
    Vertex.vertex(c, normal),
  ]);
}

/** A point on a circle of radius `r` at height `z`, at angle `theta`. */
function ringPoint(r: number, theta: number, z: number): Vec3Type {
  return Vec3.vec3(r * Math.cos(theta), r * Math.sin(theta), z);
}

/**
 * Creates a cylinder (or, with unequal radii, a cone/frustum) solid
 * centered on the z-axis, matching OpenSCAD's `cylinder()` semantics.
 *
 * Side faces are always emitted as triangles (2 per segment, or 1 at a
 * degenerate zero-radius end) so every `Polygon` stays exactly planar even
 * when tapered; top/bottom caps are single flat n-gons.
 *
 * @param h - Height along the z-axis. Must be `> 0`.
 * @param options - Radius, taper, centering, and tessellation options.
 * @throws {Error} If `h <= 0`, either radius is negative, both radii are
 *   zero, or `fn < 3`.
 */
export function cylinder(h: number, options: CylinderOptions = {}): Solid {
  const { center = false, fn = 32 } = options;
  const r1 = options.r1 ?? options.r ?? 1;
  const r2 = options.r2 ?? options.r ?? 1;

  if (!(h > 0)) {
    throw new Error(`cylinder height must be > 0, got ${h}`);
  }
  if (r1 < 0 || r2 < 0) {
    throw new Error(`cylinder radii must be >= 0, got r1=${r1}, r2=${r2}`);
  }
  if (almostEqual(r1, 0) && almostEqual(r2, 0)) {
    throw new Error('cylinder radii r1 and r2 cannot both be 0');
  }
  if (fn < 3) {
    throw new Error(`cylinder fn must be >= 3, got ${fn}`);
  }

  const z0 = center ? -h / 2 : 0;
  const z1 = z0 + h;
  const bottomIsPoint = almostEqual(r1, 0);
  const topIsPoint = almostEqual(r2, 0);

  const thetas = Array.from({ length: fn }, (_, i) => (i * 2 * Math.PI) / fn);
  const bottomRing = thetas.map((theta) => ringPoint(r1, theta, z0));
  const topRing = thetas.map((theta) => ringPoint(r2, theta, z1));

  const polygons: PolygonType[] = [];

  for (let i = 0; i < fn; i++) {
    const i2 = (i + 1) % fn;
    const b0 = bottomRing[i]!;
    const b1 = bottomRing[i2]!;
    const t0 = topRing[i]!;
    const t1 = topRing[i2]!;

    if (!bottomIsPoint && !topIsPoint) {
      polygons.push(triangleFace(b0, b1, t1));
      polygons.push(triangleFace(b0, t1, t0));
    } else if (bottomIsPoint) {
      // Bottom degenerates to a single apex shared by every segment.
      polygons.push(triangleFace(b0, t1, t0));
    } else {
      // Top degenerates to a single apex shared by every segment.
      polygons.push(triangleFace(b0, b1, t1));
    }
  }

  if (!bottomIsPoint) {
    const bottomCapVertices: VertexType[] = [...bottomRing]
      .reverse()
      .map((pos) => Vertex.vertex(pos, Vec3.vec3(0, 0, -1)));
    polygons.push(Polygon.polygon(bottomCapVertices));
  }

  if (!topIsPoint) {
    const topCapVertices: VertexType[] = topRing.map((pos) =>
      Vertex.vertex(pos, Vec3.vec3(0, 0, 1)),
    );
    polygons.push(Polygon.polygon(topCapVertices));
  }

  return new Solid(polygons);
}
