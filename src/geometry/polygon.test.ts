import { describe, expect, test } from 'bun:test';
import * as Vec3 from '../math/vec3';
import * as Plane from './plane';
import * as Polygon from './polygon';
import * as Vertex from './vertex';

function square(): Polygon.Polygon {
  const n = Vec3.vec3(0, 0, 1);
  return Polygon.polygon([
    Vertex.vertex(Vec3.vec3(0, 0, 0), n),
    Vertex.vertex(Vec3.vec3(1, 0, 0), n),
    Vertex.vertex(Vec3.vec3(1, 1, 0), n),
    Vertex.vertex(Vec3.vec3(0, 1, 0), n),
  ]);
}

describe('polygon', () => {
  test('derives its plane from the first three vertices', () => {
    const p = square();
    expect(Vec3.equals(p.plane.normal, Vec3.vec3(0, 0, 1))).toBe(true);
  });

  test('throws when given fewer than 3 vertices', () => {
    const n = Vec3.vec3(0, 0, 1);
    const two = [
      Vertex.vertex(Vec3.vec3(0, 0, 0), n),
      Vertex.vertex(Vec3.vec3(1, 0, 0), n),
    ];
    expect(() => Polygon.polygon(two)).toThrow();
  });

  test('accepts exactly 3 vertices', () => {
    const n = Vec3.vec3(0, 0, 1);
    const p = Polygon.polygon([
      Vertex.vertex(Vec3.vec3(0, 0, 0), n),
      Vertex.vertex(Vec3.vec3(1, 0, 0), n),
      Vertex.vertex(Vec3.vec3(0, 1, 0), n),
    ]);
    expect(p.vertices.length).toBe(3);
  });
});

describe('flip', () => {
  test('reverses vertex order', () => {
    const p = square();
    const flipped = Polygon.flip(p);
    const originalPositions = p.vertices.map((v) => v.pos);
    const flippedPositions = flipped.vertices.map((v) => v.pos);
    expect(flippedPositions).toEqual([...originalPositions].reverse());
  });

  test('negates the plane', () => {
    const p = square();
    const flipped = Polygon.flip(p);
    expect(Plane.equals(flipped.plane, Plane.flip(p.plane))).toBe(true);
  });

  test('negates every vertex normal', () => {
    const p = square();
    const flipped = Polygon.flip(p);
    for (let i = 0; i < p.vertices.length; i++) {
      const original = p.vertices[i]!;
      const flippedVertex = flipped.vertices[p.vertices.length - 1 - i]!;
      expect(
        Vec3.equals(flippedVertex.normal, Vec3.negate(original.normal)),
      ).toBe(true);
    }
  });

  test('is its own inverse', () => {
    const p = square();
    const roundTripped = Polygon.flip(Polygon.flip(p));
    expect(roundTripped.vertices.map((v) => v.pos)).toEqual(
      p.vertices.map((v) => v.pos),
    );
    expect(Plane.equals(roundTripped.plane, p.plane)).toBe(true);
  });
});
