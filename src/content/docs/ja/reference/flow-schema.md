---
title: Flow YAML スキーマ
description: フロー定義ファイル（.ygtc）の完全リファレンス
---

## 概要

フローは `.ygtc` 拡張子を持つ YAML ファイルで定義されます。このリファレンスでは完全なスキーマを扱います。

## トップレベル構造

```yaml
name: string          # Required: Flow identifier
version: string       # Required: Semantic version
description: string   # Optional: Human-readable description

nodes: []             # Required: List of nodes
triggers: []          # Required: List of triggers
variables: {}         # Optional: Flow-level variables
config: {}            # Optional: Flow configuration
```

## ノード

### ノードスキーマ

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

### ノードタイプ

#### reply

メッセージ応答を送信します。

```yaml
- id: greet
  type: reply
  config:
    message: string         # Message text
    buttons: []             # Optional: Action buttons
    attachments: []         # Optional: File attachments
```

#### llm

LLM を呼び出します。

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

Handlebars テンプレートをレンダリングします。

```yaml
- id: format
  type: template
  config:
    template: string        # Inline template
    template_file: string   # Or: Path to template file
    data: object            # Optional: Template data
```

#### script

Rhai スクリプトを実行します。

```yaml
- id: calculate
  type: script
  config:
    script: string          # Inline script
    script_file: string     # Or: Path to script file
```

#### branch

条件分岐を行います。

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

セッション状態を管理します。

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

HTTP リクエストを実行します。

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

イベントを発行します。

```yaml
- id: notify
  type: event
  config:
    event_type: string      # Event type identifier
    payload: object         # Event payload
```

#### adaptive-card

Adaptive Card をレンダリングします。

```yaml
- id: show_card
  type: adaptive-card
  config:
    card: string            # Card name (from pack)
    card_json: object       # Or: Inline card JSON
    data: object            # Optional: Card data
```

#### fast2flow

インテントルーティングです。

```yaml
- id: route
  type: fast2flow
  config:
    config_file: string     # Path to fast2flow config
    fallback_to_llm: bool   # Optional: Use LLM for ambiguous
```

#### flow2flow

サブフローを呼び出します。

```yaml
- id: call_sub
  type: flow2flow
  config:
    target_flow: string     # Flow to invoke
    pass_context: bool      # Optional: Pass current context
    input: object           # Optional: Input data
```

#### mcp-tool

MCP ツールを実行します。

```yaml
- id: query
  type: mcp-tool
  config:
    tool: string            # Tool name
    parameters: object      # Tool parameters
```

## トリガー

### トリガースキーマ

```yaml
triggers:
  - type: string            # Trigger type
    target: string          # Target node ID
    # Type-specific fields
```

### トリガータイプ

#### message

受信メッセージによってトリガーされます。

```yaml
- type: message
  pattern: string           # Optional: Regex pattern
  target: start
```

#### default

すべてを受け止めるトリガーです。

```yaml
- type: default
  target: fallback
```

#### event

イベントによってトリガーされます。

```yaml
- type: event
  event_type: string        # Event type to listen for
  target: handle_event
```

#### timer

スケジュールされたトリガーです。

```yaml
- type: timer
  cron: string              # Cron expression
  timezone: string          # Optional: Timezone
  target: scheduled_task
```

#### callback_query

ボタンコールバック（Telegram）。

```yaml
- type: callback_query
  target: handle_button
```

#### block_action

インタラクティブアクション（Slack）。

```yaml
- type: block_action
  target: handle_action
```

## 変数

フローレベルの変数を定義します。

```yaml
variables:
  max_retries: 3
  api_url: "https://api.example.com"
  welcome_message: "Hello!"
```

ノード内でのアクセス:

```yaml
- id: greet
  type: reply
  config:
    message: "{{flow.welcome_message}}"
```

## 設定

```yaml
config:
  timeout: 30000            # Flow timeout in ms
  retry_policy:
    max_retries: 3
    backoff: exponential
  logging:
    level: debug
```

## 式の構文

式ではシンプルな DSL を使用します。

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

## テンプレート変数

すべての文字列フィールドで利用できます。

| 変数 | 説明 |
|----------|-------------|
| `{{message}}` | 現在のメッセージテキスト |
| `{{user_id}}` | ユーザー識別子 |
| `{{channel_id}}` | チャネル識別子 |
| `{{session_id}}` | セッション識別子 |
| `{{tenant_id}}` | テナント識別子 |
| `{{state.*}}` | セッション状態の値 |
| `{{flow.*}}` | フロー変数 |
| `{{entry.*}}` | エントリー（受信）コンテキストのフィールド |
| `{{in.*}}` | `{{entry.*}}` の別名 |

### テンプレートコンテキストの別名: `in` と `entry`

テンプレートコンテキストは、受信メッセージデータを `entry` キーの下で公開します。現行バージョンでは、`in` が `entry` の別名としてサポートされており、テンプレート内で受信データを参照するためのより短く直感的な方法を提供します。

どちらの形式も同等です。

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

`entry` キーは後方互換性のために引き続き完全にサポートされます。`{{entry.*}}` を使う既存のフローは、変更なしでそのまま動作します。新しいフローではどちらの形式も使用できますが、簡潔さのため `in` を推奨します。

## 完全な例

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

## 次のステップ

- [Pack Format](/ja/reference/pack-format/)
- [Flows ガイド](/ja/concepts/flows/)
