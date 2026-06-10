---
title: QA
description: Setup, update, remove, and validation questions for Greentic components
---

## Overview

QA is the component question-and-answer contract used by Greentic tooling to collect setup data, validate it, and convert answers into component configuration. Wizard-generated components include QA scaffolding in `src/qa.rs`.

QA matters because it keeps component configuration deterministic:

- operators get typed setup, update, and remove questions
- coding agents can replay answers from JSON instead of editing code by hand
- setup values can be validated before they become runtime config
- i18n keys for setup UI are checked by `greentic-component doctor`
- packs can expose setup flows without hard-coding provider-specific forms in the UI

## Generated QA Surface

`greentic-component wizard` scaffolds QA support alongside the component implementation:

```text
my-component/
├── component.manifest.json
├── src/
│   ├── lib.rs
│   ├── qa.rs
│   └── i18n.rs
└── assets/
    └── i18n/
        └── en.json
```

The generated QA code supports the lifecycle modes:

| Mode | Purpose |
| --- | --- |
| `setup` | Collect required values for first installation. |
| `update` | Change existing configuration safely. |
| `remove` | Confirm or collect data needed for uninstall/removal. |

The scaffold accepts compatibility aliases such as `default`, `install`, and `upgrade`, but new docs and answers should use `setup`, `update`, and `remove`.

## What QA Contains

A QA spec contains:

| Part | Purpose |
| --- | --- |
| `mode` | Lifecycle mode such as `setup`, `update`, or `remove`. |
| `title` / `description` | i18n-backed text for setup UI. |
| `questions` | Field definitions, labels, help text, required flags, defaults, and input kind. |
| `defaults` | Optional default values for the mode. |

`apply-answers` validates submitted answers and returns an operator-friendly result shape with `ok`, `config`, `warnings`, and `errors`. Extend that function for domain validation such as checking required API keys, allowed regions, URL shape, or remove confirmations.

## Create QA with the Wizard

Use the component wizard rather than hand-writing `src/qa.rs` and manifest entries:

```bash
greentic-component wizard --schema
greentic-component wizard --answers component-create-answers.json
```

Minimal direct answers look like this:

```json title="component-create-answers.json"
{
  "wizard_id": "greentic-component.wizard.run",
  "schema_id": "greentic-component.wizard.run",
  "schema_version": "1.0.0",
  "answers": {
    "mode": "create",
    "fields": {
      "component_name": "ticket-client",
      "output_dir": "./components/ticket-client",
      "advanced_setup": true,
      "abi_version": "0.6.0",
      "operation_names": "create_ticket,lookup_ticket",
      "filesystem_mode": "none",
      "http_client": true,
      "messaging_inbound": false,
      "messaging_outbound": true,
      "events_inbound": false,
      "events_outbound": false,
      "secrets_enabled": true,
      "secret_keys": "ticket_api_key",
      "secret_format": "text",
      "state_read": true,
      "state_write": true,
      "state_delete": false,
      "telemetry_scope": "node",
      "config_fields": "base_url:string,region:string"
    }
  },
  "locks": {}
}
```

For pack-owned components, use `gtc wizard --schema` and let the pack wizard delegate to `greentic-component wizard` through `component_wizard_answers`.

## Validate and Apply

Use validation before writing files:

```bash
greentic-component wizard validate --answers component-create-answers.json
```

Apply the same answer document when the plan is correct:

```bash
greentic-component wizard apply --answers component-create-answers.json
```

After implementing the real operations and QA validation rules, build and run doctor:

```bash
greentic-component build --manifest ./component.manifest.json
greentic-component doctor ./dist/ticket-client__0_6_0.wasm
```

## Good QA Practice

- Keep setup questions focused on values the component actually needs.
- Put secrets in `secret_requirements` through the wizard; do not store secret values in pack assets.
- Use i18n keys for labels, help text, and errors so setup UI can be localized.
- Validate required fields in `apply-answers`, not only in the UI.
- Return structured errors with field names so operators and coding agents can fix answers quickly.
- Re-run `greentic-component doctor` after QA or i18n changes.

## Next Steps

- [Components](/concepts/components/)
- [gtc wizard](/cli/wizard/)
- [greentic-component CLI](/reference/cli/greentic-component/)
