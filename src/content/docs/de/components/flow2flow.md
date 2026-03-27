---
title: flow2flow
description: Komponente für Flow-zu-Flow-Routing und Dispatch
---

## Überblick

**flow2flow** ermöglicht Routing zwischen Flows und erlaubt modulare Flow-Komposition sowie das Aufrufen von Sub-Flows.

## Anwendungsfälle

- Modulare Organisation von Flows
- Wiederverwendbare Sub-Flows
- Bedingtes Umschalten zwischen Flows
- Verkettung von Flows

## Konfiguration

```yaml title="flows/main.ygtc"
name: main_flow
version: "1.0"

nodes:
  - id: check_context
    type: branch
    config:
      conditions:
        - expression: "context.needs_auth"
          next: call_auth_flow
        - expression: "context.is_returning"
          next: call_returning_flow
      default: call_new_user_flow

  - id: call_auth_flow
    type: flow2flow
    config:
      target_flow: "auth/login"
      pass_context: true
    next: continue_main

  - id: call_returning_flow
    type: flow2flow
    config:
      target_flow: "users/returning"
      pass_context: true
    next: continue_main

  - id: call_new_user_flow
    type: flow2flow
    config:
      target_flow: "users/onboarding"
      pass_context: true
    next: continue_main

  - id: continue_main
    type: reply
    config:
      message: "Continuing main flow..."

triggers:
  - type: message
    target: check_context
```

## Parameter

| Parameter | Typ | Beschreibung |
|-----------|------|-------------|
| `target_flow` | string | Aufzurufender Flow |
| `pass_context` | bool | Aktuellen Kontext an den Sub-Flow übergeben |
| `input` | object | An den Sub-Flow zu übergebende Daten |
| `wait_for_completion` | bool | Warten, bis der Sub-Flow abgeschlossen ist |

## Beispiel: Modularer Customer Service

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

## Nächste Schritte

- [fast2flow](/de/components/fast2flow/)
- [Flows-Leitfaden](/de/concepts/flows/)
