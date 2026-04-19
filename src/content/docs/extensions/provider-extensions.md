---
title: Provider Extensions
description: The 4th extension kind — ship messaging providers, event sources, and event sinks as signed .gtxpack artifacts.
---

Provider extensions are the fourth `.gtxpack` kind, added in Wave A of the
extensions rollout. Unlike `DesignExtension` / `BundleExtension` /
`DeployExtension` — which are pure WASM components consumed by the
designer — a `ProviderExtension` **also bundles a runtime `.gtpack`**: the
actual messaging or events adapter that `greentic-runner` executes.

One `.gtxpack` therefore ships two WASM payloads:

- A small **guest component** that the designer / `gtdx` / wizards call to
  enumerate channels, triggers, and events and to fetch their JSON schemas.
- A full **runtime `.gtpack`** (the same format greentic-runner already loads)
  containing the provider's send / receive / emit logic.

## What is a provider extension?

```
my-provider-0.1.0.gtxpack
├── describe.json         # metadata + runtime.gtpack pointer
├── extension.wasm        # guest component (channels/triggers/events schemas)
├── schemas/              # optional JSON schemas referenced from contributions
└── runtime/
    └── provider.gtpack   # the actual runtime pack (loaded by greentic-runner)
```

At install time, `gtdx install` verifies the bundled `.gtpack` against the
sha256 pinned in `describe.json`, then extracts the extension into
`~/.greentic/extensions/provider/<id>-<version>/` **and** drops the
runtime pack into `~/.greentic/runtime/packs/providers/gtdx/`. The
runtime polls that directory every 30 s, so a fresh install light up
in any running tenant that declares the pack in its bundle `.gmap`.

## The `runtime.gtpack` field

Every provider extension **must** set `runtime.gtpack` in `describe.json`:

```json
{
  "apiVersion": "greentic.ai/v1",
  "kind": "ProviderExtension",
  "metadata": {
    "id": "myco.my-provider",
    "version": "0.1.0",
    "…": "…"
  },
  "runtime": {
    "component": "extension.wasm",
    "memoryLimitMB": 128,
    "permissions": {
      "network": ["https://api.myprovider.com"],
      "secrets": ["api-key", "webhook-secret"],
      "callExtensionKinds": []
    },
    "gtpack": {
      "file": "runtime/provider.gtpack",
      "sha256": "abc123def456…",
      "pack_id": "myco.my-provider-runtime@0.1.0",
      "component_version": "0.6.0"
    }
  }
}
```

| Field               | Type    | Notes                                                                                 |
|---------------------|---------|---------------------------------------------------------------------------------------|
| `file`              | string  | Relative path inside the `.gtxpack`. Must exist and match `sha256`.                   |
| `sha256`            | string  | Exactly 64 lowercase hex characters. Computed via `sha256sum provider.gtpack`.        |
| `pack_id`           | string  | The `pack.yaml` / `manifest.cbor` pack id inside the `.gtpack`. Verified at install.  |
| `component_version` | string  | The `greentic:component@<ver>` the runtime WASM exports.                              |

**Schema invariant:** `kind == "ProviderExtension"` ↔ `runtime.gtpack is Some`.
The runtime rejects a `ProviderExtension` without `runtime.gtpack`, and
rejects any other kind that sets it. This is enforced at `describe.json`
deserialization — `gtdx validate` catches the mismatch before packing.

## The 6 worlds

The WIT contract at
[`greentic:extension-provider@0.1.0`](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/wit/extension-provider.wit)
exposes three interfaces — `messaging`, `event-source`, `event-sink` — and
six worlds covering every useful combination. Pick the world that matches
the capabilities your runtime actually implements:

