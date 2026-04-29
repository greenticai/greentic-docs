---
title: flow2flow
description: Flow-to-flow routing and dispatch component
---

## Overview

**flow2flow** enables routing between flows, allowing modular flow composition and sub-flow invocation.

## Use Cases

- Modular flow organization
- Reusable sub-flows
- Conditional flow switching
- Flow chaining

## Configuration

```yaml title="flows/main.ygtc"
name: main_flow
version: "1.0"

nodes:
  - id: check_context
    type: branch
    config:
      conditions:
        - expression: "context.needs_auth"
          to: call_auth_flow
        - expression: "context.is_returning"
          to: call_returning_flow
      default: call_new_user_flow

  - id: call_auth_flow
    type: flow2flow
    config:
      target_flow: "auth/login"
      pass_context: true
    to: continue_main

  - id: call_returning_flow
    type: flow2flow
    config:
      target_flow: "users/returning"
      pass_context: true
    to: continue_main

  - id: call_new_user_flow
    type: flow2flow
    config:
      target_flow: "users/onboarding"
      pass_context: true
    to: continue_main

  - id: continue_main
    type: reply
    config:
      message: "Continuing main flow..."

triggers:
  - type: message
    target: check_context
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_flow` | string | Flow to invoke |
| `pass_context` | bool | Pass current context to sub-flow |
| `input` | object | Data to pass to sub-flow |
| `wait_for_completion` | bool | Wait for sub-flow to complete |

## Example: Modular Customer Service

```yaml title="flows/customer_service/main.ygtc"
name: customer_service_main
version: "1.0"

nodes:
  - id: classify
    type: fast2flow
    config:
      intents:
        billing:
          patterns: ["invoice", "payment", "charge"]
          target: call_billing
        technical:
          patterns: ["error", "bug", "not working"]
          target: call_technical
        general:
          patterns: [".*"]
          target: call_general

  - id: call_billing
    type: flow2flow
    config:
      target_flow: "customer_service/billing"
      pass_context: true

  - id: call_technical
    type: flow2flow
    config:
      target_flow: "customer_service/technical"
      pass_context: true

  - id: call_general
    type: flow2flow
    config:
      target_flow: "customer_service/general"
      pass_context: true

triggers:
  - type: message
    target: classify
```

## Next Steps

- [fast2flow](/components/fast2flow/)
- [Flows Guide](/concepts/flows/)
