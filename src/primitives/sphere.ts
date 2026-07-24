import { polygon } from '../geometry/polygon';
import type { Polygon } from '../geometry/polygon';
import { Solid } from '../geometry/solid';
import { vertex } from '../geometry/vertex';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';

/** Options accepted by {@link sphere}. */
export interface SphereOptions {
  /**
   * Controls tessellation density, mirroring OpenSCAD's `$fn`. Used
   * directly as the number of longitude segments (segments running around
   * the sphere, pole to pole to pole). The number of latitude rings
   * (bands stacked from the north pole to the south pole) is derived as
   * `fn / 2`, floored, with a minimum of 2 — matching the common
   * approximation that a sphere's silhouette should have roughly as many
   * horizontal bands as it does vertical wedges around the equator.
   * Defaults to `32`.
   */
  fn?: number;
}

/**
 * Builds a UV-sphere of radius `r`, centered at the origin.
 *
 * Every face is a triangle. A UV-sphere's "band" faces between two
 * latitude rings are natural quads, but four points on a sphere's curved
 * surface are only ever approximately coplanar — this codebase's
 * `Polygon` is required to be *exactly* planar, so each band quad is
 * split into 2 triangles (always exactly planar) instead of being kept
 * as a quad. The polar caps are triangle fans connecting the pole point
 * to the nearest latitude ring, which are triangles already.
 *
 * Vertex normals are the exact smooth-shading normals for a sphere
 * centered at the origin: each vertex's own position, normalized.
 *
 * @param r - Sphere radius.
 * @param options - See {@link SphereOptions}.
 * @throws {Error} If `options.fn` is less than 3.
 */
export function sphere(r: number, options?: SphereOptions): Solid {
  const fn = options?.fn ?? 32;
  if (fn < 3) {
    throw new Error(`sphere requires fn >= 3, got ${fn}`);
  }

  const segments = Math.max(3, Math.floor(fn));
  const rings = Math.max(2, Math.floor(fn / 2));

  const northPole = Vec3.vec3(0, 0, r);
  const southPole = Vec3.vec3(0, 0, -r);

  // `ringPositions[i]` holds the `segments` vertex positions for the
  // latitude ring at colatitude `phi = (i + 1) * PI / rings`, i.e. the
  // intermediate rings strictly between the two poles.
  const ringPositions: Vec3Type[][] = [];
  for (let i = 1; i < rings; i++) {
    const phi = (i * Math.PI) / rings;
    const row: Vec3Type[] = [];
    for (let j = 0; j < segments; j++) {
      const theta = (j * 2 * Math.PI) / segments;
      row.push(
        Vec3.vec3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ),
      );
    }
    ringPositions.push(row);
  }

  const face = (...positions: readonly Vec3Type[]): Polygon =>
    polygon(positions.map((pos) => vertex(pos, Vec3.normalize(pos))));

  const polygons: Polygon[] = [];

  // `rings` is clamped to a minimum of 2, so `ringPositions` always has
  // at least 1 row (the `rings === 2` case degenerates to a single ring,
  // with both pole caps fanning directly to it and no bands in between).

  // North cap: a triangle fan from the north pole to the first ring.
  const firstRing = ringPositions[0]!;
  for (let j = 0; j < segments; j++) {
    const jNext = (j + 1) % segments;
    polygons.push(face(northPole, firstRing[j]!, firstRing[jNext]!));
  }

  // Bands: each quad between consecutive rings, split into 2 triangles.
  for (let i = 0; i < ringPositions.length - 1; i++) {
    const ringA = ringPositions[i]!;
    const ringB = ringPositions[i + 1]!;
    for (let j = 0; j < segments; j++) {
      const jNext = (j + 1) % segments;
      const a0 = ringA[j]!;
      const a1 = ringA[jNext]!;
      const b0 = ringB[j]!;
      const b1 = ringB[jNext]!;
      polygons.push(face(a0, b0, b1));
      polygons.push(face(a0, b1, a1));
    }
  }

  // South cap: a triangle fan from the south pole to the last ring.
  const lastRing = ringPositions[ringPositions.length - 1]!;
  for (let j = 0; j < segments; j++) {
    const jNext = (j + 1) % segments;
    polygons.push(face(southPole, lastRing[jNext]!, lastRing[j]!));
  }

  return new Solid(polygons);
}
