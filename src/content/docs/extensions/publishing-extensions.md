---
title: Publishing Extensions
description: Ship your .gtxpack to a filesystem, the Greentic Store, or any OCI Distribution v2 registry — manually or from CI.
---

`gtdx publish` builds a release-profile WASM component, packs it into a
deterministic `.gtxpack`, and pushes it to one of three registry backends.
The same command drives local smoke tests, staged CI releases, and
production pushes to GHCR or the Greentic Store.

## Overview

The `--registry` flag picks the backend:

| Value                               | Backend                                              |
|-------------------------------------|------------------------------------------------------|
| `local` (default)                   | Filesystem under `$GREENTIC_HOME/registries/local/`  |
| `file://<abs-path>`                 | Filesystem at an explicit path                       |
| `<name>` (e.g. `my-store`)          | Greentic Store HTTP — entry from `config.toml`       |
| `oci://<host>/<ns>[/<name>]`        | OCI Distribution v2 (GHCR, Docker Hub, Harbor, ACR)  |

Every backend runs the same pipeline: schema-validate `describe.json`,
apply business-rule validators, build the WASM with `cargo component build`,
pack the `.gtxpack` deterministically, optionally sign, then write. A
receipt lands at `./dist/publish-<id>-<version>.json`.

## Registry backends

### Local filesystem

The default. Good for private distribution inside a team, or a
pre-publish smoke test before pushing further.

```bash
gtdx publish --registry local
# or
gtdx publish --registry file:///opt/greentic/shared-registry
```

Layout under the registry root:

```
<root>/
  <ext-id>/
    <version>/
      <name>-<version>.gtxpack
      manifest.json
      artifact.sha256
      signature.json       # only if --sign
  index.json
```

`manifest.json` mirrors the `describe.json` inside the pack, for fast
listing. `artifact.sha256` lets consumers verify without unzipping.
`index.json` at the root enumerates every extension and version in the
registry — the same format `gtdx install` resolves against.

### Greentic Store (HTTP)

The Greentic Store is a multi-publisher HTTP server that serves the Store
API (see [`greentic-store-api.openapi.yaml`](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/docs/greentic-store-api.openapi.yaml)).
Each publisher is scoped by an `allowed_prefixes` list: the `metadata.id`
in your `describe.json` must start with one of your allowed prefixes, or
the server rejects the publish with 403.

Workflow from scratch:

1. **Register an account** on the target Store. For the public
   Greentic Store, `POST /api/v1/auth/register` returns a short-lived
   JWT and your `allowed_prefixes`.
2. **Create an API token** (recommended for CI). Long-lived `gts_…`
   tokens are the canonical format used by the reference server
   implementation — they stay valid until you revoke them. Short-lived
   JWTs from `/auth/login` also work for interactive use.
3. **Configure `gtdx`:**

   ```bash
   gtdx registries add my-store https://store.example.com
   gtdx login --registry my-store
   # paste your API token when prompted
   ```

   Alternatively, plumb the token through an environment variable:

   ```bash
   gtdx registries add my-store https://store.example.com \
     --token-env MY_STORE_TOKEN
   export MY_STORE_TOKEN=gts_...
   ```

4. **Publish:**

   ```bash
   gtdx publish --registry my-store
   ```

Token types at a glance:

| Type      | Format    | Lifetime          | Use for                   |
|-----------|-----------|-------------------|---------------------------|
| API token | `gts_...` | long-lived        | CI / automation           |
| JWT       | `eyJ...`  | 24 hours          | interactive `gtdx login`  |

Token resolution order on publish:

1. Env var named in the registry's `token-env` entry (set via
   `gtdx registries add … --token-env`).
2. `~/.greentic/credentials.toml` entry for the registry name
   (written by `gtdx login`, chmod 0600 on Unix).
3. None → publish aborts with `AuthRequired` (exit 20).

### OCI registries (GHCR, Docker Hub, Harbor, Azure ACR)

