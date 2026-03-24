---
title: Introduction to Greentic
description: Learn about Greentic, the WASM-component-based platform for AI-driven digital workers
---

## What is Greentic?

Greentic is a **WASM-component-based, multi-tenant platform** for building and running AI-driven digital workers. These digital workers are autonomous agentic automation pipelines that can handle complex workflows across multiple channels and services.

## Key Characteristics

### WebAssembly-First Architecture

Greentic uses **WebAssembly (WASI Preview 2)** for sandboxed, portable execution of:
- Flow nodes
- Messaging providers
- Event providers
- MCP tools

This means components are:
- **Portable** - Write once, run anywhere
- **Secure** - Sandboxed execution environment
- **Fast** - Near-native performance
- **Language-agnostic** - Build in Rust, Go, or any WASM-compatible language

### Multi-Tenant by Design

Every aspect of Greentic is designed for multi-tenancy:
- **TenantCtx** - Tenant context flows through all operations
- **Isolated sessions** - Each tenant's data is completely isolated
- **Flexible deployment** - Single-tenant or multi-tenant configurations

### Flow-Based Orchestration

Workflows are defined as **directed graphs** in YAML files (`.ygtc`):
- Visual, declarative pipeline definitions
- Composable node components
- Control flow with branches and conditions
- Resumable sessions

## Platform Components

| Component | Purpose |
|-----------|---------|
| **greentic-runner** | Production runtime host |
| **greentic-flow** | Flow schema, IR, loader, validator |
| **greentic-pack** | Pack builder CLI |
| **greentic-component** | Component authoring CLI |
| **greentic-mcp** | MCP executor / WASI bridge |

## Tech Stack

| Aspect | Technology |
|--------|------------|
| Language | Rust (edition 2024) |
| Async Runtime | Tokio v1 |
| WASM Runtime | Wasmtime v41 |
| WASM Target | `wasm32-wasip2` |
| HTTP Server | Axum v0.8 |
| Messaging Bus | NATS |
| Serialization | serde + CBOR + YAML |

## Use Cases

Greentic excels at building:

1. **Customer Service Bots** - Multi-channel support across Slack, Teams, WhatsApp
2. **IT Helpdesk Automation** - Ticket routing, password resets, status queries
3. **HR Assistants** - Leave requests, policy queries, onboarding workflows
4. **Sales Automation** - Lead qualification, CRM integration
5. **Event-Driven Workflows** - Webhook handlers, scheduled tasks, notifications

## Next Steps

- [Quick Start Guide](/greentic-docs/getting-started/quick-start/) - Get your first digital worker running
- [Installation](/greentic-docs/getting-started/installation/) - Detailed installation instructions
- [Architecture Overview](/greentic-docs/concepts/architecture/) - Deep dive into the platform architecture
