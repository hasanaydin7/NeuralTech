# Releasing npm packages

npm publishing runs in GitHub Actions through npm Trusted Publishing. No npm
password, automation token or two-factor authentication code is stored in the
repository.

## One-time npm setup

Configure the same GitHub trusted publisher on every public package:

- Organization or user: `hasanaydin7`
- Repository: `NeuralTech`
- Workflow filename: `publish-npm.yml`
- Environment: leave empty

The packages are `@neural-ng/core`, `@neural-ng/icons`, `@neural-ng/editor`,
`@neural-ng/theme` and `@neural-ng/mcp-server`.

## Publish a release

1. Increase the `version` in each package that should be published. Update any
   exact internal dependency versions at the same time.
2. Commit the version changes to `main` and wait for CI to pass.
3. Check the release plan locally after building the packages:

   ```bash
   npm run build
   npm run npm:publish:check
   ```

4. Tag the verified commit and push the tag:

   ```bash
   git tag npm-release-YYYYMMDD.N
   git push origin npm-release-YYYYMMDD.N
   ```

The workflow builds and validates all public packages, skips versions already
present on npm, and publishes only new versions with the `latest` dist-tag. A
failed workflow can be rerun safely from GitHub Actions.
