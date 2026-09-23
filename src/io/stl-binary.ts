import type { Solid } from '../geometry/solid';
import { triangulateSolid } from './triangulate-solid';

/** Fixed size, in bytes, of the binary STL header. */
const HEADER_SIZE = 80;

/** Size, in bytes, of the little-endian `uint32` triangle count field. */
const COUNT_SIZE = 4;

/** Size, in bytes, of a single binary STL triangle record. */
const TRIANGLE_SIZE = 50;

/**
 * Header text written into the fixed 80-byte binary STL header. Per
 * convention this must NOT start with the ASCII string `"solid"`, since
 * some lenient parsers sniff that prefix to decide whether a file is ASCII
 * or binary STL, and a binary file starting with it can be misread.
 */
const HEADER_TEXT = 'MoreOpenSCAD binary STL export';

/**
 * Serializes `solid` to the binary STL file format.
 *
 * The output is exactly `80 + 4 + 50 * n` bytes, where `n` is the number of
 * triangles `triangulateSolid(solid)` produces: an 80-byte header (arbitrary
 * content, but not starting with `"solid"`), a little-endian `uint32`
 * triangle count, then one 50-byte little-endian record per triangle (a
 * `float32` facet normal, three `float32` vertex positions, and a `uint16`
 * attribute byte count that is always `0`).
 */
export function toBinarySTL(solid: Solid): Uint8Array {
  const triangles = triangulateSolid(solid);
  const byteLength =
    HEADER_SIZE + COUNT_SIZE + TRIANGLE_SIZE * triangles.length;

  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const headerBytes = new TextEncoder().encode(HEADER_TEXT);
  bytes.set(headerBytes.subarray(0, HEADER_SIZE), 0);

  view.setUint32(HEADER_SIZE, triangles.length, true);

  let offset = HEADER_SIZE + COUNT_SIZE;
  for (const triangle of triangles) {
    view.setFloat32(offset, triangle.normal.x, true);
    view.setFloat32(offset + 4, triangle.normal.y, true);
    view.setFloat32(offset + 8, triangle.normal.z, true);

    const [v1, v2, v3] = triangle.vertices;
    view.setFloat32(offset + 12, v1.x, true);
    view.setFloat32(offset + 16, v1.y, true);
    view.setFloat32(offset + 20, v1.z, true);
    view.setFloat32(offset + 24, v2.x, true);
    view.setFloat32(offset + 28, v2.y, true);
    view.setFloat32(offset + 32, v2.z, true);
    view.setFloat32(offset + 36, v3.x, true);
    view.setFloat32(offset + 40, v3.y, true);
    view.setFloat32(offset + 44, v3.z, true);

    view.setUint16(offset + 48, 0, true);

    offset += TRIANGLE_SIZE;
  }

  return bytes;
}
