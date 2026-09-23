# MoreOpenSCAD

## Overview

Framework agnostic TypeScript based package for generating STL files using commands similar to OpenSCAD. Distributable via NPM for inclusion in TypeScript projects.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) 1.0+
- TypeScript 5+ (for consuming projects that want type checking)

## Installation

```sh
bun add @richardmcquiston01/more-open-scad
# or
npm install @richardmcquiston01/more-open-scad
```

## Usage

Build a shape with a primitive, chain transforms onto it, then export it to STL.

```ts
import { cube, Vec3, toBinarySTL } from '@richardmcquiston01/more-open-scad';

const shape = cube(20, { center: true })
  .translate(Vec3.vec3(0, 0, 10))
  .rotateAxisAngle(Vec3.vec3(0, 0, 1), Math.PI / 4);

const stl = toBinarySTL(shape); // Uint8Array
```

### Primitives

`cube(size, options?)`, `sphere(r, options?)`, `cylinder(h, options?)`, and `polyhedron(points, faces)` (the arbitrary-mesh escape hatch) each build a `Solid`, matching OpenSCAD's semantics for the same primitive. See each function's JSDoc for its options (`center`, `fn`, `r`/`r1`/`r2`, etc.).

### Transforms

Every `Solid` has chainable, immutable transform methods: `translate`, `rotate` (Euler angles), `rotateAxisAngle`, `scale` (uniform or per-axis), `mirror`, and `multmatrix` (an arbitrary 4x4 transform, for anything the named methods don't cover). Each call returns a new `Solid` — none of them mutate the original.

### Exporting to STL

`toBinarySTL(solid)` returns a `Uint8Array` (the binary STL format); `toASCIISTL(solid, name?)` returns a `string` (the ASCII STL format). Neither writes to disk — this package stays framework-agnostic by handing back bytes/text and leaving file I/O to you:

**Node.js:**

```ts
import { writeFileSync } from 'node:fs';
import { cube, toBinarySTL } from '@richardmcquiston01/more-open-scad';

writeFileSync('cube.stl', toBinarySTL(cube(20, { center: true })));
```

**Browser (trigger a download):**

```ts
import { cube, toBinarySTL } from '@richardmcquiston01/more-open-scad';

const stl = toBinarySTL(cube(20, { center: true }));
const url = URL.createObjectURL(new Blob([stl], { type: 'model/stl' }));

const link = document.createElement('a');
link.href = url;
link.download = 'cube.stl';
link.click();
URL.revokeObjectURL(url);
```

Before exporting, `isManifold(solid)` checks whether a `Solid` is watertight (every edge shared by exactly two triangles wound in opposite directions) — useful as a sanity check that geometry is 3D-print-ready.

## License

[MIT](LICENSE)

## Copyright

(c) 2026 Richard McQuiston.

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)