| World                                      | Exports                              | Use for                                     |
|--------------------------------------------|--------------------------------------|---------------------------------------------|
| `messaging-only-provider`                  | `messaging`                          | Slack / Telegram / WhatsApp / WebChat style |
| `event-source-only-provider`               | `event-source`                       | Kafka consumers, webhook receivers, cron    |
| `event-sink-only-provider`                 | `event-sink`                         | Audit log writers, metric emitters, SIEM    |
| `messaging-and-event-source-provider`      | `messaging` + `event-source`         | Messaging with inbound trigger channels     |
| `messaging-and-event-sink-provider`        | `messaging` + `event-sink`           | Messaging with outbound event fan-out       |
| `full-provider`                            | all three                            | Generic integrations (e.g. enterprise bus)  |

Every world imports the shared host services (`extension-base/types`,
`extension-host/logging`, `extension-host/i18n`) and always exports
`extension-base/manifest` + `extension-base/lifecycle`.

`gtdx new --kind provider` scaffolds `messaging-only-provider` by default.
Switch to a different world by editing the `world` key in
`Cargo.toml` (`[package.metadata.component.target].world`) and the
`world` declaration in `wit/world.wit`.

## Interface: `messaging`

Implemented when your provider can **send or receive user messages** on
named channels.

```wit
interface messaging {
  use types.{channel-id, channel-profile, error};

  list-channels:    func()                                  -> list<channel-profile>;
  describe-channel: func(id: channel-id)                    -> result<channel-profile, error>;
  secret-schema:    func(id: channel-id)                    -> result<string, error>;
  config-schema:    func(id: channel-id)                    -> result<string, error>;
  dry-run-encode:   func(id: channel-id, sample: list<u8>)  -> result<list<u8>, error>;
}
```

| Function             | Responsibility                                                                                                                      |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `list-channels`      | Enumerate every channel the provider supports. The designer calls this to populate picker UIs.                                       |
| `describe-channel`   | Return the full `channel-profile` for one id (`direction`, `tier-support`, display name, metadata).                                 |
| `secret-schema`      | JSON Schema (as a string) for the secrets this channel needs (API key, webhook secret, OAuth token, …).                              |
| `config-schema`      | JSON Schema (as a string) for the channel config (recipient IDs, rate limits, template defaults).                                   |
| `dry-run-encode`     | Encode a sample payload without calling the external API. The wizard uses this to preview Adaptive Card tier downsampling.          |

A `channel-profile` carries:

- `id` — stable channel identifier
- `display-name` — human-readable label
- `direction` — `inbound` / `outbound` / `bidirectional`
- `tier-support` — list of Adaptive Card tiers the channel can render
  (`tier-a-native`, `tier-b-attachment`, `tier-c-fallback`, `tier-d-text-only`)
- `metadata` — key/value pairs for provider-specific extras

## Interface: `event-source`

Implemented when your provider produces **inbound trigger events** — HTTP
webhooks, scheduled timers, message-queue consumers, filesystem watchers.

```wit
interface event-source {
  use types.{trigger-id, trigger-profile, error};

  list-trigger-types: func()                      -> list<trigger-profile>;
  describe-trigger:   func(id: trigger-id)        -> result<trigger-profile, error>;
  trigger-schema:     func(id: trigger-id)        -> result<string, error>;
}
```

A `trigger-profile` declares the `id`, `display-name`, and `emit-shape`
(a JSON Schema describing the payload shape the trigger emits). Designers
use this to type-check downstream flow steps.

## Interface: `event-sink`

Implemented when your provider consumes **outbound events** — audit logs,
metrics, webhooks out, analytics pipelines.

```wit
interface event-sink {
  use types.{event-id, event-profile, error};

  list-event-types: func()                    -> list<event-profile>;
  describe-event:   func(id: event-id)        -> result<event-profile, error>;
  event-schema:     func(id: event-id)        -> result<string, error>;
}
```

An `event-profile` declares the `id`, `display-name`, and `payload-shape`
(JSON Schema for the payload the sink expects). Flows and bundles consult
this to validate emission sites.

## Workflow: build a provider extension

1. **Scaffold** the extension project:

   ```bash
   gtdx new my-provider --kind provider --id myco.my-provider
   cd my-provider
   ```

   Default world is `messaging-only-provider`. Edit `wit/world.wit` +
   `Cargo.toml` to switch worlds.

