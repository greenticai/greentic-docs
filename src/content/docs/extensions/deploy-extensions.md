---
title: Deploy Extensions
description: Declare additional deployment targets for greentic-deployer via pluggable WASM extensions — no deployer fork required.
---

Deploy extensions let platforms, clouds, and local runtimes declare themselves as deployment targets for `greentic-deployer` without modifying the deployer itself. Each extension ships a signed `.gtxpack` archive that advertises one or more targets, exposes their credential and configuration JSON Schemas, and declares how `deploy` / `poll` / `rollback` should run.

## How it works

`greentic-deployer` ships with 12 built-in backends (AWS, Azure, GCP, Terraform, Helm, single-VM, Desktop, and six more). Deploy extensions sit on top of that core: a small WebAssembly component declares new target IDs and answers four metadata questions, while actual execution is delegated to either a built-in backend (Mode A) or to the extension itself (Mode B).

A deploy extension answers four questions about each target it offers:

1. **What targets do you provide?** — `list-targets()` returns IDs and display names.
2. **What credentials does target X need?** — `credential-schema(target-id)` returns JSON Schema draft-07.
3. **What config fields does target X accept?** — `config-schema(target-id)` returns JSON Schema.
4. **Are these credentials valid?** — `validate-credentials(target-id, json)` returns zero or more diagnostics.

The deployer loads extensions from `~/.greentic/extensions/deploy/` by default (override with `GREENTIC_DEPLOY_EXT_DIR` or `--ext-dir <PATH>`), queries these methods to drive its UI, and dispatches the actual deploy through one of two paths.

### Execution modes

| Mode | `execution.kind` | Metadata served by | `deploy` / `poll` / `rollback` runs in |
|------|------------------|--------------------|----------------------------------------|
| **A — Builtin delegated** | `"builtin"` | WASM extension | Deployer's native Rust backend (`BuiltinBackendId`) |
| **B — Full WASM** | `"wasm"` | WASM extension | WASM extension via runtime host imports (`http`, `secrets`, `storage`) |

Phase A (current) implements Mode A only. Mode B is declared in the WIT contract and returns `ExtensionError::ModeBNotImplemented` at dispatch time — it requires new host interfaces in `greentic-ext-runtime` that land in Phase B.

## Enabling the feature

The deploy extension host is feature-gated. Install the deployer with:

```bash
cargo install greentic-deployer --features extensions --locked
```

Or build from source:

```bash
cargo install --path . --features extensions --locked
```

Without the feature, the `ext` subcommand is not compiled in — existing subcommands (`aws`, `azure`, `terraform`, `single-vm`, etc.) are unaffected and the binary size is unchanged.

## Using the CLI

Once installed with `--features extensions`, three subcommands become available under `ext`:

```bash
# List installed extensions and their target contributions
greentic-deployer ext list

# Print metadata and declared targets for one extension
greentic-deployer ext info greentic.deploy-desktop

# Validate a describe.json + referenced wasm at a given path
greentic-deployer ext validate ~/.greentic/extensions/deploy/greentic.deploy-desktop
```

All `ext` subcommands accept a global `--ext-dir <PATH>` flag to override the default install directory.

## Installing a reference extension

