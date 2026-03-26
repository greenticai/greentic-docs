---
title: Components
description: Building WASM components for Greentic
---

import { Aside, Tabs, TabItem } from '@astrojs/starlight/components';

## What is a Component?

A **Component** is a portable WebAssembly (WASM) building block that implements the Greentic WIT interface. Components are:

- **Sandboxed** - Execute in isolated WASM environment
- **Portable** - Run on any platform with Wasmtime
- **Composable** - Combine to build complex workflows
- **Language-agnostic** - Write in Rust, Go, or any WASM-compatible language

## Component Types

| Type | Purpose | Example |
|------|---------|---------|
| **Node** | Flow processing step | LLM caller, template renderer |
| **Provider** | External service bridge | Telegram, Slack, SendGrid |
| **Tool** | MCP tool implementation | Database query, API call |
| **Operator** | Message transformation | Button handling, card rendering |

## Creating a Component

### Project Setup

Use the component authoring CLI:

```bash
# Create new component project
greentic-component new my-processor

cd my-processor
```

This generates:

```
my-processor/
├── Cargo.toml
├── src/
│   └── lib.rs
├── wit/
│   └── component.wit
└── build.sh
```

### Cargo.toml

```toml title="Cargo.toml"
[package]
name = "my-processor"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
wit-bindgen = "0.53"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[profile.release]
opt-level = "s"
lto = true
```

### WIT Interface

Define your component's interface:

```wit title="wit/component.wit"
package greentic:my-processor;

interface types {
    record input {
        message: string,
        context: option<string>,
    }

    record output {
        result: string,
        success: bool,
    }
}

world processor {
    import types;

    export process: func(input: types.input) -> types.output;
}
```

### Implementation

```rust title="src/lib.rs"
use wit_bindgen::generate;

generate!({
    world: "processor",
    path: "wit",
});

struct MyProcessor;

impl Guest for MyProcessor {
    fn process(input: Input) -> Output {
        // Your processing logic here
        let result = format!("Processed: {}", input.message);

        Output {
            result,
            success: true,
        }
    }
}

export!(MyProcessor);
```

### Building

```bash
# Build for WASM target
cargo build --target wasm32-wasip2 --release

# Output: target/wasm32-wasip2/release/my_processor.wasm
```

## Advanced Component Patterns

### Async Operations

Components can perform async operations using WASI interfaces:

```rust
use wit_bindgen::generate;

generate!({
    world: "async-processor",
    path: "wit",
    async: true,
});

impl Guest for AsyncProcessor {
    async fn process(input: Input) -> Output {
        // Async HTTP call
        let response = http_fetch(&input.url).await;

        Output {
            result: response.body,
            success: response.status == 200,
        }
    }
}
```

### State Management

Access session state within components:

```rust
impl Guest for StatefulProcessor {
    fn process(input: Input, state: &mut State) -> Output {
        // Read from state
        let counter = state.get("counter").unwrap_or(0);

        // Update state
        state.set("counter", counter + 1);

        Output {
            result: format!("Processed {} times", counter + 1),
            success: true,
        }
    }
}
```

### Error Handling

Use the Result type for error handling:

```rust
impl Guest for SafeProcessor {
    fn process(input: Input) -> Result<Output, Error> {
        if input.message.is_empty() {
            return Err(Error::InvalidInput("Message cannot be empty".into()));
        }

        Ok(Output {
            result: process_message(&input.message)?,
            success: true,
        })
    }
}
```

## Built-in Components

Greentic provides several built-in components:

### component-llm-openai

Call OpenAI-compatible LLMs:

```yaml
- id: analyze
  type: llm
  config:
    model: "gpt-4"
    system_prompt: "You are a helpful assistant."
    prompt: "{{message}}"
```

### component-templates

Render Handlebars templates:

```yaml
- id: format
  type: template
  config:
    template: "Hello, {{name}}! Your order #{{order_id}} is ready."
```

### component-script-rhai

Execute Rhai scripts:

```yaml
- id: calculate
  type: script
  config:
    script: |
      let total = 0;
      for item in items {
        total += item.price * item.quantity;
      }
      total
```

### component-adaptive-card

Render and validate Adaptive Cards:

```yaml
- id: show_card
  type: adaptive-card
  config:
    card: "cards/welcome.json"
    data:
      user_name: "{{user_name}}"
```

## Testing Components

### Unit Tests

```rust title="src/lib.rs"
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process() {
        let input = Input {
            message: "Hello".into(),
            context: None,
        };

        let output = MyProcessor::process(input);

        assert!(output.success);
        assert!(output.result.contains("Processed"));
    }
}
```

### Integration Tests

```bash
# Run with test harness
greentic-component test ./my-processor

# Test with sample input
echo '{"message": "test"}' | greentic-component run ./my-processor.wasm
```

## Component Best Practices

<Aside type="tip">
Follow these guidelines for production-quality components:
</Aside>

1. **Keep components focused** - Single responsibility
2. **Handle all errors** - Never panic in production
3. **Minimize dependencies** - Smaller WASM binaries
4. **Use strong types** - Leverage WIT for type safety
5. **Document interfaces** - Clear WIT definitions
6. **Test thoroughly** - Unit and integration tests
7. **Optimize size** - Use LTO and size optimization

## Debugging Components

### WASM Inspection

```bash
# Inspect component exports
wasm-tools component wit ./my-processor.wasm

# Validate component
wasm-tools validate ./my-processor.wasm
```

### Logging

Use the WASI logging interface:

```rust
use greentic_interfaces::log;

impl Guest for DebugProcessor {
    fn process(input: Input) -> Output {
        log::debug(&format!("Processing: {:?}", input));

        // ... processing ...

        log::info("Processing complete");
        output
    }
}
```

## Next Steps

- [Providers](/concepts/providers/) - Build provider components
- [MCP Tools](/mcp/creating-tools/) - Create MCP tool components
- [WIT Interfaces Reference](/reference/wit-interfaces/) - Complete WIT specification
