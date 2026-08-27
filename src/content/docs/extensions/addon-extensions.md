---
title: Addon Extensions
description: Declare an infrastructure workload — Qdrant, Redis, Postgres — as an extension that a flow depends on.
---

An **addon** is a piece of infrastructure a flow depends on — a Qdrant, a Redis, a
Postgres — shipped as an extension. The addon *declares* the workload it needs and
*reconciles* day-2 state inside it; the **platform** does the provisioning. That split
is what lets one addon declaration serve both hosted and bring-your-own-cloud
placement.

## What does not work yet

Read this before writing one:

- **No platform implements `observe`, `plan`, or `apply` yet.** A shipped addon is
  inert today. Everything the contract says about platform behavior — plan/apply
  consistency enforcement, digest pinning, plan-time refusal on resource caps,
  capability gating — is a contract, not current behavior. Track the platform side at
  [greentic-designer-sdk#166](https://github.com/greenticai/greentic-designer-sdk/issues/166).
- **No released Designer can load one.** A describe bearing `contributions.addons[]`
  declares `MIN_DESIGNER_VERSION` 1.2.0, and no Designer release to date implements
  the addon surface — it is unloadable everywhere right now. See
  [Designer Compatibility](/extensions/designer-compatibility/).
- **Requires SDK 1.2.15 or newer.** 1.2.13 introduced the `addon` kind but shipped a
  scaffold whose own `build.sh` and `ci/local_check.sh` failed. 1.2.14 fixed that.

## Scaffold One

```bash
gtdx new my-cache --kind addon
gtdx dev
```

`gtdx new --kind addon` scaffolds 18 files at contract 0.3.0. It compiles with `cargo
component build` to a real wasm component, and passes `gtdx validate` and `gtdx lint`
unmodified — see [Writing Extensions](/extensions/writing-extensions/) for the
end-to-end inner loop and [What gtdx new Generates](/extensions/scaffold-layout/) for
what each scaffolded file is for.

## The Contract

The component implements `greentic:extension-addon@0.1.0`, exporting five interfaces
across six functions:

| function | pure? | what the scaffold does |
|---|---|---|
| `validation.validate-config` | yes | fully implemented |
| `validation.validate-desired-state` | yes | fully implemented |
| `workload.render-workload` | yes | fully implemented |
| `reconciler.plan` | yes | fully implemented |
| `reconciler.observe` | no | fails loudly |
| `reconciler.apply` | no | fails loudly |

That split is deliberate, not incomplete scaffolding. The four pure functions can be
implemented completely without a running instance of the addon, so the scaffold
implements them for real. `observe` and `apply` need a live backing service — there is
no Qdrant or Redis to talk to at scaffold time — so the scaffold refuses rather than
returning a success-shaped result for state it never touched. An author replacing the
scaffold must implement those two before the addon does anything.

### `plan` does not diff

`reconciler.plan` returns the full desired state amended with the addon's own
defaults, plus the paths that force a replace rather than an in-place update. It is
the **platform** that diffs `current` against that returned state, not the addon.

This is the easiest mistake to make: an author who returns only the changed subset
from `plan` will have every key they did not mention read by the platform as a
deletion.

## Backup Is a Second World, Not a Flag

WIT has no optional export, so an addon that supports backup and restore does not set
a flag — it implements a different world. `addon-extension-with-backup` exists
alongside `addon-extension` for exactly that.

Since 1.2.15, `gtdx lint` compares `describe.json`'s `supports_backup` against
`wit/world.wit` and reports a mismatch:

- `E_ADDON_BACKUP_NOT_EXPORTED` — `describe.json` claims backup support but the world
  does not export the backup interface.
- `W_ADDON_BACKUP_UNDECLARED` — the world exports the backup interface but
  `describe.json` does not advertise it.

Both checks read the *declared* world (`wit/world.wit`), not the built `.wasm` — a
mismatch between what you declare and what you actually compiled is not something
`gtdx lint` can see.

## The Catalogue

An addon extension advertises itself through `contributions.addons[]` in
`describe.json`. Each entry carries:

- `id`
- `family`
- `display_name`
- `description`
- `config_schema`
- `desired_state_schema`
- `outputs`
- `supports_backup`
- `schema_version`

`outputs` are consumed by interpolation into another resource's config —
`${resources.<id>.outputs.<name>}` — which is why they are scalars, and why marking a
sensitive one `sensitive: true` matters.

Lint rules for the catalogue entry:

- `E_ADDON_ID_PATTERN` — `id` fails the expected pattern.
- `E_ADDON_OUTPUT_NAME` — an output name is invalid.
- `E_ADDON_SECRET_IN_DESIRED_STATE` — a secret-shaped value appears in
  `desired_state_schema` (see below).
- `W_ADDON_FAMILY_UNKNOWN` — `family` is not one of the known families.

## Secrets Never Go in `desired_state_schema`

A credential placed in `desired_state_schema` can never be read back by `observe`, so
it diffs forever and no plan is ever clean. Credentials reach the addon through its
runtime binding instead, not through desired state. `gtdx lint` rejects a secret in
desired state, including nested cases, as `E_ADDON_SECRET_IN_DESIRED_STATE`.

## Two Directions for a Secret Reference

Getting these backwards is a real bug — the scaffold's own comments now guard against
it:

- In `container.env`, the guest **returns** `secret-ref(name)` as a *request*: the
  platform materializes the secret and injects it into the running workload. The guest
  never sees the value, and needs no `runtime.permissions.secrets` grant for it.
- In `reconciler.binding.outputs`, the guest **receives** `secret-ref(uri)` as a
  *pointer* to an existing value, resolved through `extension-host/secrets`. That read
  is what `runtime.permissions.secrets` authorizes.

One is the addon asking the platform for a secret to hand to the workload; the other
is the addon reading a secret the platform already resolved. Confusing the two either
leaks a value the guest should never see, or asks for a permission grant it doesn't
need.

## Conformance

`greentic-extension-sdk-testing` exports three assertions for addon reconcilers:

- `assert_apply_consistent`
- `assert_plan_idempotent`
- `assert_plan_stable`

A scaffolded project ships a test using the last two against its own `plan`.

Idempotency matters concretely here: a `plan` that normalizes an absent key to `{}`
on every call never converges — every subsequent reconcile finds "work" to do,
forever, even though nothing changed.

## Validate

```bash
gtdx validate .          # describe.json against its JSON Schema
gtdx lint                # cross-field invariants, including the addon rules above
gtdx publish --dry-run   # full build + pack + validate, no registry write
```

See [Publishing Extensions](/extensions/publishing-extensions/) for the full
validation and signing flow.
