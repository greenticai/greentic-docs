---
title: flow2flow
description: Flow 間の routing と dispatch を行う component
---

## 概要

**flow2flow** は flow 間の routing を可能にし、モジュール化された flow の構成や sub-flow の呼び出しを実現します。

## ユースケース

- モジュール化された flow の整理
- 再利用可能な sub-flows
- 条件に応じた flow の切り替え
- flow の連鎖

## 設定

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

## パラメータ

| Parameter | Type | 説明 |
|-----------|------|-------------|
| `target_flow` | string | 呼び出す flow |
| `pass_context` | bool | 現在の context を sub-flow に渡す |
| `input` | object | sub-flow に渡すデータ |
| `wait_for_completion` | bool | sub-flow の完了を待つ |

## 例: モジュール化されたカスタマーサービス

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

## 次のステップ

- [fast2flow](/ja/components/fast2flow/)
- [Flows Guide](/ja/concepts/flows/)
