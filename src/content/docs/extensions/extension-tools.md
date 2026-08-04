---
title: Extension Tools and Node Types
description: Declare tools in describe.json so they surface to agentic workers and flows — capabilities, schemas, and why a tool can be invocable but invisible.
---

An extension contributes to the platform through two independent blocks in its
`describe.json`:

- **`contributions.tools[]`** — callable tools, offered to an **agentic worker's** LLM
  and/or to the **flow** surface.
- **`contributions.nodeTypes[]`** — node types the flow editor shows as draggable blocks.

They are separate. Declaring a tool does not create a node, and declaring a node type does
not create a tool.

The [describe.json Manifest](/reference/describe-json/) reference is generated from the JSON
Schema and lists every top-level field, but it declares the contribution arrays as untyped —
the schema does not constrain their element shapes. This page is where those elements are
specified.

## Tools live in describe.json, not in Rust

For an extension whose manifest declares `"apiVersion": "greentic.ai/v2"`, the runtime
reads the tool list **only** from `describe.json`. The component's `list-tools` WIT export
is never called.

This is the single most common authoring mistake: a `ToolMeta` built in `src/lib.rs` with a
`capabilities` vector compiles fine, ships fine, and is then completely ignored. Everything
the platform knows about a tool — its name, description, argument schema, capabilities,
secrets, and planning metadata — comes from the manifest.

Older `apiVersion: greentic.ai/v1` extensions still use the WIT `list-tools` path. If you
are writing a new extension, use v2 and declare tools in the manifest.

## Declaring a tool

```jsonc title="describe.json"
{
  "apiVersion": "greentic.ai/v2",
  "contributions": {
    "tools": [
      {
        "name": "tx_resolve_prefix",
        "export": "greentic:extension-design/tools.invoke-tool",
        "runtime_ref": "telco-x-tools",
        "capabilities": ["agentic_worker", "flow"],
        "description": "Resolve a network prefix to its canonical Telco-X prefix resource.",
        "input_schema": "{\"type\":\"object\",\"required\":[\"query\"],\"properties\":{\"query\":{\"type\":\"string\",\"description\":\"A prefix such as 10.0.0.0/8\"}}}",
        "secret_requirements": [{ "key": "telcox/api_token" }]
      }
    ]
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | The name the LLM calls, and the `tool_name` in an `AgentConfig` allow-list. |
| `export` | yes | The WIT export to dispatch through. |
| `runtime_ref` | no | Which declared component to dispatch to. Omit when the extension declares exactly one. |
| `capabilities` | **effectively yes** | Which surfaces offer the tool. See below — the default is not what most authors want. |
| `description` | **effectively yes** | Shown to the LLM. Absent means the model sees a tool it cannot reason about. |
| `input_schema` | **effectively yes** | JSON Schema, **serialized as a string**. Becomes the LLM function `parameters`. |
| `output_schema` | no | JSON Schema string. |
| `secret_requirements` | no | Credentials the tool needs; `key` is a path such as `tavily/api_key`. |
| `agentic_worker_metadata` | no | Planning hints — see [below](#planning-metadata). |

`description` and `input_schema` are optional in the schema but not in practice: without
them the tool reaches the model nameless and parameterless. The runtime emits a warning at
load time for each — check your designer or runner boot log before assuming a tool is fine.

The manifest rejects unknown fields outright, so a typo in a key fails the parse rather than
being silently dropped. Validate with `gtdx validate` and `gtdx lint`.

## The two capability surfaces

`capabilities` is a list of surfaces. There are two:

| Value | Surface |
| --- | --- |
| `agentic_worker` | The agentic worker's tool list, and the Designer's **Tools → Add extension** picker. |
| `flow` | The flow surface, including the Designer's chat tool loop. |

**When `capabilities` is absent, consumers default to `["flow"]`.** A tool with no declared
capabilities is therefore invisible to every agentic worker — silently, because defaulting
is not an error. This is the usual reason a freshly written tool never appears in the
composer.

To appear on both surfaces, declare both:

```jsonc
"capabilities": ["agentic_worker", "flow"]
```

The same literal gates the packaged worker: a Digital Worker manifest keeps only the
`extension_tools` entries that declare `agentic_worker`, and drops flow-only tools.

## Why a working tool can still be invisible

Capability is necessary but not sufficient. Before the Designer offers an extension's tools
in the picker, it also requires the extension to be:

1. **Enabled** — present and enabled in `~/.greentic/extensions-state.json`, and not turned
   off by a per-tenant override.
2. **Admin-allowed** — in the tenant's allow-set when running against a Greentic Admin
   backend. With no admin backend configured this check fails open and everything shows.

Direct dispatch does not apply any of these checks — it resolves a tool by name. So an
extension can invoke perfectly while being absent from the entire UI. If a tool works when
called directly but never appears in a picker, check enablement and the tenant allow-set
before suspecting the manifest.

This page assumes the extension is loaded in the first place. If the extension itself is
missing from `/api/extensions` — no tools at all, rather than the wrong ones — that is a
different problem: see [Designer Compatibility](/extensions/designer-compatibility/), where
a Designer older than 1.2.0 skips a `greentic.ai/v2` describe at boot.

## Planning metadata

`agentic_worker_metadata` carries hints the worker's planning layer reads: `usage_hint`,
`examples`, `side_effects`, `cost`, and `confirmation_required`.

It crosses the contract boundary as an **opaque JSON string**, and a value outside the
contract drops the **entire** blob rather than the offending field. Only these values are
valid:

- `side_effects`: `none`, `read`, `write`, `external`
- `cost`: `low`, `medium`, `high`
- `confirmation_required`: boolean
- `examples[]`: objects of exactly `{ "when": …, "input": … }`

When a tool declares the `agentic_worker` capability but ships no metadata, the runtime
applies conservative defaults — `side_effects: external`, `confirmation_required: true`,
`cost: medium` — so an undeclared tool is treated as risky, not as safe.

## Node types are a different block

Flow-editor blocks come from `contributions.nodeTypes[]` and are served to the editor from
the node-type registry. That registry is built end to end from extension declarations —
there is no built-in fallback list, so a node type that is not declared in some installed
extension's manifest does not exist in the editor.

If your goal is a draggable block on the flow canvas, add `nodeTypes`. Adding the `flow`
capability to a tool does not do it.

## Checklist

- `apiVersion` is `greentic.ai/v2`, and tools are declared in `contributions.tools[]`.
- Every tool declares `capabilities` explicitly — never rely on the `["flow"]` default.
- Every tool has a `description` and a stringified `input_schema`.
- `agentic_worker_metadata`, if present, uses only contract-valid enum values.
- `gtdx validate` and `gtdx lint` pass.
- The extension is enabled, and allowed for the tenant when running against an admin.

See [Writing Extensions](/extensions/writing-extensions/) for the authoring loop and
[Agentic Workers](/concepts/agentic-workers/) for wiring a worker that uses these tools.
