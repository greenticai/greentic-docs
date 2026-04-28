---
title: Writing Extension Packs
description: Create Greentic extension packs with gtc wizard and validated manifest metadata.
---

Greentic extensions are ordinary `.gtpack` packs with extension metadata in `pack.yaml`. The authoring path is wizard-first: let the catalog create the right directories, JSON answer artifacts, manifest entries, and validation plan.

## Use the Wizard

Start interactively:

```bash
gtc wizard
```

Choose the pack workflow, then create or update an extension pack. The wizard catalog can scaffold:

- `components/` for WASM components
- `flows/` for setup, deploy, control, or operation flows
- `extensions/` for catalog answer JSON
- `qa/` for setup questions
- `i18n/` for localized setup and operator text
- `assets/` for static UI, images, scripts, and documentation assets
- `pack.yaml` with the correct extension entry

For coding agents and CI, use the schema and replay an answers file:

```bash
gtc wizard --schema
gtc wizard --answers extension-pack-answers.json
```

The schema is the contract. A coding agent should inspect it, prepare `extension-pack-answers.json`, and run `gtc wizard --answers ...` instead of guessing internal wizard fields.

## Pick an Extension Type

The wizard catalog includes extension types for messaging, events, OAuth, MCP, state, telemetry, secrets, admin, control, observer, deployer, runtime capability, contract, ops, capability offer, and custom scaffold.

Most types write `greentic.ext.capabilities.v1` offers. The deployer type writes `greentic.deployer.v1`. Static route metadata is written as `greentic.static-routes.v1` when a pack needs to expose packaged assets over HTTP.

## Create Components with the Wizard Too

Extension capabilities are implemented by components. Use the wizard for those components as well:

```bash
gtc wizard --schema
gtc wizard --answers component-create-answers.json
```

This keeps generated component metadata, WIT bindings, templates, and pack references aligned with the current CLI. Coding agents can use the same schema-driven flow to create or update components safely.

## Add or Adjust a Capability Offer

When you need a deterministic low-level edit, use the pack command that writes a capability offer:

```bash
gtc dev pack add-extension capability \
  --pack-dir ./webchat-extension \
  --offer-id messaging.webchat.inbound.01 \
  --cap-id greentic.cap.messaging.webchat.v1 \
  --version v1 \
  --component-ref webchat-extension \
  --op messaging.dispatch
```

The referenced component must exist in the pack or resolve through the pack lock. If the offer requires setup, include setup metadata and a valid QA reference in the generated extension data.

## Validate Before Shipping

Run the same validation path locally and in CI:

```bash
gtc dev pack lint --in ./my-extension-pack
gtc dev pack resolve --in ./my-extension-pack
gtc dev pack build --in ./my-extension-pack
gtc dev pack doctor ./my-extension-pack
```

Validation checks manifest structure, component references, setup QA references, deployer contracts, static route asset paths, and lock resolution.

## What Belongs in an Extension Pack

An extension pack should carry everything needed to install and run that capability:

- components that implement capability operations
- flows for setup, deployment, control, observation, or operations
- setup questions and localized strings
- static assets or UI surfaces when needed
- extension JSON answer artifacts
- validated manifest entries

Do not use old `.gtxpack`, `gtdx`, or provider-extension scaffolds for new runtime extensions.
