import { describe, expect, test } from 'bun:test';
import * as Mat4 from '../math/mat4';
import * as Vec3 from '../math/vec3';
import { cube } from '../primitives/cube';
import { hasOutwardNormals, signedVolume } from '../testing/solid-assertions';
import * as Polygon from './polygon';
import { Solid } from './solid';
import * as Vertex from './vertex';

describe('Solid', () => {
  test('exposes the polygons it was constructed with', () => {
    const n = Vec3.vec3(0, 0, 1);
    const triangle = Polygon.polygon([
      Vertex.vertex(Vec3.vec3(0, 0, 0), n),
      Vertex.vertex(Vec3.vec3(1, 0, 0), n),
      Vertex.vertex(Vec3.vec3(0, 1, 0), n),
    ]);
    const solid = new Solid([triangle]);
    expect(solid.polygons).toEqual([triangle]);
  });

  test('can be constructed with no polygons', () => {
    const solid = new Solid([]);
    expect(solid.polygons).toHaveLength(0);
  });
});

describe('translate', () => {
  test('shifts every vertex by the offset and preserves volume/winding', () => {
    const original = cube(2, { center: true });
    const moved = original.translate(Vec3.vec3(5, 0, 0));
    expect(signedVolume(moved)).toBeCloseTo(signedVolume(original));
    expect(hasOutwardNormals(moved)).toBe(true);
    for (const polygon of moved.polygons) {
      for (const v of polygon.vertices) {
        expect(v.pos.x).toBeGreaterThanOrEqual(4);
        expect(v.pos.x).toBeLessThanOrEqual(6);
      }
    }
  });

  test('does not mutate the original solid', () => {
    const original = cube(2);
    const originalPositions = original.polygons.map((p) =>
      p.vertices.map((v) => v.pos),
    );
    original.translate(Vec3.vec3(1, 1, 1));
    expect(original.polygons.map((p) => p.vertices.map((v) => v.pos))).toEqual(
      originalPositions,
    );
  });
});

describe('rotate', () => {
  test('applies Euler angles in X, then Y, then Z order', () => {
    // A pure Z rotation of a unit +X point should land on +Y.
    const point = new Solid([
      Polygon.polygon([
        Vertex.vertex(Vec3.vec3(1, 0, 0), Vec3.vec3(0, 0, 1)),
        Vertex.vertex(Vec3.vec3(1, 1, 0), Vec3.vec3(0, 0, 1)),
        Vertex.vertex(Vec3.vec3(1, 0, 1), Vec3.vec3(0, 0, 1)),
      ]),
    ]);
    const rotated = point.rotate(Vec3.vec3(0, 0, Math.PI / 2));
    expect(
      Vec3.equals(rotated.polygons[0]!.vertices[0]!.pos, Vec3.vec3(0, 1, 0)),
    ).toBe(true);
  });

  test('preserves volume and outward winding', () => {
    const original = cube(3, { center: true });
    const rotated = original.rotate(Vec3.vec3(0.3, 0.6, 1.1));
    expect(signedVolume(rotated)).toBeCloseTo(signedVolume(original));
    expect(hasOutwardNormals(rotated)).toBe(true);
  });
});

describe('rotateAxisAngle', () => {
  test('preserves volume and outward winding', () => {
    const original = cube(3, { center: true });
    const rotated = original.rotateAxisAngle(Vec3.vec3(1, 1, 0), 1.2);
    expect(signedVolume(rotated)).toBeCloseTo(signedVolume(original));
    expect(hasOutwardNormals(rotated)).toBe(true);
  });
});

describe('scale', () => {
  test('a uniform scalar factor scales volume by factor^3', () => {
    const original = cube(2, { center: true });
    const scaled = original.scale(3);
    expect(signedVolume(scaled)).toBeCloseTo(signedVolume(original) * 27);
    expect(hasOutwardNormals(scaled)).toBe(true);
  });

  test('a non-uniform Vec3 factor scales volume by the product and keeps normals outward', () => {
    const original = cube(2, { center: true });
    const scaled = original.scale(Vec3.vec3(2, 3, 4));
    expect(signedVolume(scaled)).toBeCloseTo(signedVolume(original) * 24);
    expect(hasOutwardNormals(scaled)).toBe(true);
  });

  test('a negative factor on one axis flips handedness but keeps volume positive and winding outward', () => {
    const original = cube(2, { center: true });
    const scaled = original.scale(Vec3.vec3(-1, 1, 1));
    expect(signedVolume(scaled)).toBeCloseTo(signedVolume(original));
    expect(hasOutwardNormals(scaled)).toBe(true);
  });
});

describe('mirror', () => {
  test('reflects across the given plane, preserving volume and outward winding', () => {
    const original = cube(2).translate(Vec3.vec3(5, 0, 0));
    const mirrored = original.mirror(Vec3.vec3(1, 0, 0));
    expect(signedVolume(mirrored)).toBeCloseTo(signedVolume(original));
    expect(hasOutwardNormals(mirrored)).toBe(true);
    for (const polygon of mirrored.polygons) {
      for (const v of polygon.vertices) {
        expect(v.pos.x).toBeLessThanOrEqual(-4.999);
      }
    }
  });
});

describe('multmatrix', () => {
  test('matches chaining the equivalent named transforms', () => {
    const original = cube(2, { center: true });
    const offset = Vec3.vec3(3, -1, 2);
    const angle = 0.5;

    const viaChain = original
      .translate(offset)
      .rotateAxisAngle(Vec3.vec3(0, 0, 1), angle);

    const combinedMatrix = Mat4.multiply(
      Mat4.rotationAxisAngle(Vec3.vec3(0, 0, 1), angle),
      Mat4.translation(offset),
    );
    const viaMultmatrix = original.multmatrix(combinedMatrix);

    expect(signedVolume(viaMultmatrix)).toBeCloseTo(signedVolume(viaChain));
    for (let i = 0; i < viaChain.polygons.length; i++) {
      const a = viaChain.polygons[i]!.vertices[0]!.pos;
      const b = viaMultmatrix.polygons[i]!.vertices[0]!.pos;
      expect(Vec3.equals(a, b)).toBe(true);
    }
  });

  test('a matrix with negative determinant reverses winding correctly', () => {
    const original = cube(2, { center: true });
    const reflected = original.multmatrix(Mat4.reflection(Vec3.vec3(0, 0, 1)));
    expect(signedVolume(reflected)).toBeCloseTo(signedVolume(original));
    expect(hasOutwardNormals(reflected)).toBe(true);
  });
});
