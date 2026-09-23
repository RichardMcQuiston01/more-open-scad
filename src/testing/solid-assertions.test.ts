import { describe, expect, test } from 'bun:test';
import * as Polygon from '../geometry/polygon';
import { Solid } from '../geometry/solid';
import * as Vertex from '../geometry/vertex';
import * as Vec3 from '../math/vec3';
import {
  averageVertexPosition,
  hasOutwardNormals,
  signedVolume,
} from './solid-assertions';

/** A manually-built, outward-facing unit cube spanning [0,1]^3. */
function unitCube(): Solid {
  const p = (x: number, y: number, z: number) => Vec3.vec3(x, y, z);
  const face = (
    normal: Vec3.Vec3,
    ...positions: readonly Vec3.Vec3[]
  ): Polygon.Polygon =>
    Polygon.polygon(positions.map((pos) => Vertex.vertex(pos, normal)));

  return new Solid([
    face(p(0, 0, -1), p(0, 0, 0), p(0, 1, 0), p(1, 1, 0), p(1, 0, 0)), // bottom
    face(p(0, 0, 1), p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)), // top
    face(p(0, -1, 0), p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1)), // front
    face(p(0, 1, 0), p(1, 1, 0), p(0, 1, 0), p(0, 1, 1), p(1, 1, 1)), // back
    face(p(-1, 0, 0), p(0, 1, 0), p(0, 0, 0), p(0, 0, 1), p(0, 1, 1)), // left
    face(p(1, 0, 0), p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)), // right
  ]);
}

describe('signedVolume', () => {
  test('is 1 for a unit cube with outward-facing winding', () => {
    expect(signedVolume(unitCube())).toBeCloseTo(1);
  });

  test('is negated when every face is flipped (inward-facing)', () => {
    const cube = unitCube();
    const flipped = new Solid(cube.polygons.map(Polygon.flip));
    expect(signedVolume(flipped)).toBeCloseTo(-1);
  });

  test('is 0 for a solid with no polygons', () => {
    expect(signedVolume(new Solid([]))).toBe(0);
  });
});

describe('averageVertexPosition', () => {
  test('is the cube center for a symmetric unit cube', () => {
    const centroid = averageVertexPosition(unitCube());
    expect(Vec3.equals(centroid, Vec3.vec3(0.5, 0.5, 0.5))).toBe(true);
  });

  test('is the zero vector for a solid with no polygons', () => {
    expect(averageVertexPosition(new Solid([]))).toEqual(Vec3.ZERO);
  });
});

describe('hasOutwardNormals', () => {
  test('is true for a correctly-wound cube', () => {
    expect(hasOutwardNormals(unitCube())).toBe(true);
  });

  test('is false once every face is flipped inward', () => {
    const cube = unitCube();
    const flipped = new Solid(cube.polygons.map(Polygon.flip));
    expect(hasOutwardNormals(flipped)).toBe(false);
  });
});
