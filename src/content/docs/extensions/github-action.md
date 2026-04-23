---
title: GitHub Action — greentic-designer-extension-action
description: CI wrapper around `gtdx publish`. Three lines of YAML to publish your extension from GitHub Actions.
---

## Overview

`greenticai/greentic-designer-extension-action@v1` is a composite GitHub
Action that installs the Rust toolchain + cargo-component + gtdx, then
runs `gtdx publish` with your inputs. It's the recommended way to automate
extension releases from CI.

Released at https://github.com/greenticai/greentic-designer-extension-action.
Latest: `v1.1.0` (2026-04-19). Major alias: `v1`.

## Quick start — publish to the Greentic Store on every tag

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: greenticai/greentic-designer-extension-action@v1
        with:
          store-url: http://62.171.174.152:3030
          store-token: ${{ secrets.GREENTIC_STORE_TOKEN }}
          version: ${{ github.ref_name }}
```

Prerequisite: generate a long-lived `gts_...` API token from the Store server
and paste it into the repo secret `GREENTIC_STORE_TOKEN`. See
[Publishing Extensions](./publishing-extensions/#greentic-store-http).

## Quick start — publish to GitHub Container Registry

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write   # required for ghcr.io push
    steps:
      - uses: actions/checkout@v4
      - uses: greenticai/greentic-designer-extension-action@v1
        with:
          registry: oci://ghcr.io/${{ github.repository_owner }}/${{ github.event.repository.name }}
          version: ${{ github.ref_name }}
```

No secret setup — `GITHUB_TOKEN` is auto-injected via the action's fallback
chain.

## Quick start — PR dry-run validation

```yaml
# .github/workflows/validate.yml
name: Validate
on:
  pull_request:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: greenticai/greentic-designer-extension-action@v1
        with:
          registry: local
          dry-run: 'true'
```

## Inputs

Full input table:

| Input | Required | Default | Notes |
|-------|----------|---------|-------|
| `store-url` | conditional | — | Store HTTP URL. When set, action auto-writes `~/.greentic/config.toml`. |
| `store-token` | no | — | Bearer for `store-url`. Prefer `gts_...` API tokens over JWT. Written mode `0600`. |
| `registry` | conditional | — | Alternative to `store-url`. `oci://...`, `file://...`, `local`, or a named entry. |
| `manifest` | no | `./Cargo.toml` | Path to project `Cargo.toml`. |
| `version` | no | — | Override `describe.json` version. Usually `${{ github.ref_name }}`. |
| `force` | no | `'false'` | Overwrite existing version. |
| `dry-run` | no | `'false'` | Validate + build + pack, skip registry write. |
| `oci-token` | no | — | Explicit override for `oci://`. Fallback order: `GHCR_TOKEN` > `GITHUB_TOKEN` > `OCI_TOKEN` > anonymous. |
| `format` | no | `human` | `human` or `json`. |
| `gtdx-ref` | no | *(latest)* | Pin gtdx version via git tag or commit sha. |
| `rust-toolchain` | no | `1.94` | Must be ≥ 1.94 for edition 2024. |
| `cargo-component-version` | no | *(latest)* | Pin cargo-component. |

**Rule:** at least one of `store-url` or `registry` must be set. The action
errors out otherwise.

## Outputs

- `sha256` — SHA-256 of the published `.gtxpack`
- `registry-url` — URL of the published artifact
- `ext-id` — extension id that was published
- `version` — published version

Example consuming outputs:

```yaml
- uses: greenticai/greentic-designer-extension-action@v1
  id: publish
  with:
    registry: oci://ghcr.io/${{ github.repository_owner }}/my-ext
- run: |
    echo "Published ${{ steps.publish.outputs.ext-id }}@${{ steps.publish.outputs.version }}"
    echo "sha256=${{ steps.publish.outputs.sha256 }}"
```

## How it works (under the hood)

Composite action with 6 steps:

1. Setup Rust toolchain via `dtolnay/rust-toolchain`
2. Cache `~/.cargo/bin` keyed on inputs (avoids re-installing gtdx on every
   run)
3. Install `cargo-component` + `gtdx` from the greentic-designer-extensions
   git repo
4. Write `~/.greentic/{config,credentials}.toml` if `store-url` is set
5. Resolve registry (defaults to `greentic-store` when `store-url` is set
   and `registry` is empty)
6. Run `gtdx publish` + parse the JSON receipt for outputs

First CI run: ~9–10 minutes (cargo install compiles gtdx). Subsequent runs:
~30 seconds (cache hit).

## Publish to a private Store server

```yaml
- uses: greenticai/greentic-designer-extension-action@v1
  with:
    store-url: https://my-private-store.example.com
    store-token: ${{ secrets.STORE_TOKEN }}
```

## Pin gtdx version for deterministic builds

```yaml
- uses: greenticai/greentic-designer-extension-action@v1
  with:
    gtdx-ref: v0.2.0
    registry: oci://ghcr.io/...
```

## Publish to multiple registries

The action accepts a single `registry` per step. Stack steps for multiple
destinations — the cargo cache is warm for step 2:

```yaml
- uses: greenticai/greentic-designer-extension-action@v1
  with:
    registry: oci://ghcr.io/myorg/myext
- uses: greenticai/greentic-designer-extension-action@v1
  with:
    store-url: https://my-store.example.com
    store-token: ${{ secrets.STORE_TOKEN }}
```

## Troubleshooting

- **`403 Forbidden` on GHCR push** — missing `permissions: packages: write`
  on the job.
- **`401 Unauthorized` on Store** — token expired (JWT is 24h) or wrong
  scope. Regenerate, or use a long-lived `gts_...` API token.
- **`no registry named 'greentic-store' in config.toml`** — `store-url`
  wasn't set but the action defaulted to the `greentic-store` registry.
  Set `store-url`, or provide an explicit `registry:` input.
- **`cargo install` hangs** — network / cargo registry issue; retry the
  job.
- **Publisher prefix mismatch** — `describe.metadata.id` doesn't start with
  one of the publisher's `allowed_prefixes`. See
  [Publishing Extensions](./publishing-extensions/#greentic-store-http).

## Related

- [Publishing Extensions](./publishing-extensions/)
- [gtdx CLI](./gtdx-cli/)
- Action repo: https://github.com/greenticai/greentic-designer-extension-action
