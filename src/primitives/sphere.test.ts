import { describe, expect, test } from 'bun:test';
import {
  averageVertexPosition,
  hasOutwardNormals,
  signedVolume,
} from '../testing/solid-assertions';
import * as Vec3 from '../math/vec3';
import { sphere } from './sphere';

function analyticVolume(r: number): number {
  return (4 / 3) * Math.PI * r ** 3;
}

describe('sphere', () => {
  test('throws when fn < 3', () => {
    expect(() => sphere(1, { fn: 2 })).toThrow();
    expect(() => sphere(1, { fn: 0 })).toThrow();
    expect(() => sphere(1, { fn: -5 })).toThrow();
  });

  test('every polygon has exactly 3 vertices', () => {
    for (const fn of [4, 8, 16, 32]) {
      const solid = sphere(2, { fn });
      for (const polygon of solid.polygons) {
        expect(polygon.vertices.length).toBe(3);
      }
    }
  });

  test('every vertex lies on the sphere surface (distance from origin ~= r)', () => {
    const r = 3.5;
    const solid = sphere(r, { fn: 24 });
    for (const polygon of solid.polygons) {
      for (const v of polygon.vertices) {
        expect(Vec3.length(v.pos)).toBeCloseTo(r, 6);
      }
    }
  });

  test('vertex normals equal the normalized position', () => {
    const r = 5;
    const solid = sphere(r, { fn: 12 });
    for (const polygon of solid.polygons) {
      for (const v of polygon.vertices) {
        const expectedNormal = Vec3.normalize(v.pos);
        expect(Vec3.equals(v.normal, expectedNormal, 1e-9)).toBe(true);
      }
    }
  });

  describe('hasOutwardNormals', () => {
    test('is true for a small/degenerate-ish fn', () => {
      expect(hasOutwardNormals(sphere(1, { fn: 4 }))).toBe(true);
    });

    test('is true for a typical fn', () => {
      expect(hasOutwardNormals(sphere(1, { fn: 16 }))).toBe(true);
      expect(hasOutwardNormals(sphere(1, { fn: 32 }))).toBe(true);
    });
  });

  describe('signedVolume', () => {
    test('converges toward the analytic sphere volume as fn increases', () => {
      const r = 2;
      const trueVolume = analyticVolume(r);

      const volumeLowFn = signedVolume(sphere(r, { fn: 8 }));
      const volumeHighFn = signedVolume(sphere(r, { fn: 64 }));

      const errorLowFn = Math.abs(volumeLowFn - trueVolume);
      const errorHighFn = Math.abs(volumeHighFn - trueVolume);

      // fn: 64 should be within a few percent of the analytic volume...
      expect(errorHighFn / trueVolume).toBeLessThan(0.03);
      // ...and noticeably closer to the true value than fn: 8.
      expect(errorHighFn).toBeLessThan(errorLowFn);
    });
  });

  test('is centered at the origin', () => {
    const solid = sphere(4, { fn: 20 });
    const centroid = averageVertexPosition(solid);
    // Vertex positions are symmetric about the origin, so their average
    // should land very close to it (not exactly, since pole vertices are
    // sampled once but ring vertices many times).
    expect(Vec3.length(centroid)).toBeLessThan(0.5);
  });
});
