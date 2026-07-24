import { describe, expect, test } from 'bun:test';
import * as Polygon from '../geometry/polygon';
import { Solid } from '../geometry/solid';
import { cube } from '../primitives/cube';
import { cylinder } from '../primitives/cylinder';
import { sphere } from '../primitives/sphere';
import * as Vec3 from '../math/vec3';
import { isManifold } from './manifold-check';

describe('isManifold', () => {
  test('is true for a closed, correctly-wound cube', () => {
    expect(isManifold(cube(2))).toBe(true);
  });

  test('is true for a closed, correctly-wound sphere', () => {
    expect(isManifold(sphere(1, { fn: 12 }))).toBe(true);
  });

  test('is true for a closed, correctly-wound cylinder', () => {
    expect(isManifold(cylinder(2))).toBe(true);
  });

  test('is true after chained transforms', () => {
    const transformed = cube(2)
      .translate(Vec3.vec3(5, -3, 1))
      .rotate(Vec3.vec3(Math.PI / 6, Math.PI / 4, Math.PI / 3))
      .scale(Vec3.vec3(1.5, 2, 0.5));
    expect(isManifold(transformed)).toBe(true);
  });

  test('is false for a solid missing a face (a hole)', () => {
    const openBox = new Solid(cube(2).polygons.slice(0, 5));
    expect(isManifold(openBox)).toBe(false);
  });

  test('is false when one face has inconsistent winding', () => {
    const polygons = cube(2).polygons;
    const flippedFace = [...polygons];
    flippedFace[0] = Polygon.flip(polygons[0]!);
    expect(isManifold(new Solid(flippedFace))).toBe(false);
  });

  test('is true (vacuously) for an empty solid', () => {
    expect(isManifold(new Solid([]))).toBe(true);
  });
});
