import * as Plane from '../geometry/plane';
import type { Plane as PlaneType } from '../geometry/plane';
import * as Polygon from '../geometry/polygon';
import type { Polygon as PolygonType } from '../geometry/polygon';
import { splitPolygon } from './split-polygon';

/**
 * A node in a BSP (binary space partitioning) tree, à la the classic
 * BSP-CSG algorithm (Naylor/Thibault, as popularized by csg.js), adapted
 * to this codebase's immutable value-type conventions: every function
 * below returns a new tree rather than mutating an existing one.
 *
 * `polygons` holds every polygon found to be exactly coplanar with `plane`
 * while building the tree — both those facing the same direction as
 * `plane.normal` and those facing the opposite way (the classic algorithm
 * keeps both in one list; nothing downstream needs them told apart).
 * Everything else lives in `front`/`back`, which partition the remaining
 * space on either side of `plane`. `null` (used for `front`/`back`, and as
 * the whole-tree result of building from zero polygons) represents an
 * empty subtree — "no polygons, no constraint on this side of the plane".
 */
export interface BspNode {
  readonly plane: PlaneType;
  readonly polygons: readonly PolygonType[];
  readonly front: BspNode | null;
  readonly back: BspNode | null;
}

/**
 * Builds a BSP tree from `polygons`, optionally inserting them into an
 * already-built `node` instead of starting fresh (the classic algorithm's
 * `Node.build` serves both roles too: the first call establishes each
 * node's splitting plane from its first polygon, and later calls partition
 * new polygons through the existing planes, recursing into — or lazily
 * creating — the `front`/`back` subtrees as needed).
 *
 * The splitting plane for a fresh node is `polygons[0]`'s own plane, so
 * that polygon always lands in the returned node's `polygons` (as a
 * `coplanarFront`, since a plane never disagrees with itself) rather than
 * being recursed into a subtree.
 */
export function build(
  polygons: readonly PolygonType[],
  node: BspNode | null = null,
): BspNode | null {
  if (polygons.length === 0) return node;

  const plane = node ? node.plane : polygons[0]!.plane;
  const coplanar: PolygonType[] = node ? [...node.polygons] : [];
  const front: PolygonType[] = [];
  const back: PolygonType[] = [];

  for (const polygon of polygons) {
    const split = splitPolygon(plane, polygon);
    coplanar.push(...split.coplanarFront, ...split.coplanarBack);
    front.push(...split.front);
    back.push(...split.back);
  }

  return {
    plane,
    polygons: coplanar,
    front: build(front, node ? node.front : null),
    back: build(back, node ? node.back : null),
  };
}

/**
 * Clips `polygons` against the solid volume `node` represents: every part
 * of every polygon that lies in front of `node`'s planes survives (kept
 * whole where possible, split where a polygon straddles a plane), and
 * every part behind all of them — i.e. inside the volume — is discarded.
 * A `null` node clips nothing away (there is no volume to be in front of),
 * so every polygon survives unchanged.
 *
 * A polygon exactly coplanar with a node's plane is treated as `front` or
 * `back` according to which way it's coplanar (matching `splitPolygon`'s
 * `coplanarFront`/`coplanarBack` split), rather than being kept at that
 * node the way `build` does — clipping only ever keeps or discards, it
 * never needs to *store* a polygon at a particular node.
 */
export function clipPolygons(
  node: BspNode | null,
  polygons: readonly PolygonType[],
): PolygonType[] {
  if (node === null) return [...polygons];
  if (polygons.length === 0) return [];

  const front: PolygonType[] = [];
  const back: PolygonType[] = [];

  for (const polygon of polygons) {
    const split = splitPolygon(node.plane, polygon);
    front.push(...split.front, ...split.coplanarFront);
    back.push(...split.back, ...split.coplanarBack);
  }

  return [
    ...clipPolygons(node.front, front),
    ...(node.back ? clipPolygons(node.back, back) : []),
  ];
}

/**
 * Clips every polygon stored in `node` (at every level of the tree)
 * against the solid volume `other` represents, returning the resulting
 * tree. Used to remove the part of one solid that lies inside another,
 * without discarding `node`'s own plane structure.
 */
export function clipTo(
  node: BspNode | null,
  other: BspNode | null,
): BspNode | null {
  if (node === null) return null;
  return {
    plane: node.plane,
    polygons: clipPolygons(other, node.polygons),
    front: clipTo(node.front, other),
    back: clipTo(node.back, other),
  };
}

/**
 * Turns `node`'s solid inside-out: every plane and polygon is flipped
 * (`Plane.flip`/`Polygon.flip`), and `front`/`back` are swapped, so the
 * region the tree used to consider "inside" is now "outside" and vice
 * versa. Boolean ops use this to re-express subtraction/intersection in
 * terms of union (see `../csg/boolean.ts`).
 */
export function invert(node: BspNode | null): BspNode | null {
  if (node === null) return null;
  return {
    plane: Plane.flip(node.plane),
    polygons: node.polygons.map(Polygon.flip),
    front: invert(node.back),
    back: invert(node.front),
  };
}

/** Collects every polygon stored anywhere in `node`'s tree. */
export function allPolygons(node: BspNode | null): PolygonType[] {
  if (node === null) return [];
  return [
    ...node.polygons,
    ...allPolygons(node.front),
    ...allPolygons(node.back),
  ];
}
