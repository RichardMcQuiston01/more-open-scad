import { describe, expect, test } from 'bun:test';
import {
  averageVertexPosition,
  hasOutwardNormals,
  signedVolume,
} from '../testing/solid-assertions';
import { cylinder } from './cylinder';

describe('cylinder', () => {
  describe('signedVolume', () => {
    test('converges toward the analytic straight-cylinder volume as fn increases', () => {
      const r = 2;
      const h = 5;
      const analytic = Math.PI * r * r * h;

      const coarse = cylinder(h, { r, fn: 8 });
      const fine = cylinder(h, { r, fn: 256 });

      const coarseError = Math.abs(signedVolume(coarse) - analytic);
      const fineError = Math.abs(signedVolume(fine) - analytic);

      expect(fineError).toBeLessThan(coarseError);
      expect(fineError).toBeLessThan(analytic * 1e-3);
    });

    test('is close to the analytic frustum volume for a tapered cylinder', () => {
      const r1 = 3;
      const r2 = 1;
      const h = 4;
      const analytic = ((Math.PI * h) / 3) * (r1 ** 2 + r1 * r2 + r2 ** 2);

      const solid = cylinder(h, { r1, r2, fn: 128 });

      expect(signedVolume(solid)).toBeCloseTo(analytic, 1);
    });

    test('produces a sensible positive volume for a cone (r2 = 0) without NaN/degenerate geometry', () => {
      const r1 = 2;
      const h = 6;
      const analytic = (1 / 3) * Math.PI * r1 ** 2 * h;

      const solid = cylinder(h, { r1, r2: 0, fn: 128 });
      const volume = signedVolume(solid);

      expect(Number.isNaN(volume)).toBe(false);
      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeCloseTo(analytic, 1);

      for (const polygon of solid.polygons) {
        for (const vertex of polygon.vertices) {
          expect(Number.isNaN(vertex.pos.x)).toBe(false);
          expect(Number.isNaN(vertex.pos.y)).toBe(false);
          expect(Number.isNaN(vertex.pos.z)).toBe(false);
        }
      }
    });

    test('produces a sensible positive volume for a cone (r1 = 0) without NaN/degenerate geometry', () => {
      const r2 = 2;
      const h = 6;
      const analytic = (1 / 3) * Math.PI * r2 ** 2 * h;

      const solid = cylinder(h, { r1: 0, r2, fn: 128 });
      const volume = signedVolume(solid);

      expect(Number.isNaN(volume)).toBe(false);
      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeCloseTo(analytic, 1);
    });
  });

  describe('hasOutwardNormals', () => {
    test('is true for a straight cylinder', () => {
      expect(hasOutwardNormals(cylinder(5, { r: 2, fn: 16 }))).toBe(true);
    });

    test('is true for a tapered frustum', () => {
      expect(hasOutwardNormals(cylinder(4, { r1: 3, r2: 1, fn: 16 }))).toBe(
        true,
      );
    });

    test('is true for a cone', () => {
      expect(hasOutwardNormals(cylinder(6, { r1: 2, r2: 0, fn: 16 }))).toBe(
        true,
      );
    });
  });

  describe('center option', () => {
    test('defaults to a base at z=0 and top at z=h', () => {
      const solid = cylinder(10, { r: 1, fn: 8 });
      const zs = solid.polygons.flatMap((p) => p.vertices.map((v) => v.pos.z));

      expect(Math.min(...zs)).toBeCloseTo(0);
      expect(Math.max(...zs)).toBeCloseTo(10);
    });

    test('when true, shifts the z-range to [-h/2, h/2]', () => {
      const solid = cylinder(10, { r: 1, fn: 8, center: true });
      const zs = solid.polygons.flatMap((p) => p.vertices.map((v) => v.pos.z));

      expect(Math.min(...zs)).toBeCloseTo(-5);
      expect(Math.max(...zs)).toBeCloseTo(5);
    });

    test('centers the average vertex position near z=0', () => {
      const solid = cylinder(10, { r: 1, fn: 32, center: true });
      const centroid = averageVertexPosition(solid);

      expect(centroid.z).toBeCloseTo(0, 1);
    });
  });

  describe('validation', () => {
    test('throws for fn < 3', () => {
      expect(() => cylinder(1, { fn: 2 })).toThrow();
    });

    test('throws for h <= 0', () => {
      expect(() => cylinder(0)).toThrow();
      expect(() => cylinder(-1)).toThrow();
    });

    test('throws when r1 and r2 are both 0', () => {
      expect(() => cylinder(1, { r1: 0, r2: 0 })).toThrow();
    });

    test('throws for negative radii', () => {
      expect(() => cylinder(1, { r: -1 })).toThrow();
      expect(() => cylinder(1, { r1: -1, r2: 1 })).toThrow();
    });
  });

  describe('defaults', () => {
    test('defaults to r=1 when no radius options are given', () => {
      const solid = cylinder(1, { fn: 32 });
      expect(signedVolume(solid)).toBeCloseTo(Math.PI, 1);
    });

    test('r sets both r1 and r2 for a straight cylinder', () => {
      const solid = cylinder(3, { r: 2, fn: 32 });
      const xs = solid.polygons.flatMap((p) => p.vertices.map((v) => v.pos.x));
      expect(Math.max(...xs)).toBeCloseTo(2, 1);
    });
  });
});
