---
title: Designer Extensions
description: WASM-based extension system that teaches Greentic Designer new content types, bundle recipes, and deploy targets at runtime.
---

Greentic Designer is **domain-agnostic**. It doesn't ship hardcoded
knowledge of Adaptive Cards, Digital Workers, or any specific cloud
deployment target. Instead, it loads signed WebAssembly Component Model
artifacts (`.gtxpack`) at runtime that teach it how to author content,
package output, and deploy results.

Three extension kinds share one foundation:

| Kind | Teaches the designer to... | Example reference impls |
|---|---|---|
| **design-extension** | Author content (cards, flows, digital workers, telco-x schemas) | [`greentic.adaptive-cards`](./adaptive-cards/) |
| **bundle-extension** | Package designer output into deployable Application Packs | [`bundle-standard`](./bundle-extensions/) |
| **deploy-extension** | Ship Application Packs to a target environment | (future: AWS, GCP, Cisco on-prem) |

Each extension kind has its own WIT sub-interface, its own call site in
the designer, and its own author tutorial — but the install lifecycle,
permission model, signature verification, and registry/store integration
are all shared infrastructure.

## How it works

```
                ┌──────────────────────────────────────────────┐
                │   Greentic Store  (store.greentic.ai)        │
                │   Developers upload · end-users discover     │
                └────────────────────────┬─────────────────────┘
                                         │ HTTPS / OpenAPI
                                         ▼
                ┌──────────────────────────────────────────────┐
                │            extension runtime                  │
                │  Registry trait — Store · OCI · Local         │
                │  Wasmtime Component loader + Linker           │
                │  Capability registry (semver matching)        │
                │  Host broker (permission + depth gates)       │
                │  Debounced filesystem watcher (hot reload)    │
                └────────────────────────┬─────────────────────┘
                                         │
                ┌────────────────────────▼─────────────────────┐
                │          Greentic Designer (consumer)        │
                │  Chat — design-ext tools                     │
                │  "Next" wizard — bundle-ext recipes          │
                │  Deploy wizard — deploy-ext targets          │
                └──────────────────────────────────────────────┘
```

The designer hosts the runtime in-process. On startup it scans
`~/.greentic/extensions/{design,bundle,deploy}/` for installed
extensions, validates each `describe.json`, and loads the WASM
component into a wasmtime `Linker` configured with five host imports
(logging, i18n, secrets, broker, http) plus WASI.

When the LLM in the designer chat loop calls `validate_card`, the
designer dispatches that to `runtime.invoke_tool("greentic.adaptive-cards", "validate_card", args_json)`,
which routes through wasmtime to the WASM component's exported function,
runs the real validation logic in `adaptive-card-core`, and returns the
result.

## Capability registry

Each extension declares **capabilities offered** and **capabilities
required** in its `describe.json`. The runtime resolves the graph at
startup and on hot-reload:

- Required `^1.2.0` matches offered `1.2.5` or `1.3.0`, but not `2.0.0`
- Multiple offerings → highest compatible semver wins
- Missing requirement → extension marked **degraded**, not crashed
- Cycle detection rejects circular dependencies on install

A degraded extension's offered caps are not registered, so dependents
fall back gracefully. The designer UI surfaces degraded state as a
warning so users can install the missing dependency without restarting.

## Permission model

Default-deny. Each extension declares what it needs in
`runtime.permissions`:

```json
{
  "runtime": {
    "permissions": {
      "network": ["https://api.openai.com/*"],
      "secrets": ["OPENAI_API_KEY"],
      "callExtensionKinds": ["bundle"]
    }
  }
}
```

On install, the user sees a prompt:

```
⚠️  Extension "adaptive-cards" v1.6.0 requests:
  - Network: openai.com
  - Secrets: OPENAI_API_KEY
  - Cross-extension: may call bundle-kind extensions
Install? [y/N]
```

Subsequent updates re-prompt only for new permissions. The runtime
enforces these at every host call.

## Trust policies

Extensions are signed with Ed25519 by the developer. Three trust
policies (configurable per install or globally):

| Policy | What it accepts |
|---|---|
| `strict` | Must be signed and countersigned by the Greentic Store |
| `normal` | Must be signed by a developer (default; matches cargo) |
| `loose` | Unsigned allowed (dev mode only — prints a warning) |

## Repository topology

The infrastructure (runtime, contract, CLI, registry clients) lives in
[`greentic-biz/greentic-designer-extensions`](https://github.com/greentic-biz/greentic-designer-extensions).
Reference extensions live next to their domain library:

- AC extension lives in [`greentic-biz/greentic-adaptive-card-mcp`](https://github.com/greentic-biz/greentic-adaptive-card-mcp)
  next to `adaptive-card-core`
- Bundle reference lives in [`greentic-biz/greentic-bundle-extensions`](https://github.com/greentic-biz/greentic-bundle-extensions)
- Future: a digital workers extension would live in its own
  `greentic-digital-workers` repo, etc.

This per-domain split means the designer never needs cross-repo private
dependency fetches at build time.

## Installing extensions

Use the [`gtdx` CLI](./gtdx-cli/):

```bash
# From a local .gtxpack file
gtdx install ./greentic.adaptive-cards-1.6.0.gtxpack

# From the Greentic Store
gtdx install greentic.adaptive-cards@^1.6

# From an OCI registry
gtdx install --registry oci://ghcr.io/greenticai/extensions \
  greentic.adaptive-cards
```

Files land at `~/.greentic/extensions/<kind>/<name>-<version>/`.

## See also

- [Adaptive Cards reference extension](./adaptive-cards/)
- [Bundle Extensions](./bundle-extensions/)
- [`gtdx` CLI reference](./gtdx-cli/)
- [Writing your own extension](./writing-extensions/)
