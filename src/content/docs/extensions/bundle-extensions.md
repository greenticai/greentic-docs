---
title: Bundle Extensions
description: Package Greentic Designer output into deployable bundle artifacts via pluggable WASM extensions.
---

Bundle extensions package the output of Greentic Designer — a composed session of flows, adaptive card content, assets, and capability references — into a deployable bundle artifact. Each extension declares one or more **recipes** that shape the output: channel selection, embedded UI assets, i18n scope, and pack format.

Scaffold a new bundle extension with:

```bash
gtdx new my-bundle-ext --kind bundle
```

See the [`gtdx` CLI reference](./gtdx-cli/) and
[Writing an Extension](./writing-extensions/) for the full authoring
story. The rest of this page focuses on the bundle-specific surface.

## How it works

A bundle extension is a signed `.gtxpack` archive that ships:

- `describe.json` — metadata, capability declarations, config schema pointer, and an `execution` block that tells the host whether to delegate to a native built-in handler (Mode A) or instantiate the WASM component (Mode B)
- `extension.wasm` — the compiled `wasm32-wasip2` component that implements the frozen `greentic:extension-bundle@0.1.0` WIT contract
- `schemas/*.json` — JSON Schemas for recipe configs
- `i18n/*.json` — display strings

The `greentic-bundle` binary ships a feature-gated host (`--features extensions`) that discovers installed extensions under a configurable install directory (default `state/ext/`) and dispatches recipe invocations by `execution.kind`.

### Execution modes

| Mode | `execution.kind` | Runs metadata + `validate-config` | Runs `render` |
|------|------------------|------------------------------------|----------------|
| **A — Builtin delegated** | `"builtin"` | WASM extension | Native built-in handler in `greentic-bundle` |
| **B — Full WASM** | `"wasm"` | WASM extension | WASM extension |

Phase A (current) implements Mode A only. Mode B is declared in the contract and returns `ExtensionError::ModeBNotImplemented` at dispatch time.

## Enabling the feature

The bundle extension host is feature-gated. Build with:

```bash
cargo build --features extensions
```

Without the feature, the `ext` subcommand is not compiled in — existing subcommands (`wizard`, `build`, `inspect`, etc.) are unaffected and the binary size is unchanged.

## Using the CLI

Once built with `--features extensions`, five subcommands become available:

```bash
# List installed extensions and their recipes
greentic-bundle ext list

# Print metadata for one extension
greentic-bundle ext info greentic.bundle-standard

# Validate a config JSON against a recipe's JSON Schema
greentic-bundle ext validate greentic.bundle-standard standard --config ./config.json

# Render a designer session into a bundle artifact
greentic-bundle ext render greentic.bundle-standard standard \
    --config ./config.json \
    --session ./designer-session.json \
    --out ./my-bundle-0.1.0.gtpack

# Show the resolved install directory
greentic-bundle ext install-dir
```

All subcommands accept a global `--extension-dir <PATH>` flag to override the default install directory.

## Installing a reference extension

