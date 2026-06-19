---
title: Guardrail Extensions
description: Author and attach content-safety guardrails to agentic workers using the greentic:extension-design/guardrail WIT interface.
---

Guardrails are content-safety hooks that intercept every step of an agentic worker's Plan-Act-Observe loop. Each guardrail extension implements a single WIT function — `evaluate` — and returns one of three verdicts: **accept**, **update**, or **deny**.

Guardrails run at two hook points:

- **inbound** — the user prompt, before the LLM sees it
- **outbound** — the LLM reply, before it reaches the caller

## WIT Contract

Every guardrail extension exports the `greentic:extension-design/guardrail@0.3.0` interface. The canonical WIT definition is:

```wit
interface guardrail {
  record guardrail-input {
    direction: string,   // "inbound" or "outbound"
    content:   string,   // the text to evaluate
    context:   string,   // caller-supplied JSON context (may be "{}")
  }

  variant verdict {
    accept,
    update(string),      // replacement content
    deny(string),        // denial reason
  }

  evaluate: func(input: guardrail-input) -> verdict;
}
```

### Verdict semantics

| Verdict | Meaning |
|---------|---------|
| `accept` | Pass the content through unchanged |
| `update(new_content)` | Replace the content with `new_content`; processing continues |
| `deny(reason)` | Block the step; the runtime surfaces an error to the caller |

When multiple guardrails are chained, an `update` verdict feeds the modified content to the next guardrail in the chain. A `deny` short-circuits immediately.

### Context field

The `context` field carries caller-supplied JSON that lets a single extension support multiple configurations. For example, the reference PII extension parses a blocklist:

```json
{ "blocklist": ["confidential", "internal-only"] }
```

An empty context is always valid: `"{}"`.

## Structured Deny Output

When a guardrail denies a step, the runtime wraps the verdict in a structured payload before returning it to the caller:

```json
{
  "guardrail": {
    "blocked":    true,
    "direction":  "inbound",
    "code":       "permission_denied",
    "message":    "Content blocked by guardrail <extension-id>",
    "details":    "reason text from deny(reason)"
  }
}
```

The `code` value is returned verbatim from the component's `deny(deny-info)` verdict — it is component-supplied, not a fixed platform constant. The reference PII component returns `"permission_denied"` for blocklist matches.

This payload is surfaced as `AgentError::GuardrailDenied` in the Rust API and as an HTTP `403` with the above JSON body on the `/api/agent` and `/api/ai` endpoints.

## Authoring a Guardrail Extension

### 1. Create the WASM component

A guardrail extension is a WASM component built for the `wasm32-wasip2` target. Use `cargo component new` and declare the WIT dependency:

```toml
# Cargo.toml
[dependencies]
wit-bindgen = "0.52"

[package.metadata.component.target.dependencies]
"greentic:extension-design" = { path = "wit/deps/extension-design" }
```

Vendor the WIT file at `wit/deps/extension-design/guardrail.wit`.

### 2. Implement `evaluate`

```rust
// src/lib.rs
use bindings::exports::greentic::extension_design::guardrail::{
    Guest, GuardrailInput, Verdict,
};

struct Component;

impl Guest for Component {
    fn evaluate(input: GuardrailInput) -> Verdict {
        if input.content.contains("secret") {
            return Verdict::Deny("contains forbidden term".to_string());
        }
        let masked = input.content.replace(
            |c: char| c == '@',
            "[AT]",
        );
        if masked != input.content {
            return Verdict::Update(masked);
        }
        Verdict::Accept
    }
}

bindings::export!(Component with_types_in bindings);
```

### 3. Build and sign

```bash
# Build
cargo component build --release --target wasm32-wasip2

# Sign and package with the gtdx CLI
gtdx pack sign --key path/to/signing.key
gtdx pack bundle --output my-guardrail.gtxpack
```

See [Publishing Extensions](/extensions/publishing-extensions) for the full signing and store upload workflow.

## Attaching Guardrails to an Agentic Worker

### Agent-level (fail-open)

Declare guardrail capability IDs in the `guardrails` list of `AgentConfig`. Capability IDs use colon-format: `greentic:guardrail/<name>`.

```json
{
  "agent_id": "my-worker",
  "guardrails": [
    "greentic:guardrail/pii",
    "greentic:guardrail/profanity-filter"
  ]
}
```

Agent-level guardrails fail **open**: if the runtime cannot resolve a capability at startup, the step proceeds without that guardrail and a warning is logged.

### Mandatory (platform/tenant policy, fail-closed)

Platform operators inject mandatory guardrails via `GuardrailPolicy` in the runner configuration. These are resolved from the same capability registry but fail **closed**: if a mandatory guardrail cannot be loaded, the agentic worker refuses to start and returns an error.

Mandatory guardrails run before agent-level guardrails in the chain.

### Capability resolution

The capability ID (e.g. `greentic:guardrail/pii`) is resolved through the runner's `CapabilityRegistry`. The registry maps IDs to loaded WASM extensions at startup by scanning `GREENTIC_EXTENSIONS_DIR/design/`. An extension advertises its guardrail capability in `describe.json`:

```json
{
  "capabilities": {
    "offered": [
      { "id": "greentic:guardrail/pii", "version": "1.0.0" }
    ]
  }
}
```

## Reference Implementation

`component-guardrail-pii` is the reference guardrail extension. It:

- Masks email addresses and phone numbers with `[REDACTED_EMAIL]` / `[REDACTED_PHONE]` (returns `update`)
- Denies any content that matches a caller-supplied blocklist in the `context` field (returns `deny`)
- Accepts everything else

The component is published to the extension store under the capability ID `greentic:guardrail/pii`.

## Translations

If your guardrail extension produces user-visible denial messages, author them as i18n keys rather than hardcoded strings. The extension receives the active locale from the host via the standard i18n import. Translations follow the same workflow as other extension types — see [Writing Extension Packs](/extensions/writing-extensions).

The guardrail documentation page itself does not require translation; translations are handled by the platform's docs i18n tooling on the docs site side.
