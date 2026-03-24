---
title: Multi-Tenancy
description: Understanding multi-tenant architecture in Greentic
---

import { Aside } from '@astrojs/starlight/components';

## Overview

Greentic is designed from the ground up for **multi-tenant deployments**. Every aspect of the platform supports tenant isolation, allowing a single deployment to serve multiple organizations securely.

## Tenant Hierarchy

```
Workspace
└── Tenant (organization)
    └── Environment (prod, staging, dev)
        └── Team (department, group)
            └── Channel (messaging provider instance)
                └── Session (user conversation)
```

## TenantCtx

The `TenantCtx` struct flows through all operations:

```rust
pub struct TenantCtx {
    pub tenant_id: String,
    pub env_id: String,
    pub team_id: Option<String>,
}
```

Every API call, flow execution, and data access is scoped to a `TenantCtx`.

## Configuration

### Tenant Definition

```yaml title="tenants/acme/tenant.gmap"
tenant:
  id: acme
  name: "ACME Corporation"
  settings:
    timezone: "America/New_York"
    language: "en-US"

environments:
  - id: prod
    name: "Production"
  - id: staging
    name: "Staging"
```

### Team Definition

```yaml title="tenants/acme/teams/support/team.gmap"
team:
  id: support
  name: "Customer Support"
  tenant_id: acme

channels:
  slack:
    provider: messaging-slack
    config:
      workspace_id: "T123456"
      channel_id: "C789012"

  telegram:
    provider: messaging-telegram
    config:
      chat_id: "-1001234567890"
```

### Bundle Configuration

```yaml title="greentic.demo.yaml"
tenants:
  acme:
    name: "ACME Corporation"
    teams:
      support:
        name: "Customer Support"
        channels:
          slack:
            provider: messaging-slack
          telegram:
            provider: messaging-telegram

      sales:
        name: "Sales Team"
        channels:
          teams:
            provider: messaging-teams

  bigcorp:
    name: "BigCorp Inc."
    teams:
      helpdesk:
        channels:
          webchat:
            provider: messaging-webchat
```

## Data Isolation

### Session Storage

Sessions are isolated by tenant context:

```
sessions/
├── acme/
│   ├── prod/
│   │   ├── support/
│   │   │   ├── session_001.cbor
│   │   │   └── session_002.cbor
│   │   └── sales/
│   │       └── session_003.cbor
│   └── staging/
│       └── support/
│           └── session_004.cbor
└── bigcorp/
    └── prod/
        └── helpdesk/
            └── session_005.cbor
```

### State Isolation

Working memory (state) is scoped per session:

```rust
// State key format
let key = format!(
    "state:{}:{}:{}:{}",
    tenant_ctx.tenant_id,
    tenant_ctx.env_id,
    tenant_ctx.team_id.unwrap_or("default"),
    session_id
);
```

### NATS Subject Isolation

Message routing uses tenant-scoped subjects:

```
greentic.messaging.ingress.{env}.{tenant}.{team}.{channel}
                          │      │       │      │
                          │      │       │      └─ Channel ID (slack, telegram)
                          │      │       └──────── Team ID
                          │      └─────────────── Tenant ID
                          └────────────────────── Environment (prod, staging)
```

## Secret Isolation

Secrets are stored and retrieved with tenant scope:

```rust
// Secret retrieval includes tenant context
let secret = secrets_client
    .get_secret(&tenant_ctx, "api_key")
    .await?;
```

### Secret Namespacing

```
secrets/
├── global/           # Platform-wide secrets
│   └── signing_key
├── acme/             # Tenant: ACME
│   ├── slack_bot_token
│   ├── openai_api_key
│   └── teams/
│       └── support/
│           └── webhook_secret
└── bigcorp/          # Tenant: BigCorp
    └── telegram_bot_token
```

## Flow Isolation

Each tenant can have different flows and configurations:

```yaml title="tenants/acme/apps/support-bot/flows/on_message.ygtc"
name: acme_support_flow
version: "1.0"

# ACME-specific support flow
nodes:
  - id: greet
    type: reply
    config:
      message: "Welcome to ACME Support! How can I help?"
```

```yaml title="tenants/bigcorp/apps/helpdesk/flows/on_message.ygtc"
name: bigcorp_helpdesk_flow
version: "1.0"

# BigCorp-specific helpdesk flow
nodes:
  - id: greet
    type: reply
    config:
      message: "BigCorp Helpdesk here. What's your issue?"
```

## Access Control

<Aside type="caution">
Tenant isolation is enforced at the runtime level. Always verify `TenantCtx` in custom components.
</Aside>

### Component Access

Components receive `TenantCtx` and must respect boundaries:

```rust
impl Guest for MyComponent {
    fn process(input: Input, ctx: &TenantCtx) -> Output {
        // Verify tenant has access to requested resource
        if !has_permission(ctx, &input.resource_id) {
            return Output::error("Access denied");
        }

        // Process with tenant scope
        process_for_tenant(ctx, input)
    }
}
```

### API Access

REST API enforces tenant scope:

```http
GET /api/v1/sessions
Authorization: Bearer <token>
X-Tenant-ID: acme
X-Team-ID: support
```

## Deployment Models

### Single-Tenant

One Greentic instance per tenant:

```
┌─────────────────┐
│ Greentic (ACME) │
└─────────────────┘

┌─────────────────┐
│ Greentic (BigCorp)│
└─────────────────┘
```

### Multi-Tenant Shared

Multiple tenants on shared infrastructure:

```
┌───────────────────────────────────┐
│         Greentic Instance         │
│  ┌─────────┐  ┌─────────────────┐│
│  │  ACME   │  │    BigCorp     ││
│  │ (prod)  │  │    (prod)      ││
│  └─────────┘  └─────────────────┘│
│  ┌─────────┐  ┌─────────────────┐│
│  │  ACME   │  │    BigCorp     ││
│  │(staging)│  │   (staging)    ││
│  └─────────┘  └─────────────────┘│
└───────────────────────────────────┘
```

### Hybrid

Mix of dedicated and shared resources:

```
┌───────────────────────────────────┐
│    Shared Greentic Instance       │
│  ┌─────────┐  ┌─────────────────┐│
│  │ Small   │  │   Medium        ││
│  │ Tenants │  │   Tenants       ││
│  └─────────┘  └─────────────────┘│
└───────────────────────────────────┘

┌───────────────────────────────────┐
│  Dedicated: Enterprise Tenant     │
│  (Custom SLA, dedicated resources)│
└───────────────────────────────────┘
```

## Best Practices

1. **Always pass TenantCtx** - Never hardcode tenant IDs
2. **Validate at boundaries** - Check tenant access at API and component level
3. **Use tenant-scoped logging** - Include tenant ID in all log entries
4. **Separate secrets** - Never share secrets between tenants
5. **Test isolation** - Verify one tenant cannot access another's data
6. **Monitor per-tenant** - Track usage and errors by tenant

## Next Steps

- [Architecture Overview](/concepts/architecture/)
- [Session Management](/concepts/sessions/)
- [Configuration Reference](/reference/configuration/)
