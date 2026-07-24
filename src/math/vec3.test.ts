import { describe, expect, test } from 'bun:test';
import * as Vec3 from './vec3';

describe('add/sub', () => {
  test('sub undoes add', () => {
    const a = Vec3.vec3(1, 2, 3);
    const b = Vec3.vec3(4, -5, 6);
    expect(Vec3.equals(Vec3.sub(Vec3.add(a, b), b), a)).toBe(true);
  });
});

describe('scale/negate', () => {
  test('negate is scale by -1', () => {
    const v = Vec3.vec3(1, -2, 3);
    expect(Vec3.equals(Vec3.negate(v), Vec3.scale(v, -1))).toBe(true);
  });
});

describe('dot', () => {
  test('is zero for perpendicular unit axes', () => {
    expect(Vec3.dot(Vec3.vec3(1, 0, 0), Vec3.vec3(0, 1, 0))).toBe(0);
  });

  test('of a vector with itself is length squared', () => {
    const v = Vec3.vec3(3, 4, 0);
    expect(Vec3.dot(v, v)).toBeCloseTo(Vec3.length(v) ** 2);
  });
});

describe('cross', () => {
  test('follows the right-hand rule for the standard basis', () => {
    const x = Vec3.vec3(1, 0, 0);
    const y = Vec3.vec3(0, 1, 0);
    const z = Vec3.vec3(0, 0, 1);
    expect(Vec3.equals(Vec3.cross(x, y), z)).toBe(true);
    expect(Vec3.equals(Vec3.cross(y, x), Vec3.negate(z))).toBe(true);
  });

  test('is perpendicular to both inputs', () => {
    const a = Vec3.vec3(1, 2, 3);
    const b = Vec3.vec3(-3, 1, 2);
    const c = Vec3.cross(a, b);
    expect(Vec3.dot(c, a)).toBeCloseTo(0);
    expect(Vec3.dot(c, b)).toBeCloseTo(0);
  });
});

describe('length', () => {
  test('of a 3-4-0 vector is 5', () => {
    expect(Vec3.length(Vec3.vec3(3, 4, 0))).toBeCloseTo(5);
  });
});

describe('normalize', () => {
  test('produces a unit vector preserving direction', () => {
    const v = Vec3.vec3(3, 4, 0);
    const n = Vec3.normalize(v);
    expect(Vec3.length(n)).toBeCloseTo(1);
    expect(Vec3.dot(Vec3.normalize(v), v)).toBeCloseTo(Vec3.length(v));
  });

  test('of the zero vector is the zero vector, not NaN', () => {
    const n = Vec3.normalize(Vec3.ZERO);
    expect(n).toEqual(Vec3.ZERO);
  });
});

describe('lerp', () => {
  test('at t=0 returns a, at t=1 returns b', () => {
    const a = Vec3.vec3(0, 0, 0);
    const b = Vec3.vec3(10, 20, 30);
    expect(Vec3.equals(Vec3.lerp(a, b, 0), a)).toBe(true);
    expect(Vec3.equals(Vec3.lerp(a, b, 1), b)).toBe(true);
    expect(Vec3.equals(Vec3.lerp(a, b, 0.5), Vec3.vec3(5, 10, 15))).toBe(true);
  });
});
