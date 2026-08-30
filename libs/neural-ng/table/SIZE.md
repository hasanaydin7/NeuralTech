# NeuralNg Table size report

Measured from the production package build for `0.1.0-beta.0`.

| Artifact | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Table FESM (`neural-ng-core-table.mjs`) | 256,543 B | 38,884 B | 26,374 B |
| Table declarations (`neural-ng-core-table.d.ts`) | 52,776 B | 7,575 B | 6,652 B |
| Source component SCSS | 25,105 B | 3,876 B | 3,378 B |

Notes:

- The FESM figure is the complete secondary entry point before consumer
  minification/tree-shaking; it is not the cost of every individual usage.
- Angular's demo production build reports compiled Table component styles at
  approximately 22.07 kB raw, above the current 8 kB warning budget.
- The warning does not block beta, but stylesheet modularization is a
  pre-stable optimization target.
- Regenerate these figures after a production library build with Node's
  `zlib.gzipSync` and `zlib.brotliCompressSync`.
