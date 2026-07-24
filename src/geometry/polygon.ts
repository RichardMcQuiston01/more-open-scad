import * as Plane from './plane';
import type { Plane as PlaneType } from './plane';
import * as Vertex from './vertex';
import type { Vertex as VertexType } from './vertex';

/**
 * A planar, convex polygon with an arbitrary number of vertices (3+),
 * wound counter-clockwise when viewed from the side its plane's normal
 * points toward. Polygons are kept as-is (not pre-triangulated) so they
 * can be split cleanly by the future BSP-tree CSG engine; triangulation
 * happens only at STL-export time via `triangulate`.
 */
export interface Polygon {
  readonly vertices: readonly VertexType[];
  readonly plane: PlaneType;
}

/**
 * Creates a `Polygon` from `vertices`, deriving its plane from the first
 * three. Throws if fewer than 3 vertices are given.
 */
export function polygon(vertices: readonly VertexType[]): Polygon {
  const [v0, v1, v2] = vertices;
  if (!v0 || !v1 || !v2) {
    throw new Error(
      `Polygon requires at least 3 vertices, got ${vertices.length}`,
    );
  }
  return { vertices, plane: Plane.fromPoints(v0.pos, v1.pos, v2.pos) };
}

/**
 * The polygon with its winding order reversed and its plane/vertex
 * normals flipped to match — turns an outward-facing polygon inside out.
 */
export function flip(p: Polygon): Polygon {
  return {
    vertices: [...p.vertices].reverse().map(Vertex.flip),
    plane: Plane.flip(p.plane),
  };
}
