import type { Solid } from '../geometry/solid';
import type { Vec3 } from '../math/vec3';
import { triangulateSolid } from './triangulate-solid';

/**
 * Decimal places used to quantize a vertex coordinate before it becomes
 * part of an edge map key. `EPSILON` (`1e-9`, see `src/math/epsilon.ts`)
 * is the project's tolerance for *exact* floating-point round-off (e.g.
 * two computations of the same point that should be bit-for-bit close).
 * Rounding to 9 decimal places matches that same order of magnitude: two
 * positions produced by independent but mathematically-equal computations
 * (e.g. a shared cube edge reached once per adjacent face) round to the
 * same key, while any two positions that are genuinely distinct at the
 * precision this codebase cares about still round to different keys.
 */
const EDGE_KEY_DECIMALS = 9;

/** Quantizes a single coordinate to `EDGE_KEY_DECIMALS` decimal places. */
function quantize(n: number): string {
  return n.toFixed(EDGE_KEY_DECIMALS);
}

/** A stable string key for a vertex position, used to key the edge map. */
function pointKey(p: Vec3): string {
  return `${quantize(p.x)},${quantize(p.y)},${quantize(p.z)}`;
}

/** A stable string key for a directed edge `from -> to`. */
function directedEdgeKey(from: Vec3, to: Vec3): string {
  return `${pointKey(from)}->${pointKey(to)}`;
}

/** A stable string key for the reverse of a directed edge `from -> to`. */
function reverseEdgeKey(from: Vec3, to: Vec3): string {
  return `${pointKey(to)}->${pointKey(from)}`;
}

/**
 * Checks whether `solid` is manifold ("watertight"): every directed edge
 * produced by triangulating the solid has exactly one occurrence, and its
 * reverse-directed counterpart also has exactly one occurrence elsewhere
 * in the mesh. This is the standard mesh-processing definition of a
 * closed, consistently-wound 2-manifold surface — it catches both holes
 * (a directed edge with no matching reverse partner) and winding
 * inconsistencies (a directed edge duplicated in the same direction,
 * which leaves its reverse missing).
 *
 * A solid with no triangles is defined as manifold (`true`): there are no
 * edges to violate the watertightness property, so the check is
 * vacuously satisfied rather than an error condition.
 *
 * @param solid - The solid to check.
 * @returns `true` if `solid` is manifold, `false` otherwise.
 */
export function isManifold(solid: Solid): boolean {
  const triangles = triangulateSolid(solid);
  if (triangles.length === 0) {
    return true;
  }

  const edgeCounts = new Map<string, number>();
  for (const { vertices } of triangles) {
    const [a, b, c] = vertices;
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const key = directedEdgeKey(from, to);
      edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
    }
  }

  for (const { vertices } of triangles) {
    const [a, b, c] = vertices;
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const count = edgeCounts.get(directedEdgeKey(from, to));
      if (count !== 1) {
        return false;
      }
      const reverseCount = edgeCounts.get(reverseEdgeKey(from, to)) ?? 0;
      if (reverseCount !== 1) {
        return false;
      }
    }
  }

  return true;
}
