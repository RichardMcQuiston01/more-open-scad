import { describe, expect, test } from 'bun:test';
import * as Vec3 from '../math/vec3';
import * as Vertex from './vertex';

describe('lerp', () => {
  test('at t=0 returns a, at t=1 returns b', () => {
    const a = Vertex.vertex(Vec3.vec3(0, 0, 0), Vec3.vec3(1, 0, 0));
    const b = Vertex.vertex(Vec3.vec3(10, 0, 0), Vec3.vec3(0, 1, 0));
    expect(Vertex.equals(Vertex.lerp(a, b, 0), a)).toBe(true);
    expect(Vertex.equals(Vertex.lerp(a, b, 1), b)).toBe(true);
  });

  test('interpolates position linearly', () => {
    const a = Vertex.vertex(Vec3.vec3(0, 0, 0), Vec3.vec3(0, 0, 1));
    const b = Vertex.vertex(Vec3.vec3(10, 20, 30), Vec3.vec3(0, 0, 1));
    const mid = Vertex.lerp(a, b, 0.5);
    expect(Vec3.equals(mid.pos, Vec3.vec3(5, 10, 15))).toBe(true);
  });

  test('re-normalizes the interpolated normal', () => {
    const a = Vertex.vertex(Vec3.vec3(0, 0, 0), Vec3.vec3(1, 0, 0));
    const b = Vertex.vertex(Vec3.vec3(0, 0, 0), Vec3.vec3(0, 1, 0));
    const mid = Vertex.lerp(a, b, 0.5);
    expect(Vec3.length(mid.normal)).toBeCloseTo(1);
  });
});

describe('flip', () => {
  test('negates the normal but preserves position', () => {
    const v = Vertex.vertex(Vec3.vec3(1, 2, 3), Vec3.vec3(0, 0, 1));
    const flipped = Vertex.flip(v);
    expect(Vec3.equals(flipped.pos, v.pos)).toBe(true);
    expect(Vec3.equals(flipped.normal, Vec3.negate(v.normal))).toBe(true);
  });
});
