---
title: LLM OpenAI
description: Komponen integrasi LLM yang kompatibel dengan OpenAI
---

## Gambaran Umum

Komponen **LLM OpenAI** menyediakan integrasi dengan OpenAI dan API yang kompatibel dengan OpenAI (Azure OpenAI, Ollama, dll.).

## Konfigurasi

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

### Untuk Azure OpenAI

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

## Penggunaan di Flow

### Completion Dasar

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "What is the capital of France?"
  to: use_response
```

### Dengan System Prompt

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
  to: route_intent
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

### Dengan Function Calling

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

## Parameter

| Parameter | Jenis | Default | Deskripsi |
|-----------|------|---------|-----------|
| `model` | string | "gpt-4" | Nama model |
| `prompt` | string | - | Prompt pengguna |
| `system_prompt` | string | - | Pesan system |
| `messages` | array | - | Array pesan penuh |
| `temperature` | float | 1.0 | Kreativitas (0-2) |
| `max_tokens` | int | - | Maksimum token respons |
| `output_format` | string | "text" | "text" atau "json" |
| `functions` | array | - | Definisi function |
| `function_call` | string | "auto" | Mode pemanggilan function |

## Penanganan Respons

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "{{question}}"
  output: llm_response
  to: use_response

- id: use_response
  type: reply
  config:
    message: "{{llm_response}}"
```

## Penanganan Error

```yaml
- id: safe_llm_call
  type: llm
  config:
    model: "gpt-4"
    prompt: "{{message}}"
    timeout: 30000
    retry_count: 3
  on_error: handle_error
  to: success

- id: handle_error
  type: reply
  config:
    message: "I'm having trouble processing that. Please try again."
```

## Langkah Berikutnya

- [Komponen Templates](/id/components/templates/)
- [fast2flow](/id/components/fast2flow/)
