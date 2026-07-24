import { EPSILON } from '../math/epsilon';
import * as Vec3 from '../math/vec3';
import * as Plane from '../geometry/plane';
import type { Plane as PlaneType } from '../geometry/plane';
import * as Polygon from '../geometry/polygon';
import type { Polygon as PolygonType } from '../geometry/polygon';
import * as Vertex from '../geometry/vertex';
import type { Vertex as VertexType } from '../geometry/vertex';

/** Exactly on the plane, within `EPSILON`. */
export const COPLANAR = 0;
/** Strictly on the side the plane's normal points toward. */
export const FRONT = 1;
/** Strictly on the opposite side from the plane's normal. */
export const BACK = 2;
/** Both `Front` and `Back` — the polygon crosses the plane. */
export const SPANNING = 3;

/**
 * How a vertex (or, bitwise-OR'd together, a whole polygon) sits relative
 * to a splitting plane. `Spanning` is `Front | Back`: a polygon spans the
 * plane exactly when it has at least one strictly-front and one
 * strictly-back vertex.
 */
export type Classification =
  | typeof COPLANAR
  | typeof FRONT
  | typeof BACK
  | typeof SPANNING;

/**
 * The result of splitting one polygon against one plane. A polygon lands
 * in exactly one of the four buckets, except a `Spanning` polygon, which
 * contributes one clipped piece to both `front` and `back` (or is dropped
 * from a side entirely if clipping leaves fewer than 3 vertices on that
 * side — see `splitPolygon`). Every field is an array purely for uniform,
 * concatenation-friendly call sites (the BSP tree in later stages will
 * accumulate many of these); for this library's always-convex `Polygon`,
 * each field holds at most one polygon per call.
 */
export interface SplitResult {
  /** Coplanar with the plane, facing the same direction as its normal. */
  readonly coplanarFront: readonly PolygonType[];
  /** Coplanar with the plane, facing the opposite direction. */
  readonly coplanarBack: readonly PolygonType[];
  /** Strictly in front of the plane (or the front piece of a split). */
  readonly front: readonly PolygonType[];
  /** Strictly behind the plane (or the back piece of a split). */
  readonly back: readonly PolygonType[];
}

const EMPTY: SplitResult = {
  coplanarFront: [],
  coplanarBack: [],
  front: [],
  back: [],
};

/**
 * Classifies `polygon` against `plane` and splits it if it spans the
 * plane, à la the classic BSP-CSG algorithm (Naylor/Thibault, as
 * popularized by csg.js).
 *
 * Each vertex is classified `Front`/`Back`/`Coplanar` by its signed
 * distance to the plane (within `EPSILON`); the polygon's overall
 * classification is the bitwise OR of its vertices' classifications.
 * `Coplanar` polygons are further split into `coplanarFront`/
 * `coplanarBack` by comparing their own plane's normal to the splitting
 * plane's normal. A `Spanning` polygon is walked edge by edge: each
 * vertex joins the front chain (if not strictly `Back`), the back chain
 * (if not strictly `Front`) — so a `Coplanar` vertex joins both, forming
 * the shared boundary — and any edge that strictly crosses the plane
 * contributes one new vertex, interpolated at the crossing point, to
 * both chains. A resulting chain becomes an output polygon only if it
 * has at least 3 vertices (matching `Polygon`'s minimum).
 *
 * Because interpolated points are affine combinations of two points on
 * the source polygon's plane, they remain exactly on that same plane, so
 * each output polygon's freshly-derived plane matches the source
 * polygon's orientation.
 */
export function splitPolygon(plane: PlaneType, polygon: PolygonType): SplitResult {
  const distances = polygon.vertices.map((v) => Plane.signedDistance(plane, v.pos));
  const types = distances.map((d): Classification =>
    d < -EPSILON ? BACK : d > EPSILON ? FRONT : COPLANAR,
  );
  const polygonType = types.reduce<Classification>(
    (acc, t) => (acc | t) as Classification,
    COPLANAR,
  );

  switch (polygonType) {
    case COPLANAR: {
      const sameDirection = Vec3.dot(plane.normal, polygon.plane.normal) > 0;
      return sameDirection
        ? { ...EMPTY, coplanarFront: [polygon] }
        : { ...EMPTY, coplanarBack: [polygon] };
    }
    case FRONT:
      return { ...EMPTY, front: [polygon] };
    case BACK:
      return { ...EMPTY, back: [polygon] };
    case SPANNING: {
      const front: VertexType[] = [];
      const back: VertexType[] = [];
      const n = polygon.vertices.length;

      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ti = types[i]!;
        const tj = types[j]!;
        const vi = polygon.vertices[i]!;
        const vj = polygon.vertices[j]!;

        if (ti !== BACK) front.push(vi);
        if (ti !== FRONT) back.push(vi);

        if (((ti | tj) as Classification) === SPANNING) {
          const di = distances[i]!;
          const dj = distances[j]!;
          const t = di / (di - dj);
          const crossing = Vertex.lerp(vi, vj, t);
          front.push(crossing);
          back.push(crossing);
        }
      }

      return {
        ...EMPTY,
        front: front.length >= 3 ? [Polygon.polygon(front)] : [],
        back: back.length >= 3 ? [Polygon.polygon(back)] : [],
      };
    }
    default: {
      const unreachable: never = polygonType;
      throw new Error(`splitPolygon: impossible classification ${unreachable}`);
    }
  }
}
