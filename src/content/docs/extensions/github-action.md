---
title: Extension CI
description: Validate describe.json and publish signed .gtxpack extensions from GitHub Actions on a version bump.
---

An extension repository can validate its `describe.json` on every change and publish a signed `.gtxpack` to [`store.greentic.cloud`](https://store.greentic.cloud) automatically when its version is bumped. This page documents the two workflows used by Greentic's own extension repos.

## Validate describe.json on Every Change

`describe.json` is the source of truth for an extension's metadata, so it is governed on every push and pull request that touches it. The validation workflow triggers only on changes to `describe.json` (and the workflow file itself):

```yaml
name: validate-describe
on:
  push:
    paths: ["describe.json", ".github/workflows/validate-describe.yml"]
  pull_request:
    paths: ["describe.json", ".github/workflows/validate-describe.yml"]
jobs:
  govern:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@1.90.0
      - uses: Swatinem/rust-cache@v2
      - name: Validate describe.json governance
        uses: greenticai/greentic-designer-sdk/.github/actions/validate-extension@research
        with:
          dir: "."
          gtdx-ref: v1.2.18-research
```

The `validate-extension` action (shipped from `greentic-designer-sdk`) runs the same governance and schema checks as `gtdx validate` / `gtdx lint` against the extension directory.

## Publish on a Version Bump

The release workflow publishes only when the `version` in `Cargo.toml` actually changes. It triggers on pushes to `main`, `develop`, and `research`, plus a manual `workflow_dispatch` that takes an explicit `version`:

```yaml
name: Release

on:
  push:
    branches: [main, develop, research]
  workflow_dispatch:
    inputs:
      version:
        description: 'Extension version to (re)publish. Required.'
        required: true
```

### Job 1 — Detect the version bump

The `detect` job checks out with `fetch-depth: 2` and diffs the `version` field in `Cargo.toml` between `HEAD` and `HEAD~1`. If the version is unchanged, the run stops (no publish). A `workflow_dispatch` always publishes the supplied input version.

It also enforces the per-branch suffix policy before publishing:

- `research` requires a `-research` prerelease suffix.
- `develop` requires a `-dev` prerelease suffix.
- `main` requires a stable version with no prerelease suffix.

A version that violates the policy fails the job.

### Job 2 — CI gate

When a bump is detected, the reusable `ci.yml` workflow runs as a gate. It installs the Rust toolchain plus the `wasm32-wasip2` target and `cargo-component`, then runs the repo's check script (`cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`, and `cargo component build --release --target wasm32-wasip2`).

### Job 3 — Publish the .gtxpack

After CI passes, the publish job builds, signs, and uploads the `.gtxpack` to the store via the shared action:

```yaml
  publish:
    name: Publish .gtxpack to Greentic Store
    needs: [detect, ci]
    if: needs.detect.outputs.should_publish == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: greenticai/greentic-designer-extension-action@v2
        with:
          gtdx-version: "=1.2.18-research"
          manifest: Cargo.toml
          store-url: https://store.greentic.cloud
          store-token: ${{ secrets.GREENTIC_STORE_TOKEN }}
          version: ${{ needs.detect.outputs.version }}
```

The `greentic-designer-extension-action` wraps the `gtdx publish` flow described in [Publishing Extension Packs](/extensions/publishing-extensions/): it installs the pinned `gtdx`, builds and signs the pack, and publishes the detected version to `store-url` using `store-token`.

The store token is held in the repository secret `GREENTIC_STORE_TOKEN`. For headless signing, supply the PKCS8 PEM signing key through the `GREENTIC_EXT_SIGNING_KEY_PEM` environment variable (the default read by `gtdx publish --key-env`).
