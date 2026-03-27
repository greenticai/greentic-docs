---
title: flow2flow
description: Komponen routing dan dispatch flow-ke-flow
---

## Gambaran Umum

**flow2flow** memungkinkan routing antar flow, sehingga mendukung komposisi flow modular dan pemanggilan sub-flow.

## Kasus Penggunaan

- Organisasi flow modular
- Sub-flow yang dapat digunakan ulang
- Peralihan flow bersyarat
- Rangkaian flow

## Konfigurasi

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

| Parameter | Jenis | Deskripsi |
|-----------|------|-----------|
| `target_flow` | string | Flow yang akan dipanggil |
| `pass_context` | bool | Oper context saat ini ke sub-flow |
| `input` | object | Data yang diteruskan ke sub-flow |
| `wait_for_completion` | bool | Tunggu sub-flow selesai |

## Contoh: Layanan Pelanggan Modular

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

## Langkah Berikutnya

- [fast2flow](/id/components/fast2flow/)
- [Panduan Flows](/id/concepts/flows/)
