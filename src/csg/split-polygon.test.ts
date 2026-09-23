import { describe, expect, test } from 'bun:test';
import { EPSILON } from '../math/epsilon';
import * as Vec3 from '../math/vec3';
import * as Plane from '../geometry/plane';
import * as Polygon from '../geometry/polygon';
import * as Vertex from '../geometry/vertex';
import { BACK, FRONT, SPANNING, splitPolygon } from './split-polygon';

/** The z=0 plane, normal pointing +z. */
const XY_PLANE: Plane.Plane = { normal: Vec3.vec3(0, 0, 1), w: 0 };

function triangleAt(
  ...zs: readonly [number, number, number]
): Polygon.Polygon {
  const n = Vec3.vec3(0, 0, 1);
  return Polygon.polygon([
    Vertex.vertex(Vec3.vec3(0, 0, zs[0]), n),
    Vertex.vertex(Vec3.vec3(1, 0, zs[1]), n),
    Vertex.vertex(Vec3.vec3(0, 1, zs[2]), n),
  ]);
}

describe('classification constants', () => {
  test('SPANNING is FRONT | BACK', () => {
    expect(FRONT | BACK).toBe(SPANNING);
  });
});

describe('splitPolygon: fully front / fully back', () => {
  test('a polygon strictly in front lands only in `front`, unchanged', () => {
    const p = triangleAt(1, 2, 3);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front).toEqual([p]);
    expect(result.back).toEqual([]);
    expect(result.coplanarFront).toEqual([]);
    expect(result.coplanarBack).toEqual([]);
  });

  test('a polygon strictly behind lands only in `back`, unchanged', () => {
    const p = triangleAt(-1, -2, -3);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.back).toEqual([p]);
    expect(result.front).toEqual([]);
    expect(result.coplanarFront).toEqual([]);
    expect(result.coplanarBack).toEqual([]);
  });

  test('a vertex touching the plane does not by itself cause a split', () => {
    // One vertex coplanar, the rest strictly front: overall classification
    // is FRONT (0 | 1 = 1), not SPANNING, since no vertex is strictly BACK.
    const p = triangleAt(0, 1, 2);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front).toEqual([p]);
    expect(result.back).toEqual([]);
  });
});

describe('splitPolygon: coplanar', () => {
  test('a coplanar polygon facing the same direction goes to coplanarFront', () => {
    const p = triangleAt(0, 0, 0); // plane.normal = (0,0,1), same as XY_PLANE
    const result = splitPolygon(XY_PLANE, p);
    expect(result.coplanarFront).toEqual([p]);
    expect(result.coplanarBack).toEqual([]);
    expect(result.front).toEqual([]);
    expect(result.back).toEqual([]);
  });

  test('a coplanar polygon facing the opposite direction goes to coplanarBack', () => {
    const n = Vec3.vec3(0, 0, -1);
    const flipped = Polygon.polygon([
      Vertex.vertex(Vec3.vec3(0, 0, 0), n),
      Vertex.vertex(Vec3.vec3(0, 1, 0), n),
      Vertex.vertex(Vec3.vec3(1, 0, 0), n),
    ]);
    expect(flipped.plane.normal.z).toBeLessThan(0);

    const result = splitPolygon(XY_PLANE, flipped);
    expect(result.coplanarBack).toEqual([flipped]);
    expect(result.coplanarFront).toEqual([]);
  });
});

describe('splitPolygon: epsilon boundary', () => {
  test('a vertex at exactly +EPSILON is classified coplanar, not front', () => {
    const p = triangleAt(EPSILON, 1, 1);
    const result = splitPolygon(XY_PLANE, p);
    // Still all-front-or-coplanar overall (no strictly-BACK vertex), so no split.
    expect(result.front).toEqual([p]);
  });

  test('a vertex at exactly -EPSILON is classified coplanar, not back', () => {
    const p = triangleAt(-EPSILON, 1, 1);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front).toEqual([p]);
  });

  test('a vertex just past +EPSILON combined with a back vertex spans', () => {
    const p = triangleAt(EPSILON * 2, -1, 1);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front.length + result.back.length).toBeGreaterThan(0);
    expect(result.coplanarFront).toEqual([]);
    expect(result.coplanarBack).toEqual([]);
    // It's a genuine split, not a pass-through.
    expect(result.front).not.toEqual([p]);
    expect(result.back).not.toEqual([p]);
  });
});

/** Every vertex position must satisfy `signedDistance(plane, pos) >= -tolerance`. */
function assertOnFrontSide(polygons: readonly Polygon.Polygon[], plane: Plane.Plane) {
  for (const polygon of polygons) {
    for (const v of polygon.vertices) {
      expect(Plane.signedDistance(plane, v.pos)).toBeGreaterThanOrEqual(-1e-6);
    }
  }
}

/** Every vertex position must satisfy `signedDistance(plane, pos) <= tolerance`. */
function assertOnBackSide(polygons: readonly Polygon.Polygon[], plane: Plane.Plane) {
  for (const polygon of polygons) {
    for (const v of polygon.vertices) {
      expect(Plane.signedDistance(plane, v.pos)).toBeLessThanOrEqual(1e-6);
    }
  }
}

