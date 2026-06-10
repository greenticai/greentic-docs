---
title: Introduction to Greentic
description: Build, run, and control an army of AI-driven digital workers across messaging platforms, event sources, tenants, and clouds
---

## What is Greentic?

Greentic is a **WASM-component-based, multi-tenant platform** for building and running AI-driven digital workers.

Think of it as a control plane for your own army of digital workers: specialized agents that can talk to people, listen for business events, call tools, integrate with external systems, and execute repeatable workflows under your rules. A worker might triage customer questions in Slack, process an order webhook, update a CRM, ask a human for approval in Teams, trigger a downstream API, and leave a full trace of what happened.

Greentic is designed for serious automation work: many tenants, many channels, many languages, strong isolation, observable execution, and deployment wherever your organization needs it.

## Why Greentic?

Most automation platforms force a tradeoff between speed, control, and portability. Greentic is built so you can move fast without giving up the operational properties that matter in production.

- **Create digital workers for real business processes** - Build assistants, agents, routers, processors, and event handlers that interact with people and systems.
- **Integrate with external systems** - Connect workers to APIs, MCP tools, SaaS platforms, internal services, databases, ticketing systems, CRMs, ERPs, and custom backends.
- **Support many tenants** - Isolate organizations, environments, teams, channels, sessions, state, and secrets.
- **Build in multiple languages** - Use Rust, Go, JavaScript, Python, or any language that can compile to WebAssembly components.
- **Run anywhere** - Deploy locally, in AWS, Azure, Google Cloud, across all three clouds, or through your own custom deployer.
- **Stay in control** - Package, validate, version, sign, inspect, and operate workers as explicit Greentic packs.
- **Observe everything** - Trace flows, measure execution, follow errors, and connect telemetry to your existing observability stack.
- **Keep execution contained** - Use WebAssembly sandboxing, tenant context, scoped secrets, and provider boundaries to reduce blast radius.

## Key Characteristics

### Digital Workers with Real Reach

Greentic workers are not limited to chat. They can be started by conversations, webhooks, schedules, email events, SMS events, API calls, and other event sources. Once running, they can call components and tools that integrate with the systems your organization already uses.

That means a single worker can combine:

- Conversation handling
- Tool calls
- Human approvals
- External API integration
- Event-driven processing
- Multi-step flow state
- Tenant-aware data access
- Auditable outcomes

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
- **Language-agnostic** - Build in Rust, Go, JavaScript, Python, or any WASM-compatible language

### Multi-Tenant by Design

Every aspect of Greentic is designed for multi-tenancy:
- **TenantCtx** - Tenant context flows through all operations
- **Isolated sessions** - Each tenant's data is completely isolated
- **Flexible deployment** - Single-tenant or multi-tenant configurations
- **Scoped providers** - Messaging, events, state, and secrets can be configured per tenant and environment

### Multi-Language and i18n

Greentic treats "multi-language" in two separate ways:

- **Implementation languages** - Workers and reusable operations run as WebAssembly components, so teams can build components in Rust, Go, JavaScript, Python, or any language that can target WASI Preview 2.
- **User-facing languages** - Cards, prompts, messages, WebChat labels, and other user-visible strings can be translated and resolved by locale at runtime.

i18n is packaged with the worker instead of being an afterthought. Application packs can include locale files under assets, Adaptive Cards can have strings extracted into translation bundles, and WebChat can enable bundle-level locale assets with the `greentic.cap.webchat.i18n.v1` capability. This lets one digital worker serve multiple languages without forking the pack for each market or tenant.

At runtime, Greentic resolves language from context. A session can carry a locale, teams and tenants can define defaults, and the platform falls back to the global default when no narrower locale is available. Translatable strings can use deterministic `I18nId` values, so the same source string produces a stable translation key across builds, tools, and languages.

The practical flow is:

1. Extract translatable strings from cards, templates, or source assets.
2. Generate or maintain locale JSON files such as `en.json`, `fr.json`, `de.json`, or `ja.json`.
3. Package those files into an application pack or scaffold them into bundle-level assets.
4. Let the runtime choose the right text for the current tenant, team, session, or WebChat locale.

