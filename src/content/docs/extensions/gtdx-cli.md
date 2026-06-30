---
title: gtdx CLI
description: The Greentic Designer Extensions CLI for scaffolding, building, signing, and publishing .gtxpack extensions.
---

`gtdx` (Greentic Designer Extensions CLI) is the current authoring tool for Greentic
extensions. An extension is a WebAssembly component (target `wasm32-wasip2`) packaged
as a signed `.gtxpack` archive that the runtime and store load. `describe.json` is the
extension manifest and the single source of truth for its metadata; signing uses
ed25519.

```bash
gtdx --version   # e.g. gtdx 1.1.1
gtdx --help
```

The `--home <HOME>` option (env `GREENTIC_HOME`, default `~/.greentic`) is available on
every subcommand and overrides the Greentic home directory used for keys, registries,
and local installs.

## Authoring Inner Loop

The authoring path is: scaffold with `gtdx new`, iterate with `gtdx dev`, then sign and
publish with `gtdx keygen` + `gtdx login` + `gtdx publish`.

### `gtdx new` — scaffold a new extension

```bash
gtdx new my-extension
gtdx new my-extension --kind design --id com.example.my-extension
gtdx new my-extension --yes        # non-interactive: resolve from flags/defaults
gtdx new                            # launch the interactive wizard
```

Scaffolds a new extension project. Run with no name on a terminal to launch the
interactive wizard, or pass `--yes` to resolve everything from flags and defaults.

Key options:

- `--kind <KIND>` — extension kind, one of `design` (default), `bundle`, `deploy`,
  `provider`, `wasm-component`, `mcp`, `llm`.
- `--id <ID>` — reverse-DNS extension id (default `com.example.<name>`).
- `--version <VERSION>` — initial version (default `0.1.0`).
- `--author <AUTHOR>` — defaults to `git config user.name`.
- `--license <LICENSE>` — SPDX license id (default `Apache-2.0`).
- `--dir <DIR>` — output directory (default `./<name>`).
- `--no-git` — skip `git init`; `--force` — overwrite an existing target.
- `-w, --wizard` — force the interactive wizard even when a name/flags are given.

The scaffold includes a working WASM component (`src/lib.rs`), the vendored WIT contract
under `wit/` (pinned by `.gtdx-contract.lock`), `describe.json`, `i18n/en.json`, a
`build.sh`, a `ci/local_check.sh` quality gate, and AI-agent onboarding files: an
`AGENTS.md`, a `CLAUDE.md` that points to it, and a `.claude/` directory with
pre-approved build permissions and a `/check` quality-gate command. The `AGENTS.md`
documents which values are scaffold placeholders to replace and which files
(`describe.json` `sha256` fields, `.gtdx-contract.lock`, `wit/deps/`, `src/bindings.rs`)
are generated and must never be hand-edited.

### `gtdx dev` — developer inner loop

```bash
gtdx dev                 # watch mode (default): rebuild + pack + reinstall on save
gtdx dev --once          # build + install once, then exit (CI-friendly)
gtdx dev --no-install    # build and pack only; skip installation
gtdx dev --release       # build with --release (default is debug for speed)
```

Runs the inner loop: on each source change it rebuilds the component, packs the
`.gtxpack`, and installs it into the local registry under `GREENTIC_HOME`. Useful
options: `--debounce-ms <MS>` (file-watch debounce, default 500), `--force-rebuild`
(runs `cargo clean -p <crate>` first), `--manifest <PATH>` (path to `Cargo.toml`), and
`--mount <PATH>` to build+pack+install a built extension once the way `gtdx install`
would (conflicts with `--watch`/`--once`).

### `gtdx validate` / `gtdx lint` — check `describe.json`

```bash
gtdx validate            # describe.json against the JSON Schema
gtdx lint                # cross-field invariants beyond JSON Schema
gtdx lint --publish      # also reject placeholder 0000… sha256 (E_SHA256_ZERO)
```

`validate` checks an extension directory's `describe.json` against the schema (default
path `.`, or pass a `PATH`). `lint` checks cross-field invariants such as id pattern and
schema host (default `--dir .`); `--publish` enables publish-only rules. Run both after
any edit to `describe.json`, and `gtdx lint --publish` right before publishing.

### `gtdx doctor` — diagnose the environment

```bash
gtdx doctor
gtdx doctor --offline    # skip network probes
```

Diagnoses installed extensions and the local toolchain (cargo, cargo-component, the
`wasm32-wasip2` target).

## Signing and Publishing

For the full distribution flow and trust model, see
[Publishing Extensions](/extensions/publishing-extensions/).

### `gtdx keygen` — generate a signing keypair

```bash
gtdx keygen                       # print a new ed25519 private key
gtdx keygen --out ~/.greentic/keys/my-key.key   # write to a file (mode 0600)
```

Generates an ed25519 keypair for signing extension artifacts. With `--out`, writes the
private key to a file that must not already exist.

### `gtdx login` / `gtdx logout` — registry authentication

