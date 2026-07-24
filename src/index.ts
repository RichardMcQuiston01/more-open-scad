// Primitives — build a Solid from scratch.
export { cube } from './primitives/cube';
export type { CubeOptions } from './primitives/cube';
export { sphere } from './primitives/sphere';
export type { SphereOptions } from './primitives/sphere';
export { cylinder } from './primitives/cylinder';
export type { CylinderOptions } from './primitives/cylinder';
export { polyhedron } from './primitives/polyhedron';

// Geometry — Solid (with its chainable transforms) and the mesh building
// blocks it's made of, for consumers who want to inspect or hand-build
// geometry beyond what the primitives above cover.
export { Solid } from './geometry/solid';
export * as Vertex from './geometry/vertex';
export * as Polygon from './geometry/polygon';
export * as Plane from './geometry/plane';

// Math — Vec3/Mat4, needed to call the primitives/transforms above and
// useful standalone for consumers doing their own geometry work.
export * as Vec3 from './math/vec3';
export * as Mat4 from './math/mat4';

// STL export and mesh diagnostics.
export { toBinarySTL } from './io/stl-binary';
export { toASCIISTL } from './io/stl-ascii';
export { isManifold } from './io/manifold-check';
export { triangulateSolid } from './io/triangulate-solid';
export type { StlTriangle } from './io/triangulate-solid';
