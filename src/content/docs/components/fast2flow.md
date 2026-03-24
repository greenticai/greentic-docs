---
title: fast2flow
description: High-performance intent routing and flow dispatch extension
---

import { Aside } from '@astrojs/starlight/components';

## Overview

**fast2flow** is a high-performance routing extension that routes incoming messages to the appropriate flow using deterministic token-based scoring (BM25) with optional LLM fallback.

Core concept: A user sends a message like "refund please" → fast2flow checks tenant-specific indexes → returns a routing directive (`Dispatch`, `Respond`, `Deny`, or `Continue`).

**Key principles:**
- **Deterministic first** — Token-based BM25 scoring for predictable, explainable routing
- **Fail-open** — Errors, timeouts, or missing indexes produce a `Continue` directive
- **Time-bounded** — Hard timeout enforcement via `time_budget_ms`
- **Policy-driven** — Runtime behavior changes without code changes

## Architecture

```
Incoming Message
    │
    ▼
┌──────────────────────────────────────────────────┐
│                fast2flow Pipeline                 │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  1. Hook Filter                            │  │
│  │  Allow/deny lists, respond rules, policy   │  │
│  └────────────────────────────────────────────┘  │
│                      │                           │
│  ┌────────────────────────────────────────────┐  │
│  │  2. Index Lookup                           │  │
│  │  Load TF-IDF index for tenant scope        │  │
│  └────────────────────────────────────────────┘  │
│                      │                           │
│  ┌────────────────────────────────────────────┐  │
│  │  3. Deterministic Strategy (BM25)          │  │
│  │  Token scoring with title boosting (2x)    │  │
│  └────────────────────────────────────────────┘  │
│                      │                           │
│  ┌────────────────────────────────────────────┐  │
│  │  4. Confidence Gate                        │  │
│  │  min_confidence threshold check            │  │
│  └────────────────────────────────────────────┘  │
│                      │                           │
│  ┌────────────────────────────────────────────┐  │
│  │  5. LLM Fallback (optional)                │  │
│  │  OpenAI or Ollama for ambiguous cases      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
    │
    ▼
Routing Directive (Dispatch / Respond / Deny / Continue)
```

## Routing Directives

Every routing decision produces one of four directives:

| Directive | Purpose | Fields |
|-----------|---------|--------|
| `dispatch` | Route to a specific flow | `target`, `confidence`, `reason` |
| `respond` | Return an immediate response | `message` |
| `deny` | Block the request | `reason` |
| `continue` | No decision — let the caller handle it | — |

```json
// Dispatch to a flow
{"type": "dispatch", "target": "support-pack:refund_request", "confidence": 0.92, "reason": "BM25 match"}

// Auto-respond without routing
{"type": "respond", "message": "Use the self-service refund form at /refund."}

// Block the request
{"type": "deny", "reason": "Denied by scope policy"}

// Pass through (fail-open default)
{"type": "continue"}
```

## Installation

fast2flow is distributed as a `.gtpack` artifact via GHCR:

```bash
# Pull from GHCR
oras pull ghcr.io/greentic-biz/providers/routing-hook/fast2flow.gtpack:latest

# Or reference a specific version
oras pull ghcr.io/greentic-biz/providers/routing-hook/fast2flow.gtpack:v0.4.6
```

The pack registers a `post_ingress` hook that intercepts messages before they reach any flow.

## WASM Components

fast2flow ships three WASM components (targeting `wasm32-wasip2`):

| Component | Purpose | Operation |
|-----------|---------|-----------|
| **Indexer** | Builds a searchable TF-IDF index from flow metadata | `build`, `update` |
| **Matcher** | Fast BM25-based intent matching against the index | `match` |
| **Router** | Orchestrates the full routing pipeline | `route` |

These components are coordinated by three flows defined in the pack:

```yaml
# flows/index.ygtc  — Runs at deploy time to build indexes
# flows/match.ygtc  — Runtime BM25 intent matching
# flows/route.ygtc  — Full routing pipeline with LLM fallback
```

## Bundle Workflow

fast2flow indexes flows from your bundle's `.ygtc` files. The indexer scans your bundle directory, extracts metadata (title, description, tags), and builds a TF-IDF index with BM25 scoring.

