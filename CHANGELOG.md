# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- CSG plane/polygon splitting (`src/csg/split-polygon.ts`): `splitPolygon`, the geometric core of the upcoming BSP-tree boolean operations. Classifies a polygon against a plane (coplanar/front/back/spanning) and clips spanning polygons into front/back pieces, preserving winding. Not yet part of the public API — later CSG stages (BSP tree, union/difference/intersect) build on this.

## [0.1.0] - 2026-07-24

The first published release: primitives, transforms, and STL export.

### Added

- Primitives: `cube`, `sphere`, `cylinder`, and `polyhedron` (the arbitrary-mesh escape hatch), matching OpenSCAD's semantics — see each function's docs for its options.
- Chainable transforms on `Solid`: `translate`, `rotate` (Euler angles), `rotateAxisAngle`, `scale` (uniform or per-axis), `mirror`, and `multmatrix` (arbitrary 4x4 transform). Normals transform correctly under non-uniform scale, and winding is automatically corrected for any handedness-flipping transform (e.g. `mirror`).
- STL export: `toBinarySTL` and `toASCIISTL`, plus `isManifold` for checking a solid is watertight before exporting, and `triangulateSolid` for consumers who want raw per-facet triangle data directly (e.g. to feed a WebGL renderer).
- The full `Vec3`/`Mat4` math toolkit and the underlying `Vertex`/`Polygon`/`Plane`/`Solid` geometry types, for consumers who want to inspect or hand-build geometry beyond what the primitives above cover.
- Project scaffolding: TypeScript build/typecheck/lint/test pipeline (`bun`-based) and GitHub Actions CI.

### Fixed

- Removed `"sideEffects": false` from `package.json` — it was causing `bun build` to silently tree-shake away the entire bundled implementation behind the public barrel export (`src/index.ts`), shipping an empty package. Caught before publishing via an end-to-end smoke test against the actual built `dist/index.js`.

### Changed

- Pinned `prettier` to the exact installed version (`3.9.6`, was `^3.4.2`) so `bun run format` no longer produces unrelated diffs from version drift.
