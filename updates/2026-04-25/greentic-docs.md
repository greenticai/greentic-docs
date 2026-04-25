# greentic-docs — canonical patterns (2026-04-25)

Three new Reference pages close gaps surfaced by the 3Point team and
Maarten's R1 demo debugging. Branch: `docs/canonical-patterns-2026-04-25`.

## Pages added

- `src/content/docs/reference/channel-data-access.mdx` — DirectLine
  `channelData` -> `envelope.extensions.channel_data` -> flow template
  `{{ entry.input.extensions.channel_data.* }}` -> WASM
  `input.extensions.channel_data.*` (auto-merged by runner 0.5.11+).
  Documents the camelCase/snake_case rename and points at the
  regression test in `greentic-start/src/messaging_app.rs`.

  **Closes:** 3Point's "how do we read `r1_principals` from a flow"
  question from the R1 demo; Maarten's request for a canonical
  pattern after the channelData plumbing fix.

- `src/content/docs/reference/secret-seeding.mdx` — canonical URI
  scheme `secrets://{env}/{tenant}/{team}/{pack_id}/{key}`, with
  preferred Path A (`setup.yaml` wizard) and fallback Path B
  (`greentic-secrets admin set`). Calls out `--category` as the
  legacy alias of `--pack-id` and warns that the value must be the
  pack manifest id, never a component id.

  **Closes:** 3Point hitting "Secret was not found or not provisioned
  for this component" because they passed `component-llm-openai` to
  `--category`; Maarten's ask to make the pack-id-vs-component-id
  rule explicit in docs.

- `src/content/docs/reference/flow-node-kinds.mdx` — authoritative
  list of node kinds recognised by runner 0.5.11: component nodes
  plus `emit.response`, `emit.log`, `session.wait`, `flow.call`,
  `provider.invoke`. Explicit gap note that no flow-callable
  `state.*` builtin ships today; documents the state-memory /
  state-redis backend + host-capability workaround and flags the
  `qa-demo` state flow as a forward-looking (not runnable) example.

  **Closes:** 3Point's confusion about why `state.get` nodes do not
  dispatch; Maarten's request to set expectations for the state
  roadmap item.

## Config change

- `astro.config.mjs` — three new Reference sidebar entries between
  `flow-schema` and `pack-format`.

## Not done

- Translations — will run via `scripts/translate-docs.mjs` after merge.
- State-store builtin docs — blocked on runner work (Option B framing
  shipped instead of Option A because the runner does not yet
  dispatch `state.*`).
