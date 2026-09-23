import { describe, expect, test } from 'bun:test';
import {
  cube,
  cylinder,
  isManifold,
  Mat4,
  Plane,
  Polygon,
  polyhedron,
  Solid,
  sphere,
  toASCIISTL,
  toBinarySTL,
  triangulateSolid,
  Vec3,
  Vertex,
} from './index';

describe('public API surface', () => {
  test('exports every primitive as a function', () => {
    expect(typeof cube).toBe('function');
    expect(typeof sphere).toBe('function');
    expect(typeof cylinder).toBe('function');
    expect(typeof polyhedron).toBe('function');
  });

  test('exports Solid and the geometry/math namespaces', () => {
    expect(typeof Solid).toBe('function'); // a class is a function at runtime
    expect(typeof Vertex.vertex).toBe('function');
    expect(typeof Polygon.polygon).toBe('function');
    expect(typeof Plane.fromPoints).toBe('function');
    expect(typeof Vec3.vec3).toBe('function');
    expect(typeof Mat4.multiply).toBe('function');
  });

  test('exports the STL/mesh diagnostic functions', () => {
    expect(typeof toBinarySTL).toBe('function');
    expect(typeof toASCIISTL).toBe('function');
    expect(typeof isManifold).toBe('function');
    expect(typeof triangulateSolid).toBe('function');
  });
});

describe('end-to-end: primitive -> transform -> STL export', () => {
  test('builds a cube, transforms it, and exports valid binary + ASCII STL', () => {
    const shape = cube(10, { center: true })
      .translate(Vec3.vec3(5, 0, 0))
      .rotateAxisAngle(Vec3.vec3(0, 0, 1), Math.PI / 4);

    expect(isManifold(shape)).toBe(true);

    const binary = toBinarySTL(shape);
    const triangleCount = triangulateSolid(shape).length;
    expect(binary.byteLength).toBe(80 + 4 + 50 * triangleCount);

    const ascii = toASCIISTL(shape, 'cube');
    expect(ascii.startsWith('solid cube')).toBe(true);
    expect(ascii.trimEnd().endsWith('endsolid cube')).toBe(true);
  });

  test('builds a polyhedron from Vec3 points and exports STL', () => {
    const shape = polyhedron(
      [
        Vec3.vec3(0, 0, 0),
        Vec3.vec3(1, 0, 0),
        Vec3.vec3(0, 1, 0),
        Vec3.vec3(0, 0, 1),
      ],
      [
        [0, 2, 1],
        [0, 1, 3],
        [0, 3, 2],
        [1, 2, 3],
      ],
    );
    expect(isManifold(shape)).toBe(true);
    expect(toASCIISTL(shape).startsWith('solid')).toBe(true);
  });
});
