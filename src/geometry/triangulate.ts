import type { Polygon } from './polygon';
import type { Vertex } from './vertex';

/** Three vertices forming a triangle, wound the same way as their source. */
export type Triangle = readonly [Vertex, Vertex, Vertex];

/**
 * Fan-triangulates a convex `Polygon` into `n - 2` triangles (for an
 * `n`-vertex polygon), all sharing the first vertex. Winding is preserved:
 * each triangle keeps the same vertex order as the source polygon, so its
 * implied normal matches the polygon's plane.
 *
 * Triangulation happens only at STL-export time — `Polygon`/`Solid` keep
 * their original (non-triangulated) vertices so the future CSG engine can
 * split them cleanly.
 */
export function triangulate(polygon: Polygon): Triangle[] {
  const { vertices } = polygon;
  const v0 = vertices[0]!;
  const triangles: Triangle[] = [];
  for (let i = 1; i < vertices.length - 1; i++) {
    triangles.push([v0, vertices[i]!, vertices[i + 1]!]);
  }
  return triangles;
}