### Flow-Based Orchestration

Workflows are defined as **directed graphs** in YAML files (`.ygtc`):
- Visual, declarative pipeline definitions
- Composable node components
- Control flow with branches and conditions
- Resumable sessions
- Triggered by messages, events, schedules, and external systems

### Observable, Controlled, and Secure

Greentic is built for operators as much as builders:

- **Observability** - OpenTelemetry tracing, structured logs, metrics, flow execution timings, throughput, and error rates
- **Control** - Pack validation, explicit configuration, versioned bundles, provider setup flows, and runtime registration
- **Security** - WASM sandboxing, tenant isolation, scoped secrets, signed packs, and provider-level boundaries
- **Governance** - Clear deployment artifacts, reproducible packs, and auditable worker behavior

## Platform Components

| Component | Purpose |
|-----------|---------|
| **greentic-runner** | Production runtime host |
| **greentic-flow** | Flow schema, IR, loader, validator |
| **greentic-pack** | Pack builder CLI |
| **greentic-component** | Component authoring CLI |
| **greentic-mcp** | MCP executor / WASI bridge |

## Messaging Platforms

Greentic workers can meet users where they already work. Supported messaging providers include:

- **Slack**
- **Microsoft Teams**
- **Telegram**
- **WhatsApp Business**
- **WebChat** for embedded website chat
- **Cisco Webex**
- **Email**

All messaging providers normalize incoming and outgoing messages so your flows can stay portable across channels.

## Event Sources

Digital workers can also start without a chat message. Greentic event providers can kickstart flows from:

- **Webhooks** from external services
- **Timers and cron schedules**
- **Email events through SendGrid**
- **SMS events through Twilio**
- **Custom event providers** implemented as WASM components

This lets you build workers that respond to orders, incidents, form submissions, alerts, scheduled jobs, lifecycle events, and any other system signal.

## Deployment Anywhere

Greentic is designed to run in the environment that fits your organization:

- **Local development** for fast iteration
- **Single cloud** deployments on AWS, Azure, or Google Cloud
- **Multi-cloud** deployments spanning all three major clouds
- **Private infrastructure** for regulated or air-gapped environments
- **Custom deployers** when your platform team already owns the release path

Because workers, providers, and tools are packaged as portable components, you can keep your automation model consistent while changing the deployment target underneath it.

## Tech Stack

| Aspect | Technology |
|--------|------------|
| Language | Rust (edition 2024) |
| Async Runtime | Tokio v1 |
| WASM Runtime | Wasmtime v41 |
| WASM Target | `wasm32-wasip2` |
| HTTP Server | Axum v0.8 |
| Message Routing | Internal runtime routing |
| Serialization | serde + CBOR + YAML |

## Use Cases

Greentic excels at building:

1. **Customer Service Bots** - Multi-channel support across Slack, Teams, WhatsApp
2. **IT Helpdesk Automation** - Ticket routing, password resets, status queries
3. **HR Assistants** - Leave requests, policy queries, onboarding workflows
4. **Sales Automation** - Lead qualification, CRM integration
5. **Event-Driven Workflows** - Webhook handlers, scheduled tasks, notifications
6. **Operations Digital Workers** - Incident response, approvals, enrichment, and remediation
7. **Back-Office Automation** - Finance, procurement, compliance, and document workflows
8. **Platform Integrations** - Internal tools that connect APIs, queues, messaging, and human decisions

## Next Steps

- [Quick Start Guide](/getting-started/quick-start/) - Get your first digital worker running
- [Multi-Language and i18n](/getting-started/multilanguage-i18n/) - Learn how locale, translation assets, and tenant context work
- [Installation](/getting-started/installation/) - Detailed installation instructions
- [Architecture Overview](/concepts/architecture/) - Deep dive into the platform architecture
- [i18n Overview](/i18n/overview/) - Translate cards, messages, and runtime UI
