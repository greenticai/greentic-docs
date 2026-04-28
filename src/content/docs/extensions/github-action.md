---
title: Extension CI
description: Validate extension packs in GitHub Actions with the current gtc workflow.
---

CI should run the same extension-pack validation path developers run locally.

## Install gtc

Use `cargo binstall gtc` when your runner has Rust tooling available, then let `gtc install` fetch the Greentic toolchain pieces required by the repo.

```yaml
- name: Install gtc
  run: |
    cargo binstall gtc --no-confirm
    gtc install
```

If your repository pins a specific `gtc` binary another way, keep that mechanism but still run the pack validation commands below.

## Validate the Pack

```yaml
- name: Validate extension pack
  run: |
    gtc dev pack lint --in ./my-extension-pack
    gtc dev pack resolve --in ./my-extension-pack
    gtc dev pack build --in ./my-extension-pack
    gtc dev pack doctor ./my-extension-pack
```

Run `doctor` against the emitted `.gtpack` too when the build location is known.

## Replay Generated Answers

If the extension pack is generated from wizard answers, keep the answers file in the repository and replay it before validation:

```yaml
- name: Generate extension pack
  run: gtc wizard --answers extension-pack-answers.json --non-interactive --yes
```

Coding agents can update the answers file by first reading:

```bash
gtc wizard --schema
```

## Legacy Note

The old GitHub Action flow for `gtdx publish` targeted `.gtxpack` artifacts. It is not the recommended extension CI path.
