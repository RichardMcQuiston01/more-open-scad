import { describe, expect, test } from 'bun:test';
import * as Vec3 from '../math/vec3';
import * as Plane from './plane';

describe('fromPoints', () => {
  test('normal follows the right-hand rule for a CCW triangle', () => {
    const plane = Plane.fromPoints(
      Vec3.vec3(0, 0, 0),
      Vec3.vec3(1, 0, 0),
      Vec3.vec3(0, 1, 0),
    );
    expect(Vec3.equals(plane.normal, Vec3.vec3(0, 0, 1))).toBe(true);
  });

  test('reversing point order flips the normal', () => {
    const a = Vec3.vec3(0, 0, 0);
    const b = Vec3.vec3(1, 0, 0);
    const c = Vec3.vec3(0, 1, 0);
    const forward = Plane.fromPoints(a, b, c);
    const reversed = Plane.fromPoints(c, b, a);
    expect(Vec3.equals(reversed.normal, Vec3.negate(forward.normal))).toBe(
      true,
    );
  });

  test('every input point lies on the resulting plane', () => {
    const a = Vec3.vec3(1, 2, 3);
    const b = Vec3.vec3(4, 2, -1);
    const c = Vec3.vec3(0, 5, 2);
    const plane = Plane.fromPoints(a, b, c);
    expect(Plane.signedDistance(plane, a)).toBeCloseTo(0);
    expect(Plane.signedDistance(plane, b)).toBeCloseTo(0);
    expect(Plane.signedDistance(plane, c)).toBeCloseTo(0);
  });

  test('collinear points produce a zero normal, not NaN', () => {
    const plane = Plane.fromPoints(
      Vec3.vec3(0, 0, 0),
      Vec3.vec3(1, 0, 0),
      Vec3.vec3(2, 0, 0),
    );
    expect(plane.normal).toEqual(Vec3.ZERO);
    expect(Number.isNaN(plane.w)).toBe(false);
  });

  test('coincident points produce a zero normal, not NaN', () => {
    const p = Vec3.vec3(1, 1, 1);
    const plane = Plane.fromPoints(p, p, p);
    expect(plane.normal).toEqual(Vec3.ZERO);
    expect(Number.isNaN(plane.w)).toBe(false);
  });
});

describe('signedDistance', () => {
  test('is positive on the normal side and negative on the other', () => {
    const plane = Plane.fromPoints(
      Vec3.vec3(0, 0, 0),
      Vec3.vec3(1, 0, 0),
      Vec3.vec3(0, 1, 0),
    );
    expect(Plane.signedDistance(plane, Vec3.vec3(0, 0, 5))).toBeGreaterThan(0);
    expect(Plane.signedDistance(plane, Vec3.vec3(0, 0, -5))).toBeLessThan(0);
  });
});

describe('flip', () => {
  test('negates the normal and w', () => {
    const plane = Plane.fromPoints(
      Vec3.vec3(0, 0, 1),
      Vec3.vec3(1, 0, 1),
      Vec3.vec3(0, 1, 1),
    );
    const flipped = Plane.flip(plane);
    expect(Vec3.equals(flipped.normal, Vec3.negate(plane.normal))).toBe(true);
    expect(flipped.w).toBeCloseTo(-plane.w);
  });

  test('is its own inverse', () => {
    const plane = Plane.fromPoints(
      Vec3.vec3(2, 0, 0),
      Vec3.vec3(0, 3, 0),
      Vec3.vec3(0, 0, 4),
    );
    expect(Plane.equals(Plane.flip(Plane.flip(plane)), plane)).toBe(true);
  });
});
