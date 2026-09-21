# Security Policy

## Supported versions

NeuralNg packages are versioned independently. Core and Editor are currently
beta software; the MCP server is a release candidate. Security fixes target
the latest supported release of each affected package, including beta and RC
releases. Older prereleases are not maintained as separate security branches.

## Dependency maintenance

Audit the full workspace and the production subset separately with `npm audit`
and `npm audit --omit=dev`. Development-tool findings must remain visible;
excluding them from the production report is not a waiver or a claim that the
entire workspace is vulnerability-free.

The workspace temporarily pins `nx > smol-toml` to `1.7.1` and Verdaccio's
Express dependencies to `4.22.3` through scoped overrides. Remove these overrides
when their parent packages adopt fixed versions and a fresh install, audit,
build and test run passes. Do not use forced major downgrades merely to silence
an audit finding.

Audit review on 2026-09-19: the updated lockfile has no high or critical
findings. Five moderate package findings share one development-only chain:
`@angular-devkit/build-angular` / `build-webpack` -> `webpack-dev-server` ->
`sockjs` -> `uuid` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)).
The installed SockJS code calls `uuid.v4`, while the advisory concerns v3/v5/v6
buffer handling; this limits the observed exposure but does not remove the
finding. Keep development servers private and recheck parent-package updates.
No major-version UUID override or audit suppression is applied.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private
security advisory flow for this repository and include the affected package,
version, reproduction, impact and any known workaround.

Maintainers will acknowledge a complete report as soon as practical, validate
the impact, and coordinate disclosure with the reporter. Please allow time for
a patched package before publishing details.
