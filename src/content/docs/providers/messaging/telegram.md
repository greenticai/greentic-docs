---
title: Telegram
description: Connect your digital worker to Telegram
---

import { Aside, Steps, Tabs, TabItem } from '@astrojs/starlight/components';

## Overview

The Telegram provider allows your digital worker to communicate via Telegram bots. It supports:

- Text messages
- Inline keyboards (buttons)
- Reply keyboards
- File attachments
- Media (photos, videos, documents)
- Group chats

## Prerequisites

- A Telegram account
- A Telegram bot (created via @BotFather)

## Setup

<Steps>

1. **Create a Telegram bot**

   Open Telegram and message [@BotFather](https://t.me/botfather):

   ```
   /newbot
   ```

   Follow the prompts:
   - Enter a name for your bot (e.g., "My Support Bot")
   - Enter a username (must end in `bot`, e.g., "my_support_bot")

   BotFather will give you a **bot token** like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

2. **Configure the provider**

   Create or update your answers file:

   ```json title="answers.json"
   {
     "messaging-telegram": {
       "enabled": true,
       "public_base_url": "https://your-domain.ngrok-free.app",
       "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
     }
   }
   ```

3. **Run setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

4. **Start the runtime**

   ```bash
   gtc start ./my-bundle
   ```

5. **Test your bot**

   Open Telegram, find your bot by username, and send a message!

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable the provider |
| `public_base_url` | Yes | Public URL for webhook |
| `bot_token` | Yes | Bot token from @BotFather |
| `api_base_url` | No | Telegram API URL (default: `https://api.telegram.org`) |

## Features

### Text Messages

```yaml
- id: reply
  type: reply
  config:
    message: "Hello! How can I help you today?"
```

### Markdown Formatting

Telegram supports MarkdownV2:

```yaml
- id: formatted_reply
  type: reply
  config:
    message: |
      *Bold* _Italic_ `Code`
      [Link](https://example.com)
    parse_mode: MarkdownV2
```

### Inline Keyboards (Buttons)

```yaml
- id: ask_action
  type: reply
  config:
    message: "What would you like to do?"
    buttons:
      - row:
          - label: "Get Help"
            callback_data: "action:help"
          - label: "Settings"
            callback_data: "action:settings"
      - row:
          - label: "Contact Support"
            url: "https://support.example.com"
```

### Reply Keyboards

```yaml
- id: ask_choice
  type: reply
  config:
    message: "Choose an option:"
    reply_keyboard:
      - ["Option A", "Option B"]
      - ["Option C", "Cancel"]
    resize_keyboard: true
    one_time_keyboard: true
```

### Send Photos

```yaml
- id: send_image
  type: reply
  config:
    photo:
      url: "https://example.com/image.jpg"
      caption: "Here's your image!"
```

### Send Documents

```yaml
- id: send_file
  type: reply
  config:
    document:
      url: "https://example.com/report.pdf"
      filename: "report.pdf"
      caption: "Your monthly report"
```

### Reply to Specific Message

```yaml
- id: reply_to_message
  type: reply
  config:
    message: "This is a reply to your previous message"
    reply_to_message_id: "{{original_message_id}}"
```

## Handling Button Callbacks

When a user clicks an inline keyboard button, you receive a callback:

```yaml title="flows/on_callback.ygtc"
name: handle_callback
version: "1.0"

nodes:
  - id: check_action
    type: branch
    config:
      conditions:
        - expression: "callback_data == 'action:help'"
          next: show_help
        - expression: "callback_data == 'action:settings'"
          next: show_settings
      default: unknown_action

  - id: show_help
    type: reply
    config:
      message: "Here's how I can help..."

  - id: show_settings
    type: reply
    config:
      message: "Settings menu..."

  - id: unknown_action
    type: reply
    config:
      message: "Unknown action"

triggers:
  - type: callback_query
    target: check_action
```

## Group Chat Support

The Telegram provider supports group chats:

```yaml title="greentic.demo.yaml"
tenants:
  demo:
    teams:
      support:
        channels:
          telegram-group:
            provider: messaging-telegram
            config:
              chat_id: "-1001234567890"  # Group chat ID
```

<Aside type="note">
Group chat IDs start with `-100` followed by the chat ID.
</Aside>

### Getting Group Chat ID

1. Add your bot to the group
2. Send a message in the group
3. Check the webhook payload for `chat.id`

Or use the Telegram API:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

## Webhook Configuration

The setup flow automatically configures the webhook:

```
POST https://api.telegram.org/bot<TOKEN>/setWebhook
{
  "url": "https://your-domain.com/webhook/telegram/{tenant}/{team}",
  "allowed_updates": ["message", "callback_query"]
}
```

### Manual Webhook Setup

If needed, configure manually:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook/telegram/demo/default",
    "allowed_updates": ["message", "callback_query"]
  }'
```

## Troubleshooting

### Bot Not Responding

1. **Check webhook status:**
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

2. **Verify public URL is accessible:**
   ```bash
   curl https://your-domain.ngrok-free.app/health
   ```

3. **Check logs:**
   ```bash
   gtc start ./my-bundle --verbose
   ```

### Webhook Registration Failed

```
Error: 401 Unauthorized
```

Verify your bot token is correct and not expired.

### Messages Not Being Received

1. Ensure the bot has been started (user sent `/start`)
2. Check if the bot is in the group (for group chats)
3. Verify webhook URL matches your public URL

### Rate Limiting

Telegram has rate limits:
- 1 message per second per chat
- 30 messages per second overall

Handle rate limits gracefully:

```yaml
- id: reply
  type: reply
  config:
    message: "Response"
    retry_on_429: true
    max_retries: 3
```

## Security

<Aside type="caution">
Never expose your bot token. Keep it in secure secrets storage.
</Aside>

### Webhook Security

Telegram sends a secret token with webhook requests. Greentic validates this automatically.

### Input Validation

Always validate user input:

```yaml
- id: validate
  type: script
  config:
    script: |
      if message.len() > 4096 {
        return error("Message too long")
      }
      message
```

## Next Steps

- [Slack Provider](/greentic-docs/providers/messaging/slack/) - Add Slack integration
- [Flows Guide](/greentic-docs/concepts/flows/) - Build complex workflows
- [Buttons and Cards](/greentic-docs/components/adaptive-cards/) - Rich UI elements
