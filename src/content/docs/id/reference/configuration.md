---
title: Configuration Reference
description: Current configuration files and answer documents used by Greentic tooling
---

## Overview

Greentic configuration is mostly produced and consumed by wizards, setup flows, pack manifests, and runtime overlays. Prefer generated schemas over remembered examples.

The current high-confidence references are:

| File | Purpose |
| --- | --- |
| `pack.yaml` | Pack source manifest. |
| `.ygtc` | Flow definition file. |
| `answers.json` | Wizard answer document for a specific CLI/wizard. |
| setup answers JSON | Provider or extension setup answers consumed by `greentic-setup`. |
| tenant/team `.gmap` files | Runtime access and mapping files produced by setup/start tooling. |

Older docs listed a broad `greentic.toml` runtime schema with Redis, logging, telemetry, and WASM settings. That schema is not validated by the current local docs/tooling pass, so it is not documented here as a canonical Greentic config file.

## Wizard Answer Documents

Wizard answer files are schema-versioned JSON documents. Always inspect the installed schema before writing one by hand or with a coding agent:

```bash
gtc wizard --schema
greentic-bundle wizard --schema
greentic-pack wizard --schema
greentic-component wizard --schema
greentic-flow wizard --schema
```

A bundle wizard answer document has this outer shape:

```json
{
  "wizard_id": "greentic-bundle.wizard.run",
  "schema_id": "greentic-bundle.wizard.answers",
  "schema_version": "1.0.0",
  "locale": "en",
  "answers": {
    "bundle_name": "Deep Research Demo",
    "bundle_id": "deep-research-demo",
    "app_packs": ["demos/deep-research-demo.gtpack"],
    "extension_providers": [],
    "setup_answers": {}
  }
}
```

The exact fields under `answers` depend on the wizard and installed tool version.

## Setup Answers

`greentic-setup` accepts setup answer JSON for provider/extension configuration. The common pattern is a JSON object keyed by provider or extension id:

```json
{
  "messaging-webchat": {
    "enabled": true,
    "public_base_url": "http://localhost:8080"
  },
  "messaging-teams": {
    "enabled": false,
    "public_base_url": "http://localhost:8080",
    "app_id": "00000000-0000-0000-0000-000000000000",
    "app_password": "secret-ref-or-value",
    "tenant_id": "00000000-0000-0000-0000-000000000000"
  }
}
```

Do not treat this as a universal schema. Each provider or extension contributes its own questions and answer fields. Use the bundle setup flow or provider QA schema to get the authoritative fields.

## Pack Configuration

Pack configuration lives in `pack.yaml`:

```yaml
pack_id: quickstart-app
version: 0.1.0
kind: application
publisher: Example Publisher

components: []
dependencies: []
flows:
  - id: on_message
    file: flows/on_message.ygtc
    tags: [messaging, default]
    entrypoints: [default]
assets:
  - path: assets/i18n/en.json
```

See [Pack Format](/reference/pack-format/) for the current pack source shape.

## Flow Configuration

Flow configuration lives in `.ygtc` files:

```yaml
id: on_message
type: messaging
start: extract_event

nodes:
  extract_event:
    component.exec:
      component: component-msg2events
      operation: extract
      message: "{{in.input}}"
    routing:
      - to: echo_result
```

See [Flow YAML Schema](/reference/flow-schema/) for the current flow shape.

## Locale Configuration

Pack i18n assets are JSON files under `assets/i18n/`:

```text
assets/i18n/en.json
assets/i18n/de.json
assets/i18n/locales.json
```

The Greentic i18n runtime normalizes BCP-47-ish locale tags and falls back from exact locale to base language to English.

## Public Base URL

Several setup flows ask for `public_base_url`. It is the externally reachable runtime URL used for webhooks, OAuth callbacks, webchat links, or provider configuration. Local demos commonly use:

```json
{
  "public_base_url": "http://localhost:8080"
}
```

Some runtime code also accepts a configured public base URL from environment/runtime configuration, but provider setup answers remain the most visible place this value appears.

## Secrets

Secret values should be supplied through setup answers, `greentic-secrets`, or a configured secrets extension/manager. Do not hardcode credentials in `pack.yaml`, flow files, or component source.

Useful commands:

```bash
greentic-secrets --help
greentic-setup --help
```

## Configuration Precedence

For wizard-created artifacts, use this practical precedence:

1. Explicit CLI flags and `--answers` files
2. Existing setup/runtime state for the selected tenant/team
3. Pack defaults and generated wizard defaults
4. Tool defaults

Provider-specific setup screens can also prefill values from saved tenant/team state.

## Next Steps

- [Pack Format](/reference/pack-format/)
- [Flow YAML Schema](/reference/flow-schema/)
- [gtc CLI](/reference/cli/gtc/)
- [greentic-setup CLI](/reference/cli/greentic-setup/)
