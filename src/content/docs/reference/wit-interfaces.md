---
title: WIT Interfaces
description: WebAssembly Interface Types specification for Greentic
---

## Overview

Greentic uses **WIT (WebAssembly Interface Types)** to define component interfaces. All WASM components must implement the appropriate WIT interface.

## Core Types

```wit
package greentic:types;

interface core {
    /// Tenant context for multi-tenancy
    record tenant-ctx {
        tenant-id: string,
        env-id: string,
        team-id: option<string>,
    }

    /// Normalized message format
    record message {
        id: string,
        channel-id: string,
        sender-id: string,
        sender-name: option<string>,
        content: string,
        timestamp: u64,
        reply-to: option<string>,
        attachments: list<attachment>,
        metadata: option<string>,
    }

    /// Attachment type
    record attachment {
        type: string,
        url: option<string>,
        data: option<list<u8>>,
        name: option<string>,
    }

    /// Flow execution outcome
    variant outcome {
        success(string),
        error(string),
        pending(string),
    }

    /// Session key for state management
    record session-key {
        tenant-ctx: tenant-ctx,
        session-id: string,
    }
}
```

## Component Interface

```wit
package greentic:component;

interface component {
    use greentic:types/core.{message, outcome, tenant-ctx};

    /// Input for component execution
    record input {
        message: message,
        context: option<string>,
        config: option<string>,
    }

    /// Execute the component
    execute: func(ctx: tenant-ctx, input: input) -> outcome;
}

world flow-component {
    import greentic:types/core;
    export component;
}
```

## Messaging Provider Interface

```wit
package greentic:messaging;

interface ingress {
    use greentic:types/core.{message, tenant-ctx};

    /// Raw webhook payload
    record raw-payload {
        body: list<u8>,
        headers: list<tuple<string, string>>,
        query: list<tuple<string, string>>,
    }

    /// Parse incoming webhook to normalized message
    parse: func(ctx: tenant-ctx, payload: raw-payload) -> result<message, string>;

    /// Verify webhook signature
    verify: func(payload: raw-payload, secret: string) -> bool;
}

interface egress {
    use greentic:types/core.{tenant-ctx};

    /// Outbound message
    record outbound {
        channel-id: string,
        content: string,
        reply-to: option<string>,
        buttons: list<button>,
        attachments: list<outbound-attachment>,
    }

    record button {
        label: string,
        action: string,
        style: option<string>,
    }

    record outbound-attachment {
        type: string,
        url: option<string>,
        data: option<list<u8>>,
        name: string,
    }

    /// Send message via provider
    send: func(ctx: tenant-ctx, msg: outbound) -> result<string, string>;
}

interface operator {
    use greentic:types/core.{tenant-ctx};

    /// Handle button callback
    handle-callback: func(ctx: tenant-ctx, data: string) -> result<string, string>;

    /// Render rich content
    render-card: func(ctx: tenant-ctx, card-json: string) -> result<string, string>;
}

world messaging-provider {
    import greentic:types/core;
    export ingress;
    export egress;
    export operator;
}
```

## Events Provider Interface

```wit
package greentic:events;

interface events {
    use greentic:types/core.{tenant-ctx};

    /// Normalized event
    record event {
        id: string,
        event-type: string,
        source: string,
        timestamp: u64,
        payload: string,
        metadata: option<string>,
    }

    /// Parse incoming webhook to event
    parse: func(ctx: tenant-ctx, body: list<u8>, headers: list<tuple<string, string>>) -> result<event, string>;

    /// Emit outbound event
    emit: func(ctx: tenant-ctx, event: event) -> result<string, string>;
}

world events-provider {
    import greentic:types/core;
    export events;
}
```

## Extension Base (`greentic:extension-base@0.1.0`)

The shared foundation for every designer / bundle / deploy / provider
extension. Defines the extension `kind` enum and common types.

Source:
[`extension-base.wit`](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/wit/extension-base.wit)

```wit
package greentic:extension-base@0.1.0;

interface types {
    record extension-identity {
        id: string,
        version: string,
        kind: kind,
    }

    enum kind {
        design,
        bundle,
        deploy,
        provider,
    }

    record capability-ref {
        id: string,
        version: string,
    }

    record diagnostic {
        severity: severity,
        code: string,
        message: string,
        path: option<string>,
    }

    enum severity { error, warning, info, hint }

    variant extension-error {
        invalid-input(string),
        missing-capability(string),
        permission-denied(string),
        internal(string),
    }
}

interface manifest {
    use types.{extension-identity, capability-ref};
    get-identity: func() -> extension-identity;
    get-offered: func() -> list<capability-ref>;
    get-required: func() -> list<capability-ref>;
}

interface lifecycle {
    use types.{extension-error};
    init: func(config-json: string) -> result<_, extension-error>;
    shutdown: func();
}
```

All four extension worlds export `manifest` and `lifecycle` and import the
host interfaces from `greentic:extension-host@0.1.0` (`logging`, `i18n`,
`secrets`, `broker`, `http`).

## Extension Provider (`greentic:extension-provider@0.1.0`)

The 4th extension kind — providers that ship as `.gtxpack` artifacts with
a bundled runtime `.gtpack`. The guest component exports discovery
interfaces so the designer, wizards, and `gtdx` can enumerate channels,
triggers, and events and fetch their JSON schemas without running the
runtime pack.

