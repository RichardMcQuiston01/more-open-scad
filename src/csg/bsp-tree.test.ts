import { describe, expect, test } from 'bun:test';
import { isManifold } from '../io/manifold-check';
import * as Polygon from '../geometry/polygon';
import { Solid } from '../geometry/solid';
import * as Vertex from '../geometry/vertex';
import * as Vec3 from '../math/vec3';
import { cube } from '../primitives/cube';
import { signedVolume } from '../testing/solid-assertions';
import { allPolygons, build, clipPolygons, clipTo, invert } from './bsp-tree';

/**
 * A unit square in the z = `z` plane, wound so its plane's normal is
 * `(0, 0, normalSign)`.
 */
function quadAt(z: number, normalSign: 1 | -1 = 1): Polygon.Polygon {
  const n = Vec3.vec3(0, 0, normalSign);
  const corners: readonly (readonly [number, number])[] =
    normalSign === 1
      ? [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]
      : [
          [-1, -1],
          [-1, 1],
          [1, 1],
          [1, -1],
        ];
  return Polygon.polygon(
    corners.map(([x, y]) => Vertex.vertex(Vec3.vec3(x, y, z), n)),
  );
}

/** A small triangle strictly at height `z` (spans no plane at z = 0). */
function triangleAt(z: number): Polygon.Polygon {
  const n = Vec3.vec3(0, 0, 1);
  return Polygon.polygon([
    Vertex.vertex(Vec3.vec3(0, 0, z), n),
    Vertex.vertex(Vec3.vec3(0.5, 0, z), n),
    Vertex.vertex(Vec3.vec3(0, 0.5, z), n),
  ]);
}

describe('build', () => {
  test('an empty list with no existing node builds nothing', () => {
    expect(build([])).toBeNull();
  });

  test('inserting no new polygons into an existing node returns it unchanged', () => {
    const node = build([quadAt(0)]);
    expect(build([], node)).toBe(node);
  });

  test('a single polygon becomes a leaf: its own plane, no front/back', () => {
    const p = quadAt(0);
    const node = build([p]);
    expect(node?.plane).toEqual(p.plane);
    expect(node?.polygons).toEqual([p]);
    expect(node?.front).toBeNull();
    expect(node?.back).toBeNull();
  });

  test('the first polygon sets the plane; later polygons partition into front/back', () => {
    const root = quadAt(0);
    const front = triangleAt(1);
    const back = triangleAt(-1);
    const node = build([root, front, back]);

    expect(node?.plane).toEqual(root.plane);
    expect(node?.polygons).toEqual([root]);
    expect(node?.front?.polygons).toEqual([front]);
    expect(node?.back?.polygons).toEqual([back]);
  });

  test('re-building into an existing node inserts through its established plane', () => {
    const root = quadAt(0);
    const front = triangleAt(1);
    const base = build([root]);
    const extended = build([front], base);

    expect(extended?.plane).toEqual(base?.plane);
    expect(extended?.polygons).toEqual([root]);
    expect(extended?.front?.polygons).toEqual([front]);
    expect(extended?.back).toBeNull();
  });

  test('round-trips a solid with no polygon spanning another: same faces, same volume, still manifold', () => {
    const original = cube(2, { center: true });
    const tree = build(original.polygons);
    const rebuilt = new Solid(allPolygons(tree));

    expect(allPolygons(tree)).toHaveLength(original.polygons.length);
    expect(signedVolume(rebuilt)).toBeCloseTo(signedVolume(original));
    expect(isManifold(rebuilt)).toBe(true);
  });
});

describe('clipPolygons', () => {
  test('clipping against an empty tree (null) leaves every polygon unchanged', () => {
    const polygons = [triangleAt(1), triangleAt(-1)];
    expect(clipPolygons(null, polygons)).toEqual(polygons);
  });

  test('a polygon strictly in front of a single-plane tree survives whole', () => {
    const node = build([quadAt(0)]);
    const front = triangleAt(1);
    expect(clipPolygons(node, [front])).toEqual([front]);
  });

  test('a polygon strictly behind a single-plane tree is fully removed (no back child means solid interior)', () => {
    const node = build([quadAt(0)]);
    const back = triangleAt(-1);
    expect(clipPolygons(node, [back])).toEqual([]);
  });

  test('a polygon spanning the plane is clipped down to its front portion', () => {
    const node = build([quadAt(0)]);
    const n = Vec3.vec3(0, 0, 1);
    const spanning = Polygon.polygon([
      Vertex.vertex(Vec3.vec3(0, 0, 1), n),
      Vertex.vertex(Vec3.vec3(0.5, 0, -1), n),
      Vertex.vertex(Vec3.vec3(0, 0.5, -1), n),
    ]);
    const [clipped] = clipPolygons(node, [spanning]);
    expect(clipped).toBeDefined();
    for (const v of clipped!.vertices) {
      expect(v.pos.z).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('clipTo', () => {
  test('a polygon set fully outside a solid is untouched', () => {
    const outer = cube(4, { center: true });
    const farAway = cube(1, { center: true }).translate(Vec3.vec3(10, 0, 0));

    const outerTree = build(outer.polygons);
    const farTree = build(farAway.polygons);
    const clipped = allPolygons(clipTo(farTree, outerTree));

    expect(clipped).toHaveLength(farAway.polygons.length);
  });

  test('a polygon set fully inside a solid is clipped away entirely', () => {
    const outer = cube(4, { center: true });
    const inner = cube(1, { center: true });

    const outerTree = build(outer.polygons);
    const innerTree = build(inner.polygons);
    const clipped = allPolygons(clipTo(innerTree, outerTree));

    expect(clipped).toHaveLength(0);
  });
});

describe('invert', () => {
  test('inverting null is null', () => {
    expect(invert(null)).toBeNull();
  });

  test('flips a leaf node’s plane and polygons, front/back stay null', () => {
    const p = quadAt(0);
    const node = build([p]);
    const inverted = invert(node);

    expect(inverted?.plane).toEqual(Polygon.flip(p).plane);
    expect(inverted?.polygons).toEqual([Polygon.flip(p)]);
    expect(inverted?.front).toBeNull();
    expect(inverted?.back).toBeNull();
  });

  test('inverting twice returns to the original tree', () => {
    const tree = build(cube(2, { center: true }).polygons);
    expect(invert(invert(tree))).toEqual(tree);
  });
});

describe('allPolygons', () => {
  test('collects polygons from the root and every front/back subtree', () => {
    const root = quadAt(0);
    const front = triangleAt(1);
    const back = triangleAt(-1);
    const node = build([root, front, back]);

    expect(allPolygons(node)).toEqual([root, front, back]);
  });
});
