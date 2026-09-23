import * as Plane from '../geometry/plane';
import * as Polygon from '../geometry/polygon';
import { Solid } from '../geometry/solid';
import * as Vertex from '../geometry/vertex';
import type { Vec3 } from '../math/vec3';

/**
 * Builds an arbitrary-mesh `Solid` from a flat list of points and a list of
 * faces, each face being a list of indices into `points`. This is the raw
 * escape hatch for geometry that has no dedicated primitive, mirroring
 * OpenSCAD's `polyhedron()`.
 *
 * **Winding convention — read this if porting `.scad` data**: OpenSCAD's own
 * `polyhedron()` conventionally expects each face's indices listed
 * *clockwise* when viewed from outside (a well-known historical OpenSCAD
 * quirk). This library instead uses *counter-clockwise from outside*
 * consistently everywhere, matching `Plane.fromPoints`'s right-hand-rule
 * convention used by every other primitive. So **this function expects each
 * face's indices ordered counter-clockwise when viewed from outside** — the
 * opposite of raw OpenSCAD `.scad` polyhedron() code. Porting OpenSCAD data
 * as-is will silently produce inside-out geometry (inward-facing normals);
 * reverse each face's index order first.
 *
 * Each face is trusted to be planar and convex, same as the standard
 * OpenSCAD polyhedron contract — this function does not validate or repair
 * non-planar/non-convex face data. It does validate structure: every face
 * must have at least 3 indices, and every index must be in bounds for
 * `points`.
 *
 * All vertices within a face share that face's flat-shading normal, derived
 * from the face's own first three listed points via `Plane.fromPoints`.
 *
 * @param points - Flat list of point positions referenced by `faces`.
 * @param faces - List of faces; each face is a list of indices into
 *   `points`, ordered counter-clockwise when viewed from outside.
 * @throws {Error} If any face has fewer than 3 indices, or if any index is
 *   negative or `>= points.length`.
 */
export function polyhedron(
  points: readonly Vec3[],
  faces: readonly (readonly number[])[],
): Solid {
  const polygons = faces.map((face, faceIndex) => {
    if (face.length < 3) {
      throw new Error(
        `polyhedron: face ${faceIndex} has ${face.length} indices, but each face requires at least 3`,
      );
    }

    for (const index of face) {
      if (index < 0 || index >= points.length) {
        throw new Error(
          `polyhedron: face ${faceIndex} references index ${index}, out of bounds for ${points.length} points`,
        );
      }
    }

    const [i0, i1, i2] = face;
    const plane = Plane.fromPoints(points[i0!]!, points[i1!]!, points[i2!]!);

    const vertices = face.map((index) =>
      Vertex.vertex(points[index]!, plane.normal),
    );
    return Polygon.polygon(vertices);
  });

  return new Solid(polygons);
}
