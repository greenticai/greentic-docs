---
title: Writing an Extension
description: Build a design / bundle / deploy / provider extension with gtdx, cargo-component, and a WASM component model guest.
---

This is the canonical "day in the life" walkthrough for writing a
Greentic extension. It covers all four extension kinds — **design**,
**bundle**, **deploy**, **provider** — using the scaffold that
[`gtdx new`](./gtdx-cli/) generates and the
[`cargo-component`](https://github.com/bytecodealliance/cargo-component)
build tool.

If you want the conceptual overview of what each kind does, read
[Designer Extensions](./designer-extensions/) first and come back here
once you are ready to write code.

## Prerequisites

- **Rust 1.94+** with edition 2024 (match the rest of the Greentic
  workspace)
- **`cargo-component` ≥ 0.21** — the component-model build tool that
  generates the WIT bindings for you:

  ```bash
  cargo install --locked cargo-component
  ```

- **`wasm32-wasip2` target**:

  ```bash
  rustup target add wasm32-wasip2
  ```

- **`gtdx` CLI** — see the [gtdx CLI reference](./gtdx-cli/) for
  install instructions. Run `gtdx doctor` once to sanity-check your
  toolchain.

## Step 1 — Scaffold a new extension

`gtdx new` handles everything the old manual recipe required:
`Cargo.toml`, vendored WIT under `wit/deps/greentic/`, the
`describe.json`, a `build.sh`, a ready-to-fill `src/lib.rs`, a contract
lock file, and an `i18n/en.json`.

```bash
gtdx new my-ext --kind design --author "Your Name" -y --no-git
cd my-ext
```

Supported `--kind` values:

| Kind | Purpose | Required exports |
| --- | --- | --- |
| `design` | Teach the designer a new content type | manifest, lifecycle, tools, validation, prompting, knowledge |
| `bundle` | Package designer output into Application Packs | manifest, lifecycle, recipes, bundling |
| `deploy` | Ship Application Packs to a target | manifest, lifecycle, targets, deployment |
| `provider` | Package a messaging / events runtime | manifest, lifecycle, messaging and/or event-source and/or event-sink |

The scaffold preflight checks that `cargo`, `cargo-component`, and the
`wasm32-wasip2` target are all available before writing any files. If
any fail, fix them first — the scaffold refuses to run on a broken
toolchain.

After a successful run you will see:

```
Scaffolded design extension at ./my-ext (14 files, contract 0.2.0).

Next steps:
  cd my-ext
  gtdx dev        # watch, rebuild, reinstall
  gtdx publish    # pack to dist/
```

### Generated tree

```
my-ext/
├── .gitignore
├── .gtdx-contract.lock        # pins the WIT bundle by sha256
├── Cargo.toml                 # crate-type = ["cdylib"], wit-bindgen-rt dep
├── README.md
├── build.sh                   # `cargo component build --release` + dist/
├── ci/
│   └── local_check.sh
├── describe.json              # store-facing manifest (schema v1)
├── i18n/
│   └── en.json
├── prompts/                   # design kind only
│   └── system.md
├── src/
│   └── lib.rs                 # TODO-stubbed guest — this is what you fill in
└── wit/
    ├── deps/greentic/
    │   ├── extension-base/world.wit
    │   ├── extension-host/world.wit
    │   └── extension-<kind>/world.wit
    └── world.wit              # your crate's local world
```

Bundle, deploy, and provider kinds drop the `prompts/` directory and
swap in the matching `extension-<kind>` WIT package.

## Step 2 — Understand the generated guest

Open `src/lib.rs`. For a `design` extension you will see this pattern:

```rust
// Design extension guest for com.example.my-ext.
//
// This scaffold implements every export required by the extension-design
// contract as a TODO stub. Replace each body with real logic before shipping.

#[allow(warnings)]
mod bindings;

use bindings::exports::greentic::extension_base::{lifecycle, manifest};
use bindings::exports::greentic::extension_design::{knowledge, prompting, tools, validation};
use bindings::greentic::extension_base::types;

struct Component;
```

The key lines, from top to bottom:

- **`#[allow(warnings)] mod bindings;`** — `cargo-component` generates
  `src/bindings.rs` at build time from `wit/world.wit` plus the vendored
  deps under `wit/deps/greentic/`. You do **not** commit `bindings.rs`,
  you do **not** call `wit_bindgen::generate!` by hand, and you do
  **not** edit the generated file. If it is missing, run
  `cargo component build` once to produce it.
- **`use bindings::exports::...`** — the interfaces your extension
  implements (what the host calls into).
- **`use bindings::greentic::extension_base::types;`** — shared types
  (`ExtensionIdentity`, `CapabilityRef`, `ExtensionError`, `Diagnostic`).
  They come from `import` interfaces; you consume, not implement, them.
- **`struct Component;`** — a zero-sized marker type. `cargo-component`
  wires the `bindings::export!` macro at the bottom to this type.

### Filling in the TODOs

Each required export gets its own `impl ...::Guest for Component` block.
For the design kind there are **six**:

```rust
// ---- extension-base/manifest ----
impl manifest::Guest for Component {
    fn get_identity() -> types::ExtensionIdentity {
        types::ExtensionIdentity {
            id: "com.example.my-ext".to_string(),
            version: "0.1.0".to_string(),
            kind: types::Kind::Design,
        }
    }

    fn get_offered() -> Vec<types::CapabilityRef> {
        // TODO: list the capability refs this extension advertises,
        // e.g. [{ id: "yourorg:my-ext/validate", version: "1.0.0" }]
        Vec::new()
    }

    fn get_required() -> Vec<types::CapabilityRef> {
        Vec::new()
    }
}

// ---- extension-base/lifecycle ----
impl lifecycle::Guest for Component {
    fn init(_config_json: String) -> Result<(), types::ExtensionError> {
        // TODO: read configuration from `config_json` and initialize state.
        Ok(())
    }

    fn shutdown() {
        // TODO: release any resources the extension owns.
    }
}

// ---- extension-design/tools ----
impl tools::Guest for Component {
    fn list_tools() -> Vec<tools::ToolDefinition> {
        // TODO: return the list of tools the designer may invoke.
        Vec::new()
    }

    fn invoke_tool(
        name: String,
        _args_json: String,
    ) -> Result<String, types::ExtensionError> {
        // TODO: dispatch on `name` and return a JSON-encoded result.
        Err(types::ExtensionError::InvalidInput(format!(
            "unknown tool: {name}"
        )))
    }
}

// ---- extension-design/validation ----
impl validation::Guest for Component {
    fn validate_content(
        _content_type: String,
        _content_json: String,
    ) -> validation::ValidateResult {
        validation::ValidateResult { valid: true, diagnostics: Vec::new() }
    }
}

// ---- extension-design/prompting ----
impl prompting::Guest for Component {
    fn system_prompt_fragments() -> Vec<prompting::PromptFragment> {
        Vec::new()
    }
}

// ---- extension-design/knowledge ----
impl knowledge::Guest for Component {
    fn list_entries(_category_filter: Option<String>) -> Vec<knowledge::EntrySummary> {
        Vec::new()
    }

    fn get_entry(id: String) -> Result<knowledge::Entry, types::ExtensionError> {
        Err(types::ExtensionError::InvalidInput(format!("unknown entry: {id}")))
    }

    fn suggest_entries(_query: String, _limit: u32) -> Vec<knowledge::EntrySummary> {
        Vec::new()
    }
}

bindings::export!(Component with_types_in bindings);
```

The last line wires the exports through the component-model ABI. It is
the one non-obvious piece of the pattern, so leave it exactly as the
scaffold produced it.

Bundle, deploy, and provider kinds share the `manifest` + `lifecycle`
blocks verbatim; only the kind-specific exports differ — see
[Kind-specific notes](#kind-specific-notes) below.

## Step 3 — Iterate with `gtdx dev`

Once you have meaningful implementations, the developer inner-loop is a
single command:

```bash
gtdx dev
```

`gtdx dev` runs a watcher that:

1. Calls `cargo component build` on any change to `src/`, `wit/`,
   `Cargo.toml`, or `describe.json` (default debounce 500 ms).
2. Stages the resulting `.wasm` + `describe.json` into a `.gtxpack`
   archive.
3. Installs the pack into `$GREENTIC_HOME` so the designer picks it up
   on its next hot-reload tick.

Useful flags:

- `--once` — build + pack + install a single time, then exit. Ideal for
  CI smoke runs.
- `--no-install` — build and pack only; do not touch the user registry.
  Combine with `--once` for a pure "does it compile and pack?" check.
- `--release` — produce an optimized wasm (dev mode defaults to debug
  for speed).
- `--format json` — structured event stream suitable for a watch-mode
  UI or CI log. Each line is a JSON object (`build`, `pack`, `install`,
  `error`).
- `--force-rebuild` — runs `cargo clean -p <crate>` first when you
  suspect a stale bindings file.

See [gtdx CLI — `gtdx dev`](./gtdx-cli/) for the full flag list.

## Step 4 — Publish

Before you go public, smoke-test the publish flow against the local
registry (`$GREENTIC_HOME/registries/local`):

```bash
gtdx publish --registry local
```

This builds a release `.gtxpack`, validates `describe.json` against the
v1 JSON Schema, copies the artifact into `./dist/`, and writes it into
the local registry so you can `gtdx install` from the same machine.

When you are ready to ship it to the world, see
[Publishing Extensions](./publishing-extensions/) for the full story —
keys, signing, remote registries, OCI, and the
[publisher GitHub Action](./github-action/).

## Kind-specific notes

The four kinds share the scaffolding pattern above. What changes is
which WIT package the scaffold vendors, which exports you must
implement, and (for provider) what goes in `describe.json`.

### Design extensions

**Required exports:** `manifest`, `lifecycle`, `tools`, `validation`,
`prompting`, `knowledge`.

**Imported facets:** `logging`, `i18n`, `secrets`, `broker`, `http`.
These are host-provided — your guest calls them through
`bindings::greentic::extension_host::*` after `cargo component build`
has generated the bindings.

A design extension is what the designer LLM reasons against: `tools`
exposes callable actions, `validation` grades designer-proposed
content, `prompting` contributes system-prompt fragments (the
`prompts/system.md` file is the natural place to author them), and
`knowledge` advertises reference material the LLM can retrieve.

Full concept page: [Designer Extensions](./designer-extensions/).
Worked example: [Adaptive Cards](./adaptive-cards/).

### Bundle extensions

**Required exports:** `manifest`, `lifecycle`, `recipes`, `bundling`.

Bundle extensions run during the build step that turns a designer
session into a `.gtbundle`. The host calls `list_recipes()` to
enumerate build targets, `recipe_config_schema()` to collect
per-recipe configuration, then hands the final
`bundling::DesignerSession` to `render()` which returns a
`BundleArtifact` (bytes + metadata).

Typical shape:

```rust
impl bundling::Guest for Component {
    fn validate_config(
        _recipe_id: String,
        _config_json: String,
    ) -> Vec<types::Diagnostic> {
        Vec::new()
    }

    fn render(
        recipe_id: String,
        _config_json: String,
        _session: bundling::DesignerSession,
    ) -> Result<bundling::BundleArtifact, types::ExtensionError> {
        // Turn the session into your bundle format.
        Err(types::ExtensionError::Internal(format!(
            "render not implemented for recipe: {recipe_id}"
        )))
    }
}
```

Full concept page: [Bundle Extensions](./bundle-extensions/).

### Deploy extensions

**Required exports:** `manifest`, `lifecycle`, `targets`, `deployment`.

Deploy extensions ship built bundles to a target (single VM, desktop,
Kubernetes, a managed cloud). The state machine the host expects:

- `targets::list_targets()` advertises what the extension can deploy to.
- `targets::credential_schema()` + `targets::config_schema()` drive the
  wizard UI.
- `deployment::deploy(DeployRequest)` launches the work and returns a
  `DeployJob` handle.
- `deployment::poll(job_id)` is called on a timer until the job reaches
  a terminal state.
- `deployment::rollback(job_id)` is optional but strongly recommended
  for anything that mutates production.

Because deploys often take minutes, all three methods must be
idempotent and safe to retry. Persist state keyed on `job_id` via the
host secrets / state facets — do not keep it in process memory.

Full concept page: [Deploy Extensions](./deploy-extensions/).

### Provider extensions (4th kind)

**New in Wave A.** A provider extension packages a messaging or events
runtime as a `.gtpack` plus a tiny shim guest that advertises which
channels the pack implements.

**Required exports** (for the default `messaging-only-provider` world):
`manifest`, `lifecycle`, `messaging`.

Provider has **six possible worlds**, selected by editing
`wit/world.wit` after scaffolding:

| World | Exports (beyond manifest + lifecycle) |
| --- | --- |
| `messaging-only-provider` (default) | `messaging` |
| `event-source-only-provider` | `event-source` |
| `event-sink-only-provider` | `event-sink` |
| `messaging-and-event-source-provider` | `messaging`, `event-source` |
| `messaging-and-event-sink-provider` | `messaging`, `event-sink` |
| `full-provider` | `messaging`, `event-source`, `event-sink` |

All six live in `wit/deps/greentic/extension-provider/world.wit`; point
your local `world.wit` at the one you need and add the matching
`impl ...::Guest for Component` blocks.

`describe.json` for a provider kind has one extra block that the other
kinds do not have — `runtime.gtpack`:

```json
{
  "kind": "ProviderExtension",
  "runtime": {
    "component": "extension.wasm",
    "permissions": { "network": [], "secrets": [], "callExtensionKinds": [] },
    "gtpack": {
      "file": "REPLACE_WITH_YOUR.gtpack",
      "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
      "pack_id": "com.example.my-ext",
      "component_version": "0.1.0"
    }
  }
}
```

The `runtime.gtpack` block is **required** when `kind ==
"ProviderExtension"` and is rejected at deserialize time for any other
kind. Before you run `gtdx publish`, replace the placeholder `file` +
`sha256` with the real pack — the publisher reads the file, verifies
the hash, and embeds it in the `.gtxpack` alongside the shim wasm.

Full concept page: [Provider Extensions](./provider-extensions/).

## Tips and troubleshooting

- **Toolchain issues:** run `gtdx doctor` before digging into build
  errors. It checks `cargo`, `cargo-component`, `wasm32-wasip2`, the
  contract lock, and your registry credentials.
- **Schema-only iteration:** `gtdx validate .` runs a static schema
  check on `describe.json` without building. Useful in a tight edit
  loop before you even touch `src/lib.rs`.
- **CI-safe build:** `gtdx dev --once --no-install` builds, packs, and
  exits — without writing anything to the user registry. Drop this into
  `ci/local_check.sh` (the scaffold ships with one already).
- **`bindings.rs` not found:** the file is generated, not committed.
  Run `cargo component build` once to produce it, or add the project
  root to your IDE's watcher.
- **rustfmt on `bindings.rs`:** the generated file uses
  `cfg(target_arch = "wasm32")`-gated attributes that rustfmt cannot
  normalize on a host build. Keep it excluded from `cargo fmt`; the
  scaffold's `.gitignore` already omits `target/` so the generated
  bindings never end up in git.
- **Native `cargo build` fails:** the crate is `crate-type =
  ["cdylib"]` targeting `wasm32-wasip2`. Always go through
  `cargo component build` (or `build.sh`, or `gtdx dev`), never
  `cargo build`.

## Related

- [gtdx CLI reference](./gtdx-cli/)
- [Publishing Extensions](./publishing-extensions/)
- [Provider Extensions](./provider-extensions/)
- [Designer Extensions](./designer-extensions/) — design kind deep dive
- [Bundle Extensions](./bundle-extensions/) — bundle kind deep dive
- [Deploy Extensions](./deploy-extensions/) — deploy kind deep dive
- [Adaptive Cards](./adaptive-cards/) — full worked example
- [WIT contract source of truth](https://github.com/greentic-biz/greentic-designer-extensions/tree/main/wit)
