---
title: fast2flow
description: High-performance intent routing and flow dispatch component
---

import { Aside } from '@astrojs/starlight/components';

## Overview

**fast2flow** is a high-performance intent routing component that enables:

- Fast intent classification
- Multi-flow routing
- Control-chain hooks for policy enforcement
- LLM fallback for ambiguous cases

## Architecture

```
Incoming Message
    │
    ▼
┌─────────────────────────────────────────┐
│            fast2flow Component          │
│  ┌─────────────────────────────────┐    │
│  │    Intent Classification       │    │
│  │    (Rule-based + Embedding)    │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │    Control Chain Hooks         │    │
│  │    (Policy enforcement)        │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │    Flow Router                 │    │
│  │    (Dispatch to target flow)   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
    │
    ▼
Target Flow
```

## Installation

Add to your bundle:

```yaml title="greentic.demo.yaml"
components:
  fast2flow:
    pack: "components/fast2flow.gtpack"
```

## Configuration

### Basic Setup

```yaml title="fast2flow-config.yaml"
name: main_router
version: "1.0"

# Intent definitions
intents:
  greeting:
    patterns:
      - "hello"
      - "hi"
      - "hey"
      - "good morning"
    target_flow: "greeting_flow"

  help:
    patterns:
      - "help"
      - "support"
      - "assistance"
    target_flow: "help_flow"

  order_status:
    patterns:
      - "order status"
      - "where is my order"
      - "track order"
    target_flow: "order_status_flow"

# Default flow for unmatched intents
default_flow: "fallback_flow"
```

### With Embeddings

For semantic matching:

```yaml
name: semantic_router
version: "1.0"

embedding:
  model: "text-embedding-3-small"
  threshold: 0.75

intents:
  billing:
    examples:
      - "I have a question about my invoice"
      - "Why was I charged twice?"
      - "Can I get a refund?"
    target_flow: "billing_flow"

  technical:
    examples:
      - "The app is not working"
      - "I can't log in"
      - "Getting an error message"
    target_flow: "technical_flow"
```

## Using in Flows

### As Entry Point

```yaml title="flows/on_message.ygtc"
name: on_message
version: "1.0"

nodes:
  - id: route
    type: fast2flow
    config:
      config_file: "fast2flow-config.yaml"
      fallback_to_llm: true

triggers:
  - type: message
    target: route
```

### With Control Chain

```yaml
nodes:
  - id: route
    type: fast2flow
    config:
      config_file: "fast2flow-config.yaml"
      control_chain:
        - hook: "check_blocked_intents"
          action: "block"
        - hook: "log_intent"
          action: "continue"
```

## Control Chain Hooks

Control chains allow policy enforcement before routing:

### Block Hook

```yaml
control_chain:
  - hook: "block_sensitive"
    type: block
    config:
      blocked_intents:
        - "password_reset"
        - "account_deletion"
      message: "This action requires human verification"
```

### Transform Hook

```yaml
control_chain:
  - hook: "normalize"
    type: transform
    config:
      lowercase: true
      remove_punctuation: true
```

### Log Hook

```yaml
control_chain:
  - hook: "audit_log"
    type: log
    config:
      level: info
      include_metadata: true
```

## LLM Fallback

For ambiguous cases, fall back to LLM classification:

```yaml
name: hybrid_router
version: "1.0"

intents:
  # ... intent definitions

llm_fallback:
  enabled: true
  model: "gpt-4"
  threshold: 0.5  # Use LLM when confidence < 0.5
  system_prompt: |
    Classify the user's intent into one of:
    - greeting
    - help
    - order_status
    - billing
    - other

    Respond with JSON: {"intent": "...", "confidence": 0.0-1.0}
```

## Multi-Intent Detection

Detect multiple intents in a single message:

```yaml
name: multi_intent_router
version: "1.0"

multi_intent:
  enabled: true
  max_intents: 3

intents:
  greeting:
    patterns: ["hello", "hi"]
  order:
    patterns: ["order", "purchase"]
  question:
    patterns: ["?", "how", "what", "when"]

# Message: "Hi, what's my order status?"
# Detected: [greeting, question, order_status]
```

## Performance

fast2flow is optimized for high throughput:

| Metric | Value |
|--------|-------|
| Pattern matching | < 1ms |
| Embedding lookup | < 10ms |
| LLM fallback | ~500ms |

<Aside type="tip">
Use pattern matching for common intents and embeddings for long-tail variations.
</Aside>

## Best Practices

1. **Start with patterns** - Use regex patterns for clear, common intents
2. **Add examples gradually** - Use embeddings for semantic matching
3. **Set appropriate thresholds** - Balance precision and recall
4. **Use control chains** - Enforce policies before routing
5. **Monitor fallback rate** - High LLM fallback indicates missing patterns
6. **Test edge cases** - Ensure graceful handling of unexpected inputs

## Example: Customer Service Router

```yaml title="fast2flow-cs.yaml"
name: customer_service_router
version: "1.0"

embedding:
  model: "text-embedding-3-small"
  threshold: 0.7

intents:
  greeting:
    patterns:
      - "^(hello|hi|hey|good\\s+(morning|afternoon|evening))$"
    target_flow: "greeting_flow"
    priority: 1

  order_inquiry:
    patterns:
      - "order\\s*(status|tracking|where)"
      - "track(ing)?\\s*(my)?\\s*order"
    examples:
      - "Where is my package?"
      - "Can you check on my delivery?"
    target_flow: "order_flow"
    priority: 2

  return_request:
    patterns:
      - "return|refund|exchange"
    examples:
      - "I want to send this back"
      - "This product doesn't work"
    target_flow: "return_flow"
    priority: 2

  complaint:
    examples:
      - "I'm very unhappy with the service"
      - "This is unacceptable"
      - "I want to speak to a manager"
    target_flow: "escalation_flow"
    priority: 3

control_chain:
  - hook: "detect_urgency"
    type: transform
    config:
      keywords: ["urgent", "asap", "emergency"]
      flag: "is_urgent"

  - hook: "rate_limit"
    type: block
    config:
      max_requests_per_minute: 10
      message: "Please slow down. Try again in a moment."

llm_fallback:
  enabled: true
  model: "gpt-4"
  threshold: 0.6

default_flow: "general_inquiry_flow"
```

## Next Steps

- [flow2flow Component](/components/flow2flow/)
- [Flows Guide](/concepts/flows/)
- [Control Chains Reference](/reference/control-chains/)
