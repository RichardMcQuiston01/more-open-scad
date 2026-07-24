import { triangulate } from '../geometry/triangulate';
import type { Solid } from '../geometry/solid';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';

/**
 * A single triangle in STL's flat, per-facet representation: one normal
 * plus three vertex positions (STL has no notion of per-vertex smooth
 * shading, unlike `Vertex`).
 */
export interface StlTriangle {
  readonly normal: Vec3Type;
  readonly vertices: readonly [Vec3Type, Vec3Type, Vec3Type];
}

/**
 * Flattens `solid` into the list of triangles STL export needs: every
 * polygon is fan-triangulated (reusing `geometry/triangulate`), and each
 * resulting triangle's normal is (re)computed directly from its own three
 * vertex positions via the right-hand rule — matching STL's convention
 * that vertices are wound counter-clockwise when viewed from the side the
 * normal points toward. Computing the normal per-triangle (rather than
 * reusing the source polygon's plane or a vertex's smooth-shading normal)
 * keeps every emitted triangle self-consistent, even for a polygon whose
 * vertices aren't perfectly planar (e.g. a caller-supplied `polyhedron`
 * face).
 */
export function triangulateSolid(solid: Solid): StlTriangle[] {
  const triangles: StlTriangle[] = [];
  for (const polygon of solid.polygons) {
    for (const [a, b, c] of triangulate(polygon)) {
      const normal = Vec3.normalize(
        Vec3.cross(Vec3.sub(b.pos, a.pos), Vec3.sub(c.pos, a.pos)),
      );
      triangles.push({ normal, vertices: [a.pos, b.pos, c.pos] });
    }
  }
  return triangles;
}
