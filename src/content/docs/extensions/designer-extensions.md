---
title: Extension Catalog and Wizard
description: Use the extension catalog and gtc wizard to scaffold Greentic extension packs.
---

The extension catalog is the data source behind the wizard's extension-pack flow. It maps user-facing extension types to the canonical manifest entries Greentic understands.

Use it through `gtc wizard`; do not hand-author catalog internals unless you are maintaining Greentic tooling.

## Wizard Entry Points

Interactive authoring:

```bash
gtc wizard
```

Agentic and CI authoring:

```bash
gtc wizard --schema
gtc wizard --answers extension-pack-answers.json
```

The launcher schema includes the embedded pack and bundle answer schemas. Coding agents should fetch this schema first, generate an answers file that matches it, and replay the wizard non-interactively.

## What the Catalog Provides

Each extension type can define:

- a stable type id such as `messaging`, `events`, `secrets`, or `deployer`
- the canonical manifest key to write
- localized names and descriptions
- questions for the wizard
- templates for scaffolded files
- plan steps such as creating directories, writing files, delegating component or flow creation, and running CLI commands

The wizard writes generated extension answers as JSON under `extensions/` and merges the validated extension payload into `pack.yaml`.

## Catalog Types

The current catalog covers:

- `messaging`
- `events`
- `oauth`
- `mcp`
- `state`
- `telemetry`
- `secrets`
- `admin`
- `control`
- `observer`
- `deployer`
- `runtime-capability`
- `contract`
- `ops`
- `capability-offer`
- `custom-scaffold`

Most types map to `greentic.ext.capabilities.v1`. The deployer type maps to `greentic.deployer.v1`.

## Default and Custom Catalogs

The wizard can use the bundled catalog, check a catalog source, or use an explicit catalog reference when that is supported by the answer schema. Catalog references may be local files, fixtures, or registry-backed sources depending on the CLI build.

For normal extension authoring, prefer the bundled/default catalog exposed by `gtc wizard`. For automation, pin the answers file and validate it with the schema before applying it.

## Design-Time Extensions

The `gtc wizard` catalog above scaffolds **extension packs** (`.gtpack`) that provide platform capabilities — messaging, events, secrets, deployers, and the other catalog types.

Separately, Greentic has **design-time extensions** (`.gtxpack`) that surface inside the Designer and are consumed by agentic workers: tools, guardrails, and composers. These are authored with the `gtdx` CLI (`gtdx new --kind design` for a design extension; other kinds include `mcp`, `llm`, `provider`, `deploy`, `bundle`, and `wasm-component`) and published to the store. Once registered, the Designer surfaces them in the flow-editor and the agentic-worker pickers.

- Design extensions (tools, guardrails, composers): [Writing Extensions](/extensions/writing-extensions/) and [Guardrail Extensions](/extensions/guardrail-extensions/)
- The `gtdx` CLI: [gtdx CLI](/extensions/gtdx-cli/)
- Local-WASM MCP tools (`gtdx new --kind mcp`): [Creating MCP Tools](/mcp/creating-tools/)
