import { describe, expect, test } from 'bun:test';
import * as Vec3 from '../math/vec3';
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
