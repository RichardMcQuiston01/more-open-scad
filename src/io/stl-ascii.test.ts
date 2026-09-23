import { describe, expect, test } from 'bun:test';
import { cube } from '../primitives/cube';
import { sphere } from '../primitives/sphere';
import { Solid } from '../geometry/solid';
import * as Vec3 from '../math/vec3';
import { toASCIISTL } from './stl-ascii';
import { triangulateSolid } from './triangulate-solid';

/** Extracts every numeric token following `label` (e.g. `facet normal` or `vertex`) as flat number arrays. */
function extractTriples(text: string, label: string): number[][] {
  const pattern = new RegExp(
    `${label} (-?[\\d.]+) (-?[\\d.]+) (-?[\\d.]+)`,
    'g',
  );
  const results: number[][] = [];
  for (const match of text.matchAll(pattern)) {
    results.push([Number(match[1]), Number(match[2]), Number(match[3])]);
  }
  return results;
}

describe('toASCIISTL', () => {
  test('unnamed output starts with bare "solid" and ends with bare "endsolid"', () => {
    const output = toASCIISTL(cube(2)).trim();
    expect(output.startsWith('solid')).toBe(true);
    expect(output.startsWith('solid ')).toBe(false);
    expect(output.endsWith('endsolid')).toBe(true);
    const lastLine = output.split('\n').at(-1);
    expect(lastLine).toBe('endsolid');
  });

  test('named output includes the name on both the solid and endsolid lines', () => {
    const output = toASCIISTL(cube(2), 'mycube').trim();
    expect(output).toContain('solid mycube');
    expect(output.split('\n')[0]).toBe('solid mycube');
    expect(output.split('\n').at(-1)).toBe('endsolid mycube');
  });

  test('ends with a trailing newline', () => {
    expect(toASCIISTL(cube(2)).endsWith('\n')).toBe(true);
  });

  test('facet/endfacet counts match triangulateSolid for a cube', () => {
    const solid = cube(2);
    const expectedCount = triangulateSolid(solid).length;
    expect(expectedCount).toBe(12);

    const output = toASCIISTL(solid);
    expect(output.match(/facet normal/g)?.length).toBe(expectedCount);
    expect(output.match(/endfacet/g)?.length).toBe(expectedCount);
  });

  test('an empty solid produces valid output with zero facets and does not throw', () => {
    const output = toASCIISTL(new Solid([]));
    expect(output.match(/facet normal/g)).toBeNull();
    expect(output.match(/endfacet/g)).toBeNull();
    expect(output.trim()).toBe('solid\nendsolid'.split('\n').join('\n'));
    expect(output).toBe('solid\nendsolid\n');
  });

  test('round-trips facet normals and vertex positions back to the source triangle data', () => {
    const solid = sphere(1, { fn: 8 });
    const triangles = triangulateSolid(solid);
    const output = toASCIISTL(solid);

    const normals = extractTriples(output, 'facet normal');
    const vertices = extractTriples(output, 'vertex');

    expect(normals.length).toBe(triangles.length);
    expect(vertices.length).toBe(triangles.length * 3);

    triangles.forEach((triangle, i) => {
      const normal = normals[i]!;
      expect(normal[0]).toBeCloseTo(triangle.normal.x, 5);
      expect(normal[1]).toBeCloseTo(triangle.normal.y, 5);
      expect(normal[2]).toBeCloseTo(triangle.normal.z, 5);

      for (let v = 0; v < 3; v++) {
        const parsed = vertices[i * 3 + v]!;
        const source = triangle.vertices[v]!;
        expect(parsed[0]).toBeCloseTo(source.x, 5);
        expect(parsed[1]).toBeCloseTo(source.y, 5);
        expect(parsed[2]).toBeCloseTo(source.z, 5);
      }
    });
  });

  test('never emits scientific notation in numeric fields for a large-offset solid', () => {
    const output = toASCIISTL(cube(2).translate(Vec3.vec3(1000, 1000, 1000)));
    const numericTokens = output.match(/-?\d[\d.eE+-]*/g) ?? [];
    expect(numericTokens.length).toBeGreaterThan(0);
    for (const token of numericTokens) {
      expect(/[eE]/.test(token)).toBe(false);
    }
  });

  test('never emits scientific notation in numeric fields for a very small solid', () => {
    const output = toASCIISTL(cube(0.001));
    const numericTokens = output.match(/-?\d[\d.eE+-]*/g) ?? [];
    expect(numericTokens.length).toBeGreaterThan(0);
    for (const token of numericTokens) {
      expect(/[eE]/.test(token)).toBe(false);
    }
  });
});