Any OCI Distribution v2 registry can hold a `.gtxpack` directly — no
Greentic Store server required. The artifact is a single-layer OCI image:

- **Layer blob** — the raw `.gtxpack` bytes, media type
  `application/vnd.greentic.gtxpack.v1`.
- **Config blob** — minimal JSON (`{}`), media type
  `application/vnd.greentic.gtxpack.config.v1+json`.
- **Tag** — the `describe.metadata.version`.

URI form: `oci://<host>/<namespace>[/<artifact-name>]`

- **2 segments** (`oci://ghcr.io/myorg`) — namespace only. `gtdx`
  appends `describe.metadata.name` as the artifact name for each
  publish. Use when one GitHub org publishes many extensions.
- **3 segments** (`oci://ghcr.io/myorg/fixed-name`) — explicit path.
  Every publish from this URI targets the same package; new versions
  become new tags.

Auth resolution, first non-empty wins:

1. `--oci-token <TOKEN>` CLI flag
2. `GHCR_TOKEN` env
3. `GITHUB_TOKEN` env (auto-injected by `actions/checkout@v4`)
4. `OCI_TOKEN` env
5. Anonymous (pull-only; push returns 401 → `AuthRequired`)

`gtdx` converts the token into OCI basic auth per host: GHCR uses
`(oauth2, <PAT>)`, anything else uses `(token, <PAT>)`.

Example — GHCR with the `gh` CLI:

```bash
gh auth refresh --scopes write:packages,read:packages
export GHCR_TOKEN=$(gh auth token)

gtdx publish --registry oci://ghcr.io/myorg/my-ext
# pushes to ghcr.io/myorg/my-ext:<describe.version>
```

Consumers install from the same URI:

```bash
gtdx install oci://ghcr.io/myorg/my-ext@0.1.0
```

## Signing

Phase 1 signing reuses the JCS Ed25519 `sign_describe` flow from Wave 1.
Generate a keypair once, then pass `--sign --key-id` to each publish:

```bash
gtdx keygen developer-01
gtdx publish --sign --key-id developer-01 --registry my-store
```

Keys live under `~/.greentic/keys/<key-id>.key` (Ed25519 seed, base64).
The signature is written into `describe.json` in place — the same
`describe.json` is packed into the `.gtxpack`, so consumers see the
signature as they unpack. Verify with:

```bash
gtdx verify ./dist/myco.my-ext-0.1.0.gtxpack
```

Strict trust policies, counter-signatures by the Greentic Store, and
passphrase-encrypted keys land in Phase 2.

## Flags reference

| Flag                  | Purpose                                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------|
| `--registry <URI>`    | Backend selector. `local` / `file://<path>` / `oci://<host>/<ns>[/<name>]` / named Store entry. Default `local`.         |
| `--version <SEMVER>`  | Override `describe.json` version (CI version bumps).                                                                    |
| `--dry-run`           | Validate + build + pack; skip the registry write.                                                                       |
| `--force`             | Overwrite an existing version.                                                                                          |
| `--sign`              | Sign `describe.json` with the local Ed25519 key identified by `--key-id`.                                               |
| `--key-id <ID>`       | Signing key id (requires `--sign`). Reads `~/.greentic/keys/<ID>.key`.                                                  |
| `--trust <POLICY>`    | `loose` / `normal` / `strict`. Stamped into the receipt. Default `loose`.                                               |
| `--dist <DIR>`        | Also copy the artifact here. Default `./dist/`.                                                                         |
| `--release`           | `cargo component build --release`. Default `true` for publish.                                                          |
| `--verify-only`       | Skip build + upload; check whether the target version already exists in the registry.                                   |
| `--manifest <PATH>`   | Path to the project's `Cargo.toml`. Default `./Cargo.toml`.                                                             |
| `--format <FMT>`      | `human` (default) or `json` — one JSON line per invocation on stdout.                                                   |
| `--oci-token <TOKEN>` | Bearer/PAT for `oci://...` registries. Falls back to `GHCR_TOKEN` / `GITHUB_TOKEN` / `OCI_TOKEN`.                       |

