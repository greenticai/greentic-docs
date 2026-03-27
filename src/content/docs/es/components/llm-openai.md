---
title: LLM OpenAI
description: Componente de integración de LLM compatible con OpenAI
---

## Resumen

El componente **LLM OpenAI** proporciona integración con OpenAI y APIs compatibles con OpenAI (Azure OpenAI, Ollama, etc.).

## Configuración

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

### Para Azure OpenAI

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

## Uso en Flows

### Completion básica

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "What is the capital of France?"
  next: use_response
```

### Con system prompt

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

### Chat completion

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

### Con llamada a funciones

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

## Parámetros

| Parámetro | Tipo | Valor por defecto | Descripción |
|-----------|------|-------------------|-------------|
| `model` | string | "gpt-4" | Nombre del modelo |
| `prompt` | string | - | Prompt del usuario |
| `system_prompt` | string | - | Mensaje del sistema |
| `messages` | array | - | Arreglo completo de mensajes |
| `temperature` | float | 1.0 | Creatividad (0-2) |
| `max_tokens` | int | - | Máximo de tokens de respuesta |
| `output_format` | string | "text" | `"text"` o `"json"` |
| `functions` | array | - | Definiciones de funciones |
| `function_call` | string | "auto" | Modo de llamada a funciones |

## Manejo de respuestas

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

## Manejo de errores

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

## Siguientes pasos

- [Componente Templates](/es/components/templates/)
- [fast2flow](/es/components/fast2flow/)
