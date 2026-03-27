---
title: LLM OpenAI
description: OpenAI-kompatible LLM-Integrationskomponente
---

## Überblick

Die Komponente **LLM OpenAI** bietet Integration mit OpenAI und OpenAI-kompatiblen APIs (Azure OpenAI, Ollama usw.).

## Konfiguration

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

### Für Azure OpenAI

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

## Verwendung in Flows

### Einfache Completion

```yaml
- id: ask_llm
  type: llm
  config:
    model: "gpt-4"
    prompt: "What is the capital of France?"
  next: use_response
```

### Mit System-Prompt

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

### Chat-Completion

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

### Mit Function Calling

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

| Parameter | Typ | Standard | Beschreibung |
|-----------|------|---------|-------------|
| `model` | string | "gpt-4" | Modellname |
| `prompt` | string | - | Benutzer-Prompt |
| `system_prompt` | string | - | Systemnachricht |
| `messages` | array | - | Vollständiges Message-Array |
| `temperature` | float | 1.0 | Kreativität (0-2) |
| `max_tokens` | int | - | Maximale Antwort-Tokens |
| `output_format` | string | "text" | `"text"` oder `"json"` |
| `functions` | array | - | Funktionsdefinitionen |
| `function_call` | string | "auto" | Function-Call-Modus |

## Antwortverarbeitung

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

## Fehlerbehandlung

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

## Nächste Schritte

- [Templates-Komponente](/de/components/templates/)
- [fast2flow](/de/components/fast2flow/)
