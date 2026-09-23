import { EPSILON } from '../math/epsilon';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';

/**
 * An infinite plane, represented in Hessian normal form: a unit `normal`
 * and the offset `w` such that a point `p` lies on the plane when
 * `dot(normal, p) === w`.
 */
export interface Plane {
  readonly normal: Vec3Type;
  readonly w: number;
}

/**
 * Builds the plane through `a`, `b`, `c`. The three points must be ordered
 * counter-clockwise when viewed from the side the resulting normal points
 * toward (right-hand rule) — this matches the outward-facing winding
 * convention used by primitives and STL export.
 *
 * If `a`, `b`, `c` are collinear or coincident, the cross product degenerates
 * to the zero vector; per `Vec3.normalize`, this yields a plane with a zero
 * normal rather than throwing or producing `NaN`.
 */
export function fromPoints(a: Vec3Type, b: Vec3Type, c: Vec3Type): Plane {
  const normal = Vec3.normalize(Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a)));
  return { normal, w: Vec3.dot(normal, a) };
}

/**
 * The signed distance from `point` to `plane`: positive on the side the
 * normal points toward, negative on the opposite side, zero on the plane.
 */
export function signedDistance(plane: Plane, point: Vec3Type): number {
  return Vec3.dot(plane.normal, point) - plane.w;
}

/** The plane with its normal (and therefore orientation) reversed. */
export function flip(plane: Plane): Plane {
  return { normal: Vec3.negate(plane.normal), w: -plane.w };
}

/** Whether `a` and `b` represent the same plane within `tolerance`. */
export function equals(a: Plane, b: Plane, tolerance = EPSILON): boolean {
  return (
    Vec3.equals(a.normal, b.normal, tolerance) &&
    Math.abs(a.w - b.w) <= tolerance
  );
}
