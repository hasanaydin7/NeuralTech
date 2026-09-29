# Icons 1.0 acceptance

Date: 2026-09-28. Scope: `@neural-ng/icons`, not the stability of Core or Theme.

## Public contract

- 108 curated classes; full inventory: 5,130 outline + 1,054 filled variants.
- 41 category names, with filled entry points only for non-empty categories.
- Existing `nt` classes, CSS entry points, aliases, motion classes and duration
  custom properties remain unchanged. Upstream Tabler inventory is pinned.
- No runtime dependencies, external artwork requests or JavaScript component.
- Curated/full naming differences and CSS ordering are documented explicitly.

## Automated acceptance

`npx nx test neural-icons` checks deterministic generation, metadata versions,
exports, exact catalog/category membership, alias presence, license packaging,
embedded SVG payload safety and lack of consumer dependencies.

`npx nx run neural-icons:browser-test` packs the build, installs the tarball in
a fresh temporary consumer, then checks inherited color and dimensions,
accessible control naming, dual/reverse/fallback animation, reduced motion,
all 6,184 computed mask declarations, allowed/blocked image CSP and lack of
external requests. Set `NEURAL_ICONS_BROWSERS=chromium,firefox,webkit` to run all
three engines. This passed locally on Windows; CI repeats it on Linux.

## Limits

Catalog-wide checks verify computed mask availability, not individual pixel
snapshots or human review of all artwork. Automated WebKit is not a physical
iOS/Safari device test. RTL mirroring is not automatic. Meaningful icons need
text alternatives; forced-color and application overrides can affect rendering.
Strict CSP must allow `data:` in its effective `img-src` policy.

Release is not published until CI, merge and the npm release workflow succeed.
