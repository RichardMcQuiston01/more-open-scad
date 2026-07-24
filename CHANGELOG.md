# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Project scaffolding: `package.json`, `tsconfig.json`, ESLint + Prettier config, `bun test` setup, and GitHub Actions CI (typecheck, lint, test, build on PRs into `dev`/`staging`/`release`/`main`).
- README skeleton sections for Prerequisites, Installation, and Usage.
- Internal math kernel (`src/math`): `Vec3` and `Mat4` (column-major) with the operations needed for later primitives, transforms, and CSG (add/sub/cross/dot/normalize, matrix compose/invert/transpose, point/direction transforms), plus shared epsilon-tolerance utilities. Not yet part of the public API.
- Internal mesh data structure (`src/geometry`): `Plane`, `Vertex`, `Polygon` (planar, convex, arbitrary vertex count — kept untriangulated so the future CSG engine can split it directly), `Solid` (a polygon collection, and the anchor point for chainable transforms), and `triangulate` (fan-triangulation deferred to STL-export time). Not yet part of the public API.
- Shared test-only geometry assertions (`src/testing/solid-assertions.ts`): `signedVolume` (divergence-theorem volume check), `averageVertexPosition`, and `hasOutwardNormals`, for verifying primitive/transform/CSG correctness. Excluded from the published package.
- `cube` primitive (`src/primitives/cube.ts`): builds an axis-aligned box `Solid` from a scalar or `Vec3` size, with an optional `center` flag matching OpenSCAD's `cube()`.
- `polyhedron` primitive (`src/primitives/polyhedron.ts`): builds an arbitrary-mesh `Solid` from a flat list of points and a list of faces (index lists into `points`), the raw escape hatch for geometry with no dedicated primitive. Validates that every face has at least 3 indices and that all indices are in bounds; expects faces wound counter-clockwise from outside, the opposite of raw OpenSCAD `.scad` `polyhedron()` data.
- `sphere(r, options?)` primitive (`src/primitives/sphere.ts`): a UV-sphere of radius `r` centered at the origin, tessellated entirely from triangles (band quads split in two) so every `Polygon` stays exactly planar, with `options.fn` (default `32`) controlling longitude segment count and latitude ring count (`fn / 2`, minimum 2).
- `cylinder` primitive (`src/primitives/cylinder.ts`): builds a cylinder, cone, or frustum solid matching OpenSCAD's `cylinder()` semantics (`r`/`r1`/`r2`, `h`, `center`, `fn`), with triangulated side faces (kept exactly planar even when tapered) and flat n-gon top/bottom caps.
- Chainable transforms on `Solid` (`src/geometry/solid.ts`): `translate`, `rotate` (Euler angles, X/Y/Z order), `rotateAxisAngle`, `scale` (uniform or per-axis), `mirror`, and `multmatrix` (arbitrary 4x4 transform). Normals transform by the matrix's inverse-transpose for correctness under non-uniform scale; winding is automatically reversed for any transform with negative determinant (mirror, or an odd number of reflections via `multmatrix`) so outward-facing geometry stays outward-facing. Also adds `Mat4.determinant` and `Mat4.reflection` to the math kernel. Not yet part of the public API.
- STL triangulation helper (`src/io/triangulate-solid.ts`): flattens a `Solid` into per-facet STL triangles (fan-triangulating each polygon and recomputing each triangle's own normal via the right-hand rule), the shared foundation the upcoming binary/ASCII STL writers build on. Not yet part of the public API.

### Changed

- Pinned `prettier` to the exact installed version (`3.9.6`, was `^3.4.2`) and reformatted the two files the version drift affected, so `bun run format` no longer produces unrelated diffs.