The companion repository [`greentic-biz/greentic-deployer-extensions`](https://github.com/greentic-biz/greentic-deployer-extensions) ships `deploy-desktop` 0.1.0 as the first reference deploy extension. It declares two targets (`docker-compose-local` + `podman-local`) that route via Mode A to the deployer's built-in `desktop` backend.

To install from a cloned checkout of the extensions repo:

```bash
# 1. Build the .gtxpack bundle
(cd greentic-deployer-extensions/reference-extensions/deploy-desktop && ./build.sh)

# 2. Install into your local extension dir
mkdir -p ~/.greentic/extensions/deploy/greentic.deploy-desktop
unzip -o greentic-deployer-extensions/reference-extensions/deploy-desktop/greentic.deploy-desktop-0.1.0.gtxpack \
         -d ~/.greentic/extensions/deploy/greentic.deploy-desktop/

# 3. Confirm the deployer sees the new targets
greentic-deployer ext list
# TARGET                   EXTENSION                   EXECUTION
# docker-compose-local     greentic.deploy-desktop     builtin:desktop:docker-compose
# podman-local             greentic.deploy-desktop     builtin:desktop:podman
```

## The `deploy-desktop` reference extension

`greentic.deploy-desktop@0.1.0` declares two targets:

| Target ID | Runtime | Rollback | Execution |
|-----------|---------|----------|-----------|
| `docker-compose-local` | `docker compose` | Yes (`docker compose down`) | Mode A → `desktop` backend, handler `docker-compose` |
| `podman-local` | `podman play kube` + `podman pod` | Yes (`podman pod stop`) | Mode A → `desktop` backend, handler `podman` |

### Configuration

Both targets accept the same config shape (mirrors `DesktopConfig` in `greentic-deployer/src/desktop.rs`):

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `deploymentName` | string | required | Compose project / Podman pod name |
| `composeFile` | string | `{projectDir}/docker-compose.yml` | Path to compose YAML or Kubernetes manifest |
| `image` | string | optional | Primary image reference (informational) |
| `ports` | array of strings | `[]` | Port mappings `host:container` |
| `env` | array of strings | `[]` | Environment variables `KEY=VALUE` |
| `projectDir` | string | `$TMPDIR/greentic-desktop` | Working directory for execution |

Minimal config for a docker-compose deploy:

```json
{
  "deploymentName": "my-app",
  "composeFile": "/srv/apps/my-app/docker-compose.yml"
}
```

### Credentials

Local docker-compose and podman do not require any credentials. The credential schema accepts an empty object:

```json
{}
```

## Writing a new deploy extension

The `deploy-desktop` reference extension is intentionally minimal — copy it as a template:

1. Clone `greentic-biz/greentic-deployer-extensions` and start a new directory under `reference-extensions/`.
2. Rename the crate in `Cargo.toml` (`name`, `package.metadata.component.package`).
3. Update `describe.json` metadata, `capabilities.offered`, and `contributions.targets[]`.
4. Replace the four files in `schemas/` with your target's credential + config JSON Schemas.
5. Update `wit/world.wit` imports if your extension needs host capabilities (`secrets`, `http`).
6. Rewrite `src/lib.rs` to implement the four `targets::Guest` methods for your targets.
7. Update `build.sh` constants (`ID`, output path).
8. Run `./ci/local_check.sh` in the repo root to verify everything lands clean.

For Mode B (full WASM execution), also implement `deployment::Guest::{deploy, poll, rollback}` and request the relevant `permissions.network` / `permissions.secrets` in `describe.json`. The runtime rejects unauthorized host calls. Mode B is a Phase B surface — prerequisites are tracked in the parent migration spec linked below.

## Phase A scope

- **Unsigned artifacts.** `describe.json` has no `metadata.author.publicKey`; no `.sig` files. The deployer accepts unsigned extensions while Phase A ships; set `GREENTIC_EXT_ALLOW_UNSIGNED=1` explicitly if you enable strict mode locally.
- **Mode A only.** The WIT `deployment::{deploy, poll, rollback}` exports exist in every extension but return `ExtensionError::Internal(...)` in Phase A reference extensions. The dispatcher never calls them for Mode A targets.
- **One reference extension.** Only `deploy-desktop` ships. Additional reference extensions (`deploy-aws`, `deploy-gcp`, `deploy-azure`, `deploy-cisco`) follow in Phase B.
- **Structural CI.** CI validates `.gtxpack` structure, WIT sync, and WASM component validity. Live `docker compose up` tests require a developer machine (`scripts/smoke.sh` in the extensions repo).

## Phase B roadmap

1. **Signing.** Ed25519 keypair management, `describe.json.metadata.author.publicKey`, `.sig` sidecar in `.gtxpack`, CI signing on release tag, deployer `verify_ed25519` wiring.
2. **New host interfaces.** `host::http`, `host::secrets`, `host::storage` land in `greentic-ext-runtime` (breaking bump to `greentic:extension-host@0.2.0`).
3. **Mode B reference extension.** At least one extension implements full WASM deploy through the new host imports.
4. **Additional Mode A reference extensions.** `deploy-aws`, `deploy-gcp`, `deploy-azure` ship as thin wrappers over the deployer's cloud backends once each backend exposes target-level handler variants (EKS vs ECS vs Lambda, etc.).

## Troubleshooting

- **`unknown subcommand: ext`** — your `greentic-deployer` is pre-v0.4.53 or was built without the `extensions` feature. Reinstall with `cargo install greentic-deployer --features extensions --locked`.
- **`ext list` returns nothing** — the deployer scanned an empty `~/.greentic/extensions/deploy/`. Either unzip a `.gtxpack` there or pass `--ext-dir <path>`.
- **`unknown target` errors** — the target ID in your command doesn't match any installed extension's `contributions.targets[].id`. Run `ext list` to see what's registered.
- **Deployer accepts the extension but dispatch fails with `ModeBNotImplemented`** — your extension declares `execution.kind = "wasm"`. Phase A supports `"builtin"` only. Change `describe.json` to `execution.kind = "builtin"` and point at an existing backend.

## Further reading

- Parent migration spec: [`greenticai/greentic-deployer/docs/superpowers/specs/2026-04-17-deploy-extension-migration-design.md`](https://github.com/greenticai/greentic-deployer/blob/main/docs/superpowers/specs/2026-04-17-deploy-extension-migration-design.md) — authoritative design document (Mode A vs Mode B semantics, canonical backend strings, WIT contract usage).
- Host integration PR: [`greenticai/greentic-deployer#121`](https://github.com/greenticai/greentic-deployer/pull/121) — the `src/ext/` module, `BuiltinBackendId::Desktop` variant, and `Ext` CLI subcommand.
- Reference extension repo: [`greentic-biz/greentic-deployer-extensions`](https://github.com/greentic-biz/greentic-deployer-extensions) — companion repo for shippable `.gtxpack` artifacts.
- [Bundle Extensions](/extensions/bundle-extensions) — sibling pattern for packaging Greentic Designer output.
