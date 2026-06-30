---
title: Publishing Extension Packs
description: Sign and publish Greentic designer extensions as .gtxpack artifacts with the gtdx CLI.
---

Greentic designer extensions are published as signed `.gtxpack` artifacts. The pack bundles the extension's `describe.json` (the source of truth for its metadata), the built `wasm32-wasip2` component, and the publisher's Ed25519 signature. The production registry is [`store.greentic.cloud`](https://store.greentic.cloud), configured by default as the `greentic-store` registry.

This page uses the [`gtdx` CLI](/extensions/gtdx-cli/). The end-to-end flow is: generate a signing key, log in to the registry, then publish a signed pack.

## 1. Generate a Signing Key

Extensions are signed with an Ed25519 keypair. Generate one with `gtdx keygen`. Publishing with `--key-id <id>` loads the private key from `~/.greentic/keys/<id>.key`, so write the key there:

```bash
gtdx keygen --out ~/.greentic/keys/my-key.key
```

The private key file is written with mode `0600` and must not already exist. Omit `--out` to print the key to stdout instead.

## 2. Log In to the Registry

`gtdx login` stores a registry token at `~/.greentic/credentials.toml`:

```bash
gtdx login --registry greentic-store
```

By default this opens a browser device login. For headless or CI use, pass `--token <token>` (or set the `GTDX_TOKEN` environment variable), which makes login non-interactive. Use `--no-browser` to print the login URL instead of opening it, or `--paste` to paste a token manually.

Inspect the configured registries at any time:

```bash
gtdx registries list
```

The default install ships `greentic-store` pointing at `https://store.greentic.cloud` and set as the default registry. Add or change registries with `gtdx registries add <name> <url>`, `gtdx registries remove`, and `gtdx registries set-default`.

## 3. Validate Before Publishing

`gtdx publish --dry-run` runs the full build + pack + validate path without writing to the registry:

```bash
gtdx publish --registry greentic-store --dry-run
```

You can also validate the describe and signature independently:

```bash
gtdx validate .          # validate the extension directory against the describe.json schema
gtdx lint ./describe.json    # cross-field invariants beyond JSON Schema
gtdx verify ./my-extension.gtxpack    # signature + manifest binding + ledger
```

`gtdx verify` accepts a `describe.json` file, an extension directory, or a `.gtxpack` archive. Pass `--trusted-key <base64-ed25519>` to assert the signature was produced by a specific publisher key; without it, only describe self-consistency is checked.

## 4. Publish a Signed Pack

Build, sign, and publish in one step:

```bash
gtdx publish --registry greentic-store --sign --key-id my-key
```

Publishing returns the artifact path, its `sha256`, whether it was signed, and a registry receipt. By default a copy of the artifact is also written to `./dist` (override with `--dist`). Use `--format json` for machine-readable output.

Useful publish options:

- `--sign` — sign the `.gtxpack`. Requires a key via `--key-id`, `--key`, or `--key-env`.
- `--key-id <id>` — load the PKCS8 PEM key at `~/.greentic/keys/<id>.key` and label the signature with `<id>`.
- `--key <file>` — explicit PKCS8 PEM key file (overrides `--key-id`).
- `--key-env <var>` — read the PKCS8 PEM key from an environment variable (CI / headless). Defaults to `GREENTIC_EXT_SIGNING_KEY_PEM`.
- `--version <version>` — override the `describe.json` version for this run (CI version bumps).
- `--trust <loose|normal|strict>` — trust policy for the publish (default `loose`).
- `--force` — overwrite an existing version.
- `--wizard` / `-w` — interactive prompts for registry, mode, signing, and trust instead of the full flag string.
- `--registry <uri>` — a named entry from `~/.greentic/config.toml`, a `file://<path>`, or an `oci://<host>/<namespace>` URI (default `local`).

## How the Store Verifies a Pack

When an extension is registered, the store and admin verify the published `.gtxpack`:

- The artifact `sha256` is checked against what was published.
- The Ed25519 signature is verified against the trusted publisher keys.
- The `describe.json` is the single source of truth for the extension's metadata; the store validates it against its schema (for example, `describe-mcp-v1` for `wasix:mcp/router` components).

A pack that fails signature or hash verification is rejected.

## Versioning

Version the extension and its describe intentionally:

- Bump the `version` in `describe.json` / `Cargo.toml` for every published change.
- Keep the extension `id` stable across versions.
- Treat component operation and tool names as part of the runtime contract.
- Branch-suffix conventions used by CI: `research` → `-research`, `develop` → `-dev`, `main` → a stable version with no prerelease suffix.

For automated, CI-driven publishing on a version bump, see [Extension CI](/extensions/github-action/).
