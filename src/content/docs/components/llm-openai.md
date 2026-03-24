---
title: LLM OpenAI
description: OpenAI-compatible LLM integration component
---

## Overview

The **LLM OpenAI** component provides integration with OpenAI and OpenAI-compatible APIs (Azure OpenAI, Ollama, etc.).

## Configuration

### Setup

```json title="answers.json"
{
  "component-llm-openai": {
    "api_key": "sk-xxx...",
    "api_base": "https://api.openai.com/v1",
    "default_model": "gpt-4"
  }
}
```

### For Azure OpenAI

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

## Usage in Flows

### Basic Completion

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "What is the capital of France?"
  next: use_response
```

### With System Prompt

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

### With Function Calling

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

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | "gpt-4" | Model name |
| `prompt` | string | - | User prompt |
| `system_prompt` | string | - | System message |
| `messages` | array | - | Full message array |
| `temperature` | float | 1.0 | Creativity (0-2) |
| `max_tokens` | int | - | Max response tokens |
| `output_format` | string | "text" | "text" or "json" |
| `functions` | array | - | Function definitions |
| `function_call` | string | "auto" | Function call mode |

## Response Handling

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

## Error Handling

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

## Next Steps

- [Templates Component](/greentic-docs/components/templates/)
- [fast2flow](/greentic-docs/components/fast2flow/)
