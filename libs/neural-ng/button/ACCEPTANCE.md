# Button acceptance scope

This change prepares Button and ButtonGroup for a focused review. It does not
promote either component to stable or change package versions. Other components'
readiness work is intentionally excluded.

## Reproducible checks

- `npx nx test neural-ng`: includes `button-acceptance.spec.ts` for native form
  actions, busy/disabled menu triggers, content identity, and unstyled grouping.
- `npx playwright test --config=apps/neural-site-e2e/playwright.config.mts button-release.spec.ts`:
  Button documentation acceptance in Chromium, Firefox, and WebKit; light/dark,
  LTR/RTL, narrow reflow, reduced motion, keyboard operation, and axe checks.
- `npx nx run neural-ng:button-consumer-test`: installs the built Core tarball
  outside workspace aliases, compiles strict Angular templates and negative API
  canaries, verifies SSR hydration node identity, and tests Button/Menu/native
  form composition. Set `NEURAL_CORE_ANGULAR_VERSION=22.0.0` or `latest-22` to
  choose a compatibility lane; CI runs both.
- The installed consumer samples 49 severity/variant combinations in four
  light/dark and LTR/RTL configurations, with idle/hover/focus/pressed/busy
  states (980 samples), and checks forced colors and actual 200% Chromium tab
  zoom. Contrast checks use computed solid backgrounds, not a claim to validate
  arbitrary consumer CSS or experimental themes.

Evidence is written to `tmp/button-acceptance/<Angular version>/`. The zoom
screenshot is diagnostic only: viewport and overflow measurements are the zoom
assertions, not screenshot clipping. CI publishes this evidence for review.

## Manual assistive-technology feedback

Before separation, the maintainer used Windows Narrator in the ChatGPT in-app
browser on the Button documentation page and reported correct names and Tab
navigation. Following consolidation of duplicate live outputs into one announcer,
the repeated announcement appeared resolved. This is useful manual feedback, not
a complete cross-screen-reader certification; no unmeasured browser version or
formal stable acceptance is claimed.

The landing example has one polite status region. Its visual duplicate outputs
are not live regions, and a loading Button supplies its own busy state/name.
