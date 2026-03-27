---
title: Flow YAML 模式
description: flow 定义文件（`.ygtc`）的完整参考
---

## 概述

Flow 使用带有 `.ygtc` 扩展名的 YAML 文件定义。本文档涵盖完整的 schema。

## 顶层结构

```yaml
name: string          # Required: Flow identifier
version: string       # Required: Semantic version
description: string   # Optional: Human-readable description

nodes: []             # Required: List of nodes
triggers: []          # Required: List of triggers
variables: {}         # Optional: Flow-level variables
config: {}            # Optional: Flow configuration
```

## 节点

### 节点 Schema

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

### 节点类型

#### reply

发送消息回复。

```yaml
- id: greet
  type: reply
  config:
    message: string         # Message text
    buttons: []             # Optional: Action buttons
    attachments: []         # Optional: File attachments
```

#### llm

调用 LLM。

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

渲染 Handlebars 模板。

```yaml
- id: format
  type: template
  config:
    template: string        # Inline template
    template_file: string   # Or: Path to template file
    data: object            # Optional: Template data
```

#### script

执行 Rhai 脚本。

```yaml
- id: calculate
  type: script
  config:
    script: string          # Inline script
    script_file: string     # Or: Path to script file
```

#### branch

条件分支。

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

管理会话状态。

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

发起 HTTP 请求。

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

发送事件。

```yaml
- id: notify
  type: event
  config:
    event_type: string      # Event type identifier
    payload: object         # Event payload
```

#### adaptive-card

渲染 Adaptive Card。

```yaml
- id: show_card
  type: adaptive-card
  config:
    card: string            # Card name (from pack)
    card_json: object       # Or: Inline card JSON
    data: object            # Optional: Card data
```

#### fast2flow

意图路由。

```yaml
- id: route
  type: fast2flow
  config:
    config_file: string     # Path to fast2flow config
    fallback_to_llm: bool   # Optional: Use LLM for ambiguous
```

#### flow2flow

调用子 flow。

```yaml
- id: call_sub
  type: flow2flow
  config:
    target_flow: string     # Flow to invoke
    pass_context: bool      # Optional: Pass current context
    input: object           # Optional: Input data
```

#### mcp-tool

执行 MCP tool。

```yaml
- id: query
  type: mcp-tool
  config:
    tool: string            # Tool name
    parameters: object      # Tool parameters
```

## 触发器

### 触发器 Schema

```yaml
triggers:
  - type: string            # Trigger type
    target: string          # Target node ID
    # Type-specific fields
```

### 触发器类型

#### message

由传入消息触发。

```yaml
- type: message
  pattern: string           # Optional: Regex pattern
  target: start
```

#### default

兜底触发器。

```yaml
- type: default
  target: fallback
```

#### event

由事件触发。

```yaml
- type: event
  event_type: string        # Event type to listen for
  target: handle_event
```

#### timer

定时触发器。

```yaml
- type: timer
  cron: string              # Cron expression
  timezone: string          # Optional: Timezone
  target: scheduled_task
```

#### callback_query

按钮回调（Telegram）。

```yaml
- type: callback_query
  target: handle_button
```

#### block_action

交互动作（Slack）。

```yaml
- type: block_action
  target: handle_action
```

## 变量

定义 flow 级变量：

```yaml
variables:
  max_retries: 3
  api_url: "https://api.example.com"
  welcome_message: "Hello!"
```

在节点中访问：

```yaml
- id: greet
  type: reply
  config:
    message: "{{flow.welcome_message}}"
```

## 配置

```yaml
config:
  timeout: 30000            # Flow timeout in ms
  retry_policy:
    max_retries: 3
    backoff: exponential
  logging:
    level: debug
```

## 表达式语法

表达式使用简单的 DSL：

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

## 模板变量

在所有字符串字段中均可使用：

| 变量 | 说明 |
|----------|-------------|
| `{{message}}` | 当前消息文本 |
| `{{user_id}}` | 用户标识符 |
| `{{channel_id}}` | 渠道标识符 |
| `{{session_id}}` | 会话标识符 |
| `{{tenant_id}}` | 租户标识符 |
| `{{state.*}}` | 会话状态值 |
| `{{flow.*}}` | Flow 变量 |
| `{{entry.*}}` | entry（传入）上下文字段 |
| `{{in.*}}` | `{{entry.*}}` 的别名 |

### 模板上下文别名：`in` 和 `entry`

模板上下文通过 `entry` 键暴露传入消息数据。从当前版本开始，支持使用 `in` 作为 `entry` 的别名，从而提供更简短、更直观的方式在模板中引用传入数据。

两种写法是等价的：

```yaml
# Using 'entry' (original)
- id: echo
  type: reply
  config:
    message: "You said: {{entry.text}}"

# Using 'in' (alias)
- id: echo
  type: reply
  config:
    message: "You said: {{in.text}}"
```

出于向后兼容考虑，`entry` 键仍然被完全支持。现有使用 `{{entry.*}}` 的 flow 无需修改即可继续工作。新 flow 可以使用任意一种形式；为简洁起见，推荐使用 `in`。

## 完整示例

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

## 后续步骤

- [Pack Format](/zh/reference/pack-format/)
- [Flows Guide](/zh/concepts/flows/)