2. **Build the runtime `.gtpack`** separately. Providers typically reuse
   an existing runtime from
   [`greentic-messaging-providers`](../messaging-providers/overview/),
   or author a new one with `greentic-pack`:

   ```bash
   greentic-pack build --manifest runtime/pack.yaml \
     --output runtime/provider.gtpack
   ```

3. **Compute the sha256** of the runtime pack and pin it in `describe.json`:

   ```bash
   sha256sum runtime/provider.gtpack | cut -d' ' -f1
   ```

   Paste the value into `runtime.gtpack.sha256`. The hash must be
   **64 lowercase hex** characters — mixed case or wrong length fails
   deserialization.

4. **Implement the guest** in `src/lib.rs` — `list_channels`,
   `describe_channel`, `secret_schema`, `config_schema`, `dry_run_encode`
   (and the event-source / event-sink equivalents if your world exports
   them). See
   [How to Write a Provider Extension](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/docs/how-to-write-a-provider-extension.md)
   in the source repo for a full Telegram-style walkthrough.

5. **Build, validate, pack:**

   ```bash
   gtdx dev --once   # build + pack locally for smoke
   gtdx validate .
   ```

6. **Sign and publish:**

   ```bash
   gtdx publish --sign --key-id developer-01 --registry my-store
   ```

## Install-side behaviour

When `gtdx install <provider>.gtxpack` runs, it:

1. **Verifies the bundled `.gtpack` sha256** against
   `describe.runtime.gtpack.sha256`. A mismatch aborts the install.
2. **Extracts the extension** into `~/.greentic/extensions/provider/<id>-<version>/`.
   Contains `describe.json`, `extension.wasm`, and any declared assets.
3. **Extracts the runtime pack** into
   `~/.greentic/runtime/packs/providers/gtdx/<pack_id>.gtpack`. Refuses to
   overwrite an existing pack with the same `pack_id` unless `--force`.
4. **Registers the provider guest** with the extension registry so the
   designer can enumerate its channels / triggers / events.
5. **`greentic-runner` hot-loads** the new `.gtpack` via its 30 s pack-index
   polling loop — no restart required. Tenants that declare the pack in
   their bundle `.gmap` receive it on the next poll.

Uninstall reverses all of the above, including pulling the runtime pack
back out of `runtime/packs/providers/gtdx/`.

## Common pitfalls

- **`kind: "ProviderExtension"` missing.** Without this exact string,
  schema validation rejects `runtime.gtpack`. Any other kind with
  `runtime.gtpack` set also fails.
- **Stale sha256.** Rebuilt the runtime `.gtpack` but forgot to update
  `describe.runtime.gtpack.sha256`. Install fails with "hash mismatch."
- **Mixed-case hex.** sha256 must be lowercase. `SHA256SUM` output is
  already lowercase on Linux; Windows PowerShell produces uppercase — pipe
  through `ForEach-Object { $_.ToLower() }`.
- **Confusing extension WASM with runtime WASM.** The extension WASM is
  built with `cargo component` and runs in `gtdx` / the designer. The
  runtime WASM lives inside the `.gtpack` and runs in `greentic-runner`.
  They are different files, often in different crates.
- **`pack_id` mismatch.** `describe.runtime.gtpack.pack_id` must match the
  `pack_id` recorded inside the runtime pack's `manifest.cbor`. Use
  `greentic-pack inspect runtime/provider.gtpack` to read the canonical
  value.
- **`engine.greenticDesigner` missing.** Even for pure event-source
  providers, the field is required — set it to `"*"` to match any host.

## Related

- [Writing an Extension](./writing-extensions/) — shared scaffolding workflow
- [Publishing Extensions](./publishing-extensions/) — ship the `.gtxpack`
- [Messaging Providers overview](../providers/messaging/overview/) — reference runtime packs
- [`extension-provider.wit`](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/wit/extension-provider.wit) — canonical WIT contract
- [How to Write a Provider Extension](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/docs/how-to-write-a-provider-extension.md) — Telegram-style walkthrough
