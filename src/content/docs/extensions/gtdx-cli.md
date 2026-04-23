---
title: gtdx CLI
description: Command-line tool for scaffolding, developing, packaging, and publishing Greentic Designer extensions.
---

`gtdx` is the single CLI authors use to scaffold, develop, test, and publish
Greentic Designer extensions. Four scaffold kinds, three registry backends,
one binary.

It ships from the
[`greentic-biz/greentic-designer-extensions`](https://github.com/greentic-biz/greentic-designer-extensions)
workspace (currently v0.2.x). The runtime side lives in
`greentic-ext-runtime`; the designer process loads it in-process and the CLI
talks to the same installed tree.

## Install

Published to crates.io is on the Phase 3 roadmap. Until then, install from
source:

```bash
cargo install --locked \
  --git https://github.com/greentic-biz/greentic-designer-extensions.git \
  greentic-ext-cli

gtdx version
gtdx --help
```

The binary is called `gtdx`. The crate is `greentic-ext-cli`.

## Quick start

```bash
# 1. Scaffold a new Design extension
gtdx new my-cards --kind design --id com.acme.my-cards

# 2. Iterate — watch mode rebuilds + reinstalls on file save
cd my-cards
gtdx dev

# 3. Publish to an OCI registry (GitHub Container Registry shown)
gtdx publish \
  --registry oci://ghcr.io/acme/extensions \
  --sign --key-id release-2026
```

First-run `gtdx new` renders the project, seeds WIT contract files, writes
`.gtdx-contract.lock`, and runs `git init`. `gtdx dev` debounces file events,
runs `cargo component build --target wasm32-wasip2`, packs a `.gtxpack`, and
installs to `$GREENTIC_HOME/extensions/<kind>/<name>-<version>/`. `gtdx
publish` builds in release mode, signs if asked, writes a delivery receipt,
and pushes to the registry.

## Global flags

| Flag | Env | Default | Purpose |
|------|-----|---------|---------|
| `--home <PATH>` | `GREENTIC_HOME` | `~/.greentic` | Root for config, credentials, installed extensions, keys. |

Every subcommand accepts `--home`. Point it at a throwaway dir to sandbox
experiments:

```bash
TEST_HOME=$(mktemp -d)
gtdx --home "$TEST_HOME" install ./my-ext.gtxpack -y --trust loose
GREENTIC_HOME="$TEST_HOME" greentic-designer ui
rm -rf "$TEST_HOME"
```

## Authoring

### `gtdx new <NAME>`

Scaffold a new extension project.

```
gtdx new [OPTIONS] <NAME>
```

| Flag | Default | Notes |
|------|---------|-------|
| `-k, --kind <KIND>` | `design` | `design` \| `bundle` \| `deploy` \| `provider` |
| `-i, --id <ID>` | `com.example.<name>` | Reverse-DNS id. Must match `^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$`. |
| `-v, --version <VERSION>` | `0.1.0` | Semver. |
| `--author <AUTHOR>` | git `user.name` | Written to `Cargo.toml` + `describe.json`. |
| `--license <LICENSE>` | `Apache-2.0` | SPDX id. |
| `--no-git` | off | Skip `git init`. |
| `--dir <DIR>` | `./<name>` | Output directory. |
| `--force` | off | Delete + recreate the target if it exists. |
| `-y, --yes` | off | Skip interactive prompts. |

Files written:

```
<name>/
├── Cargo.toml              # cargo-component crate setup
├── describe.json           # extension manifest (unsigned stub)
├── README.md               # kind-specific README
├── build.sh                # one-shot build (chmod 0755 on Unix)
├── ci/local_check.sh       # fmt + clippy + build gate
├── src/lib.rs              # WIT exports stub for the chosen kind
├── wit/
│   └── deps/greentic/
│       ├── extension-base/world.wit
│       ├── extension-host/world.wit
│       ├── runtime-side/world.wit
│       └── extension-<kind>/world.wit
└── .gtdx-contract.lock     # SHA-256s of pinned WIT files
```

Preflight checks run first and fail hard if `cargo` or a writable target dir
is missing. Missing `cargo-component` and `wasm32-wasip2` are warnings (you
can install them later).

Example:

```bash
gtdx new bundle-openshift --kind bundle \
  --id com.redhat.bundle-openshift \
  --author "Platform Team" \
  --license MIT
```

### `gtdx dev`

Developer inner loop. Rebuilds, packs, and installs on every source change.

```
gtdx dev [OPTIONS]
```

| Flag | Default | Notes |
|------|---------|-------|
| `--once` | off | Build + install once and exit. Mutually exclusive with `--watch`. CI-friendly. |
| `--watch` | default mode | Continuous file watcher. |
| `--no-install` | off | Build and pack, skip the install step. |
| `--release` | off (debug) | Build with `--release`. |
| `--install-to <PATH>` | unused | Reserved; overrides the install target dir. |
| `--ext-id <ID>` | from describe | Reserved; future multi-variant dev. |
| `--force-rebuild` | off | Reserved; `cargo clean -p <crate>` before build. |
| `--debounce-ms <MS>` | `500` (`1000` on Windows) | File-watch debounce window. |
| `--manifest <PATH>` | `./Cargo.toml` | Path to project's `Cargo.toml`. |
| `--log <LEVEL>` | `info` | Reserved; log filter. |
| `--format <FORMAT>` | `human` | `human` \| `json` (JSONL lifecycle events). |

Reserved flags are parsed today but plumbed into the build/install pipeline
in a later Phase 1 track. They stay opt-in, so scripts that set them don't
break once they light up.

JSONL event stream when `--format json`. Each line is one object with a
discriminator field `event`:

```json
{"event":"ready","ext_id":"com.acme.my-cards","ext_version":"0.1.0","kind":"design","registry":"local","watched_files":7}
{"event":"change_detected","path":"src/lib.rs"}
{"event":"debouncing","window_ms":500}
{"event":"build_start","profile":"debug"}
{"event":"build_ok","duration_ms":842,"wasm_size":412368}
{"event":"pack_ok","pack_name":"com.acme.my-cards-0.1.0.gtxpack","size":421120}
{"event":"install_ok","registry":"local","version":"0.1.0"}
{"event":"idle","last_build_ok":true}
```

All variants: `ready`, `change_detected`, `debouncing`, `build_start`,
`build_ok`, `build_failed`, `pack_ok`, `install_ok`, `install_skipped`,
`idle`, `shutdown`, `error`. CI consumers should match on `event` rather
than positional fields — additive fields may appear in future releases.

Example CI one-shot:

```bash
gtdx dev --once --release --no-install --format json \
  | tee dev-events.jsonl
```

### `gtdx publish`

Build, validate, and push a `.gtxpack` to a registry.

```
gtdx publish [OPTIONS]
```

| Flag | Default | Notes |
|------|---------|-------|
| `-r, --registry <URI>` | `local` | `local`, `file://<path>`, `oci://<host>/<ns>[/<artifact>]`, or a named entry from `config.toml`. |
| `--version <VERSION>` | from describe | Override describe.json version for this run (CI bumps). |
| `--dry-run` | off | Build + pack + validate; do not write to the registry. |
| `--sign` | off | Sign the describe.json inside the pack. |
| `--key-id <ID>` | none | Signing key id (requires `--sign`). |
| `--trust <POLICY>` | `loose` | `loose` \| `normal` \| `strict`. Controls signature verification at install time. |
| `--dist <DIR>` | `./dist` | Copy the built artifact here in addition to publishing. |
| `--force` | off | Overwrite an existing version in the target registry. |
| `--release` | `true` | `cargo component build --release` (flip off with `--release=false`). |
| `--verify-only` | off | Skip build; only check the slot is free. Fast CI pre-flight. |
| `--manifest <PATH>` | `./Cargo.toml` | Path to the project's `Cargo.toml`. |
| `--format <FORMAT>` | `human` | `human` \| `json`. |
| `--oci-token <TOKEN>` | env fallback | Bearer / PAT for `oci://...`. Falls back in order to `GHCR_TOKEN`, `GITHUB_TOKEN`, `OCI_TOKEN`, then anonymous. |

Registry URI forms:

- `local` — writes under `$GREENTIC_HOME/registries/local/`. The default;
  good for trying the pipeline with no network.
- `file://<path>` — any local filesystem directory.
- `<name>` — a named entry from `~/.greentic/config.toml` (Greentic Store
  HTTP backend). Manage with `gtdx registries`.
- `oci://<host>/<namespace>[/<artifact>]` — OCI 1.1 Artifact push. Works
  with GHCR, Docker Hub, any OCI-compliant registry. Authenticate with
  `--oci-token` or the env fallback chain above.

`--format json` emits exactly one JSON object, shaped per event:

```json
{"event":"dry_run","artifact":"./dist/com.acme.my-cards-0.2.0.gtxpack","sha256":"…","registry":"local"}
{"event":"verify_only","ext_id":"com.acme.my-cards","version":"0.2.0","registry":"oci://ghcr.io/acme/extensions"}
{"event":"published","ext_id":"com.acme.my-cards","version":"0.2.0","sha256":"…","artifact":"./dist/…","receipt_path":"./dist/…receipt.json","signed":true,"registry_url":"oci://ghcr.io/acme/extensions/com.acme.my-cards:0.2.0"}
```

Exit code maps to the failure class (see [Exit codes](#exit-codes-publish)).

Examples:

```bash
# Local dry-run — inspect the artifact before wiring a real registry.
gtdx publish --dry-run

# Push to GHCR, signed, with version overridden from a CI workflow.
gtdx publish \
  --registry oci://ghcr.io/acme/extensions \
  --version "${GITHUB_REF_NAME#v}" \
  --sign --key-id release-2026 \
  --format json

# Cheap pre-flight: fail early if 0.2.0 already exists.
gtdx publish --registry store --version 0.2.0 --verify-only
```

## Consumption

### `gtdx install <TARGET>`

Install from a `.gtxpack` file or from a named registry.

```
gtdx install [OPTIONS] <TARGET>
```

| Flag | Default | Notes |
|------|---------|-------|
| `--version <VERSION>` | — | Required for registry installs, ignored for local paths. |
| `--registry <NAME>` | `[default].registry` | Pick a non-default registry from config. |
| `-y, --yes` | off | Skip the permission prompt. Use in CI after review. |
| `--trust <POLICY>` | from config | `strict` \| `normal` \| `loose`. Overrides `[default].trust-policy`. |

Targets:

- Local file: `./my-ext.gtxpack` — parses `<name>-<version>.gtxpack`.
- Registry name: `com.acme.my-cards` — requires `--version`.

Files install to `$GREENTIC_HOME/extensions/<kind>/<id>-<version>/`.

```bash
# Local dev install — loose trust for unsigned dev builds.
gtdx install ./dist/com.acme.my-cards-0.1.0.gtxpack -y --trust loose

# From the Greentic Store.
gtdx install com.acme.my-cards --version 1.6.0

# From a non-default registry.
gtdx install com.acme.my-cards --version 1.6.0 --registry enterprise
```

### `gtdx list`

Show installed extensions grouped by kind.

```
gtdx list [--kind design|bundle|deploy|provider|all]
```

`--kind all` (default) prints every kind that has installs. Passing a single
kind hides the others.

```text
[design]
  com.acme.my-cards@0.1.0  Acme branded card renderer
[bundle]
  bundle-standard@0.1.0    Standard application pack
```

### `gtdx info <NAME>`

Show describe.json metadata for an installed extension.

```
gtdx info [OPTIONS] <NAME>
```

| Flag | Notes |
|------|-------|
| `--version <VERSION>` | Pin to an exact version. Without it, the highest installed semver wins. |
| `--registry <NAME>` | Reserved; ignored in Wave A (reads from local installs). |

Output:

```text
Kind: DesignExtension
Name: com.acme.my-cards
Version: 0.1.0
License: Apache-2.0
Summary: Acme branded card renderer
Capabilities: design.render, design.validate
```

For provider kinds, the runtime `.gtpack` id and component version also
print.

### `gtdx search [QUERY]`

List or filter extensions in a registry.

```
gtdx search [OPTIONS] [QUERY]
```

| Flag | Default | Notes |
|------|---------|-------|
| `--registry <NAME>` | `[default].registry` | Which registry to query. |
| `--kind <KIND>` | none | Filter by `design` \| `bundle` \| `deploy`. |
| `--limit <N>` | `20` | Max results. |

`QUERY` is optional — omit to list everything:

```bash
gtdx search                       # list first 20
gtdx search --kind bundle         # bundle extensions only
gtdx search card --limit 5        # top 5 matches for "card"
```

### `gtdx uninstall <NAME>`

Remove an installed extension.

```
gtdx uninstall [OPTIONS] <NAME>
```

| Flag | Notes |
|------|-------|
| `--version <VERSION>` | Remove only this version. Without it, all installed versions of the name are removed. |

```bash
gtdx uninstall com.acme.my-cards                 # all versions
gtdx uninstall com.acme.my-cards --version 0.1.0 # one version
```

## Auth and registries

Registries are stored in `~/.greentic/config.toml`. Credentials in
`~/.greentic/credentials.toml` (mode `0600`).

### `gtdx registries`

```
gtdx registries <COMMAND>
```

Subcommands:

| Subcommand | Purpose |
|------------|---------|
| `list` | Show default + configured registries. |
| `add <NAME> <URL> [--token-env VAR]` | Add a registry entry. `--token-env` names an env var that holds the bearer token. |
| `remove <NAME>` | Remove a registry entry. |
| `set-default <NAME>` | Promote an entry to default. |

```bash
gtdx registries add store https://store.greentic.ai/api/v1 --token-env GREENTIC_STORE_TOKEN
gtdx registries set-default store
gtdx registries list
```

### `gtdx login [--registry <NAME>]`

Interactive prompt for a bearer token. Saves to
`~/.greentic/credentials.toml`.

Two supported token shapes for the Greentic Store:

- **`gts_*` long-lived API token** — the preferred form for CI. Non-JWT, no
  expiry embedded.
- **JWT from `POST /api/v1/auth/login`** — short-lived (24h). Use for
  interactive sessions.

```bash
gtdx login                  # default registry
gtdx login --registry store # named registry
```

### `gtdx logout [--registry <NAME>]`

Delete the stored token. No-ops with a friendly message if none is present.

## Signing

Artifact signing uses Ed25519 over the JCS-canonicalized describe.json. Keys
live as PKCS#8 PEM.

### `gtdx keygen`

Generate an Ed25519 keypair.

```
gtdx keygen [--out <PATH>]
```

| Flag | Default | Notes |
|------|---------|-------|
| `--out <PATH>` | stdout | Write private key PEM here. File must not already exist. Mode `0600` on Unix. |

The public key (base64) always prints to stderr. Store the private key in
your org vault and expose it to CI as `GREENTIC_EXT_SIGNING_KEY_PEM` (the
default env var read by `gtdx sign`).

```bash
gtdx keygen --out ./release-2026.pem
# private key written: ./release-2026.pem
# public key (base64): Fp2x…
```

### `gtdx sign <DESCRIBE_PATH>`

JCS-canonicalize + sign a describe.json in place. Idempotent — re-signing
produces a stable `signature` block.

```
gtdx sign [OPTIONS] <DESCRIBE_PATH>
```

| Flag | Default | Notes |
|------|---------|-------|
| `--key <PATH>` | — | Read PKCS#8 PEM private key from this file. Mutually exclusive with `--key-env`. |
| `--key-env <VAR>` | `GREENTIC_EXT_SIGNING_KEY_PEM` | Read PKCS#8 PEM private key from this env var. |

```bash
# CI path
GREENTIC_EXT_SIGNING_KEY_PEM="$(cat release-2026.pem)" \
  gtdx sign describe.json

# Dev path
gtdx sign describe.json --key ./release-2026.pem
```

### `gtdx verify <PATH>`

Verify the inline signature on a describe.json, an extension directory, or
a `.gtxpack`.

```
gtdx verify <PATH>
```

`PATH` is auto-detected:

- `describe.json` file — verifies in place.
- Directory — reads `describe.json` inside.
- `.gtxpack` (or `.zip`) — extracts describe.json and verifies.

Exits 0 on valid signature, non-zero otherwise. Prints extension id,
version, and a short key fingerprint.

```bash
gtdx verify ./dist/com.acme.my-cards-0.2.0.gtxpack
# OK  com.acme.my-cards v0.2.0 signed by Fp2xM6vQkL9yNr4z
```

## Diagnostics

### `gtdx doctor [--offline]`

Environment check. Four sections:

1. **toolchain** — `cargo` (hard requirement), `cargo-component`, `rustup`,
   and the `wasm32-wasip2` target. Missing cargo-component / rustup /
   target are warnings, not failures, so `doctor` exits 0 on a fresh
   machine unless something real is broken.
2. **registries** — reads `config.toml`, probes each entry's `/health`
   endpoint with a 5s timeout. `--offline` skips probes and marks each
   entry as not-probed.
3. **credentials** — reads `credentials.toml`, decodes JWT `exp` claims
   and reports hours remaining. `gts_*` API tokens are non-JWT and shown
   as "cannot verify expiry" (expected).
4. **installed extensions** — walks each installed describe.json through
   the v1 JSON Schema validator.

Exits 0 when nothing hard-failed; 1 otherwise with a count.

```bash
gtdx doctor                # full online probe
gtdx doctor --offline      # skip /health probes
```

### `gtdx validate [PATH]`

Static describe.json + layout check against the v1 schema. `PATH` defaults
to `.`. Use this as a local git pre-commit gate.

```
gtdx validate [PATH]
```

```bash
gtdx validate                           # current dir
gtdx validate ./crates/my-extension
```

### `gtdx version`

Print the CLI version. Machine-friendly alternative to `gtdx --version`.

## Exit codes (publish) {#exit-codes-publish}

`gtdx publish` maps failure classes to stable exit codes so CI can branch
without parsing messages.

| Code | Name | Meaning | Remediation |
|------|------|---------|-------------|
| `0` | success | Registry write succeeded (or dry-run / verify-only passed). | — |
| `1` | other | Catch-all / unexpected error. | Re-run with `RUST_LOG=debug` for detail. |
| `2` | describe-invalid | `describe.json` failed schema validation. | Fix the manifest, re-run `gtdx validate`. |
| `10` | version-exists | Target version already present in the registry. | Bump `--version`, or re-run with `--force` if intentional. |
| `20` | auth-required | Registry demands credentials. | `gtdx login` or set `--oci-token` / `GHCR_TOKEN`. |
| `30` | registry-not-writable | Registry refused the write (read-only / permissions). | Check the account role in the registry. |
| `50` | not-implemented | Backend path not yet implemented (Phase 2 stubs). | Track the feature matrix in the repo CHANGELOG. |
| `70` | build | `cargo component build` failed. | Rebuild locally; inspect stderr. |
| `74` | io | Filesystem or network I/O failure. | Retry; check disk space + network. |

Other commands follow the same convention but the set is smaller: `0` for
success, `1` for anything else.

## Config files

| Path | Purpose | Managed via |
|------|---------|-------------|
| `~/.greentic/config.toml` | Registries list, default registry, `trust-policy`. | `gtdx registries *` |
| `~/.greentic/credentials.toml` | Bearer tokens per registry. Mode `0600`. | `gtdx login` / `gtdx logout` |
| `~/.greentic/keys/<id>.{pub,key}` | Signing keypairs. Mode `0600` on the private key. | `gtdx keygen --out` |
| `~/.greentic/extensions/<kind>/<id>-<version>/` | Installed extension tree. | `gtdx install` / `gtdx uninstall` |
| `~/.greentic/registries/local/` | The `local` publish backend's on-disk store. | `gtdx publish --registry local` |

Override the whole root with `--home <PATH>` or `GREENTIC_HOME` for sandbox
runs.

Example `config.toml`:

```toml
[default]
registry = "store"
trust-policy = "normal"      # strict | normal | loose

[[registries]]
name = "store"
url = "https://store.greentic.ai/api/v1"
token_env = "GREENTIC_STORE_TOKEN"

[[registries]]
name = "enterprise"
url = "https://registry.acme.internal/api/v1"
token_env = "ACME_REGISTRY_TOKEN"
```

Trust policies:

| Policy | Behaviour |
|--------|-----------|
| `strict` | Developer signature AND Greentic Store countersignature required. |
| `normal` | Developer signature required (matches Cargo's default trust model). |
| `loose` | Unsigned allowed. Dev-only; `gtdx install` prints a warning. |

## Related

- [Writing an Extension](./writing-extensions/) — authoring guide for each kind.
- [Publishing Extensions](./publishing-extensions/) — registry flows and CI recipes.
- [Provider Extensions](./provider-extensions/) — the fourth kind (messaging + events).
- [GitHub Action](./github-action/) — CI wrapper that drives `gtdx publish`.
- [Designer Extensions overview](./designer-extensions/)
