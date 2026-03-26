---
title: Messaging Providers Overview
description: Connect your digital worker to messaging platforms
---

import { Card, CardGrid, LinkCard } from '@astrojs/starlight/components';

## Introduction

Greentic supports multiple messaging platforms through **Messaging Providers**. Each provider is a WASM component pack that handles:

- **Ingress** - Receiving messages from the platform
- **Egress** - Sending messages to the platform
- **Operations** - Platform-specific features (buttons, cards, threads)

## Available Providers

<CardGrid>
  <LinkCard
    title="Slack"
    href="/providers/messaging/slack/"
    description="Connect to Slack workspaces with full app support"
  />
  <LinkCard
    title="Microsoft Teams"
    href="/providers/messaging/teams/"
    description="Integrate with Microsoft Teams channels and chats"
  />
  <LinkCard
    title="Telegram"
    href="/providers/messaging/telegram/"
    description="Build Telegram bots with buttons and inline keyboards"
  />
  <LinkCard
    title="WhatsApp"
    href="/providers/messaging/whatsapp/"
    description="Connect to WhatsApp Business API"
  />
  <LinkCard
    title="WebChat"
    href="/providers/messaging/webchat/"
    description="Embed chat widget in your website"
  />
  <LinkCard
    title="Webex"
    href="/providers/messaging/webex/"
    description="Integrate with Cisco Webex Teams"
  />
  <LinkCard
    title="Email"
    href="/providers/messaging/email/"
    description="Send and receive emails as messages"
  />
</CardGrid>

## Architecture

```
External Platform (Slack/Teams/Telegram)
    │
    ▼ Webhook
┌─────────────────────────────────────────┐
│           Ingress Component             │
│   (Parse platform-specific format)      │
└─────────────────────────────────────────┘
    │
    ▼ Normalized Message
┌─────────────────────────────────────────┐
│              NATS Bus                    │
│  greentic.messaging.ingress.{tenant}... │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│           Flow Executor                  │
│      (Process with your flows)          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│              NATS Bus                    │
│  greentic.messaging.egress.{tenant}...  │
└─────────────────────────────────────────┘
    │
    ▼ Platform-specific format
┌─────────────────────────────────────────┐
│           Egress Component              │
│     (Format for platform API)           │
└─────────────────────────────────────────┘
    │
    ▼ API Call
External Platform
```

## Message Normalization

All providers normalize messages to a common format:

```rust
pub struct NormalizedMessage {
    pub id: String,
    pub channel_id: String,
    pub sender_id: String,
    pub sender_name: Option<String>,
    pub content: String,
    pub timestamp: u64,
    pub reply_to: Option<String>,
    pub attachments: Vec<Attachment>,
    pub metadata: Option<Value>,
}
```

This allows your flows to work across any messaging platform without modification.

## Provider Configuration

### In Bundle

```yaml title="greentic.demo.yaml"
providers:
  messaging-telegram:
    pack: "providers/messaging/messaging-telegram.gtpack"
    setup_flow: "setup_default"
    verify_flow: "verify_webhooks"

  messaging-slack:
    pack: "providers/messaging/messaging-slack.gtpack"
    setup_flow: "setup_default"
```

### Setup Answers

```json title="answers.json"
{
  "messaging-telegram": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app",
    "bot_token": "123456789:ABCdefGHI..."
  },
  "messaging-slack": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app",
    "bot_token": "xoxb-xxx-xxx",
    "slack_app_id": "A07XXX"
  }
}
```

## NATS Subjects

Messages flow through NATS with tenant-scoped subjects:

| Subject | Direction |
|---------|-----------|
| `greentic.messaging.ingress.{env}.{tenant}.{team}.{channel}` | Incoming |
| `greentic.messaging.egress.{env}.{tenant}.{team}.{channel}` | Outgoing |

## Common Features

### Text Messages

All providers support basic text messages:

```yaml
- id: reply
  type: reply
  config:
    message: "Hello! How can I help?"
```

### Rich Content

Most providers support rich content:

```yaml
- id: send_card
  type: adaptive-card
  config:
    card: "cards/welcome.json"
```

### Buttons/Actions

Interactive elements (provider-dependent):

```yaml
- id: ask_choice
  type: reply
  config:
    message: "What would you like to do?"
    buttons:
      - label: "Get Help"
        action: "help"
      - label: "Contact Support"
        action: "support"
```

### Attachments

File and media support:

```yaml
- id: send_file
  type: reply
  config:
    message: "Here's your report"
    attachments:
      - type: file
        url: "https://example.com/report.pdf"
        name: "report.pdf"
```

## Multi-Channel Flows

Write flows that work across channels:

```yaml title="flows/on_message.ygtc"
name: universal_handler
version: "1.0"

nodes:
  - id: greet
    type: reply
    config:
      # Works on any platform
      message: "Hello! I'm your assistant."
    next: ask_intent

  - id: ask_intent
    type: reply
    config:
      message: "How can I help you today?"
      # Buttons render differently per platform
      buttons:
        - label: "Get Started"
          action: "start"
        - label: "Help"
          action: "help"

triggers:
  - type: message
    pattern: "hello|hi"
    target: greet
```

## Provider Comparison

| Feature | Slack | Teams | Telegram | WhatsApp | WebChat | Webex | Email |
|---------|-------|-------|----------|----------|---------|-------|-------|
| Text | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Rich Cards | Yes | Yes | Partial | Yes | Yes | Yes | No |
| Buttons | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Files | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Threads | Yes | Yes | Yes | No | No | Yes | Yes |
| Reactions | Yes | Yes | No | Yes | No | No | No |

## Next Steps

Choose a provider to get started:

- [Telegram](/providers/messaging/telegram/) - Easiest setup, great for testing
- [Slack](/providers/messaging/slack/) - Full-featured workspace integration
- [WebChat](/providers/messaging/webchat/) - Embed in your website
