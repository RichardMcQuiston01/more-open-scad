# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MoreOpenSCAD is a framework-agnostic TypeScript package for generating STL files using commands similar to OpenSCAD. It is intended to be distributed via NPM for use in TypeScript projects.

## Status

The package is `@richardmcquiston01/more-open-scad`, currently `0.2.0` — the first version published to npm. Primitives, transforms, STL export, and CSG boolean operations (`union`/`difference`/`intersect`) are all implemented. A tag-triggered npm publish workflow (`.github/workflows/publish.yml`) fires on `v*.*.*` tags pushed to `main`.

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
- `src/csg/` — boolean operations (`union`/`difference`/`intersect`) on top of a BSP tree (`bsp-tree.ts`) and plane/polygon splitting (`split-polygon.ts`); only `boolean.ts`'s exports are public
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
