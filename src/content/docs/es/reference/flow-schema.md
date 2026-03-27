---
title: Esquema YAML de Flow
description: Referencia completa para archivos de definición de flows (.ygtc)
---

## Resumen

Los flows se definen en archivos YAML con la extensión `.ygtc`. Esta referencia cubre el esquema completo.

## Estructura de Nivel Superior

```yaml
name: string          # Required: Flow identifier
version: string       # Required: Semantic version
description: string   # Optional: Human-readable description

nodes: []             # Required: List of nodes
triggers: []          # Required: List of triggers
variables: {}         # Optional: Flow-level variables
config: {}            # Optional: Flow configuration
```

## Nodos

### Esquema de Nodo

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

### Tipos de Nodo

#### reply

Envía una respuesta de mensaje.

```yaml
- id: greet
  type: reply
  config:
    message: string         # Message text
    buttons: []             # Optional: Action buttons
    attachments: []         # Optional: File attachments
```

#### llm

Llama a un LLM.

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

Renderiza una plantilla Handlebars.

```yaml
- id: format
  type: template
  config:
    template: string        # Inline template
    template_file: string   # Or: Path to template file
    data: object            # Optional: Template data
```

#### script

Ejecuta un script Rhai.

```yaml
- id: calculate
  type: script
  config:
    script: string          # Inline script
    script_file: string     # Or: Path to script file
```

#### branch

Ramificación condicional.

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

Administra el estado de la sesión.

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

Realiza solicitudes HTTP.

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

Emite un evento.

```yaml
- id: notify
  type: event
  config:
    event_type: string      # Event type identifier
    payload: object         # Event payload
```

#### adaptive-card

Renderiza una Adaptive Card.

```yaml
- id: show_card
  type: adaptive-card
  config:
    card: string            # Card name (from pack)
    card_json: object       # Or: Inline card JSON
    data: object            # Optional: Card data
```

#### fast2flow

Enrutamiento por intención.

```yaml
- id: route
  type: fast2flow
  config:
    config_file: string     # Path to fast2flow config
    fallback_to_llm: bool   # Optional: Use LLM for ambiguous
```

#### flow2flow

Invoca un sub-flow.

```yaml
- id: call_sub
  type: flow2flow
  config:
    target_flow: string     # Flow to invoke
    pass_context: bool      # Optional: Pass current context
    input: object           # Optional: Input data
```

#### mcp-tool

Ejecuta una herramienta MCP.

```yaml
- id: query
  type: mcp-tool
  config:
    tool: string            # Tool name
    parameters: object      # Tool parameters
```

## Triggers

### Esquema de Trigger

```yaml
triggers:
  - type: string            # Trigger type
    target: string          # Target node ID
    # Type-specific fields
```

### Tipos de Trigger

#### message

Se activa con mensajes entrantes.

```yaml
- type: message
  pattern: string           # Optional: Regex pattern
  target: start
```

#### default

Trigger general.

```yaml
- type: default
  target: fallback
```

#### event

Se activa por eventos.

```yaml
- type: event
  event_type: string        # Event type to listen for
  target: handle_event
```

#### timer

Trigger programado.

```yaml
- type: timer
  cron: string              # Cron expression
  timezone: string          # Optional: Timezone
  target: scheduled_task
```

#### callback_query

Callback de botón (Telegram).

```yaml
- type: callback_query
  target: handle_button
```
