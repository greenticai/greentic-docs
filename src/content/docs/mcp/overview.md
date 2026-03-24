---
title: MCP Overview
description: Model Context Protocol integration in Greentic
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Introduction

**MCP (Model Context Protocol)** is a standard for connecting AI models to external tools and data sources. Greentic implements MCP for:

- Tool execution in sandboxed WASM environment
- Secure external API access
- Database queries
- File system operations

## Key Features

<CardGrid>
  <Card title="WASM Sandboxing" icon="puzzle">
    MCP tools run in isolated WebAssembly environments for security.
  </Card>
  <Card title="Tool Discovery" icon="magnifier">
    Automatic tool registration and capability advertisement.
  </Card>
  <Card title="Type Safety" icon="approve-check">
    WIT interfaces ensure type-safe tool invocations.
  </Card>
  <Card title="Observability" icon="seti:pulse">
    Built-in tracing and logging for tool executions.
  </Card>
</CardGrid>

## Architecture

```
LLM (with tool use)
       │
       ▼ Tool Call Request
┌─────────────────────────────────┐
│       greentic-mcp              │
│   (MCP Executor / WASI Bridge)  │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│    WASM Tool Component          │
│   (Sandboxed execution)         │
└─────────────────────────────────┘
       │
       ▼ Tool Result
Back to LLM
```

## MCP in Flows

### Tool Definition

```yaml title="tools/database-query.yaml"
name: database_query
description: Query the customer database
parameters:
  - name: query
    type: string
    description: SQL query to execute
    required: true
  - name: limit
    type: integer
    description: Maximum rows to return
    default: 10
returns:
  type: array
  items:
    type: object
```

### Using Tools in Flow

```yaml
- id: query_orders
  type: mcp-tool
  config:
    tool: "database_query"
    parameters:
      query: "SELECT * FROM orders WHERE customer_id = '{{customer_id}}'"
      limit: 5
  output: orders_result
  next: process_orders
```

### With LLM

```yaml
- id: agent_step
  type: llm
  config:
    model: "gpt-4"
    system_prompt: "You are a helpful assistant with database access."
    tools:
      - database_query
      - send_email
      - create_ticket
    tool_choice: "auto"
  next: handle_response
```

## Available Tools

Greentic provides several built-in MCP tools:

| Tool | Description |
|------|-------------|
| `http_request` | Make HTTP requests |
| `database_query` | Query databases |
| `file_read` | Read files (sandboxed) |
| `file_write` | Write files (sandboxed) |
| `send_email` | Send emails |
| `create_ticket` | Create support tickets |

## Security

### WASM Sandboxing

All MCP tools run in WASM sandboxes:
- No direct filesystem access
- No network access unless explicitly granted
- Memory isolation
- CPU time limits

### Capability Model

Tools declare required capabilities:

```yaml
capabilities:
  - network:outbound  # Can make outbound requests
  - filesystem:read   # Can read files in sandbox
```

## Next Steps

- [Creating MCP Tools](/greentic-docs/mcp/creating-tools/)
- [LLM OpenAI Component](/greentic-docs/components/llm-openai/)
