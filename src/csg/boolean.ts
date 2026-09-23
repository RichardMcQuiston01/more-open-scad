import { Solid } from '../geometry/solid';
import * as Bsp from './bsp-tree';
import type { BspNode } from './bsp-tree';

/**
 * The three boolean operations below are the classic BSP-CSG algorithm
 * (Naylor/Thibault, as popularized by csg.js), expressed with this
 * codebase's immutable `Bsp` functions in place of the original's
 * in-place `Node` mutations. Each op builds a tree per input solid, uses
 * `clipTo`/`invert` to cut away the region that should not survive, then
 * merges what's left of one tree into the other with `build` and reads
 * the result back out with `allPolygons`.
 *
 * `difference`/`intersect` reduce to the same shape as `union` by
 * inverting one or both solids first — inside-out, "the part of A not in
 * B" is "the union of (inside-out A) and B, inside-out" — which is why
 * every op ends by inverting back if it inverted going in.
 */

/** The union of `a` and `b`: every point inside either solid. */
export function union(a: Solid, b: Solid): Solid {
  let nodeA: BspNode | null = Bsp.build(a.polygons);
  let nodeB: BspNode | null = Bsp.build(b.polygons);

  nodeA = Bsp.clipTo(nodeA, nodeB);
  nodeB = Bsp.clipTo(nodeB, nodeA);
  nodeB = Bsp.invert(nodeB);
  nodeB = Bsp.clipTo(nodeB, nodeA);
  nodeB = Bsp.invert(nodeB);
  nodeA = Bsp.build(Bsp.allPolygons(nodeB), nodeA);

  return new Solid(Bsp.allPolygons(nodeA));
}

/** `a` with the part it shares with `b` removed. */
export function difference(a: Solid, b: Solid): Solid {
  let nodeA: BspNode | null = Bsp.build(a.polygons);
  let nodeB: BspNode | null = Bsp.build(b.polygons);

  nodeA = Bsp.invert(nodeA);
  nodeA = Bsp.clipTo(nodeA, nodeB);
  nodeB = Bsp.clipTo(nodeB, nodeA);
  nodeB = Bsp.invert(nodeB);
  nodeB = Bsp.clipTo(nodeB, nodeA);
  nodeB = Bsp.invert(nodeB);
  nodeA = Bsp.build(Bsp.allPolygons(nodeB), nodeA);
  nodeA = Bsp.invert(nodeA);

  return new Solid(Bsp.allPolygons(nodeA));
}

/** The intersection of `a` and `b`: only the region inside both solids. */
export function intersect(a: Solid, b: Solid): Solid {
  let nodeA: BspNode | null = Bsp.build(a.polygons);
  let nodeB: BspNode | null = Bsp.build(b.polygons);

  nodeA = Bsp.invert(nodeA);
  nodeB = Bsp.clipTo(nodeB, nodeA);
  nodeB = Bsp.invert(nodeB);
  nodeA = Bsp.clipTo(nodeA, nodeB);
  nodeB = Bsp.clipTo(nodeB, nodeA);
  nodeA = Bsp.build(Bsp.allPolygons(nodeB), nodeA);
  nodeA = Bsp.invert(nodeA);

  return new Solid(Bsp.allPolygons(nodeA));
}
