import * as Mat4 from '../math/mat4';
import type { Mat4 as Mat4Type } from '../math/mat4';
import * as Vec3 from '../math/vec3';
import type { Vec3 as Vec3Type } from '../math/vec3';
import * as Polygon from './polygon';
import type { Polygon as PolygonType } from './polygon';
import * as Vertex from './vertex';

/**
 * Applies `matrix` to every vertex of `solid`, using the mathematically
 * general (and always-correct, though not always cheapest) approach:
 * positions transform by `matrix` directly, normals transform by its
 * inverse-transpose (required for correctness under non-uniform scale;
 * harmless — and equal to `matrix` itself — for pure rotations/
 * translations). If `matrix` is singular (e.g. a zero scale factor), there
 * is no well-defined inverse-transpose, so normals fall back to
 * transforming by `matrix` directly rather than throwing.
 *
 * When `matrix` has a negative determinant (e.g. `mirror`, or any
 * `multmatrix` with an odd number of reflections), it flips the handedness
 * of space, which would otherwise leave polygons with inward-facing
 * winding relative to their (correctly transformed) normals — so vertex
 * order is reversed in that case to keep winding consistent.
 */
function applyMatrix(solid: Solid, matrix: Mat4Type): Solid {
  const inverse = Mat4.invert(matrix);
  const normalMatrix = inverse ? Mat4.transpose(inverse) : matrix;
  const reverseWinding = Mat4.determinant(matrix) < 0;

  const polygons = solid.polygons.map((polygon): PolygonType => {
    const vertices = polygon.vertices.map((v) =>
      Vertex.vertex(
        Mat4.transformPoint(matrix, v.pos),
        Vec3.normalize(Mat4.transformDirection(normalMatrix, v.normal)),
      ),
    );
    return Polygon.polygon(reverseWinding ? [...vertices].reverse() : vertices);
  });
  return new Solid(polygons);
}

/** Composes Euler-angle rotations in OpenSCAD's order: X, then Y, then Z. */
function eulerRotation(radians: Vec3Type): Mat4Type {
  return Mat4.multiply(
    Mat4.rotationZ(radians.z),
    Mat4.multiply(Mat4.rotationY(radians.y), Mat4.rotationX(radians.x)),
  );
}

/**
 * A solid 3D shape: an immutable collection of polygons.
 *
 * `Solid` is the primary value type primitives (Stage 3) produce and
 * transforms (Stage 4) operate on. Unlike the rest of the geometry kernel
 * (which favors plain interfaces + free functions), `Solid` is a class so
 * that transforms can be chained as instance methods, e.g.
 * `cube(10).translate(vec3(5, 0, 0)).rotate(vec3(0, 0, Math.PI / 4))`.
 * Every transform method returns a new `Solid`; none mutate `this`.
 */
export class Solid {
  readonly polygons: readonly PolygonType[];

  constructor(polygons: readonly PolygonType[]) {
    this.polygons = polygons;
  }

  /** Translates every point of the solid by `offset`. */
  translate(offset: Vec3Type): Solid {
    return applyMatrix(this, Mat4.translation(offset));
  }

  /**
   * Rotates the solid by Euler angles (in radians), applied in OpenSCAD's
   * order: first around X, then Y, then Z.
   */
  rotate(radians: Vec3Type): Solid {
    return applyMatrix(this, eulerRotation(radians));
  }

  /** Rotates the solid by `radians` around `axis` (right-hand rule). */
  rotateAxisAngle(axis: Vec3Type, radians: number): Solid {
    return applyMatrix(this, Mat4.rotationAxisAngle(axis, radians));
  }

  /**
   * Scales the solid. A single `number` scales all three axes uniformly;
   * a `Vec3` scales each axis independently. A negative or zero factor on
   * an odd number of axes flips handedness/degenerates the shape — winding
   * is corrected automatically for the flip case, per `applyMatrix`.
   */
  scale(factor: number | Vec3Type): Solid {
    const v =
      typeof factor === 'number' ? Vec3.vec3(factor, factor, factor) : factor;
    return applyMatrix(this, Mat4.scaling(v));
  }

  /**
   * Reflects the solid across the plane through the origin with normal
   * `normal` (need not be pre-normalized).
   */
  mirror(normal: Vec3Type): Solid {
    return applyMatrix(this, Mat4.reflection(normal));
  }

  /** Applies an arbitrary 4x4 transform matrix to the solid. */
  multmatrix(matrix: Mat4Type): Solid {
    return applyMatrix(this, matrix);
  }
}
