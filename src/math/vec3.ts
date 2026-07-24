import { almostEqual, EPSILON } from './epsilon';

/**
 * An immutable 3-component vector (or point).
 *
 * `Vec3` values are treated as immutable throughout the codebase — every
 * function below returns a new `Vec3` rather than mutating its arguments.
 */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Creates a `Vec3` from its components.
 */
export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

/** The zero vector, `(0, 0, 0)`. */
export const ZERO: Vec3 = vec3(0, 0, 0);

/** Component-wise addition: `a + b`. */
export function add(a: Vec3, b: Vec3): Vec3 {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

/** Component-wise subtraction: `a - b`. */
export function sub(a: Vec3, b: Vec3): Vec3 {
  return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Scales `v` by scalar `s`. */
export function scale(v: Vec3, s: number): Vec3 {
  return vec3(v.x * s, v.y * s, v.z * s);
}

/** Negates `v`, equivalent to `scale(v, -1)`. */
export function negate(v: Vec3): Vec3 {
  return vec3(-v.x, -v.y, -v.z);
}

/** The dot product of `a` and `b`. */
export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** The cross product `a × b`, following the right-hand rule. */
export function cross(a: Vec3, b: Vec3): Vec3 {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

/** The Euclidean length (magnitude) of `v`. */
export function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Returns `v` scaled to unit length.
 *
 * The zero vector has no defined direction, so normalizing it returns the
 * zero vector rather than producing `NaN`.
 */
export function normalize(v: Vec3): Vec3 {
  const len = length(v);
  if (len <= EPSILON) {
    return ZERO;
  }
  return scale(v, 1 / len);
}

/** Linearly interpolates from `a` to `b` by `t` (0 = `a`, 1 = `b`). */
export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return add(a, scale(sub(b, a), t));
}

/** Whether `a` and `b` are equal within `tolerance` on every component. */
export function equals(a: Vec3, b: Vec3, tolerance = EPSILON): boolean {
  return (
    almostEqual(a.x, b.x, tolerance) &&
    almostEqual(a.y, b.y, tolerance) &&
    almostEqual(a.z, b.z, tolerance)
  );
}
