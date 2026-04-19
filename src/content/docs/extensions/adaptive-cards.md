---
title: Adaptive Cards Extension
description: The first canonical Greentic Designer extension — wraps adaptive-card-core and exposes 8 tools through the WIT contract.
---

`greentic.adaptive-cards@1.6.0` is the first canonical
[design-extension](./designer-extensions/) for Greentic Designer. It
wraps the [`adaptive-card-core`](https://github.com/greentic-biz/greentic-adaptive-card-mcp)
library as a WebAssembly Component and exposes 8 tools to the
designer's chat loop.

## What it gives the designer

When installed, the LLM in the designer chat loop can call:

| Tool | Purpose |
|---|---|
| `validate_card` | Schema v1.6 validation + accessibility scoring + optional host-compat check, in one call |
| `analyze_card` | Element / action counts, nesting depth, duplicate-ID detection |
| `check_accessibility` | WCAG-style score 0-100 with issues + fix hints |
| `optimize_card` | Auto-fix accessibility / performance / modernize categories |
| `transform_card` | Version downgrade and/or host adaptation |
| `template_card` | Convert static card to `${expression}` template + sample data |
| `data_to_card` | Auto-generate card from data shape (table / factset / list / chart) |
| `check_host_compat` | Per-host (Teams / Outlook / WebChat / Webex / ...) compat report |

Plus prompt fragments and (placeholder) knowledge base entries that the
designer aggregates into its system prompt.

## Where it lives

- **Source**: [`greentic-biz/greentic-adaptive-card-mcp`](https://github.com/greentic-biz/greentic-adaptive-card-mcp)
  (path: `crates/adaptive-card-extension/`)
- **Built artifact**: `greentic.adaptive-cards-1.6.0.gtxpack` (~1 MB)
- **Same repo also ships**:
  - `adaptive-card-core` (the pure Rust library this extension wraps)
  - `adaptive-card-mcp` (a stdio MCP server that exposes the same tools
    to external LLM clients like Claude Code, Cursor, Windsurf)

## Building the `.gtxpack`

```bash
git clone git@github.com:greentic-biz/greentic-adaptive-card-mcp.git
cd greentic-adaptive-card-mcp
crates/adaptive-card-extension/build.sh
ls -lh crates/adaptive-card-extension/greentic.adaptive-cards-1.6.0.gtxpack
```

Prerequisites: Rust 1.94, `cargo-component` ≥ 0.20, `wasm32-wasip2`
target. The build script wraps `cargo component build --release` and
zips the output with `describe.json`, schemas, prompts, and i18n into
the final `.gtxpack`.

### From scratch via `gtdx`

If you want to build a similar design-extension from scratch, start with:

```bash
gtdx new my-ac-ext --kind design
```

and implement the same `greentic:extension-design@0.1.0` exports. See
[Writing an Extension](./writing-extensions/) for the full walkthrough,
and [Publishing Extensions](./publishing-extensions/) for the distribute
story.

## Installing

```bash
gtdx install ./greentic.adaptive-cards-1.6.0.gtxpack -y --trust loose
```

(Use `--trust normal` once the artifact is signed and you have the
developer's public key configured.)

Files install at:

```
~/.greentic/extensions/design/greentic.adaptive-cards-1.6.0/
├── describe.json
├── extension.wasm
├── schemas/adaptive-card-v1.6.json
├── prompts/{rules,examples}.md
├── knowledge/
└── i18n/en.json
```

## Live invocation example

What the designer's chat loop sees when it calls `validate_card` on a
minimal v1.6 card:

```jsonc
// runtime.invoke_tool("greentic.adaptive-cards", "validate_card",
//   r#"{"card":{"type":"AdaptiveCard","version":"1.6"}}"#)
{
  "valid": true,
  "accessibility": {
    "score": 95,
    "issues": [
      {
        "rule": "missing-speak",
        "severity": "warning",
        "path": "",
        "message": "Add a 'speak' field at the root for screen readers"
      }
    ]
  },
  "card_version": "1.6",
  "host_compat": null,
  "schema_errors": [],
  "suggestions": [
    "[a11y/missing-speak] Add a 'speak' field at the root summarising the card content"
  ]
}
```

This is real `adaptive-card-core` output dispatched through wasmtime —
not a stub.

## Capabilities offered

```json
{
  "capabilities": {
    "offered": [
      { "id": "greentic:adaptive-cards/schema",      "version": "1.6.0" },
      { "id": "greentic:adaptive-cards/validate",    "version": "1.0.0" },
      { "id": "greentic:adaptive-cards/transform",   "version": "1.0.0" },
      { "id": "greentic:adaptive-cards/host-compat", "version": "1.0.0" }
    ],
    "required": []
  }
}
```

A flow extension that needs to validate embedded cards can declare
`greentic:adaptive-cards/validate@^1.0` as a required cap and call into
this extension via the host broker.

## Bundled with the designer

The designer ships with this `.gtxpack` embedded via `include_bytes!`.
On first run, if no AC extension is installed at the user's
`~/.greentic/extensions/design/`, the designer auto-extracts the
bundled copy. Disable with `DESIGNER_NO_BUNDLED_FALLBACK=1` or via
the CLI flag if you prefer to install your own version manually.

## Known v1.6.0 limitations

The MVP wires 4 tools to real `adaptive-card-core` logic and stubs 4
others:

| Tool | Status |
|---|---|
| `validate_card` | ✅ real |
| `analyze_card` | ✅ real |
| `check_accessibility` | ✅ real |
| `check_host_compat` | ✅ real |
| `optimize_card` | ⚠️ stub — returns `"not_implemented_in_v1_6"` |
| `transform_card` | ⚠️ stub |
| `template_card` | ⚠️ stub |
| `data_to_card` | ⚠️ stub |

The next AC ext release wires the remaining four through the same
adaptive-card-core API.

## Knowledge base

Empty in v1.6.0. The hooks (`list_examples`, `get_example`,
`suggest_layout`) return empty / not-found responses. Curated advanced
samples ship in a follow-up.

## See also

- [`adaptive-card-core` library docs](https://github.com/greentic-biz/greentic-adaptive-card-mcp/tree/main/crates/adaptive-card-core)
- [`adaptive-card-mcp` MCP server](https://github.com/greentic-biz/greentic-adaptive-card-mcp/tree/main/crates/adaptive-card-mcp)
  for using the same tools from external LLM clients
- [Designer Extensions overview](./designer-extensions/)
- [Writing your own extension](./writing-extensions/)
- [Publishing Extensions](./publishing-extensions/)
- [`gtdx` CLI reference](./gtdx-cli/)