## Exit codes

| Code | Meaning                                                  |
|------|----------------------------------------------------------|
| 0    | Published (or dry-run / verify-only OK).                 |
| 1    | Any other failure.                                       |
| 2    | `describe.json` failed schema or business validation.    |
| 10   | Version already exists; re-run with `--force`.           |
| 20   | Auth required or token invalid; run `gtdx login`.        |
| 30   | Registry not writable (permissions / read-only).         |
| 50   | Backend returns `NotImplemented` (e.g. Phase 2 stubs).   |
| 70   | `cargo component build` failed — see compiler output.    |
| 74   | I/O error (disk, network).                               |

Branch on the code in CI scripts:

```bash
gtdx publish --registry oci://ghcr.io/myorg/my-ext || {
  case $? in
    10) echo "already published this version, skipping" ;;
    20) echo "need to refresh token" ; exit 1 ;;
    *)  exit 1 ;;
  esac
}
```

## JSON output

`--format json` writes one JSON object per invocation on stdout. The
`event` tag is one of `dry_run`, `verify_only`, or `published`:

```json
{"event":"published","ext_id":"com.example.demo","version":"0.1.0","sha256":"089a1b56...","artifact":"./dist/demo-0.1.0.gtxpack","receipt_path":"./dist/publish-com.example.demo-0.1.0.json","signed":false,"registry_url":"file:///…"}
```

IDEs and CI tools can parse this line without scraping the human
renderer.

## Determinism

Two `gtdx publish` invocations over identical sources produce
byte-identical `.gtxpack` archives:

- Entries are sorted lexicographically.
- Timestamps are zeroed to the ZIP epoch (`1980-01-01 00:00:00`).
- Permissions are normalised to `0644` (files) / `0755` (scripts).
- Line endings in `json` / `md` / `wit` / `txt` / `toml` / `yaml` are
  normalised to LF.

This makes the sha256 reproducible across machines — useful for
signature audits and transparency logs.

## CI: GitHub Actions

The fastest way to publish from CI is the
[`greentic-designer-extension-action`](./github-action/):

```yaml
- uses: greenticai/greentic-designer-extension-action@v1
  with:
    store-url: https://store.example.com
    store-token: ${{ secrets.GREENTIC_STORE_TOKEN }}
    version: ${{ github.ref_name }}
```

The action installs `gtdx`, writes a `config.toml` + `credentials.toml`
with the given Store URL + token, runs the build, and publishes. It
also accepts `registry: oci://...` and `registry: file://...` for
non-Store targets, and auto-injects `GITHUB_TOKEN` when publishing to
GHCR (requires `permissions: packages: write` on the job).

See [GitHub Action](./github-action/) for the full input reference.

## Troubleshooting

| Symptom                | Likely cause                                                                   |
|------------------------|--------------------------------------------------------------------------------|
| `401 Unauthorized`     | Token expired, wrong scope, or not configured. Re-run `gtdx login`.            |
| `403 Forbidden`        | Your publisher is not allowed to publish this `metadata.id` prefix. Or — for GHCR — your token lacks `write:packages`. |
| `409 Conflict`         | Version already exists. Bump the version in `describe.json` or pass `--force`. |
| Exit 70 (build error)  | Run `gtdx doctor` to check toolchain; then inspect `cargo component build` output. |
| Schema error on launch | `gtdx validate .` locally to see exactly which field is wrong before publishing. |
| OCI push returns 400   | Registry doesn't accept the custom media type. File an issue and pin a known-good registry (GHCR, Harbor, ACR, Docker Hub). |

## Related

- [gtdx CLI](./gtdx-cli/) — full command reference
- [Writing an Extension](./writing-extensions/) — build the thing you're about to publish
- [GitHub Action](./github-action/) — publish from CI in one step
- [Provider Extensions](./provider-extensions/) — the 4th kind bundles a runtime pack
