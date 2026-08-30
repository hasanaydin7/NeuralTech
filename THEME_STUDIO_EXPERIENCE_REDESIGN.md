# Theme Studio Experience Redesign

## Objective

Turn Theme Studio from a three-column compiler dashboard into a guided product
workflow that a designer or application developer can understand without first
learning the full NeuralNg token contract.

## Product decisions

- The main path is four steps: Brand, Feel, Preview and Export.
- The compact JSON recipe remains canonical, but its editor is hidden under an
  advanced disclosure in the Export step.
- The generated preview stays visible while the user changes settings.
- Brand presets and visual option cards replace most raw select controls.
- Component previews are grouped into Overview, Forms, Feedback and Editor so
  the screen does not display every component at once.
- Diagnostics are summarized as export readiness and expanded only when action
  is required.
- Import, reset, recipe, CSS, token and report workflows remain available.

## Files changed

- `apps/neural-demo/src/app/docs/pages/theme-studio/theme-studio.page.ts`
- `apps/neural-demo/src/app/docs/pages/theme-studio/theme-studio.page.html`
- `apps/neural-demo/src/app/docs/pages/theme-studio/theme-studio.page.scss`
- `CHANGELOG.md`

## Compatibility

The redesign does not change the `@neural-ng/theme` recipe schema, compiler,
browser entry point or generated artifacts. Existing recipes continue to import
and compile through the same Theme Foundation Phase 2 APIs.
