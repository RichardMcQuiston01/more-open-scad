# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MoreOpenSCAD is a framework-agnostic TypeScript package for generating STL files using commands similar to OpenSCAD. It is intended to be distributed via NPM for use in TypeScript projects.

## Status

The package is initialized and published as `@richardmcquiston01/more-open-scad` (currently `0.1.0`). Primitives, transforms, and STL export are implemented; CSG boolean operations (union/difference/intersect) are in progress — `splitPolygon` (plane/polygon splitting) is the first landed piece, not yet part of the public API.

Use `bun` (not `npm`) for all tooling per the user's global tooling preference.

## Commands

- `bun install` — install dependencies
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — ESLint over the whole repo (`bun run lint:file <path>` for a single file)
- `bun run format` — Prettier, writes in place
- `bun test` — run the test suite (co-located `*.test.ts` files; `bun test <path>` for a single file)
- `bun run build` — `build:js` (bundles `src/index.ts` to `dist/` via `bun build`) then `build:types` (emits `.d.ts` via `tsc`)

CI (`.github/workflows/`) runs typecheck, lint, test, and build on PRs into `dev`, `staging`, `release`, and `main`.

## Structure

- `src/math/` — `Vec3`, `Mat4`, and epsilon-based float comparison
- `src/geometry/` — `Vertex`, `Polygon`, `Plane`, `Solid`, and mesh triangulation
- `src/csg/` — BSP-tree boolean operations (in progress; `splitPolygon` so far)
- `src/primitives/` — `cube`, `sphere`, `cylinder`, `polyhedron`
- `src/io/` — STL export (`stl-binary`, `stl-ascii`), `triangulateSolid`, `isManifold`
- `src/testing/` — shared test assertion helpers
- `src/index.ts` — the public barrel export

## Resources

OpenSCAD concepts this library is modeled after:

- <https://openscad.org/documentation.html>
- <https://openscad.org/documentation-articles.html#makerbot-blog>
- <https://en.wikibooks.org/wiki/OpenSCAD_User_Manual>
- <https://en.wikipedia.org/wiki/STL_(file_format)>
- <https://threejs.org/docs/#STLExporter>
