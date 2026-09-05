# NeuralNg MCP beta exit criteria

The MCP package must not be merged to `main`, release-tagged, or published from
the Contract V2 branch until every required gate below is green. Release
candidate metadata may be prepared on the branch for tarball host verification.

## Roadmap gates

- [x] Contract Generator V2 is generated from public Angular source.
- [x] Component discovery returns versioned contracts and bounded examples.
- [x] The capability/composition graph is contract-backed.
- [x] `plan_ui` returns exact imports, providers, state, accessibility checks,
      and implementation order.
- [x] `validate_usage` uses the Angular compiler AST and exposes
      usage-validation schema v2.
- [x] The Neural Icons catalog and `search_icons` are implemented and tested.
- [ ] Read-only project inspection is completed and integrated with all preceding
      contracts. The existing bounded implementation is an early slice.
- [ ] Project-consistent UI suggestions are completed and integrated. The existing
      planner is an early slice.
- [ ] The acceptance evaluation package passes deterministically.
- [ ] `1.0.0-rc.1` metadata, release notes, packed artifact, and real coding-agent
      host verification are completed together.

The detailed order and acceptance scenario are maintained in `ROADMAP.md`.

## Release rule

Do not infer readiness from a successful build alone. Merge only after the unchecked
items are completed and reviewed. Publishing remains a separate, explicit action.
