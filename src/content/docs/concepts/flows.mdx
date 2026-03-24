---
title: Flows
description: Understanding flow definitions in Greentic
---

import { Aside, Code } from '@astrojs/starlight/components';

## What is a Flow?

A **Flow** is a YAML-defined orchestration graph that describes how messages and data move through your digital worker. Flows are stored in `.ygtc` files and define:

- **Nodes** - Individual processing steps (WASM components)
- **Edges** - Connections between nodes
- **Triggers** - What starts the flow
- **Conditions** - Branching logic

## Basic Flow Structure

```yaml title="flows/hello.ygtc"
name: hello_world
version: "1.0"
description: A simple greeting flow

# Define the nodes (processing steps)
nodes:
  - id: greet
    type: reply
    config:
      message: "Hello! How can I help you today?"

# Define what triggers this flow
triggers:
  - type: message
    pattern: "hello|hi|hey"
    target: greet
```

## Flow Components

### Nodes

Nodes are the building blocks of a flow. Each node represents a WASM component that processes data:

```yaml
nodes:
  - id: unique_node_id
    type: node_type           # Component type
    config:                   # Component-specific configuration
      key: value
    next: next_node_id        # Optional: next node to execute
```

#### Common Node Types

| Type | Purpose |
|------|---------|
| `reply` | Send a message back to the user |
| `llm` | Call an LLM (OpenAI, etc.) |
| `template` | Render a Handlebars template |
| `script` | Execute Rhai script |
| `branch` | Conditional branching |
| `http` | Make HTTP requests |
| `state` | Manage session state |

### Edges

Edges connect nodes together. They can be implicit (via `next`) or explicit:

```yaml
nodes:
  - id: start
    type: template
    config:
      template: "Processing your request..."
    next: process

  - id: process
    type: llm
    config:
      model: "gpt-4"
      prompt: "{{message}}"
    next: respond

  - id: respond
    type: reply
    config:
      message: "{{llm_response}}"
```

### Triggers

Triggers define what starts a flow:

```yaml
triggers:
  # Message pattern trigger
  - type: message
    pattern: "order|purchase|buy"
    target: handle_order

  # Default trigger (catch-all)
  - type: default
    target: fallback_handler

  # Event trigger
  - type: event
    event_type: "user.created"
    target: welcome_user
```

## Conditional Branching

Use `branch` nodes for conditional logic:

```yaml
nodes:
  - id: check_intent
    type: branch
    config:
      conditions:
        - expression: "intent == 'greeting'"
          next: greet_user
        - expression: "intent == 'help'"
          next: show_help
        - expression: "intent == 'order'"
          next: process_order
      default: fallback

  - id: greet_user
    type: reply
    config:
      message: "Hello! Nice to meet you!"

  - id: show_help
    type: reply
    config:
      message: "Here's what I can help you with..."

  - id: fallback
    type: reply
    config:
      message: "I'm not sure I understand. Can you rephrase?"
```

## Working with State

Flows can read and write session state:

```yaml
nodes:
  - id: save_name
    type: state
    config:
      action: set
      key: "user_name"
      value: "{{extracted_name}}"
    next: confirm

  - id: get_name
    type: state
    config:
      action: get
      key: "user_name"
      output: "stored_name"
    next: greet_by_name
```

## LLM Integration

Integrate with LLMs for AI-powered responses:

```yaml
nodes:
  - id: analyze
    type: llm
    config:
      model: "gpt-4"
      system_prompt: |
        You are a helpful customer service agent.
        Extract the user's intent and any relevant entities.
      prompt: "User message: {{message}}"
      output_format: json
    next: process_result
```

## Template Rendering

Use Handlebars templates for dynamic content:

```yaml
nodes:
  - id: format_response
    type: template
    config:
      template: |
        Hi {{user_name}}!

        Here's your order summary:
        {{#each items}}
        - {{name}}: ${{price}}
        {{/each}}

        Total: ${{total}}
    next: send_response
```

## Flow Validation

Validate your flows before deployment:

```bash
greentic-flow doctor ./flows/

# Or with the GTC CLI
gtc flow validate ./flows/hello.ygtc
```

<Aside type="tip">
Use `greentic-flow doctor` to catch issues like:
- Missing node references
- Invalid node types
- Circular dependencies
- Schema violations
</Aside>

## Best Practices

1. **Keep flows focused** - One flow per user intent or workflow
2. **Use meaningful IDs** - Node IDs should describe their purpose
3. **Document with comments** - Add descriptions to complex flows
4. **Test incrementally** - Validate after each change
5. **Version your flows** - Use semantic versioning

## Example: Complete Customer Service Flow

```yaml title="flows/customer_service.ygtc"
name: customer_service
version: "1.0"
description: Handle customer inquiries with AI assistance

nodes:
  # Analyze the incoming message
  - id: analyze_intent
    type: llm
    config:
      model: "gpt-4"
      system_prompt: |
        Classify the customer's intent into one of:
        - greeting
        - order_status
        - product_question
        - complaint
        - other

        Respond with JSON: {"intent": "...", "confidence": 0.0-1.0}
      prompt: "{{message}}"
      output_format: json
    next: route_intent

  # Route based on intent
  - id: route_intent
    type: branch
    config:
      conditions:
        - expression: "intent.intent == 'greeting'"
          next: handle_greeting
        - expression: "intent.intent == 'order_status'"
          next: handle_order_status
        - expression: "intent.intent == 'complaint'"
          next: handle_complaint
      default: handle_general

  # Handle greeting
  - id: handle_greeting
    type: reply
    config:
      message: "Hello! Welcome to our support. How can I help you today?"

  # Handle order status
  - id: handle_order_status
    type: http
    config:
      method: GET
      url: "https://api.example.com/orders/{{order_id}}"
    next: format_order_response

  - id: format_order_response
    type: template
    config:
      template: |
        Your order #{{order_id}} is currently: {{status}}
        Expected delivery: {{delivery_date}}
    next: send_order_response

  - id: send_order_response
    type: reply
    config:
      message: "{{formatted_response}}"

  # Handle complaints with escalation
  - id: handle_complaint
    type: reply
    config:
      message: "I'm sorry to hear that. Let me connect you with a specialist who can help resolve this."
    next: escalate_to_human

  - id: escalate_to_human
    type: event
    config:
      event_type: "escalation.requested"
      payload:
        reason: "complaint"
        conversation_id: "{{session_id}}"

  # General handler
  - id: handle_general
    type: llm
    config:
      model: "gpt-4"
      system_prompt: "You are a helpful customer service agent. Be friendly and concise."
      prompt: "{{message}}"
    next: send_general_response

  - id: send_general_response
    type: reply
    config:
      message: "{{llm_response}}"

triggers:
  - type: message
    target: analyze_intent
```

## Next Steps

- [Packs](/greentic-docs/concepts/packs/) - Package your flows for deployment
- [Components](/greentic-docs/concepts/components/) - Create custom node types
- [Flow Schema Reference](/greentic-docs/reference/flow-schema/) - Complete YAML schema
