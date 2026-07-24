/**
 * Default tolerance used for floating-point comparisons throughout the
 * geometry kernel (vector/matrix math, plane classification, CSG splitting).
 */
export const EPSILON = 1e-9;

/**
 * Returns whether `a` and `b` are equal within `tolerance`.
 */
export function almostEqual(
  a: number,
  b: number,
  tolerance = EPSILON,
): boolean {
  return Math.abs(a - b) <= tolerance;
}
