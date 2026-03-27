---
title: Interfaces WIT
description: Especificación de WebAssembly Interface Types para Greentic
---

## Resumen

Greentic usa **WIT (WebAssembly Interface Types)** para definir interfaces de componentes. Todos los componentes WASM deben implementar la interfaz WIT correspondiente.

## Tipos Principales

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

## Interfaz de Componente

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

## Interfaz de Proveedor de Mensajería

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

## Interfaz de Proveedor de Eventos

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

## Interfaz de Herramienta MCP

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

## Interfaz de Estado

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

## Interfaz de Secrets

```wit
package greentic:secrets;

interface secrets {
    use greentic:types/core.{tenant-ctx};

    /// Get secret value
    get: func(ctx: tenant-ctx, name: string) -> option<string>;
}
```

## Interfaz HTTP

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

## Uso de WIT en Componentes

### Implementación en Rust

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

### Compilación

```bash
cargo build --target wasm32-wasip2 --release
```

## Validación de WIT

```bash
# Validate WIT syntax
wit-bindgen rust --check ./wit/

# Generate bindings
wit-bindgen rust ./wit/ --out-dir ./src/bindings/
```

## Siguientes Pasos

- [Guía de Componentes](/es/concepts/components/)
- [Crear Herramientas MCP](/es/mcp/creating-tools/)
