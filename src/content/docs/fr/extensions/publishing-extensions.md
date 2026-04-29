---
title: Publishing Extension Packs
description: Package and distribute extension packs as validated Greentic .gtpack artifacts.
---

Current Greentic extensions are distributed as `.gtpack` packs. The built pack contains the validated manifest, components, flows, assets, i18n files, setup questions, and extension metadata.

## Build the Pack

Run the pack validation path before distribution:

```bash
gtc dev pack lint --in ./my-extension-pack
gtc dev pack resolve --in ./my-extension-pack
gtc dev pack build --in ./my-extension-pack
gtc dev pack doctor ./my-extension-pack
```

Run `doctor` against the built `.gtpack` as well when your build process emits the artifact path.

## Consume the Pack

An extension pack is consumed like any other Greentic pack: add the built artifact to the bundle or deployment flow that needs it. During setup and startup, Greentic reads the extension metadata and makes the offered capabilities, deployer contract, or static routes available to the runtime.

Use extension packs for deploy-anywhere deployments:

- local development
- desktop or workstation installs
- Kubernetes
- AWS, Azure, and GCP
- private cloud
- custom enterprise deployers

## Versioning

Version the pack and the capability offers intentionally:

- Keep `offer_id` stable for the same provider behavior.
- Change capability `version` when the capability contract changes.
- Keep setup QA files compatible where possible.
- Treat component operation names as part of the runtime contract.

## What Not to Publish

Do not publish `.gtxpack` archives or document `gtdx publish` as the current path. The implemented extension path is `.gtpack` plus `gtc wizard` and `gtc dev pack`.
