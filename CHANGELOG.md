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
