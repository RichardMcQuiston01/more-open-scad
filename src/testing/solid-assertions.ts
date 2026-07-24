import type { Polygon } from '../geometry/polygon';
import type { Solid } from '../geometry/solid';
import { triangulate } from '../geometry/triangulate';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';

/**
 * Test-only geometry assertions shared across primitive, transform, STL
 * export, and (later) CSG tests. Not part of the published package — see
 * `tsconfig.build.json`, which excludes `src/testing/**`.
 */

/**
 * The signed volume enclosed by `solid`, computed via the divergence
 * theorem (the sum of signed tetrahedron volumes from the origin to each
 * triangle). For a closed, non-self-intersecting solid with consistently
 * outward-facing winding, this is positive and equal to the solid's true
 * volume; a negative result indicates inward-facing (flipped) winding.
 */
export function signedVolume(solid: Solid): number {
  let sum = 0;
  for (const polygon of solid.polygons) {
    for (const [a, b, c] of triangulate(polygon)) {
      sum += Vec3.dot(a.pos, Vec3.cross(b.pos, c.pos));
    }
  }
  return sum / 6;
}

function averagePosition(polygons: readonly Polygon[]): Vec3Type {
  let sum = Vec3.ZERO;
  let count = 0;
  for (const polygon of polygons) {
    for (const vertex of polygon.vertices) {
      sum = Vec3.add(sum, vertex.pos);
      count++;
    }
  }
  return count === 0 ? Vec3.ZERO : Vec3.scale(sum, 1 / count);
}

/**
 * The average of every vertex position in `solid`. A reasonable proxy for
 * its centroid for the convex, roughly-symmetric primitives this helper
 * is used to test — not a true volumetric centroid.
 */
export function averageVertexPosition(solid: Solid): Vec3Type {
  return averagePosition(solid.polygons);
}

function faceCentroid(polygon: Polygon): Vec3Type {
  return averagePosition([polygon]);
}

/**
 * Whether every face of `solid` has an outward-facing normal: for each
 * polygon, the vector from the solid's (approximate) centroid to the
 * face's centroid must point in roughly the same direction as the face's
 * plane normal.
 */
export function hasOutwardNormals(solid: Solid): boolean {
  const centroid = averageVertexPosition(solid);
  return solid.polygons.every((polygon) => {
    const toFace = Vec3.sub(faceCentroid(polygon), centroid);
    return Vec3.dot(polygon.plane.normal, toFace) > 0;
  });
}