```bash
gtdx login                                  # browser/device login to the default registry
gtdx login --registry store.greentic.cloud
gtdx login --token "$GTDX_TOKEN"            # non-interactive (CI)
gtdx logout --registry store.greentic.cloud
```

`login` stores the token at `~/.greentic/credentials.toml`. When `--token` is omitted it
falls back to the `GTDX_TOKEN` env var, then to browser login; `--no-browser` prints the
URL instead of opening it, and `--paste` skips device login to paste a token manually.

### `gtdx sign` — sign a `describe.json`

```bash
gtdx sign ./describe.json --key ~/.greentic/keys/my-key.key
gtdx sign ./describe.json --key-env GREENTIC_EXT_SIGNING_KEY_PEM
```

Signs a `describe.json` in place with ed25519. Provide the PKCS8 PEM key with `--key`
(file) or `--key-env` (env var, default `GREENTIC_EXT_SIGNING_KEY_PEM`).

### `gtdx publish` — publish to a registry

```bash
gtdx publish --registry store.greentic.cloud --sign --key-id my-key
gtdx publish --dry-run            # build + pack + validate; skip registry write
gtdx publish --registry local     # publish to the local registry
```

Builds, packs, validates, and writes the `.gtxpack` to a registry. The `--registry`
value accepts `local`, a `file://<path>`, an `oci://<host>/<namespace>` URI, or a named
entry from `~/.greentic/config.toml` (default `local`). Common options:

- `--sign` — sign the `.gtxpack`; pair with `--key-id <ID>` (loads
  `~/.greentic/keys/<id>.key`), `--key <FILE>`, or `--key-env <VAR>`.
- `--trust <loose|normal|strict>` — trust level (default `loose`).
- `--version <VERSION>` — override the `describe.json` version for this run (CI bumps).
- `--dry-run` — build/pack/validate only; `--verify-only` — skip build, only check for a
  version conflict; `--force` — overwrite an existing version.
- `--dist <DIR>` — also copy the artifact here (default `./dist`).
- `--wasm <PATH>` — pack a pre-built `wasm32-wasip2` component instead of running
  `cargo component build` (for externally produced components such as generated MCP
  components).
- `--oci-token <TOKEN>` — bearer token for `oci://` registries (falls back to
  `GHCR_TOKEN`, `GITHUB_TOKEN`, `OCI_TOKEN`).
- `-w, --wizard` — prompt for registry, mode, signing, and trust interactively.

### `gtdx verify` — verify a signature

```bash
gtdx verify ./describe.json
gtdx verify ./my-extension/
gtdx verify ./dist/my-extension-0.1.0.gtxpack --trusted-key <base64-ed25519>
```

Verifies an extension signature. Accepts a `describe.json` file (inline signature), an
extension directory, or a `.gtxpack` archive (full chain: signature + manifest binding +
ledger). Without `--trusted-key` it only checks describe self-consistency (integrity, not
authenticity); with `--trusted-key <base64>` it requires the signature to come from that
exact key.

## Installing and Managing Extensions

### `gtdx install` / `gtdx uninstall`

```bash
gtdx install ./dist/my-extension-0.1.0.gtxpack
gtdx install my-extension --version 0.1.0 --registry store.greentic.cloud
gtdx uninstall my-extension
```

`install` takes a registry name (with `--version`) or a path to a local `.gtxpack`.
Options include `-y, --yes` (skip the permission prompt) and `--trust
<strict|normal|loose>`.

### `gtdx list`

```bash
gtdx list
gtdx list --kind design --status
```

Lists installed extensions. `--kind` filters by `design`, `bundle`, `deploy`,
`provider`, `mcp`, or `all` (default); `--status` adds an enabled/disabled column.

### `gtdx enable` / `gtdx disable`

```bash
gtdx enable greentic.foo@0.1.0
gtdx disable greentic.foo
```

Enable or disable an installed extension by id, optionally with `@version`.

### `gtdx info` / `gtdx search`

```bash
gtdx search slack --kind provider --limit 10
gtdx info my-extension --version 0.1.0
```

`search` does partial-name matching against a registry (omit the query to list
everything). `info` shows metadata for one extension.

### `gtdx outdated` / `gtdx update`

```bash
gtdx outdated
gtdx update my-extension
gtdx update --all -y
```

`outdated` checks installed extensions for available updates; `update` updates one
extension (or `--all`) to the latest permitted version.

### `gtdx registries`

```bash
gtdx registries list
gtdx registries add store https://store.greentic.cloud --token-env GTDX_TOKEN
gtdx registries set-default store
gtdx registries remove store
```

Show or modify configured registries (`list`, `add <NAME> <URL>`, `remove`,
`set-default`).

### `gtdx component register`

```bash
gtdx component register --help
```

Registers a component-tool by URL against greentic-designer-admin.

## See Also

- [Writing Extensions](/extensions/writing-extensions/) — the end-to-end authoring path.
- [Publishing Extensions](/extensions/publishing-extensions/) — packaging, signing, and
  distribution details.
</content>
