import { describe, expect, test } from 'bun:test';
import * as Vec3 from '../math/vec3';
import * as Polygon from './polygon';
import { triangulate } from './triangulate';
import * as Vertex from './vertex';

function ngon(n: number): Polygon.Polygon {
  const normal = Vec3.vec3(0, 0, 1);
  const vertices = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    vertices.push(
      Vertex.vertex(Vec3.vec3(Math.cos(angle), Math.sin(angle), 0), normal),
    );
  }
  return Polygon.polygon(vertices);
}

describe('triangulate', () => {
  test('a triangle yields exactly 1 triangle, unchanged', () => {
    const p = ngon(3);
    const triangles = triangulate(p);
    expect(triangles).toHaveLength(1);
    expect(triangles[0]).toEqual([
      p.vertices[0]!,
      p.vertices[1]!,
      p.vertices[2]!,
    ]);
  });

  test('produces n - 2 triangles for an n-gon', () => {
    for (const n of [3, 4, 5, 6, 8, 12]) {
      expect(triangulate(ngon(n))).toHaveLength(n - 2);
    }
  });

  test("every triangle shares the polygon's first vertex", () => {
    const p = ngon(6);
    const triangles = triangulate(p);
    for (const triangle of triangles) {
      expect(triangle[0]).toBe(p.vertices[0]!);
    }
  });

  test("preserves winding: each triangle's implied normal matches the polygon plane", () => {
    const p = ngon(7);
    for (const [a, b, c] of triangulate(p)) {
      const implied = Vec3.normalize(
        Vec3.cross(Vec3.sub(b.pos, a.pos), Vec3.sub(c.pos, a.pos)),
      );
      expect(Vec3.dot(implied, p.plane.normal)).toBeGreaterThan(0);
    }
  });

  test('does not throw on a degenerate polygon with duplicate vertices', () => {
    const normal = Vec3.vec3(0, 0, 1);
    const p = Polygon.polygon([
      Vertex.vertex(Vec3.vec3(0, 0, 0), normal),
      Vertex.vertex(Vec3.vec3(1, 0, 0), normal),
      Vertex.vertex(Vec3.vec3(1, 0, 0), normal),
      Vertex.vertex(Vec3.vec3(0, 1, 0), normal),
    ]);
    expect(() => triangulate(p)).not.toThrow();
    expect(triangulate(p)).toHaveLength(2);
  });
});
