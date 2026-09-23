import { triangulateSolid } from './triangulate-solid';
import type { Solid } from '../geometry/solid';
import type { Vec3 } from '../math/vec3';

/**
 * Decimal places used when formatting each coordinate/normal component.
 *
 * Six digits after the decimal point comfortably round-trips float32
 * precision (STL geometry is conventionally float32-precision, matching the
 * binary writer) while staying well clear of `toFixed`'s exponential-notation
 * fallback, which only kicks in for magnitudes at or beyond 1e21 — far
 * outside any realistic model coordinate.
 */
const DECIMAL_PLACES = 6;

/** The exact string `toFixed` produces for zero, used to strip `-0`. */
const ZERO_STRING = (0).toFixed(DECIMAL_PLACES);

/**
 * Formats a single number as a fixed-point decimal string, never using
 * scientific notation for realistic coordinate ranges. Negative zero (which
 * `toFixed` would otherwise render as e.g. `-0.000000` for tiny negative
 * values that round to zero) is normalized to positive zero for a cleaner,
 * unambiguous output.
 */
function formatNumber(value: number): string {
  const fixed = value.toFixed(DECIMAL_PLACES);
  return fixed === `-${ZERO_STRING}` ? ZERO_STRING : fixed;
}

/** Formats a `Vec3` as three space-separated fixed-point numbers. */
function formatVec3(v: Vec3): string {
  return `${formatNumber(v.x)} ${formatNumber(v.y)} ${formatNumber(v.z)}`;
}

/**
 * Serializes `solid` to the standard ASCII STL text format.
 *
 * `name` (default `''`) is used as the identifier on both the opening
 * `solid` line and the closing `endsolid` line, per the STL spec — when
 * empty, the header/footer lines are emitted as bare `solid`/`endsolid`
 * with no trailing space. Triangles are sourced from `triangulateSolid` and
 * emitted in order, one `facet normal` / `outer loop` / `vertex` x3 /
 * `endloop` / `endfacet` block per triangle. The result always ends with a
 * trailing newline.
 */
export function toASCIISTL(solid: Solid, name = ''): string {
  const header = name === '' ? 'solid' : `solid ${name}`;
  const footer = name === '' ? 'endsolid' : `endsolid ${name}`;

  const lines: string[] = [header];
  for (const triangle of triangulateSolid(solid)) {
    lines.push(`  facet normal ${formatVec3(triangle.normal)}`);
    lines.push('    outer loop');
    for (const vertex of triangle.vertices) {
      lines.push(`      vertex ${formatVec3(vertex)}`);
    }
    lines.push('    endloop');
    lines.push('  endfacet');
  }
  lines.push(footer);

  return `${lines.join('\n')}\n`;
}
