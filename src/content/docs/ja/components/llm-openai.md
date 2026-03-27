---
title: LLM OpenAI
description: OpenAI 互換の LLM 統合 component
---

## 概要

**LLM OpenAI** component は、OpenAI および OpenAI 互換 API（Azure OpenAI、Ollama など）との統合を提供します。

## 設定

### セットアップ

```json title="answers.json"
{
  "component-llm-openai": {
    "api_key": "sk-xxx...",
    "api_base": "https://api.openai.com/v1",
    "default_model": "gpt-4"
  }
}
```

### Azure OpenAI の場合

```json
{
  "component-llm-openai": {
    "api_key": "your-azure-key",
    "api_base": "https://your-resource.openai.azure.com",
    "api_type": "azure",
    "api_version": "2024-02-15-preview",
    "deployment_name": "gpt-4"
  }
}
```

## Flows での使い方

### 基本的な Completion

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "What is the capital of France?"
  next: use_response
```

### System Prompt を使う

```yaml
- id: classify
  type: llm
  config:
    model: "gpt-4"
    system_prompt: |
      You are a customer service intent classifier.
      Classify the user's message into one of: greeting, question, complaint, other.
      Respond with JSON: {"intent": "...", "confidence": 0.0-1.0}
    prompt: "{{message}}"
    output_format: json
  next: route_intent
```

### Chat Completion

```yaml
- id: chat
  type: llm
  config:
    model: "gpt-4"
    messages:
      - role: system
        content: "You are a helpful assistant."
      - role: user
        content: "{{user_message}}"
    temperature: 0.7
    max_tokens: 500
```

### Function Calling を使う

```yaml
- id: extract_entities
  type: llm
  config:
    model: "gpt-4"
    prompt: "Extract order information from: {{message}}"
    functions:
      - name: extract_order
        description: "Extract order details"
        parameters:
          type: object
          properties:
            order_id:
              type: string
              description: "The order ID"
            product:
              type: string
              description: "Product name"
          required: ["order_id"]
    function_call: "auto"
```

## パラメータ

| Parameter | Type | Default | 説明 |
|-----------|------|---------|-------------|
| `model` | string | "gpt-4" | model 名 |
| `prompt` | string | - | user prompt |
| `system_prompt` | string | - | system message |
| `messages` | array | - | 完全な message 配列 |
| `temperature` | float | 1.0 | 創造性（0-2） |
| `max_tokens` | int | - | 最大応答 token 数 |
| `output_format` | string | "text" | "text" または "json" |
| `functions` | array | - | function 定義 |
| `function_call` | string | "auto" | function call モード |

## 応答の扱い

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "{{question}}"
  output: llm_response
  next: use_response

- id: use_response
  type: reply
  config:
    message: "{{llm_response}}"
```

## エラーハンドリング

```yaml
- id: safe_llm_call
  type: llm
  config:
    model: "gpt-4"
    prompt: "{{message}}"
    timeout: 30000
    retry_count: 3
  on_error: handle_error
  next: success

- id: handle_error
  type: reply
  config:
    message: "I'm having trouble processing that. Please try again."
```

## 次のステップ

- [Templates Component](/ja/components/templates/)
- [fast2flow](/ja/components/fast2flow/)
