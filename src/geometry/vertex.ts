import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';

/** A polygon vertex: a position plus its shading normal. */
export interface Vertex {
  readonly pos: Vec3Type;
  readonly normal: Vec3Type;
}

/** Creates a `Vertex` from a position and normal. */
export function vertex(pos: Vec3Type, normal: Vec3Type): Vertex {
  return { pos, normal };
}

/**
 * Linearly interpolates from `a` to `b` by `t` (0 = `a`, 1 = `b`),
 * interpolating both position and normal. The interpolated normal is
 * re-normalized, since a linear blend of two unit vectors is not itself
 * unit length in general.
 */
export function lerp(a: Vertex, b: Vertex, t: number): Vertex {
  return vertex(
    Vec3.lerp(a.pos, b.pos, t),
    Vec3.normalize(Vec3.lerp(a.normal, b.normal, t)),
  );
}

/** The vertex with its normal reversed, position unchanged. */
export function flip(v: Vertex): Vertex {
  return vertex(v.pos, Vec3.negate(v.normal));
}

/** Whether `a` and `b` are equal within `tolerance` on both fields. */
export function equals(a: Vertex, b: Vertex, tolerance?: number): boolean {
  return (
    Vec3.equals(a.pos, b.pos, tolerance) &&
    Vec3.equals(a.normal, b.normal, tolerance)
  );
}
