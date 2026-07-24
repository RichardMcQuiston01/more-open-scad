import { EPSILON } from './epsilon';
import { type Vec3, vec3 } from './vec3';

/**
 * The 16 elements of a `Mat4`, stored **column-major** (the same layout
 * used by OpenGL/WebGL/three.js): `e[12]`, `e[13]`, `e[14]` hold the
 * translation. `transformPoint`/`transformDirection` apply the matrix to a
 * column vector, i.e. `v' = M * v`.
 */
export type Mat4Elements = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** An immutable 4x4 transformation matrix. */
export interface Mat4 {
  readonly e: Mat4Elements;
}

function mat4(e: Mat4Elements): Mat4 {
  return { e };
}

/** The identity matrix. */
export const IDENTITY: Mat4 = mat4([
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]);

/** A matrix translating by `v`. */
export function translation(v: Vec3): Mat4 {
  return mat4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v.x, v.y, v.z, 1]);
}

/** A matrix scaling each axis by the corresponding component of `v`. */
export function scaling(v: Vec3): Mat4 {
  return mat4([v.x, 0, 0, 0, 0, v.y, 0, 0, 0, 0, v.z, 0, 0, 0, 0, 1]);
}

/** A matrix rotating `radians` around the X axis (right-hand rule). */
export function rotationX(radians: number): Mat4 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return mat4([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

/** A matrix rotating `radians` around the Y axis (right-hand rule). */
export function rotationY(radians: number): Mat4 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return mat4([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

/** A matrix rotating `radians` around the Z axis (right-hand rule). */
export function rotationZ(radians: number): Mat4 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return mat4([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

/**
 * A matrix rotating `radians` around `axis` (right-hand rule), via the
 * Rodrigues rotation formula. `axis` need not be pre-normalized.
 */
export function rotationAxisAngle(axis: Vec3, radians: number): Mat4 {
  const len = Math.hypot(axis.x, axis.y, axis.z);
  if (len <= EPSILON) {
    return IDENTITY;
  }
  const x = axis.x / len;
  const y = axis.y / len;
  const z = axis.z / len;
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  const t = 1 - c;

  return mat4([
    t * x * x + c,
    t * x * y + s * z,
    t * x * z - s * y,
    0,
    t * x * y - s * z,
    t * y * y + c,
    t * y * z + s * x,
    0,
    t * x * z + s * y,
    t * y * z - s * x,
    t * z * z + c,
    0,
    0,
    0,
    0,
    1,
  ]);
}

/**
 * A matrix reflecting points across the plane through the origin with
 * (not necessarily unit) normal `normal` — the Householder reflection
 * `I - 2 * n * nᵀ`. Reflections have determinant `-1`.
 */
export function reflection(normal: Vec3): Mat4 {
  const len = Math.hypot(normal.x, normal.y, normal.z);
  if (len <= EPSILON) {
    return IDENTITY;
  }
  const x = normal.x / len;
  const y = normal.y / len;
  const z = normal.z / len;

  return mat4([
    1 - 2 * x * x,
    -2 * x * y,
    -2 * x * z,
    0,
    -2 * x * y,
    1 - 2 * y * y,
    -2 * y * z,
    0,
    -2 * x * z,
    -2 * y * z,
    1 - 2 * z * z,
    0,
    0,
    0,
    0,
    1,
  ]);
}

/** The matrix product `a * b` (i.e. "apply `b`, then `a`" to a point). */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const [
    a00,
    a01,
    a02,
    a03,
    a10,
    a11,
    a12,
    a13,
    a20,
    a21,
    a22,
    a23,
    a30,
    a31,
    a32,
    a33,
  ] = a.e;
  const [
    b00,
    b01,
    b02,
    b03,
    b10,
    b11,
    b12,
    b13,
    b20,
    b21,
    b22,
    b23,
    b30,
    b31,
    b32,
    b33,
  ] = b.e;

  return mat4([
    a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
    a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
    a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
    a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,

    a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
    a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
    a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
    a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,

    a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
    a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
    a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
    a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,

    a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
    a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
    a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
    a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33,
  ]);
}

/** The transpose of `m`. */
export function transpose(m: Mat4): Mat4 {
  const [
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
  ] = m.e;
  return mat4([
    m00,
    m10,
    m20,
    m30,
    m01,
    m11,
    m21,
    m31,
    m02,
    m12,
    m22,
    m32,
    m03,
    m13,
    m23,
    m33,
  ]);
}

/** The 12 minors shared by `determinant` and `invert`'s cofactor expansion. */
function minors(m: Mat4) {
  const [
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
  ] = m.e;

  const b00 = m00 * m11 - m01 * m10;
  const b01 = m00 * m12 - m02 * m10;
  const b02 = m00 * m13 - m03 * m10;
  const b03 = m01 * m12 - m02 * m11;
  const b04 = m01 * m13 - m03 * m11;
  const b05 = m02 * m13 - m03 * m12;
  const b06 = m20 * m31 - m21 * m30;
  const b07 = m20 * m32 - m22 * m30;
  const b08 = m20 * m33 - m23 * m30;
  const b09 = m21 * m32 - m22 * m31;
  const b10 = m21 * m33 - m23 * m31;
  const b11 = m22 * m33 - m23 * m32;

  const det =
    b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return {
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
    b00,
    b01,
    b02,
    b03,
    b04,
    b05,
    b06,
    b07,
    b08,
    b09,
    b10,
    b11,
    det,
  };
}

/** The determinant of `m`. */
export function determinant(m: Mat4): number {
  return minors(m).det;
}

/**
 * The inverse of `m`, or `null` if `m` is singular (not invertible within
 * floating-point tolerance).
 */
export function invert(m: Mat4): Mat4 | null {
  const {
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
    b00,
    b01,
    b02,
    b03,
    b04,
    b05,
    b06,
    b07,
    b08,
    b09,
    b10,
    b11,
    det,
  } = minors(m);

  if (Math.abs(det) <= EPSILON) {
    return null;
  }
  const invDet = 1 / det;

  return mat4([
    (m11 * b11 - m12 * b10 + m13 * b09) * invDet,
    (m02 * b10 - m01 * b11 - m03 * b09) * invDet,
    (m31 * b05 - m32 * b04 + m33 * b03) * invDet,
    (m22 * b04 - m21 * b05 - m23 * b03) * invDet,

    (m12 * b08 - m10 * b11 - m13 * b07) * invDet,
    (m00 * b11 - m02 * b08 + m03 * b07) * invDet,
    (m32 * b02 - m30 * b05 - m33 * b01) * invDet,
    (m20 * b05 - m22 * b02 + m23 * b01) * invDet,

    (m10 * b10 - m11 * b08 + m13 * b06) * invDet,
    (m01 * b08 - m00 * b10 - m03 * b06) * invDet,
    (m30 * b04 - m31 * b02 + m33 * b00) * invDet,
    (m21 * b02 - m20 * b04 - m23 * b00) * invDet,

    (m11 * b07 - m10 * b09 - m12 * b06) * invDet,
    (m00 * b09 - m01 * b07 + m02 * b06) * invDet,
    (m31 * b01 - m30 * b03 - m32 * b00) * invDet,
    (m20 * b03 - m21 * b01 + m22 * b00) * invDet,
  ]);
}

/** Whether `a` and `b` are equal within `tolerance` on every element. */
export function equals(a: Mat4, b: Mat4, tolerance = EPSILON): boolean {
  return a.e.every((value, i) => Math.abs(value - b.e[i]!) <= tolerance);
}

/** Applies `m` to point `v` (treats `v` as having an implicit `w = 1`). */
export function transformPoint(m: Mat4, v: Vec3): Vec3 {
  const [
    m00,
    m01,
    m02,
    _m03,
    m10,
    m11,
    m12,
    _m13,
    m20,
    m21,
    m22,
    _m23,
    m30,
    m31,
    m32,
    _m33,
  ] = m.e;
  return vec3(
    m00 * v.x + m10 * v.y + m20 * v.z + m30,
    m01 * v.x + m11 * v.y + m21 * v.z + m31,
    m02 * v.x + m12 * v.y + m22 * v.z + m32,
  );
}

/**
 * Applies `m` to direction `v` (treats `v` as having an implicit `w = 0`,
 * so translation is ignored). Note: transforming a *normal* correctly under
 * non-uniform scale requires the inverse-transpose of `m`, not `m` itself —
 * callers responsible for normals should pass `transpose(invert(m))`.
 */
export function transformDirection(m: Mat4, v: Vec3): Vec3 {
  const [m00, m01, m02, _m03, m10, m11, m12, _m13, m20, m21, m22, _m23] = m.e;
  return vec3(
    m00 * v.x + m10 * v.y + m20 * v.z,
    m01 * v.x + m11 * v.y + m21 * v.z,
    m02 * v.x + m12 * v.y + m22 * v.z,
  );
}
