import { describe, expect, test } from 'bun:test';
import { isManifold } from '../io/manifold-check';
import { Solid } from '../geometry/solid';
import * as Vec3 from '../math/vec3';
import { cube } from '../primitives/cube';
import { signedVolume } from '../testing/solid-assertions';
import { difference, intersect, union } from './boolean';

/**
 * Two unit-cube-derived boxes (side 2, so volume 8 each) offset along x by
 * 1 — half of one side length — so they overlap in a 1x2x2 slab (volume 4)
 * running from x=0 to x=1. Classic, easy-to-hand-verify CSG test geometry:
 * every op below has a volume computable by hand from these two numbers.
 */
function overlappingBoxes(): [Solid, Solid] {
  const a = cube(2, { center: true });
  const b = cube(2, { center: true }).translate(Vec3.vec3(1, 0, 0));
  return [a, b];
}

const BOX_VOLUME = 8;
const OVERLAP_VOLUME = 4;

describe('union', () => {
  test('volume is the sum of both boxes minus their overlap, and the result is manifold', () => {
    const [a, b] = overlappingBoxes();
    const result = union(a, b);
    expect(signedVolume(result)).toBeCloseTo(2 * BOX_VOLUME - OVERLAP_VOLUME);
    expect(isManifold(result)).toBe(true);
  });

  test('disjoint boxes union to the sum of their volumes', () => {
    const a = cube(2, { center: true });
    const b = cube(2, { center: true }).translate(Vec3.vec3(10, 0, 0));
    const result = union(a, b);
    expect(signedVolume(result)).toBeCloseTo(2 * BOX_VOLUME);
    expect(isManifold(result)).toBe(true);
  });

  test('is commutative (up to volume/manifoldness)', () => {
    const [a, b] = overlappingBoxes();
    expect(signedVolume(union(a, b))).toBeCloseTo(signedVolume(union(b, a)));
  });
});

describe('difference', () => {
  test('removes the overlap from the first box', () => {
    const [a, b] = overlappingBoxes();
    const result = difference(a, b);
    expect(signedVolume(result)).toBeCloseTo(BOX_VOLUME - OVERLAP_VOLUME);
    expect(isManifold(result)).toBe(true);
  });

  test('subtracting a disjoint box leaves the first box unchanged in volume', () => {
    const a = cube(2, { center: true });
    const b = cube(2, { center: true }).translate(Vec3.vec3(10, 0, 0));
    const result = difference(a, b);
    expect(signedVolume(result)).toBeCloseTo(BOX_VOLUME);
    expect(isManifold(result)).toBe(true);
  });

  test('subtracting a box from itself leaves nothing', () => {
    const a = cube(2, { center: true });
    const result = difference(a, a);
    expect(signedVolume(result)).toBeCloseTo(0);
  });
});

describe('intersect', () => {
  test('keeps only the overlap of the two boxes', () => {
    const [a, b] = overlappingBoxes();
    const result = intersect(a, b);
    expect(signedVolume(result)).toBeCloseTo(OVERLAP_VOLUME);
    expect(isManifold(result)).toBe(true);
  });

  test('disjoint boxes intersect to nothing', () => {
    const a = cube(2, { center: true });
    const b = cube(2, { center: true }).translate(Vec3.vec3(10, 0, 0));
    const result = intersect(a, b);
    expect(signedVolume(result)).toBeCloseTo(0);
    expect(result.polygons).toHaveLength(0);
  });

  test('is commutative (up to volume/manifoldness)', () => {
    const [a, b] = overlappingBoxes();
    expect(signedVolume(intersect(a, b))).toBeCloseTo(
      signedVolume(intersect(b, a)),
    );
  });

  test('a box intersected with itself is unchanged in volume', () => {
    const a = cube(2, { center: true });
    const result = intersect(a, a);
    expect(signedVolume(result)).toBeCloseTo(BOX_VOLUME);
  });
});

describe('consistency across ops', () => {
  test('union, difference, and intersect volumes reconstruct both boxes', () => {
    const [a, b] = overlappingBoxes();
    const u = signedVolume(union(a, b));
    const i = signedVolume(intersect(a, b));
    const aMinusB = signedVolume(difference(a, b));
    const bMinusA = signedVolume(difference(b, a));

    // Inclusion-exclusion: |A ∪ B| = |A| + |B| - |A ∩ B|.
    expect(u).toBeCloseTo(2 * BOX_VOLUME - i);
    // |A| = |A - B| + |A ∩ B|, and symmetrically for B.
    expect(aMinusB + i).toBeCloseTo(BOX_VOLUME);
    expect(bMinusA + i).toBeCloseTo(BOX_VOLUME);
  });
});
