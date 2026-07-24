import { describe, expect, test } from 'bun:test';
import { cube } from '../primitives/cube';
import { cylinder } from '../primitives/cylinder';
import { sphere } from '../primitives/sphere';
import { Solid } from '../geometry/solid';
import * as Vec3 from '../math/vec3';
import { triangulateSolid } from './triangulate-solid';

describe('triangulateSolid', () => {
  test('produces an empty list for a solid with no polygons', () => {
    expect(triangulateSolid(new Solid([]))).toEqual([]);
  });

  test('produces 12 triangles for a cube (6 quad faces x 2)', () => {
    expect(triangulateSolid(cube(2))).toHaveLength(12);
  });

  test('every triangle normal is a unit vector', () => {
    for (const solid of [cube(2), sphere(1, { fn: 12 }), cylinder(2)]) {
      for (const triangle of triangulateSolid(solid)) {
        expect(Vec3.length(triangle.normal)).toBeCloseTo(1);
      }
    }
  });

  test("each triangle's normal matches the right-hand rule for its own vertices", () => {
    for (const solid of [cube(2), sphere(1, { fn: 12 }), cylinder(2)]) {
      for (const triangle of triangulateSolid(solid)) {
        const [a, b, c] = triangle.vertices;
        const expected = Vec3.normalize(
          Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a)),
        );
        expect(Vec3.equals(triangle.normal, expected)).toBe(true);
      }
    }
  });

  test('a cube only produces axis-aligned facet normals', () => {
    const axisDirections = [
      Vec3.vec3(1, 0, 0),
      Vec3.vec3(-1, 0, 0),
      Vec3.vec3(0, 1, 0),
      Vec3.vec3(0, -1, 0),
      Vec3.vec3(0, 0, 1),
      Vec3.vec3(0, 0, -1),
    ];
    for (const triangle of triangulateSolid(cube(2))) {
      expect(axisDirections.some((d) => Vec3.equals(d, triangle.normal))).toBe(
        true,
      );
    }
  });
});
