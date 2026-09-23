import { describe, expect, test } from 'bun:test';
import * as Mat4 from './mat4';
import * as Vec3 from './vec3';

describe('multiply', () => {
  test('by identity is a no-op', () => {
    const m = Mat4.translation(Vec3.vec3(1, 2, 3));
    expect(Mat4.equals(Mat4.multiply(m, Mat4.IDENTITY), m)).toBe(true);
    expect(Mat4.equals(Mat4.multiply(Mat4.IDENTITY, m), m)).toBe(true);
  });

  test('composes transforms so the rightmost applies first', () => {
    const t = Mat4.translation(Vec3.vec3(10, 0, 0));
    const s = Mat4.scaling(Vec3.vec3(2, 2, 2));
    const combined = Mat4.multiply(t, s);
    const p = Mat4.transformPoint(combined, Vec3.vec3(1, 0, 0));
    // scale first: (1,0,0) -> (2,0,0), then translate: -> (12,0,0)
    expect(Vec3.equals(p, Vec3.vec3(12, 0, 0))).toBe(true);
  });
});

describe('translation', () => {
  test('moves a point by the given offset', () => {
    const m = Mat4.translation(Vec3.vec3(1, 2, 3));
    const p = Mat4.transformPoint(m, Vec3.vec3(0, 0, 0));
    expect(Vec3.equals(p, Vec3.vec3(1, 2, 3))).toBe(true);
  });

  test('does not affect direction vectors', () => {
    const m = Mat4.translation(Vec3.vec3(1, 2, 3));
    const d = Mat4.transformDirection(m, Vec3.vec3(5, 6, 7));
    expect(Vec3.equals(d, Vec3.vec3(5, 6, 7))).toBe(true);
  });
});

describe('rotationAxisAngle', () => {
  test('four quarter turns return to identity', () => {
    const quarterTurn = Mat4.rotationAxisAngle(Vec3.vec3(0, 0, 1), Math.PI / 2);
    const fourTurns = [
      quarterTurn,
      quarterTurn,
      quarterTurn,
      quarterTurn,
    ].reduce((acc, m) => Mat4.multiply(m, acc), Mat4.IDENTITY);
    expect(Mat4.equals(fourTurns, Mat4.IDENTITY)).toBe(true);
  });

  test('around Z matches rotationZ', () => {
    const angle = Math.PI / 3;
    expect(
      Mat4.equals(
        Mat4.rotationAxisAngle(Vec3.vec3(0, 0, 1), angle),
        Mat4.rotationZ(angle),
      ),
    ).toBe(true);
  });

  test('90 degrees around Z maps +X to +Y', () => {
    const m = Mat4.rotationAxisAngle(Vec3.vec3(0, 0, 1), Math.PI / 2);
    const p = Mat4.transformPoint(m, Vec3.vec3(1, 0, 0));
    expect(Vec3.equals(p, Vec3.vec3(0, 1, 0))).toBe(true);
  });
});

describe('invert', () => {
  test('invert(M) * M is the identity', () => {
    const m = Mat4.multiply(
      Mat4.translation(Vec3.vec3(3, -2, 5)),
      Mat4.rotationAxisAngle(Vec3.vec3(1, 1, 0), 0.7),
    );
    const inv = Mat4.invert(m);
    expect(inv).not.toBeNull();
    expect(Mat4.equals(Mat4.multiply(inv!, m), Mat4.IDENTITY)).toBe(true);
  });

  test('returns null for a singular matrix', () => {
    const singular = Mat4.scaling(Vec3.vec3(1, 0, 1));
    expect(Mat4.invert(singular)).toBeNull();
  });
});

describe('transpose', () => {
  test('transpose is its own inverse operation', () => {
    const m = Mat4.rotationAxisAngle(Vec3.vec3(1, 2, 3), 1.1);
    expect(Mat4.equals(Mat4.transpose(Mat4.transpose(m)), m)).toBe(true);
  });
});

describe('determinant', () => {
  test('is 1 for the identity', () => {
    expect(Mat4.determinant(Mat4.IDENTITY)).toBeCloseTo(1);
  });

  test('is the product of the scale factors for a scaling matrix', () => {
    const m = Mat4.scaling(Vec3.vec3(2, 3, 4));
    expect(Mat4.determinant(m)).toBeCloseTo(24);
  });

  test('is 1 for a pure rotation', () => {
    const m = Mat4.rotationAxisAngle(Vec3.vec3(1, 1, 1), 0.9);
    expect(Mat4.determinant(m)).toBeCloseTo(1);
  });

  test('is 0 for a singular matrix', () => {
    expect(Mat4.determinant(Mat4.scaling(Vec3.vec3(1, 0, 1)))).toBeCloseTo(0);
  });

  test('is unaffected by translation', () => {
    const m = Mat4.multiply(
      Mat4.translation(Vec3.vec3(5, -3, 2)),
      Mat4.scaling(Vec3.vec3(2, 2, 2)),
    );
    expect(Mat4.determinant(m)).toBeCloseTo(8);
  });
});

describe('reflection', () => {
  test('has determinant -1', () => {
    const m = Mat4.reflection(Vec3.vec3(0, 0, 1));
    expect(Mat4.determinant(m)).toBeCloseTo(-1);
  });

  test('negates the component along the normal, preserves the rest', () => {
    const m = Mat4.reflection(Vec3.vec3(0, 0, 1));
    const p = Mat4.transformPoint(m, Vec3.vec3(3, 4, 5));
    expect(Vec3.equals(p, Vec3.vec3(3, 4, -5))).toBe(true);
  });

  test('leaves points on the mirror plane unchanged', () => {
    const m = Mat4.reflection(Vec3.vec3(1, 0, 0));
    const p = Mat4.transformPoint(m, Vec3.vec3(0, 7, -2));
    expect(Vec3.equals(p, Vec3.vec3(0, 7, -2))).toBe(true);
  });

  test('applying it twice is the identity', () => {
    const m = Mat4.reflection(Vec3.vec3(1, 1, 0));
    expect(Mat4.equals(Mat4.multiply(m, m), Mat4.IDENTITY)).toBe(true);
  });

  test('accepts a non-unit normal', () => {
    const m = Mat4.reflection(Vec3.vec3(0, 0, 5));
    const p = Mat4.transformPoint(m, Vec3.vec3(1, 2, 3));
    expect(Vec3.equals(p, Vec3.vec3(1, 2, -3))).toBe(true);
  });
});
