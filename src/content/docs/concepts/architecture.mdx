---
title: Architecture Overview
description: Understand the Greentic platform architecture
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## High-Level Architecture

Greentic follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Messaging Channels                    │
│         (Slack, Teams, Telegram, WhatsApp, WebChat)     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Gateway (HTTP/NATS)                    │
│                 Public Endpoint Router                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    greentic-runner                       │
│           (Production Runtime Host)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Flow Executor                       │    │
│  │         (Wasmtime Component Model)              │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Session Manager                        │    │
│  │         (Memory / Redis)                         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    WASM Components                       │
│    (Flows, Providers, MCP Tools, Custom Components)     │
└─────────────────────────────────────────────────────────┘
```

## Core Components

<CardGrid>
  <Card title="greentic-runner" icon="rocket">
    The main production runtime that hosts and executes flows, manages sessions, and coordinates all platform services.
  </Card>
  <Card title="greentic-flow" icon="random">
    Flow schema definition, intermediate representation (IR), loader, and validator for `.ygtc` files.
  </Card>
  <Card title="greentic-pack" icon="puzzle">
    Pack builder CLI for creating signed `.gtpack` archives containing flows, components, and assets.
  </Card>
  <Card title="greentic-component" icon="setting">
    Component authoring CLI and runtime utilities for building WASM components.
  </Card>
</CardGrid>

## Runtime Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **WASM Runtime** | Wasmtime v41 | Component model execution |
| **Async Runtime** | Tokio v1 | Async I/O, task scheduling |
| **HTTP Server** | Axum v0.8 | REST API, webhooks |
| **Message Bus** | NATS | Event distribution, pub/sub |
| **Session Store** | Memory/Redis | Flow state persistence |
| **Secrets** | AWS/Azure/GCP/Vault | Credential management |

## Data Flow

### Inbound Message Flow

```
1. External Message (e.g., Slack)
   │
2. Webhook Handler (Provider Ingress)
   │
3. NATS: greentic.messaging.ingress.{env}.{tenant}.{team}.{channel}
   │
4. Flow Router (tenant/team resolution)
   │
5. Flow Executor (WASM component execution)
   │
6. Session State Update
   │
7. Reply/Action Nodes
   │
8. NATS: greentic.messaging.egress.{env}.{tenant}.{team}.{channel}
   │
9. Provider Egress → External Service
```

### Pack Loading Flow

```
1. Bundle Configuration (greentic.demo.yaml)
   │
2. Pack Resolver (local/OCI registry)
   │
3. Signature Verification (ed25519-dalek)
   │
4. CBOR Metadata Parsing
   │
5. WASM Component Instantiation
   │
6. WIT Interface Binding
   │
7. Runtime Registration
```

## Multi-Tenancy Model

Greentic implements tenant isolation at every layer:

```
Tenant
  └── Environment (prod, staging, dev)
        └── Team
              └── Channel (messaging provider instance)
                    └── Session (user conversation state)
```

### TenantCtx

The `TenantCtx` struct flows through all operations:

```rust
pub struct TenantCtx {
    pub tenant_id: String,
    pub env_id: String,
    pub team_id: Option<String>,
}
```

## WIT Interface Architecture

Greentic uses the **WebAssembly Interface Types (WIT)** specification for defining component interfaces:

```wit
// greentic-interfaces/wit/component.wit
package greentic:component;

interface types {
    record message {
        id: string,
        content: string,
        sender: string,
        timestamp: u64,
    }

    record outcome {
        success: bool,
        data: option<string>,
        error: option<string>,
    }
}

world component {
    import types;
    export execute: func(input: types.message) -> types.outcome;
}
```

## Service Dependencies

```
greentic-types  ─────────────────────────── (foundation)
    ↑
greentic-telemetry
greentic-interfaces ← greentic-types
greentic-config ← greentic-types
    ↑
greentic-session ← greentic-types
greentic-state ← greentic-types + greentic-interfaces
greentic-flow ← greentic-interfaces + greentic-types
    ↑
greentic-pack ← greentic-flow + greentic-types
greentic-component ← greentic-interfaces + greentic-types
greentic-mcp ← greentic-interfaces + greentic-types
    ↑
greentic-runner ← ALL of the above
```

## Observability

Greentic uses **OpenTelemetry** for distributed tracing and metrics:

- **Tracing**: OTLP exporter for distributed trace correlation
- **Metrics**: Flow execution times, message throughput, error rates
- **Logging**: Structured logging with trace context

## Next Steps

- [Flows](/concepts/flows/) - Learn about flow definitions
- [Packs](/concepts/packs/) - Understand pack structure
- [Components](/concepts/components/) - Build custom WASM components
