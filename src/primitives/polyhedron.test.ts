import { describe, expect, test } from 'bun:test';
import * as Vec3 from '../math/vec3';
import {
  averageVertexPosition,
  hasOutwardNormals,
  signedVolume,
} from '../testing/solid-assertions';
import { polyhedron } from './polyhedron';

describe('polyhedron', () => {
  test('builds a right-angle tetrahedron with correct outward winding and volume', () => {
    // Right-angle tetrahedron at the origin with legs a=2, b=3, c=4 along
    // the axes. Analytic volume = (1/6) * a * b * c = (1/6) * 2 * 3 * 4 = 4.
    const points = [
      Vec3.vec3(0, 0, 0), // 0: origin
      Vec3.vec3(2, 0, 0), // 1: along x
      Vec3.vec3(0, 3, 0), // 2: along y
      Vec3.vec3(0, 0, 4), // 3: along z
    ];
    // Faces wound counter-clockwise when viewed from outside.
    const faces = [
      [0, 2, 1], // base (z=0 plane), viewed from below (-z), normal -z
      [0, 1, 3], // y=0 plane, normal -y
      [0, 3, 2], // x=0 plane, normal -x
      [1, 2, 3], // slanted face
    ];

    const solid = polyhedron(points, faces);

    expect(hasOutwardNormals(solid)).toBe(true);
    expect(signedVolume(solid)).toBeCloseTo((2 * 3 * 4) / 6);
  });

  test('builds a cube manually with correct volume and outward normals', () => {
    const w = 2;
    const h = 3;
    const d = 4;
    const points = [
      Vec3.vec3(0, 0, 0), // 0
      Vec3.vec3(w, 0, 0), // 1
      Vec3.vec3(w, h, 0), // 2
      Vec3.vec3(0, h, 0), // 3
      Vec3.vec3(0, 0, d), // 4
      Vec3.vec3(w, 0, d), // 5
      Vec3.vec3(w, h, d), // 6
      Vec3.vec3(0, h, d), // 7
    ];
    const faces = [
      [0, 3, 2, 1], // bottom (z=0), viewed from -z
      [4, 5, 6, 7], // top (z=d), viewed from +z
      [0, 1, 5, 4], // front (y=0)
      [1, 2, 6, 5], // right (x=w)
      [2, 3, 7, 6], // back (y=h)
      [3, 0, 4, 7], // left (x=0)
    ];

    const solid = polyhedron(points, faces);

    expect(hasOutwardNormals(solid)).toBe(true);
    expect(signedVolume(solid)).toBeCloseTo(w * h * d);
    expect(
      Vec3.equals(averageVertexPosition(solid), Vec3.vec3(w / 2, h / 2, d / 2)),
    ).toBe(true);
  });

  test('throws when a face has fewer than 3 indices', () => {
    const points = [Vec3.vec3(0, 0, 0), Vec3.vec3(1, 0, 0), Vec3.vec3(0, 1, 0)];
    expect(() => polyhedron(points, [[0, 1]])).toThrow();
  });

  test('throws when a face references a negative index', () => {
    const points = [Vec3.vec3(0, 0, 0), Vec3.vec3(1, 0, 0), Vec3.vec3(0, 1, 0)];
    expect(() => polyhedron(points, [[0, 1, -1]])).toThrow();
  });

  test('throws when a face references an index >= points.length', () => {
    const points = [Vec3.vec3(0, 0, 0), Vec3.vec3(1, 0, 0), Vec3.vec3(0, 1, 0)];
    expect(() => polyhedron(points, [[0, 1, 3]])).toThrow();
  });

  test('all vertices within one face share the same flat-shading normal', () => {
    const points = [
      Vec3.vec3(0, 0, 0),
      Vec3.vec3(1, 0, 0),
      Vec3.vec3(1, 1, 0),
      Vec3.vec3(0, 1, 0),
    ];
    const solid = polyhedron(points, [[0, 1, 2, 3]]);
    const face = solid.polygons[0]!;
    const normals = face.vertices.map((v) => v.normal);
    for (const normal of normals) {
      expect(Vec3.equals(normal, normals[0]!)).toBe(true);
    }
  });
});