describe('splitPolygon: spanning (triangles, axis-aligned plane)', () => {
  test('1 vertex front, 2 back', () => {
    const p = triangleAt(5, -1, -1);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.coplanarFront).toEqual([]);
    expect(result.coplanarBack).toEqual([]);
    expect(result.front).toHaveLength(1);
    expect(result.back).toHaveLength(1);
    assertOnFrontSide(result.front, XY_PLANE);
    assertOnBackSide(result.back, XY_PLANE);
  });

  test('2 vertices front, 1 back', () => {
    const p = triangleAt(5, 5, -1);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front).toHaveLength(1);
    expect(result.back).toHaveLength(1);
    assertOnFrontSide(result.front, XY_PLANE);
    assertOnBackSide(result.back, XY_PLANE);
  });

  test('resulting polygons preserve the source polygon\'s plane orientation', () => {
    const p = triangleAt(5, -1, -1);
    const result = splitPolygon(XY_PLANE, p);
    for (const out of [...result.front, ...result.back]) {
      expect(Vec3.dot(out.plane.normal, p.plane.normal)).toBeGreaterThan(0);
    }
  });
});

describe('splitPolygon: spanning (quad, more than 3 vertices)', () => {
  function quadAt(
    ...zs: readonly [number, number, number, number]
  ): Polygon.Polygon {
    const n = Vec3.vec3(0, 0, 1);
    return Polygon.polygon([
      Vertex.vertex(Vec3.vec3(0, 0, zs[0]), n),
      Vertex.vertex(Vec3.vec3(1, 0, zs[1]), n),
      Vertex.vertex(Vec3.vec3(1, 1, zs[2]), n),
      Vertex.vertex(Vec3.vec3(0, 1, zs[3]), n),
    ]);
  }

  test('1 vertex front, 3 back', () => {
    const p = quadAt(5, -1, -1, -1);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front).toHaveLength(1);
    expect(result.back).toHaveLength(1);
    assertOnFrontSide(result.front, XY_PLANE);
    assertOnBackSide(result.back, XY_PLANE);
    // Front piece: a triangle-ish clip (3 vertices: the corner + 2 crossings).
    expect(result.front[0]!.vertices).toHaveLength(3);
    // Back piece: a pentagon (the other 3 corners + 2 crossings).
    expect(result.back[0]!.vertices).toHaveLength(5);
  });

  test('2 adjacent vertices front, 2 back', () => {
    const p = quadAt(5, 5, -1, -1);
    const result = splitPolygon(XY_PLANE, p);
    expect(result.front).toHaveLength(1);
    expect(result.back).toHaveLength(1);
    assertOnFrontSide(result.front, XY_PLANE);
    assertOnBackSide(result.back, XY_PLANE);
    // Both pieces are quads: 2 original corners + 2 shared crossing points.
    expect(result.front[0]!.vertices).toHaveLength(4);
    expect(result.back[0]!.vertices).toHaveLength(4);
  });
});

describe('splitPolygon: a non-axis-aligned plane', () => {
  test('splits correctly against a diagonal plane through the origin', () => {
    const diagonal: Plane.Plane = {
      normal: Vec3.normalize(Vec3.vec3(1, 1, 1)),
      w: 0,
    };
    const n = Vec3.vec3(0, 0, 1);
    const p = Polygon.polygon([
      Vertex.vertex(Vec3.vec3(2, 0, 0), n), // front: x+y+z=2 > 0
      Vertex.vertex(Vec3.vec3(-2, 0, 0), n), // back: -2 < 0
      Vertex.vertex(Vec3.vec3(0, -2, 0), n), // back: -2 < 0
    ]);

    const result = splitPolygon(diagonal, p);
    expect(result.front).toHaveLength(1);
    expect(result.back).toHaveLength(1);
    assertOnFrontSide(result.front, diagonal);
    assertOnBackSide(result.back, diagonal);
  });

  test('an offset plane (w != 0) classifies correctly', () => {
    const offset: Plane.Plane = { normal: Vec3.vec3(0, 0, 1), w: 5 };
    const p = triangleAt(10, 10, 10); // all above z=5 -> front
    const result = splitPolygon(offset, p);
    expect(result.front).toEqual([p]);
    expect(result.back).toEqual([]);
  });
});

describe('splitPolygon: crossing vertices are exactly on the plane', () => {
  test('interpolated crossing points have signed distance ~0', () => {
    const p = triangleAt(3, -3, -3);
    const result = splitPolygon(XY_PLANE, p);
    // The two new shared vertices (the interpolated crossing points) are the
    // ones NOT among the source triangle's original positions.
    const originalZs = new Set([3, -3]);
    const allOutputVertices = [...result.front, ...result.back].flatMap(
      (poly) => poly.vertices,
    );
    for (const v of allOutputVertices) {
      if (!originalZs.has(v.pos.z)) {
        expect(Math.abs(Plane.signedDistance(XY_PLANE, v.pos))).toBeLessThan(
          1e-9,
        );
      }
    }
  });
});
