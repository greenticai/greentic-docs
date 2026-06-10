---
title: flow2flow
description: Flow 到 flow 的路由与分发组件
---

## 概述

**flow2flow** 支持在 flows 之间进行路由，从而实现模块化的 flow 组合与子 flow 调用。

## 使用场景

- 模块化 flow 组织
- 可复用子 flows
- 条件式 flow 切换
- Flow 链式调用

## 配置

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

## 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `target_flow` | string | 要调用的 flow |
| `pass_context` | bool | 是否将当前上下文传递给子 flow |
| `input` | object | 传递给子 flow 的数据 |
| `wait_for_completion` | bool | 是否等待子 flow 完成 |

## 示例：模块化客户服务

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

## 下一步

- [fast2flow](/zh/components/fast2flow/)
- [Flows Guide](/zh/concepts/flows/)