Source:
[`extension-provider.wit`](https://github.com/greentic-biz/greentic-designer-extensions/blob/main/wit/extension-provider.wit)

### Interfaces

```wit
package greentic:extension-provider@0.1.0;

interface types {
    type channel-id = string;
    type trigger-id = string;
    type event-id   = string;

    enum direction { inbound, outbound, bidirectional }
    enum card-tier { tier-a-native, tier-b-attachment, tier-c-fallback, tier-d-text-only }

    record channel-profile {
        id: channel-id,
        display-name: string,
        direction: direction,
        tier-support: list<card-tier>,
        metadata: list<tuple<string, string>>,
    }

    record trigger-profile {
        id: trigger-id,
        display-name: string,
        emit-shape: string,
    }

    record event-profile {
        id: event-id,
        display-name: string,
        payload-shape: string,
    }

    variant error {
        not-found(string),
        schema-invalid(string),
        internal(string),
    }
}

interface messaging {
    list-channels:    func() -> list<channel-profile>;
    describe-channel: func(id: channel-id) -> result<channel-profile, error>;
    secret-schema:    func(id: channel-id) -> result<string, error>;
    config-schema:    func(id: channel-id) -> result<string, error>;
    dry-run-encode:   func(id: channel-id, sample: list<u8>) -> result<list<u8>, error>;
}

interface event-source {
    list-trigger-types: func() -> list<trigger-profile>;
    describe-trigger:   func(id: trigger-id) -> result<trigger-profile, error>;
    trigger-schema:     func(id: trigger-id) -> result<string, error>;
}

interface event-sink {
    list-event-types: func() -> list<event-profile>;
    describe-event:   func(id: event-id) -> result<event-profile, error>;
    event-schema:     func(id: event-id) -> result<string, error>;
}
```

### Worlds

Provider extensions pick the world that matches their capability surface.
Every world exports `greentic:extension-base/manifest` and `lifecycle`, and
imports `extension-base/types`, `extension-host/logging`, and
`extension-host/i18n`.

| World | Exports (extension-provider) | Purpose |
|-------|------------------------------|---------|
| `messaging-only-provider`          | `messaging`                                 | Pure messaging provider (e.g. Slack, Telegram) |
| `event-source-only-provider`       | `event-source`                              | Emits events into flows (webhooks, timers) |
| `event-sink-only-provider`         | `event-sink`                                | Receives events from flows (SMS, email-out) |
| `messaging-and-event-source-provider` | `messaging`, `event-source`             | Chat + inbound event triggers |
| `messaging-and-event-sink-provider`   | `messaging`, `event-sink`               | Chat + outbound notifications |
| `full-provider`                    | `messaging`, `event-source`, `event-sink`   | All three facets |

Each world imports the host facets needed for logging and localization. The
extended host facets (`secrets`, `broker`, `http`) are **not** required for
provider extensions — the guest is purely a design-time descriptor, so it
cannot read secrets or call external APIs. All network and secret access
happens inside the bundled runtime `.gtpack`.

See the [Messaging and Event Extensions](/extensions/provider-extensions/) guide for
packaging and publishing.

## MCP Tool Interface

```wit
package greentic:mcp;

interface tool {
    use greentic:types/core.{tenant-ctx};

    /// Tool input
    record tool-input {
        parameters: string,  // JSON encoded
    }

    /// Tool output
    record tool-output {
        success: bool,
        data: option<string>,
        error: option<string>,
    }

    /// Execute the tool
    execute: func(ctx: tenant-ctx, input: tool-input) -> tool-output;

    /// Get tool schema (for LLM function calling)
    get-schema: func() -> string;
}

world mcp-tool {
    import greentic:types/core;
    export tool;
}
```

## State Interface

```wit
package greentic:state;

interface state {
    use greentic:types/core.{session-key};

    /// Get value from state
    get: func(key: session-key, name: string) -> option<string>;

    /// Set value in state
    set: func(key: session-key, name: string, value: string) -> result<_, string>;

    /// Delete value from state
    delete: func(key: session-key, name: string) -> result<_, string>;
}
```

## Secrets Interface

```wit
package greentic:secrets;

interface secrets {
    use greentic:types/core.{tenant-ctx};

    /// Get secret value
    get: func(ctx: tenant-ctx, name: string) -> option<string>;
}
```

## HTTP Interface

```wit
package greentic:http;

interface outgoing {
    /// HTTP request
    record request {
        method: string,
        url: string,
        headers: list<tuple<string, string>>,
        body: option<list<u8>>,
    }

    /// HTTP response
    record response {
        status: u16,
        headers: list<tuple<string, string>>,
        body: list<u8>,
    }

    /// Make HTTP request
    fetch: func(req: request) -> result<response, string>;
}
```

## Using WIT in Components

### Rust Implementation

```rust
use wit_bindgen::generate;

generate!({
    world: "flow-component",
    path: "wit",
});

struct MyComponent;

impl component::Guest for MyComponent {
    fn execute(ctx: TenantCtx, input: Input) -> Outcome {
        // Implementation
        Outcome::Success("Done".to_string())
    }
}

export!(MyComponent);
```

### Building

```bash
cargo build --target wasm32-wasip2 --release
```

## WIT Validation

```bash
# Validate WIT syntax
wit-bindgen rust --check ./wit/

# Generate bindings
wit-bindgen rust ./wit/ --out-dir ./src/bindings/
```

## Next Steps

- [Components Guide](/concepts/components/)
- [Creating MCP Tools](/mcp/creating-tools/)
