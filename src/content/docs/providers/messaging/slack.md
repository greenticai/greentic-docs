---
title: Slack
description: Connect your digital worker to Slack workspaces
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

The Slack provider integrates your digital worker with Slack workspaces. It supports:

- Direct messages (DMs)
- Channel messages
- App mentions
- Interactive components (buttons, menus)
- Block Kit rich messaging
- Slash commands
- Thread replies

## Prerequisites

- A Slack workspace
- Admin access to create a Slack app

## Setup

<Steps>

1. **Create a Slack App**

   Go to [api.slack.com/apps](https://api.slack.com/apps) and click "Create New App":
   - Choose "From scratch"
   - Enter an app name (e.g., "My Support Bot")
   - Select your workspace

2. **Configure Bot Token Scopes**

   Go to **OAuth & Permissions** → **Scopes** → **Bot Token Scopes**:

   Required scopes:
   - `chat:write` - Send messages
   - `im:history` - Read DM history
   - `im:write` - Open DMs
   - `users:read` - Read user info

   Optional scopes:
   - `channels:history` - Read channel messages
   - `channels:read` - List channels
   - `files:read` - Read files
   - `files:write` - Upload files

3. **Enable Event Subscriptions**

   Go to **Event Subscriptions**:
   - Enable Events
   - Set Request URL: `https://your-domain.com/webhook/slack/{tenant}/{team}`

   Subscribe to bot events:
   - `message.im` - DM messages
   - `message.channels` - Channel messages
   - `app_mention` - @mentions

4. **Enable Interactivity**

   Go to **Interactivity & Shortcuts**:
   - Enable Interactivity
   - Set Request URL: `https://your-domain.com/webhook/slack/{tenant}/{team}/interactive`

5. **Install App to Workspace**

   Go to **Install App** → **Install to Workspace**

   Copy the **Bot User OAuth Token** (starts with `xoxb-`)

6. **Get App Credentials**

   From **Basic Information**:
   - App ID
   - Configuration Token (for manifest updates)

7. **Configure Provider**

   ```json title="answers.json"
   {
     "messaging-slack": {
       "enabled": true,
       "public_base_url": "https://your-domain.ngrok-free.app",
       "api_base_url": "https://slack.com/api",
       "bot_token": "xoxb-xxx-xxx-xxx",
       "slack_app_id": "A07XXXXXX",
       "slack_configuration_token": "xoxe.xoxp-xxx"
     }
   }
   ```

8. **Run Setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable the provider |
| `public_base_url` | Yes | Public URL for webhooks |
| `bot_token` | Yes | Bot User OAuth Token (`xoxb-...`) |
| `slack_app_id` | Yes | App ID from Basic Information |
| `slack_configuration_token` | No | For automatic manifest updates |
| `api_base_url` | No | Slack API URL (default: `https://slack.com/api`) |

## Features

### Text Messages

```yaml
- id: reply
  type: reply
  config:
    message: "Hello! How can I help you?"
```

### Markdown Formatting

Slack uses mrkdwn format:

```yaml
- id: formatted
  type: reply
  config:
    message: |
      *Bold* _Italic_ `code`
      >Blockquote
      • Bullet point
```

### Block Kit Messages

Use Slack's Block Kit for rich layouts:

```yaml
- id: rich_message
  type: reply
  config:
    blocks:
      - type: section
        text:
          type: mrkdwn
          text: "*Welcome!*\nHow can I assist you today?"
      - type: divider
      - type: actions
        elements:
          - type: button
            text:
              type: plain_text
              text: "Get Help"
            action_id: "help_clicked"
            value: "help"
          - type: button
            text:
              type: plain_text
              text: "View Status"
            action_id: "status_clicked"
            value: "status"
```

### Interactive Buttons

```yaml
- id: ask_action
  type: reply
  config:
    message: "What would you like to do?"
    blocks:
      - type: actions
        elements:
          - type: button
            text:
              type: plain_text
              text: "Create Ticket"
            style: primary
            action_id: "create_ticket"
          - type: button
            text:
              type: plain_text
              text: "Cancel"
            style: danger
            action_id: "cancel"
```

### Select Menus

```yaml
- id: select_option
  type: reply
  config:
    blocks:
      - type: section
        text:
          type: mrkdwn
          text: "Select a category:"
        accessory:
          type: static_select
          action_id: "category_select"
          options:
            - text:
                type: plain_text
                text: "Technical Support"
              value: "technical"
            - text:
                type: plain_text
                text: "Billing"
              value: "billing"
            - text:
                type: plain_text
                text: "General"
              value: "general"
```

### Thread Replies

Reply in a thread:

```yaml
- id: thread_reply
  type: reply
  config:
    message: "This replies in the thread"
    thread_ts: "{{original_message.thread_ts}}"
```

### File Uploads

```yaml
- id: upload_file
  type: reply
  config:
    files:
      - url: "https://example.com/report.pdf"
        filename: "report.pdf"
        title: "Monthly Report"
```

### Ephemeral Messages

Messages only visible to one user:

```yaml
- id: ephemeral
  type: reply
  config:
    message: "Only you can see this"
    ephemeral: true
    user: "{{user_id}}"
```

## Handling Interactions

### Button Clicks

```yaml title="flows/on_interaction.ygtc"
name: handle_interaction
version: "1.0"

nodes:
  - id: route_action
    type: branch
    config:
      conditions:
        - expression: "action_id == 'help_clicked'"
          next: show_help
        - expression: "action_id == 'create_ticket'"
          next: create_ticket
      default: unknown_action

  - id: show_help
    type: reply
    config:
      message: "Here's how I can help..."

triggers:
  - type: block_action
    target: route_action
```

### Select Menu Changes

```yaml
- id: handle_select
  type: branch
  config:
    conditions:
      - expression: "selected_value == 'technical'"
        next: technical_flow
      - expression: "selected_value == 'billing'"
        next: billing_flow
```

## Slash Commands

<Aside type="note">
Slash commands require additional app configuration in Slack.
</Aside>

1. Go to **Slash Commands** in your app settings
2. Create a command (e.g., `/support`)
3. Set Request URL to your webhook

Handle in your flow:

```yaml title="flows/slash_command.ygtc"
name: slash_command
version: "1.0"

nodes:
  - id: handle_command
    type: reply
    config:
      message: "Support bot at your service!"
      response_type: in_channel  # or "ephemeral"

triggers:
  - type: slash_command
    command: "/support"
    target: handle_command
```

## Channel Configuration

### Single Channel

```yaml title="greentic.demo.yaml"
tenants:
  demo:
    teams:
      support:
        channels:
          slack:
            provider: messaging-slack
            config:
              channel_id: "C1234567890"
```

### Multiple Channels

```yaml
tenants:
  demo:
    teams:
      support:
        channels:
          slack-general:
            provider: messaging-slack
            config:
              channel_id: "C1234567890"
          slack-vip:
            provider: messaging-slack
            config:
              channel_id: "C0987654321"
```

## Troubleshooting

### App Not Receiving Messages

1. **Verify Event Subscriptions:**
   - Check Request URL is correct
   - Ensure events are enabled
   - Verify bot is subscribed to correct events

2. **Check Bot Permissions:**
   - Reinstall app after adding scopes
   - Verify bot is in the channel

3. **Test Webhook:**
   ```bash
   curl https://your-domain.com/webhook/slack/demo/default
   ```

### "not_authed" Error

Your bot token is invalid or expired. Get a fresh token from OAuth & Permissions.

### "channel_not_found" Error

- Verify channel ID is correct
- Ensure bot is added to the channel
- Check channel is not archived

### Rate Limiting

Slack rate limits vary by method. Handle gracefully:

```yaml
- id: reply
  type: reply
  config:
    message: "Response"
    retry_on_rate_limit: true
    max_retries: 3
```

## Security

<Aside type="caution">
Verify Slack request signatures to prevent unauthorized requests.
</Aside>

Greentic automatically validates:
- Request timestamp
- Signature using signing secret
- Token verification

## Next Steps

- [Block Kit Builder](https://api.slack.com/tools/block-kit-builder) - Design rich messages
- [Teams Provider](/providers/messaging/teams/) - Add Teams integration
- [Flows Guide](/concepts/flows/) - Build complex workflows
