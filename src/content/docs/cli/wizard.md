---
title: gtc wizard
description: Create new Greentic bundles with the wizard command
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

The `gtc wizard` command creates new Greentic bundles from wizard answers. It scaffolds the complete bundle structure including configuration files, provider setups, and app templates.

## Usage

```bash
gtc wizard [OPTIONS]
```

## Options

| Option | Description |
|--------|-------------|
| `--answers <FILE>` | Path to wizard answers file (JSON or YAML) |
| `--dry-run` | Preview generated files without writing |
| `--output <DIR>` | Output directory (default: current directory) |
| `--template <NAME>` | Use a specific template |
| `-v, --verbose` | Enable verbose output |

## Wizard Answers File

### JSON Format

```json title="wizard-answers.json"
{
  "project": {
    "name": "my-digital-worker",
    "version": "1.0.0",
    "description": "Customer support digital worker"
  },
  "providers": {
    "messaging": ["telegram", "slack"],
    "events": ["webhook", "timer"]
  },
  "apps": [
    {
      "name": "support-bot",
      "template": "customer-service"
    }
  ],
  "tenants": [
    {
      "id": "demo",
      "name": "Demo Tenant",
      "teams": [
        {
          "id": "default",
          "channels": ["telegram", "slack"]
        }
      ]
    }
  ]
}
```

### YAML Format

```yaml title="wizard-answers.yaml"
project:
  name: my-digital-worker
  version: "1.0.0"
  description: Customer support digital worker

providers:
  messaging:
    - telegram
    - slack
  events:
    - webhook
    - timer

apps:
  - name: support-bot
    template: customer-service

tenants:
  - id: demo
    name: Demo Tenant
    teams:
      - id: default
        channels:
          - telegram
          - slack
```

## Generated Structure

Running the wizard generates:

```
my-digital-worker/
├── greentic.demo.yaml          # Main configuration
├── providers/
│   ├── messaging/
│   │   ├── messaging-telegram.gtpack
│   │   └── messaging-slack.gtpack
│   └── events/
│       ├── events-webhook.gtpack
│       └── events-timer.gtpack
├── apps/
│   └── support-bot/
│       ├── app.yaml
│       └── flows/
│           └── on_message.ygtc
├── tenants/
│   └── demo/
│       ├── tenant.gmap
│       └── teams/
│           └── default/
│               └── team.gmap
└── seeds.yaml
```

## Examples

### Basic Usage

```bash
# Interactive mode
gtc wizard

# With answers file
gtc wizard --answers wizard-answers.yaml
```

### Preview Mode

```bash
# See what would be generated
gtc wizard --answers wizard-answers.yaml --dry-run
```

### Custom Output Directory

```bash
gtc wizard --answers wizard-answers.yaml --output ./my-project
```

### Using Templates

```bash
# List available templates
gtc wizard --list-templates

# Use specific template
gtc wizard --template customer-service --answers answers.yaml
```

## Available Templates

| Template | Description |
|----------|-------------|
| `minimal` | Bare bones bundle with one provider |
| `customer-service` | FAQ bot with escalation |
| `helpdesk` | IT support with ticket integration |
| `multi-channel` | Multiple messaging channels |

## Workflow

<Steps>

1. **Create answers file**

   Define your project configuration in JSON or YAML.

2. **Run wizard**

   ```bash
   gtc wizard --answers wizard-answers.yaml
   ```

3. **Review generated files**

   Check the generated bundle structure.

4. **Configure providers**

   ```bash
   gtc setup ./my-digital-worker
   ```

5. **Start runtime**

   ```bash
   gtc start ./my-digital-worker
   ```

</Steps>

## Customizing Generated Flows

The wizard generates basic flow templates. Customize them after generation:

```yaml title="apps/support-bot/flows/on_message.ygtc"
name: on_message
version: "1.0"
description: Handle incoming messages

nodes:
  # Add your custom nodes here
  - id: analyze
    type: llm
    config:
      model: "gpt-4"
      prompt: "Analyze: {{message}}"
    next: respond

  - id: respond
    type: reply
    config:
      message: "{{analysis_result}}"

triggers:
  - type: message
    target: analyze
```

<Aside type="tip">
Use `--dry-run` first to preview the generated structure before committing to disk.
</Aside>

## Troubleshooting

### Invalid Answers File

```
Error: Failed to parse answers file
```

Ensure your JSON/YAML is valid. Use a linter to check syntax.

### Missing Required Fields

```
Error: Missing required field: project.name
```

Check that all required fields are present in your answers file.

### Template Not Found

```
Error: Template 'unknown' not found
```

Use `gtc wizard --list-templates` to see available templates.

## Next Steps

- [gtc setup](/cli/setup/) - Configure providers
- [gtc start](/cli/start/) - Run the runtime
- [Quick Start](/getting-started/quick-start/) - Complete workflow
