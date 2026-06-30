---
title: Writing Extensions
description: Author Greentic .gtxpack extensions with the gtdx CLI — scaffold, describe.json, build, sign, and publish.
---

A Greentic extension is a WebAssembly component (target `wasm32-wasip2`) packaged as a
signed `.gtxpack` archive. The runtime and store load it, and `describe.json` is the
extension manifest and the single source of truth for its metadata. The authoring tool is
the [gtdx CLI](/extensions/gtdx-cli/): scaffold a project, edit the component and
`describe.json`, build, then sign and publish.

## The Authoring Path

```
gtdx new      → scaffold a project
edit          → describe.json + src/lib.rs
gtdx dev      → rebuild + pack + reinstall locally on every save
gtdx keygen   → ed25519 signing key (once)
gtdx login    → authenticate to the registry
gtdx publish  → build, pack, sign, and publish a .gtxpack
```

## 1. Scaffold

```bash
gtdx new my-extension --kind design --id com.example.my-extension
```

Pick a `--kind` for the surface your extension implements: `design`, `bundle`, `deploy`,
`provider`, `wasm-component`, `mcp`, or `llm` (these map to the
`greentic:extension-<kind>` WIT contracts — design, bundle, deploy, and provider
extensions). Run `gtdx new` with no arguments on a terminal to use the interactive
wizard, or pass `--yes` to resolve everything from flags and defaults.

The scaffold produces a buildable project:

- `describe.json` — the extension manifest (id, version, capabilities, runtime)
- `src/lib.rs` — the WASM guest exports you edit
- `wit/` — the vendored WIT contract, pinned by `.gtdx-contract.lock`
- `i18n/en.json` — user-facing strings
- `build.sh` — compiles the wasm (`cargo component build --release`)
- `ci/local_check.sh` — fmt + clippy + test + build gate
- `AGENTS.md`, `CLAUDE.md`, and `.claude/` — onboarding for AI coding agents (Claude
  Code, Codex, and similar), with pre-approved build permissions and a `/check`
  quality-gate command

The scaffolded `AGENTS.md` lists which values are placeholders to replace (id namespace,
metadata, the example export, i18n strings) and which files are generated and must never
be hand-edited.

## 2. Edit describe.json and the Component

`describe.json` is the manifest the runtime and store read. Keep the extension id and its
WIT-package form in sync across `describe.json`, `Cargo.toml`
(`package.metadata.component.package`), and `wit/world.wit`. Implement the extension's
surface in `src/lib.rs` against the vendored WIT contract.

If the extension needs a credential, declare it under `secret_requirements` in
`describe.json` — never hardcode secrets in `src/lib.rs`. The runtime resolves and injects
the secret at execution time.

Do not hand-edit generated or managed files: the `sha256` placeholders in `describe.json`
(filled in by `gtdx publish`), `.gtdx-contract.lock`, `wit/deps/`, and the generated
`src/bindings.rs`.

## 3. Build and Iterate

```bash
gtdx dev          # watch: rebuild, pack, and reinstall to the local registry on save
gtdx dev --once   # build + install once, then exit (CI-friendly)
```

`gtdx dev` runs the inner loop, reinstalling the `.gtxpack` into your local Greentic home
on every change so you can test against a running designer/runtime.

## 4. Validate Before Shipping

Run the manifest and toolchain checks — these catch a broken `describe.json` that
compiles fine but the runtime or store will reject:

```bash
gtdx doctor            # environment: cargo, cargo-component, wasm32-wasip2 target
gtdx validate          # describe.json against the JSON Schema
gtdx lint              # describe.json cross-field invariants
gtdx lint --publish    # also rejects placeholder 0000… sha256 (E_SHA256_ZERO)
```

The scaffold also ships `ci/local_check.sh` (fmt + clippy `-D warnings` + test + build)
and a `/check` command for Claude Code — run the quality gate before every commit and
before publishing.

## 5. Sign and Publish

Generate a signing key once, log in to your registry, then publish a signed `.gtxpack`:

```bash
gtdx keygen --out ~/.greentic/keys/my-key.key
gtdx login --registry store.greentic.cloud
gtdx publish --registry store.greentic.cloud --sign --key-id my-key
```

Use `gtdx publish --dry-run` to build, pack, and validate without writing to the registry.
See [Publishing Extensions](/extensions/publishing-extensions/) for the distribution and
trust details, and the [gtdx CLI reference](/extensions/gtdx-cli/) for every command and
flag.

## What Belongs in an Extension

An extension should carry everything needed to install and run its capability:

- the WASM component that implements the capability's operations
- a valid `describe.json` manifest (the single source of truth for metadata)
- declared `secret_requirements` for any credentials it needs
- user-facing strings in `i18n/`
- the vendored WIT contract under `wit/`
</content>