### Bundle Structure

```
my-bundle/
├── packs/
│   ├── support-pack/
│   │   └── flows/
│   │       ├── refund.ygtc
│   │       ├── shipping.ygtc
│   │       └── faq.ygtc
│   └── hr-pack/
│       └── flows/
│           ├── leave.ygtc
│           └── booking.ygtc
```

### Flow Definition (`.ygtc`)

Each flow file provides the metadata used for intent matching:

```yaml title="refund.ygtc"
id: refund_request
title: Process Refund Request
description: Handle customer refund requests for orders and payments
type: messaging
tags:
  - refund
  - payment
  - billing
  - return
start: collect_info

nodes:
  collect_info:
    templating.handlebars:
      text: "Please provide your order number for the refund."
    routing:
      - out: true
```

<Aside type="tip">
Title words receive a 2x TF-IDF boost, so choose descriptive titles for better routing accuracy.
</Aside>

### Building the Index

Use the CLI to build an index from your bundle:

```bash
greentic-fast2flow bundle index \
  --bundle ./my-bundle \
  --output ./state/indexes \
  --tenant demo \
  --team default \
  --verbose
```

This produces:
- `index.json` — TF-IDF index with term frequencies and document frequencies
- `intents.md` — Human-readable intent documentation

### Validating a Bundle

```bash
greentic-fast2flow bundle validate --bundle ./my-bundle
```

## Policy Configuration

Policies control routing behavior at runtime without code changes. They are JSON files loaded from `/mnt/registry/fast2flow-policy.json` or a custom path.

### Policy Structure

```json title="fast2flow-policy.json"
{
  "stage_order": ["scope", "channel", "provider"],
  "default": {
    "min_confidence": 0.5,
    "llm_min_confidence": 0.5,
    "candidate_limit": 20
  },
  "scope_overrides": [],
  "channel_overrides": [],
  "provider_overrides": []
}
```

### Policy Rules

All rule fields are optional — only specified fields are applied:

| Field | Type | Description |
|-------|------|-------------|
| `min_confidence` | `f32` | Minimum BM25 score to dispatch (0.0–1.0) |
| `llm_min_confidence` | `f32` | Minimum LLM confidence to dispatch (0.0–1.0) |
| `candidate_limit` | `usize` | Maximum candidates to evaluate |
| `allow_channels` | `string[]` | Whitelist channels (null = allow all) |
| `deny_channels` | `string[]` | Blacklist channels |
| `allow_providers` | `string[]` | Whitelist providers (null = allow all) |
| `deny_providers` | `string[]` | Blacklist providers |
| `allow_scopes` | `string[]` | Whitelist scopes (null = allow all) |
| `deny_scopes` | `string[]` | Blacklist scopes |
| `respond_rules` | `object[]` | Auto-respond rules (keyword matching) |

### Override Examples

Overrides are applied in stage order (scope → channel → provider) with priority sorting within each stage.

**Scope override** — stricter confidence for a VIP tenant:

```json
{
  "id": "vip-tenant",
  "priority": 10,
  "scope": "tenant-vip",
  "rules": {
    "min_confidence": 0.8,
    "candidate_limit": 10
  }
}
```

**Channel override** — auto-respond on email channel:

```json
{
  "id": "email-autorespond",
  "priority": 20,
  "channel": "email",
  "rules": {
    "respond_rules": [
      {
        "needle": "refund",
        "message": "Refund requests via email take 3–5 business days. Use chat for instant support.",
        "mode": "contains"
      }
    ]
  }
}
```

**Provider override** — restrict to specific provider:

```json
{
  "id": "slack-only",
  "priority": 30,
  "provider": "slack",
  "rules": {
    "deny_providers": ["telegram"]
  }
}
```

### Respond Rules

Auto-respond rules match text before the routing pipeline runs:

```json
{
  "needle": "business hours",
  "message": "Our business hours are Mon–Fri 9AM–5PM UTC.",
  "mode": "contains"
}
```

Supported modes: `exact`, `contains` (default), `regex`.

### Policy Management CLI

