# Security Policy

## Supported versions

NeuralNg packages are versioned independently. Security fixes target
the latest supported release of each affected package, including beta and RC
releases. Older prereleases are not maintained as separate security branches.

## Dependency maintenance

Audit the full workspace and the production subset separately with `npm audit`
and `npm audit --omit=dev`. Development-tool findings must remain visible;
excluding them from the production report is not a waiver or a claim that the
entire workspace is vulnerability-free.

The workspace temporarily pins `nx > smol-toml` to `1.9.1`, `nx > undici` to
`7.30.1`, and Verdaccio's Express dependencies to `4.22.3` through scoped overrides.
The Undici pin replaces Nx's exact `7.29.0` dependency within the same major to
address its HTTP/WebSocket/TLS advisories. Remove these overrides
when their parent packages adopt fixed versions and a fresh install, audit,
build and test run passes. Do not use forced major downgrades merely to silence
an audit finding.

Audit review on 2026-11-01: the updated lockfile has no high or critical
findings, and `npm audit --omit=dev` reports zero findings. The full workspace
still reports 45 moderate package findings sharing the development-only
Minimatch chain below; this is not a vulnerability-free workspace claim.

The remaining development-tool findings must be reviewed separately from the
runtime graph. In particular, the Minimatch glob-amplification advisory affects
versions below `11.0.1`
([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)).
ESLint, TypeScript ESLint, Nx and Verdaccio still consume older major versions.
Do not globally replace their Minimatch 3/10 APIs with 11 to silence the report.
Keep development servers private, avoid untrusted glob/config input, and recheck
parent-package updates. No audit suppression or forced major downgrade is applied.

The MCP package manifest pins the patched SDK `@modelcontextprotocol/server@2.3.1` and
requires `zod >=4.6.6` within v4. Verify the installed tarball's protocol behavior
and dependency audit in addition to the workspace audit when changing these pins.

The Editor manifest requires Tiptap `3.32.2` or newer within v3 and Happy DOM
`21.0.4` or newer within v21 for HTML conversion. Happy DOM is explicit because
Tiptap's peer range also accepts older vulnerable v20 versions. These source
manifest changes do not retroactively update already-published npm versions.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private
security advisory flow for this repository and include the affected package,
version, reproduction, impact and any known workaround.

Maintainers will acknowledge a complete report as soon as practical, validate
the impact, and coordinate disclosure with the reporter. Please allow time for
a patched package before publishing details.
