---
title: Flow YAML Schema
description: Complete reference for flow definition files (.ygtc)
---

## Overview

Flows are defined in YAML files with the `.ygtc` extension. This reference covers the complete schema.

## Top-Level Structure

```yaml
name: string          # Required: Flow identifier
version: string       # Required: Semantic version
description: string   # Optional: Human-readable description

nodes: []             # Required: List of nodes
triggers: []          # Required: List of triggers
variables: {}         # Optional: Flow-level variables
config: {}            # Optional: Flow configuration
```

## Nodes

### Node Schema

```yaml
nodes:
  - id: string              # Required: Unique node identifier
    type: string            # Required: Node type
    config: object          # Type-specific configuration
    next: string            # Optional: Next node ID
    on_error: string        # Optional: Error handler node ID
    output: string          # Optional: Output variable name
    timeout: number         # Optional: Timeout in milliseconds
```

### Node Types

#### reply

Send a message response.

```yaml
- id: greet
  type: reply
  config:
    message: string         # Message text
    buttons: []             # Optional: Action buttons
    attachments: []         # Optional: File attachments
```

#### llm

Call an LLM.

```yaml
- id: analyze
  type: llm
  config:
    model: string           # Model name (e.g., "gpt-4")
    prompt: string          # User prompt
    system_prompt: string   # Optional: System message
    temperature: number     # Optional: 0-2 (default: 1)
    max_tokens: number      # Optional: Max response tokens
    output_format: string   # Optional: "text" or "json"
    functions: []           # Optional: Function definitions
```

#### template

Render a Handlebars template.

```yaml
- id: format
  type: template
  config:
    template: string        # Inline template
    template_file: string   # Or: Path to template file
    data: object            # Optional: Template data
```

#### script

Execute Rhai script.

```yaml
- id: calculate
  type: script
  config:
    script: string          # Inline script
    script_file: string     # Or: Path to script file
```

#### branch

Conditional branching.

```yaml
- id: route
  type: branch
  config:
    conditions:
      - expression: string  # Condition expression
        next: string        # Target node if true
    default: string         # Default node if no match
```

#### state

Manage session state.

```yaml
- id: save
  type: state
  config:
    action: string          # "get", "set", "delete"
    key: string             # State key
    value: any              # Value (for "set")
    output: string          # Output variable (for "get")
```

#### http

Make HTTP requests.

```yaml
- id: fetch
  type: http
  config:
    method: string          # HTTP method
    url: string             # Request URL
    headers: object         # Optional: HTTP headers
    body: any               # Optional: Request body
    timeout: number         # Optional: Timeout in ms
```

#### event

Emit an event.

```yaml
- id: notify
  type: event
  config:
    event_type: string      # Event type identifier
    payload: object         # Event payload
```

#### adaptive-card

Render an Adaptive Card.

```yaml
- id: show_card
  type: adaptive-card
  config:
    card: string            # Card name (from pack)
    card_json: object       # Or: Inline card JSON
    data: object            # Optional: Card data
```

#### fast2flow

Intent routing.

```yaml
- id: route
  type: fast2flow
  config:
    config_file: string     # Path to fast2flow config
    fallback_to_llm: bool   # Optional: Use LLM for ambiguous
```

#### flow2flow

Invoke sub-flow.

```yaml
- id: call_sub
  type: flow2flow
  config:
    target_flow: string     # Flow to invoke
    pass_context: bool      # Optional: Pass current context
    input: object           # Optional: Input data
```

#### mcp-tool

Execute MCP tool.

```yaml
- id: query
  type: mcp-tool
  config:
    tool: string            # Tool name
    parameters: object      # Tool parameters
```

## Triggers

### Trigger Schema

```yaml
triggers:
  - type: string            # Trigger type
    target: string          # Target node ID
    # Type-specific fields
```

### Trigger Types

#### message

Triggered by incoming messages.

```yaml
- type: message
  pattern: string           # Optional: Regex pattern
  target: start
```

#### default

Catch-all trigger.

```yaml
- type: default
  target: fallback
```

#### event

Triggered by events.

```yaml
- type: event
  event_type: string        # Event type to listen for
  target: handle_event
```

#### timer

Scheduled trigger.

```yaml
- type: timer
  cron: string              # Cron expression
  timezone: string          # Optional: Timezone
  target: scheduled_task
```

#### callback_query

Button callback (Telegram).

```yaml
- type: callback_query
  target: handle_button
```

#### block_action

Interactive action (Slack).

```yaml
- type: block_action
  target: handle_action
```

## Variables

Define flow-level variables:

```yaml
variables:
  max_retries: 3
  api_url: "https://api.example.com"
  welcome_message: "Hello!"
```

Access in nodes:

```yaml
- id: greet
  type: reply
  config:
    message: "{{flow.welcome_message}}"
```

## Configuration

```yaml
config:
  timeout: 30000            # Flow timeout in ms
  retry_policy:
    max_retries: 3
    backoff: exponential
  logging:
    level: debug
```

## Expression Syntax

Expressions use a simple DSL:

```yaml
# Equality
expression: "intent == 'greeting'"

# Contains
expression: "message contains 'help'"

# Comparison
expression: "count > 5"

# Logical
expression: "is_vip && has_order"
expression: "status == 'pending' || status == 'processing'"

# Nested access
expression: "user.profile.tier == 'premium'"
```

## Template Variables

Available in all string fields:

| Variable | Description |
|----------|-------------|
| `{{message}}` | Current message text |
| `{{user_id}}` | User identifier |
| `{{channel_id}}` | Channel identifier |
| `{{session_id}}` | Session identifier |
| `{{tenant_id}}` | Tenant identifier |
| `{{state.*}}` | Session state values |
| `{{flow.*}}` | Flow variables |

## Complete Example

```yaml
name: customer_service
version: "1.0.0"
description: Customer service flow with intent routing

variables:
  support_email: "support@example.com"

nodes:
  - id: analyze
    type: llm
    config:
      model: "gpt-4"
      system_prompt: |
        Classify intent: greeting, order_status, complaint, other
        Respond JSON: {"intent": "...", "confidence": 0.0-1.0}
      prompt: "{{message}}"
      output_format: json
    output: intent_result
    next: route

  - id: route
    type: branch
    config:
      conditions:
        - expression: "intent_result.intent == 'greeting'"
          next: greet
        - expression: "intent_result.intent == 'order_status'"
          next: check_order
        - expression: "intent_result.intent == 'complaint'"
          next: escalate
      default: general_help

  - id: greet
    type: reply
    config:
      message: "Hello! How can I help you today?"

  - id: check_order
    type: http
    config:
      method: GET
      url: "https://api.example.com/orders/{{order_id}}"
    next: show_order_status

  - id: show_order_status
    type: template
    config:
      template: |
        Order #{{order.id}}
        Status: {{order.status}}
        ETA: {{order.eta}}
    next: reply_order

  - id: reply_order
    type: reply
    config:
      message: "{{formatted_status}}"

  - id: escalate
    type: reply
    config:
      message: "I'm sorry to hear that. Connecting you to support..."
    next: create_ticket

  - id: create_ticket
    type: mcp-tool
    config:
      tool: "create_ticket"
      parameters:
        subject: "Complaint from {{user_id}}"
        message: "{{message}}"

  - id: general_help
    type: reply
    config:
      message: |
        I can help you with:
        - Order status
        - Returns
        - General questions

        Contact: {{flow.support_email}}

triggers:
  - type: message
    target: analyze
```

## Next Steps

- [Pack Format](/reference/pack-format/)
- [Flows Guide](/concepts/flows/)
