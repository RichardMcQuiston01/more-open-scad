import { describe, expect, test } from 'bun:test';
import { cube } from '../primitives/cube';
import { cylinder } from '../primitives/cylinder';
import { sphere } from '../primitives/sphere';
import { Solid } from '../geometry/solid';
import { triangulateSolid } from './triangulate-solid';
import { toBinarySTL } from './stl-binary';

describe('toBinarySTL', () => {
  test('total byte length matches 80 + 4 + 50 * n for various solids', () => {
    for (const solid of [cube(2), sphere(1, { fn: 12 }), cylinder(2)]) {
      const n = triangulateSolid(solid).length;
      expect(toBinarySTL(solid)).toHaveLength(80 + 4 + 50 * n);
    }
  });

  test('an empty solid produces exactly an 84-byte buffer without throwing', () => {
    const bytes = toBinarySTL(new Solid([]));
    expect(bytes).toHaveLength(84);
  });

  test('the 80-byte header does not start with "solid"', () => {
    const bytes = toBinarySTL(cube(2));
    const prefix = new TextDecoder().decode(bytes.subarray(0, 5));
    expect(prefix).not.toBe('solid');
  });

  test('the triangle count field matches triangulateSolid output length', () => {
    for (const solid of [cube(2), sphere(1, { fn: 12 }), cylinder(2)]) {
      const bytes = toBinarySTL(solid);
      const view = new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength,
      );
      expect(view.getUint32(80, true)).toBe(triangulateSolid(solid).length);
    }
  });

  test('round-trips normal + vertex data for a cube within float32 precision', () => {
    const solid = cube(2);
    const expected = triangulateSolid(solid);
    const bytes = toBinarySTL(solid);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    for (let i = 0; i < expected.length; i++) {
      const triangle = expected[i]!;
      const offset = 84 + i * 50;

      expect(view.getFloat32(offset, true)).toBeCloseTo(triangle.normal.x, 5);
      expect(view.getFloat32(offset + 4, true)).toBeCloseTo(
        triangle.normal.y,
        5,
      );
      expect(view.getFloat32(offset + 8, true)).toBeCloseTo(
        triangle.normal.z,
        5,
      );

      const [v1, v2, v3] = triangle.vertices;
      expect(view.getFloat32(offset + 12, true)).toBeCloseTo(v1.x, 5);
      expect(view.getFloat32(offset + 16, true)).toBeCloseTo(v1.y, 5);
      expect(view.getFloat32(offset + 20, true)).toBeCloseTo(v1.z, 5);
      expect(view.getFloat32(offset + 24, true)).toBeCloseTo(v2.x, 5);
      expect(view.getFloat32(offset + 28, true)).toBeCloseTo(v2.y, 5);
      expect(view.getFloat32(offset + 32, true)).toBeCloseTo(v2.z, 5);
      expect(view.getFloat32(offset + 36, true)).toBeCloseTo(v3.x, 5);
      expect(view.getFloat32(offset + 40, true)).toBeCloseTo(v3.y, 5);
      expect(view.getFloat32(offset + 44, true)).toBeCloseTo(v3.z, 5);
    }
  });

  test('attribute byte count is 0 for every triangle', () => {
    const solid = cube(2);
    const bytes = toBinarySTL(solid);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const n = triangulateSolid(solid).length;

    for (let i = 0; i < n; i++) {
      const offset = 84 + i * 50 + 48;
      expect(view.getUint16(offset, true)).toBe(0);
    }
  });
});
