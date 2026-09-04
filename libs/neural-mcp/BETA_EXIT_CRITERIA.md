# NeuralNg MCP beta exit criteria

The MCP package must not be merged to `main`, release-tagged, or published from
the Contract V2 branch until every required gate below is green. Release
candidate metadata may be prepared on the branch for tarball host verification.

## Required gates

- [x] Catalog is generated from public Angular source rather than maintained by hand.
- [x] Contracts expose inputs, models, outputs, typed templates, public providers,
      provider requirements, documented methods, class slots, examples, and public
      type aliases.
- [x] Discovery supports deterministic search, token-efficient detail levels, and
      bounded examples.
- [x] Composition produces exact imports, provider requirements, state ownership,
      accessibility checks, and implementation order for page, form, and table goals.
- [x] Correctness diagnostics cover unknown selectors/bindings, required inputs,
      literal unions, icon-only button labels, missing imports/providers, and duplicate
      Toast channels.
- [x] Project inspection is read-only, pathless at the protocol boundary, bounded,
      symlink-safe, and excludes dependencies, build output, VCS data, and tests.
- [x] Project-consistent planning distinguishes reused conventions from newly
      introduced primitives.
- [x] Unit and evaluation fixtures exercise discovery, composition, correctness,
      project awareness, and theme tools deterministically.
- [x] Packaged stdio smoke initializes the published artifact and calls discovery,
      composition, validation, project, and theme tools.
- [x] CI runs MCP unit tests, build, package contract, and packaged stdio smoke.
- [ ] Full repository CI passes on the feature branch pull request.
- [x] Public tool names and result schemas receive final compatibility review.
- [x] Package/server versions and release notes are updated together only after review.
- [x] A release candidate is tested from its packed tarball in at least one real coding
      agent host before npm publication.

## Release rule

Do not infer readiness from a successful build alone. Merge only after the unchecked
items are completed and reviewed. Publishing remains a separate, explicit action.
