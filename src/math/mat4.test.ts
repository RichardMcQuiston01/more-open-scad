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
