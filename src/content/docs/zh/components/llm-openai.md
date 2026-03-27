---
title: LLM OpenAI
description: 与 OpenAI 兼容的 LLM 集成组件
---

## 概述

**LLM OpenAI** 组件提供与 OpenAI 及 OpenAI 兼容 API（Azure OpenAI、Ollama 等）的集成。

## 配置

### 设置

```json title="answers.json"
{
  "component-llm-openai": {
    "api_key": "sk-xxx...",
    "api_base": "https://api.openai.com/v1",
    "default_model": "gpt-4"
  }
}
```

### 用于 Azure OpenAI

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

## 在 Flows 中使用

### 基础 Completion

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "What is the capital of France?"
  next: use_response
```

### 配合 System Prompt

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

### 配合 Function Calling

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

## 参数

| 参数 | 类型 | 默认值 | 说明 |
|-----------|------|---------|-------------|
| `model` | string | "gpt-4" | 模型名称 |
| `prompt` | string | - | 用户提示词 |
| `system_prompt` | string | - | 系统消息 |
| `messages` | array | - | 完整消息数组 |
| `temperature` | float | 1.0 | 创造性（0-2） |
| `max_tokens` | int | - | 最大响应 token 数 |
| `output_format` | string | "text" | `"text"` 或 `"json"` |
| `functions` | array | - | 函数定义 |
| `function_call` | string | "auto" | 函数调用模式 |

## 响应处理

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

## 错误处理

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

## 下一步

- [Templates Component](/zh/components/templates/)
- [fast2flow](/zh/components/fast2flow/)