The companion repository [`greentic-biz/greentic-bundle-extensions`](https://github.com/greentic-biz/greentic-bundle-extensions) ships `bundle-standard` 0.1.0 as the first reference extension. To install it into a workspace:

```bash
wget https://github.com/greentic-biz/greentic-bundle-extensions/raw/main/reference-extensions/bundle-standard/greentic.bundle-standard-0.1.0.gtxpack

mkdir -p state/ext/greentic.bundle-standard
unzip greentic.bundle-standard-0.1.0.gtxpack -d state/ext/greentic.bundle-standard

greentic-bundle ext list
# greentic.bundle-standard 0.1.0 recipe=standard kind=Builtin { builtin_id: "standard" }
```

## The `standard` recipe

`bundle-standard` exposes a single recipe called `standard` that produces a `.gtpack` ZIP archive. Its config accepts:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `metadata.name` | string (kebab-case) | required | Pack name |
| `metadata.version` | string (semver) | required | Pack version |
| `metadata.author` | string | optional | Author name |
| `channels` | array of enum | required | Messaging providers to wire up (`slack`, `teams`, `webchat`, `telegram`, `whatsapp`, `webex`, `email`) |
| `embed_ui` | `"none"` \| `"webchat"` | `"none"` | Whether to bundle the WebChat UI assets |
| `i18n.source` | string | `"en"` | Source locale |
| `i18n.targets` | array of strings | `[]` | Auto-translation targets |
| `format` | `"gtpack-legacy"` | `"gtpack-legacy"` | Output format (Phase A: ZIP only; `"apack"` lands when Module 8 freezes) |

Minimal config:

```json
{
    "metadata": { "name": "demo-bundle", "version": "0.1.0" },
    "channels": ["webchat"],
    "format": "gtpack-legacy"
}
```

## Where the work happens (Mode A)

In Mode A the WASM extension is never instantiated for `render` — the host reads `describe.json`, sees `execution.kind="builtin"`, and routes the call to a native handler (`BuiltinRecipeId::Standard`) inside `greentic-bundle`. That handler:

1. Parses the `DesignerSession` (flows, contents, assets, capabilities)
2. Computes a deterministic 16-hex-char session id from the inputs (sha256-based, cacheable)
3. Synthesizes an ephemeral workspace under `state/ext-render/<session-id>/`: writes flows as `.ygtc` files, contents as `.json`, raw assets verbatim, and a synthesized `bundle.yaml` + `tenant.gmap`
4. Optionally runs i18n extraction + translation if `config.i18n.targets` is non-empty
5. Optionally copies WebChat UI assets if `config.embed_ui == "webchat"`
6. Archives the workspace as a `.gtpack` ZIP (deterministic byte ordering) and returns the bytes + `sha256`

The output is **reproducible**: the same input always yields the same `sha256`.

## Authoring your own bundle extension

The fastest path is `gtdx new my-bundle-ext --kind bundle`, which drops
the full layout plus a working `build.sh`, `describe.json`, and stub
`src/lib.rs`. For community-maintained examples, look under
`reference-extensions/<name>/` in the
[`greentic-bundle-extensions`](https://github.com/greentic-biz/greentic-bundle-extensions)
repository. Either way the shape is:

```
<name>/
├── Cargo.toml              [package.metadata.component] for cargo-component
├── build.sh                cargo component build → stage → zip → .gtxpack
├── describe.json           execution.kind, capabilities, recipe contributions
├── schemas/<recipe>.json   JSON Schema for recipe config
├── i18n/en.json            source locale catalog
├── src/lib.rs              `mod bindings;` + WIT Guest impls
└── tests/                  schema + round-trip smoke tests
```

The guest crate targets `wasm32-wasip2` via `cargo-component` and uses
`mod bindings;` (generated by `cargo component build`). Do not hand-roll
`wit_bindgen::generate!` — see
[Writing an Extension](./writing-extensions/#step-2--understand-the-generated-guest)
for the up-to-date pattern.

For Mode A extensions, the `bundling::render` export is a stub — the host never calls it. Only `list_recipes`, `recipe_config_schema`, `supported_capabilities`, and `validate_config` matter on the WASM side.

For Mode B (when available), `render` receives the full `DesignerSession` and must return a `BundleArtifact`. Prerequisites that must land upstream first: `greentic-ext-runtime` publication, the `host::storage` WIT interface, and any required host I/O imports.

## Non-goals (Phase A)

- Bundle extensions do **not** deploy — deployment is the concern of deploy extensions in `greentic-deployer`
- Bundle extensions do **not** author flows or cards — that happens upstream in Greentic Designer before the session reaches the extension
- Bundle extensions do **not** replace the existing `greentic-bundle wizard/build/…` subcommands — all existing behavior is unchanged with the feature disabled

## Related

- [Designer Extensions overview](./designer-extensions/)
- [Writing an Extension](./writing-extensions/) — authoring walkthrough for all four kinds
- [`gtdx` CLI reference](./gtdx-cli/)
- [Publishing Extensions](./publishing-extensions/) — ship your `.gtxpack` to Store / OCI / filesystem
- [GitHub Action](./github-action/) — automate publish from CI
- Spec: `docs/superpowers/specs/2026-04-17-bundle-extension-migration-design.md` (branch `spec/wasm-bundle-extensions` in `greentic-bundle`)
- Reference repo: [`greentic-biz/greentic-bundle-extensions`](https://github.com/greentic-biz/greentic-bundle-extensions)
- WIT contract: `greentic:extension-bundle@0.1.0` (vendored from `greentic-biz/greentic-designer-extensions`)
