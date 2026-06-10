---
title: flow2flow
description: Componente de enrutamiento y despacho entre flows
---

## Resumen

**flow2flow** permite el enrutamiento entre flows, haciendo posible la composición modular de flows y la invocación de sub-flows.

## Casos de uso

- Organización modular de flows
- Sub-flows reutilizables
- Cambio condicional de flow
- Encadenamiento de flows

## Configuración

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

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `target_flow` | string | Flow a invocar |
| `pass_context` | bool | Pasa el contexto actual al sub-flow |
| `input` | object | Datos para pasar al sub-flow |
| `wait_for_completion` | bool | Espera a que el sub-flow termine |

## Ejemplo: Servicio al cliente modular

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

## Siguientes pasos

- [fast2flow](/es/components/fast2flow/)
- [Guía de Flows](/es/concepts/flows/)
