import { describe, expect, test } from 'bun:test';
import type { Solid } from '../geometry/solid';
import * as Vec3 from '../math/vec3';
import {
  averageVertexPosition,
  hasOutwardNormals,
  signedVolume,
} from '../testing/solid-assertions';
import { cube } from './cube';

/** The min and max corner of the axis-aligned bounding box of `solid`. */
function bounds(solid: Solid): { min: Vec3.Vec3; max: Vec3.Vec3 } {
  let min = Vec3.vec3(Infinity, Infinity, Infinity);
  let max = Vec3.vec3(-Infinity, -Infinity, -Infinity);
  for (const polygon of solid.polygons) {
    for (const vertex of polygon.vertices) {
      min = Vec3.vec3(
        Math.min(min.x, vertex.pos.x),
        Math.min(min.y, vertex.pos.y),
        Math.min(min.z, vertex.pos.z),
      );
      max = Vec3.vec3(
        Math.max(max.x, vertex.pos.x),
        Math.max(max.y, vertex.pos.y),
        Math.max(max.z, vertex.pos.z),
      );
    }
  }
  return { min, max };
}

describe('cube', () => {
  test('has signed volume w^3 for a scalar size', () => {
    expect(signedVolume(cube(2))).toBeCloseTo(8);
    expect(signedVolume(cube(5))).toBeCloseTo(125);
  });

  test('has signed volume w*d*h for a Vec3 size', () => {
    expect(signedVolume(cube(Vec3.vec3(2, 3, 4)))).toBeCloseTo(24);
  });

  test('has outward-facing normals', () => {
    expect(hasOutwardNormals(cube(Vec3.vec3(2, 3, 4)))).toBe(true);
    expect(hasOutwardNormals(cube(2, { center: true }))).toBe(true);
  });

  test('by default spans [0, size] on each axis', () => {
    const { min, max } = bounds(cube(Vec3.vec3(2, 3, 4)));
    expect(Vec3.equals(min, Vec3.vec3(0, 0, 0))).toBe(true);
    expect(Vec3.equals(max, Vec3.vec3(2, 3, 4))).toBe(true);
  });

  test('when centered spans [-size/2, size/2] on each axis', () => {
    const { min, max } = bounds(cube(Vec3.vec3(2, 3, 4), { center: true }));
    expect(Vec3.equals(min, Vec3.vec3(-1, -1.5, -2))).toBe(true);
    expect(Vec3.equals(max, Vec3.vec3(1, 1.5, 2))).toBe(true);
    expect(
      Vec3.equals(averageVertexPosition(cube(2, { center: true })), Vec3.ZERO),
    ).toBe(true);
  });

  test('is made of exactly 6 quad faces', () => {
    const solid = cube(Vec3.vec3(2, 3, 4));
    expect(solid.polygons).toHaveLength(6);
    for (const polygon of solid.polygons) {
      expect(polygon.vertices).toHaveLength(4);
    }
  });
});
