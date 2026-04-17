---
title: Writing an Extension
description: Build your own design / bundle / deploy extension as a WASM Component.
---

This guide walks you through building a Greentic Designer extension
from scratch, using the
[Adaptive Cards extension](./adaptive-cards/) as a worked example.

The same recipe applies to all three extension kinds:

- **design-extension** — teaches the designer to author a content type
- **bundle-extension** — packages designer output into Application Packs
- **deploy-extension** — ships Application Packs to a target

## Prerequisites

- **Rust 1.94** + edition 2024
- **`cargo-component`** ≥ 0.20: `cargo install cargo-component --locked --version '^0.20'`
- **`wasm32-wasip1` target**: `rustup target add wasm32-wasip1`
- **Linux/macOS shell** with `zip` for the build script
- (Optional) Read the [WIT contract reference](https://github.com/greentic-biz/greentic-designer-extensions/tree/main/wit)
  before you start

## Step 1 — Scaffold the crate

```bash
mkdir -p my-extension/{src,wit,schemas,prompts,knowledge,i18n}
cd my-extension
```

Create `Cargo.toml`:

```toml
[package]
name = "my-extension"
version = "0.1.0"
edition = "2024"
license = "MIT"
publish = false

[lib]
crate-type = ["cdylib", "rlib"]
path = "src/lib.rs"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
wit-bindgen = "0.41"
wit-bindgen-rt = "0.41"
# Add any pure-Rust libs your extension wraps (must compile to wasm32-wasip1).
# Example: adaptive-card-core = { path = "../adaptive-card-core" }

[package.metadata.component]
package = "yourorg:my-extension"

[package.metadata.component.target]
path = "wit"
world = "design-extension"

[package.metadata.component.target.dependencies]
# Vendor the contract WIT files into the local `wit/` dir or reference them
# via path. See the AC extension for the canonical layout.
"greentic:extension-base" = { path = "wit/extension-base.wit" }
"greentic:extension-host" = { path = "wit/extension-host.wit" }
"greentic:extension-design" = { path = "wit/extension-design.wit" }
```

## Step 2 — Vendor the WIT contract

Copy the three contract files from
[`greentic-designer-extensions/wit/`](https://github.com/greentic-biz/greentic-designer-extensions/tree/main/wit)
into your `wit/` directory:

```bash
cp ../greentic-designer-extensions/wit/extension-{base,host,design}.wit wit/
```

Pin the contract version in a comment header so reviewers can see when
it was last synced:

```wit
// Vendored from greentic-biz/greentic-designer-extensions @ v0.6.0
// To sync: cp ../greentic-designer-extensions/wit/extension-base.wit wit/
package greentic:extension-base@0.1.0;
// ...
```

Then create your local world at `wit/world.wit`:

```wit
package yourorg:my-extension;

world design-extension {
  import greentic:extension-base/types@0.1.0;
  import greentic:extension-host/logging@0.1.0;
  import greentic:extension-host/i18n@0.1.0;
  import greentic:extension-host/secrets@0.1.0;
  import greentic:extension-host/broker@0.1.0;
  import greentic:extension-host/http@0.1.0;

  export greentic:extension-base/manifest@0.1.0;
  export greentic:extension-base/lifecycle@0.1.0;
  export greentic:extension-design/tools@0.1.0;
  export greentic:extension-design/validation@0.1.0;
  export greentic:extension-design/prompting@0.1.0;
  export greentic:extension-design/knowledge@0.1.0;
}
```

## Step 3 — Write `describe.json`

```json
{
  "apiVersion": "greentic.ai/v1",
  "kind": "DesignExtension",
  "metadata": {
    "id": "yourorg.my-thing",
    "name": "My Thing",
    "version": "0.1.0",
    "summary": "What this extension teaches the designer",
    "description": "Longer description, used in store listings.",
    "author": { "name": "Your Org", "email": "you@example.com" },
    "license": "MIT",
    "repository": "https://github.com/yourorg/my-extension",
    "keywords": ["my-thing"]
  },
  "engine": {
    "greenticDesigner": ">=0.6.0",
    "extRuntime": "^0.1.0"
  },
  "capabilities": {
    "offered": [
      { "id": "yourorg:my-thing/validate", "version": "1.0.0" }
    ],
    "required": []
  },
  "runtime": {
    "component": "extension.wasm",
    "memoryLimitMB": 64,
    "permissions": {
      "network": [],
      "secrets": [],
      "callExtensionKinds": []
    }
  },
  "contributions": {
    "schemas": ["schemas/my-schema.json"],
    "prompts": ["prompts/rules.md"],
    "knowledge": ["knowledge/"],
    "tools": [
      { "name": "validate_thing", "export": "yourorg:my-extension/tools.invoke-tool" }
    ]
  }
}
```

Validate it locally before going further:

```bash
gtdx validate .
# ✓ ./describe.json valid
```

## Step 4 — Implement the WIT exports in `src/lib.rs`

```rust
#![allow(clippy::used_underscore_items)] // wit-bindgen macro expansion

#[allow(warnings)]
mod bindings;

use bindings::exports::greentic::extension_base::{lifecycle, manifest};
use bindings::exports::greentic::extension_design::{knowledge, prompting, tools, validation};
use bindings::greentic::extension_base::types;

const PROMPT_RULES: &str = include_str!("../prompts/rules.md");

struct Component;

// ===== greentic:extension-base/manifest =====
impl manifest::Guest for Component {
    fn get_identity() -> types::ExtensionIdentity {
        types::ExtensionIdentity {
            id: "yourorg.my-thing".into(),
            version: "0.1.0".into(),
            kind: types::Kind::Design,
        }
    }
    fn get_offered() -> Vec<types::CapabilityRef> {
        vec![types::CapabilityRef {
            id: "yourorg:my-thing/validate".into(),
            version: "1.0.0".into(),
        }]
    }
    fn get_required() -> Vec<types::CapabilityRef> { vec![] }
}

// ===== greentic:extension-base/lifecycle =====
impl lifecycle::Guest for Component {
    fn init(_config_json: String) -> Result<(), types::ExtensionError> { Ok(()) }
    fn shutdown() {}
}

// ===== greentic:extension-design/tools =====
impl tools::Guest for Component {
    fn list_tools() -> Vec<tools::ToolDefinition> {
        vec![tools::ToolDefinition {
            name: "validate_thing".into(),
            description: "Validate a my-thing payload".into(),
            input_schema_json: r#"{"type":"object"}"#.into(),
            output_schema_json: None,
        }]
    }

    fn invoke_tool(name: String, args_json: String) -> Result<String, types::ExtensionError> {
        let args: serde_json::Value = serde_json::from_str(&args_json)
            .map_err(|e| types::ExtensionError::InvalidInput(e.to_string()))?;
        match name.as_str() {
            "validate_thing" => {
                // ... your real logic here ...
                Ok(serde_json::json!({ "valid": true }).to_string())
            }
            other => Err(types::ExtensionError::InvalidInput(format!("unknown tool: {other}"))),
        }
    }
}

// ===== validation, prompting, knowledge — implement similarly =====
impl validation::Guest for Component {
    fn validate_content(content_type: String, content_json: String) -> validation::ValidateResult {
        // route by content_type, run your validator
        validation::ValidateResult { valid: true, diagnostics: vec![] }
    }
}

impl prompting::Guest for Component {
    fn system_prompt_fragments() -> Vec<prompting::PromptFragment> {
        vec![prompting::PromptFragment {
            section: "rules".into(),
            content_markdown: PROMPT_RULES.into(),
            priority: 100,
        }]
    }
}

impl knowledge::Guest for Component {
    fn list_entries(_filter: Option<String>) -> Vec<knowledge::EntrySummary> { vec![] }
    fn get_entry(id: String) -> Result<knowledge::Entry, types::ExtensionError> {
        Err(types::ExtensionError::InvalidInput(format!("no entry: {id}")))
    }
    fn suggest_entries(_query: String, _limit: u32) -> Vec<knowledge::EntrySummary> { vec![] }
}

bindings::export!(Component with_types_in bindings);
```

## Step 5 — Build the `.gtxpack`

Create `build.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

cargo component build --release

WASM_PATH="target/wasm32-wasip1/release/$(basename "$PWD" | tr - _).wasm"
[ -f "$WASM_PATH" ] || { echo "ERROR: wasm not found at $WASM_PATH"; exit 1; }

STAGE=$(mktemp -d); trap "rm -rf $STAGE" EXIT
cp describe.json "$STAGE/"
cp "$WASM_PATH" "$STAGE/extension.wasm"
cp -r schemas prompts i18n "$STAGE/"
mkdir -p "$STAGE/knowledge"

OUT="$HERE/$(basename "$PWD")-$(jq -r .metadata.version describe.json).gtxpack"
TMP_ZIP="$STAGE/../tmp_$$.zip"
(cd "$STAGE" && zip -r "$TMP_ZIP" .) > /dev/null
mv "$TMP_ZIP" "$OUT"

echo "built $OUT ($(du -h "$OUT" | cut -f1))"
```

Run it:

```bash
chmod +x build.sh
./build.sh
# built ./my-extension-0.1.0.gtxpack (~500 KB)
```

## Step 6 — Test locally

```bash
TEST_HOME=$(mktemp -d)
gtdx --home "$TEST_HOME" install ./my-extension-0.1.0.gtxpack -y --trust loose
gtdx --home "$TEST_HOME" list
gtdx --home "$TEST_HOME" doctor

# Run designer pointing at this home and exercise the chat loop
GREENTIC_HOME="$TEST_HOME" greentic-designer ui
```

## Step 7 — Publish

When you're ready to share with the world:

```bash
gtdx login
gtdx publish ./my-extension-0.1.0.gtxpack
```

The publish flow signs the artifact with your developer key (registered
at first `gtdx login`), uploads it to the Greentic Store, and runs
basic validation. Users can then `gtdx install yourorg.my-thing@^0.1`.

## Bundle and deploy extensions

The same scaffolding pattern applies, with three differences:

- **Different `kind`** in `describe.json`: `BundleExtension` or
  `DeployExtension`
- **Different `contributions`** shape: `recipes` for bundle,
  `targets` for deploy (see the [WIT reference](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/wit/extension-bundle.wit))
- **Different `world.wit`** imports/exports — pull from
  `extension-bundle.wit` or `extension-deploy.wit` instead of
  `extension-design.wit`

The bundle extension reference at
[`greentic-biz/greentic-bundle-extensions`](https://github.com/greentic-biz/greentic-bundle-extensions)
is a good starting point for the bundle-kind shape.

## Troubleshooting

### "rustfmt cannot normalize bindings.rs"

`cargo-component`-generated `src/bindings.rs` has
`cfg(target_arch = "wasm32")`-gated attributes that rustfmt can't
normalize on a host build. Exclude the wasm crate from
`cargo fmt --all -- --check` in your CI:

```yaml
- run: cargo fmt -p my-extension-host-crates -- --check
```

Or just don't track `bindings.rs` — let `cargo-component` regenerate
it on every build.

### "linker error: cannot link wasm32 cdylib for native target"

The extension crate is `crate-type = ["cdylib"]` targeting
`wasm32-wasip1`. It can't be `cargo build` for the host. Use
`default-members` in your workspace `Cargo.toml` to exclude it from
default cargo invocations, and build it via `cargo component build`
(or `build.sh`).

### "404 when fetching git dep from a private GitHub repo in CI"

Move the dep into the same repo as the extension. Path deps don't
need auth. The Adaptive Cards extension followed this pattern by
moving from `greentic-designer-extensions/reference-extensions/` to
`greentic-adaptive-card-mcp/crates/adaptive-card-extension/`.

## See also

- [Designer Extensions overview](./designer-extensions/)
- [`gtdx` CLI reference](./gtdx-cli/)
- [Adaptive Cards extension](./adaptive-cards/) — full worked example
- [Bundle Extensions](./bundle-extensions/) — bundle-kind reference
- [WIT contract source of truth](https://github.com/greentic-biz/greentic-designer-extensions/tree/main/wit)
