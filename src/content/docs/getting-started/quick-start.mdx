---
title: Quick Start
description: Get your first Greentic digital worker running in minutes
---

import { Steps, Tabs, TabItem } from '@astrojs/starlight/components';

This guide will help you get a basic Greentic digital worker running locally.

## Prerequisites

Before you begin, ensure you have:

- **Rust** 1.90 or later (`rustup default 1.90`)
- **Node.js** 18+ (for frontend tools)
- **Git** for cloning repositories

## Installation

<Steps>

1. **Install the GTC CLI**

   ```bash
   cargo install greentic-cli
   ```

   Or build from source:

   ```bash
   git clone https://github.com/greenticai/greentic.git
   cd greentic/greentic
   cargo build --release
   ```

2. **Create a new bundle**

   Use the wizard to create a new bundle with your desired configuration:

   ```bash
   gtc wizard --answers wizard-answers.yaml
   ```

   Or run interactively:

   ```bash
   gtc wizard
   ```

3. **Configure providers**

   Set up your messaging providers (e.g., Telegram, Slack):

   ```bash
   gtc setup ./my-bundle
   ```

   For non-interactive setup, use an answers file:

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

4. **Start the runtime**

   Launch your digital worker:

   ```bash
   gtc start ./my-bundle
   ```

</Steps>

## Example: Hello World Flow

Create a simple flow that responds to messages:

```yaml title="flows/hello.ygtc"
name: hello_world
version: "1.0"
description: A simple greeting flow

nodes:
  - id: greet
    type: reply
    config:
      message: "Hello! I'm your digital worker."

triggers:
  - type: message
    pattern: "hello"
    target: greet
```

## Bundle Structure

A typical Greentic bundle looks like this:

```
my-bundle/
├── greentic.demo.yaml      # Main configuration
├── providers/
│   └── messaging/
│       └── messaging-telegram.gtpack
├── apps/
│   └── my-app/
│       └── flows/
│           └── on_message.ygtc
└── seeds.yaml              # Seed data (optional)
```

## Configuration File

The main configuration file (`greentic.demo.yaml`) defines your setup:

```yaml title="greentic.demo.yaml"
name: my-digital-worker
version: "1.0"

providers:
  messaging-telegram:
    pack: "providers/messaging/messaging-telegram.gtpack"
    setup_flow: "setup_default"

apps:
  my-app:
    path: "apps/my-app"
    default_flow: "on_message"

tenants:
  demo:
    name: Demo Tenant
    teams:
      default:
        channels:
          telegram:
            provider: messaging-telegram
```

## Next Steps

Now that you have a basic setup running:

- [Learn about Flows](/greentic-docs/concepts/flows/) - Understand flow definitions
- [Configure Telegram](/greentic-docs/providers/messaging/telegram/) - Set up Telegram bot
- [Configure Slack](/greentic-docs/providers/messaging/slack/) - Connect to Slack workspace
- [Build custom components](/greentic-docs/concepts/components/) - Create your own WASM components