```bash
# Print default policy
greentic-fast2flow policy print-default

# Validate a policy file
greentic-fast2flow policy validate --file ./my-policy.json
```

## LLM Fallback

When the deterministic BM25 strategy produces low confidence scores, fast2flow can fall back to an LLM for classification.

| Provider | Environment Variables |
|----------|---------------------|
| **OpenAI** | `FAST2FLOW_OPENAI_API_KEY_PATH`, `FAST2FLOW_OPENAI_MODEL_PATH` |
| **Ollama** | `FAST2FLOW_OLLAMA_ENDPOINT_PATH`, `FAST2FLOW_OLLAMA_MODEL_PATH` |
| **Disabled** | `FAST2FLOW_LLM_PROVIDER=disabled` (default) |

```bash
# Enable OpenAI fallback
FAST2FLOW_LLM_PROVIDER=openai \
FAST2FLOW_OPENAI_API_KEY_PATH=/run/secrets/openai-key \
greentic-fast2flow-routing-host < request.json
```

<Aside type="caution">
LLM providers are only available in the native host binary. WASM component runtime requires `FAST2FLOW_LLM_PROVIDER=disabled`.
</Aside>

## CLI Reference

### Bundle Commands

```bash
# Build TF-IDF index from bundle
greentic-fast2flow bundle index \
  --bundle ./my-bundle \
  --output ./indexes \
  --tenant demo \
  --team default \
  --generate-docs \
  --verbose

# Validate bundle has indexable flows
greentic-fast2flow bundle validate --bundle ./my-bundle
```

### Index Commands

```bash
# Build index from flow definitions JSON
greentic-fast2flow index build \
  --scope tenant-a \
  --flows flows.json \
  --output /tmp/indexes

# Inspect a built index
greentic-fast2flow index inspect \
  --scope tenant-a \
  --input /tmp/indexes
```

### Route Commands

```bash
# Simulate a routing decision
greentic-fast2flow route simulate \
  --scope tenant-a \
  --text "I need a refund" \
  --indexes-path /tmp/indexes
```

### Policy Commands

```bash
# Print default policy template
greentic-fast2flow policy print-default

# Validate policy file
greentic-fast2flow policy validate --file policy.json
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FAST2FLOW_LLM_PROVIDER` | `disabled` | LLM provider: `disabled`, `openai`, `ollama` |
| `FAST2FLOW_POLICY_PATH` | `/mnt/registry/fast2flow-policy.json` | Policy file path |
| `FAST2FLOW_TRACE_POLICY` | — | Set to `1` to emit policy trace to stderr |
| `FAST2FLOW_MIN_CONFIDENCE` | `0.5` | Default minimum confidence threshold |
| `FAST2FLOW_LLM_MIN_CONFIDENCE` | `0.5` | Default LLM minimum confidence |
| `FAST2FLOW_CANDIDATE_LIMIT` | `20` | Default max candidates |

## Performance

fast2flow is optimized for low-latency routing:

| Stage | Typical Latency |
|-------|----------------|
| Hook filter (allow/deny) | < 0.1ms |
| BM25 index lookup | < 1ms |
| Policy resolution | < 0.1ms |
| LLM fallback (if enabled) | 200–500ms |

<Aside type="tip">
Start with deterministic BM25 routing. Only enable LLM fallback if your flows have overlapping intents that BM25 cannot distinguish.
</Aside>

## Best Practices

1. **Write descriptive titles** — Title words get 2x TF-IDF boost for better scoring
2. **Use specific tags** — Tags are the primary signal for BM25 matching
3. **Set appropriate thresholds** — Start with `min_confidence: 0.5` and tune up
4. **Use policies for overrides** — Change behavior per scope/channel/provider without redeploying
5. **Monitor Continue rate** — High `Continue` output indicates gaps in your flow coverage
6. **Keep LLM as fallback** — Deterministic routing is faster and more predictable

## Next Steps

- [Flows Guide](/concepts/flows/) — Learn about `.ygtc` flow definitions
- [Packs Guide](/concepts/packs/) — Understand `.gtpack` distribution
- [Control Chains Reference](/reference/control-chains/) — Hook registration and policies
