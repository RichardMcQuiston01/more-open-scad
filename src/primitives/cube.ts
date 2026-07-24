import * as Polygon from '../geometry/polygon';
import { Solid } from '../geometry/solid';
import * as Vertex from '../geometry/vertex';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';

/** Options controlling how a `cube` is positioned relative to the origin. */
export interface CubeOptions {
  /**
   * When `true`, the cube is centered on the origin. When `false`
   * (default), one corner sits at the origin and the cube extends in
   * `+x`, `+y`, `+z`.
   */
  readonly center?: boolean;
}

/**
 * Creates an axis-aligned box `Solid`, matching OpenSCAD's `cube()`.
 *
 * `size` may be a single number (equal width/depth/height on all three
 * axes) or a `Vec3` giving independent width (x), depth (y), and height
 * (z). By default one corner sits at the origin; pass `{ center: true }`
 * to center the box on the origin instead.
 */
export function cube(size: number | Vec3Type, options?: CubeOptions): Solid {
  const dims: Vec3Type =
    typeof size === 'number' ? Vec3.vec3(size, size, size) : size;
  const center = options?.center ?? false;

  const minX = center ? -dims.x / 2 : 0;
  const minY = center ? -dims.y / 2 : 0;
  const minZ = center ? -dims.z / 2 : 0;
  const maxX = minX + dims.x;
  const maxY = minY + dims.y;
  const maxZ = minZ + dims.z;

  const p = (x: number, y: number, z: number): Vec3Type => Vec3.vec3(x, y, z);

  const face = (
    normal: Vec3Type,
    ...positions: readonly Vec3Type[]
  ): Polygon.Polygon =>
    Polygon.polygon(positions.map((pos) => Vertex.vertex(pos, normal)));

  return new Solid([
    face(
      Vec3.vec3(0, 0, -1),
      p(minX, minY, minZ),
      p(minX, maxY, minZ),
      p(maxX, maxY, minZ),
      p(maxX, minY, minZ),
    ), // bottom
    face(
      Vec3.vec3(0, 0, 1),
      p(minX, minY, maxZ),
      p(maxX, minY, maxZ),
      p(maxX, maxY, maxZ),
      p(minX, maxY, maxZ),
    ), // top
    face(
      Vec3.vec3(0, -1, 0),
      p(minX, minY, minZ),
      p(maxX, minY, minZ),
      p(maxX, minY, maxZ),
      p(minX, minY, maxZ),
    ), // front
    face(
      Vec3.vec3(0, 1, 0),
      p(maxX, maxY, minZ),
      p(minX, maxY, minZ),
      p(minX, maxY, maxZ),
      p(maxX, maxY, maxZ),
    ), // back
    face(
      Vec3.vec3(-1, 0, 0),
      p(minX, maxY, minZ),
      p(minX, minY, minZ),
      p(minX, minY, maxZ),
      p(minX, maxY, maxZ),
    ), // left
    face(
      Vec3.vec3(1, 0, 0),
      p(maxX, minY, minZ),
      p(maxX, maxY, minZ),
      p(maxX, maxY, maxZ),
      p(maxX, minY, maxZ),
    ), // right
  ]);
}
