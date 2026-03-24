---
title: Webex
description: Connect your digital worker to Cisco Webex
---

import { Steps } from '@astrojs/starlight/components';

## Overview

The Webex provider integrates with Cisco Webex Teams. It supports:

- Direct messages
- Space (room) messages
- Adaptive Cards
- File attachments
- @mentions

## Prerequisites

- Webex account
- Webex Developer access

## Setup

<Steps>

1. **Create a Webex Bot**

   Go to [developer.webex.com](https://developer.webex.com):
   - Navigate to My Webex Apps → Create a Bot
   - Fill in bot details
   - Copy the **Bot Access Token**

2. **Create a Webhook**

   The provider will create webhooks automatically, or create manually:
   - Go to Documentation → Webhooks API
   - Create webhook pointing to your endpoint

3. **Configure Provider**

   ```json title="answers.json"
   {
     "messaging-webex": {
       "enabled": true,
       "public_base_url": "https://your-domain.ngrok-free.app",
       "access_token": "your-bot-access-token"
     }
   }
   ```

4. **Run Setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `public_base_url` | Yes | Public URL for webhook |
| `access_token` | Yes | Bot access token |

## Features

### Text Messages

```yaml
- id: reply
  type: reply
  config:
    message: "Hello! How can I help?"
```

### Markdown

```yaml
- id: formatted
  type: reply
  config:
    message: |
      **Bold** *Italic*
      - List item
      [Link](https://example.com)
```

### Adaptive Cards

```yaml
- id: card
  type: adaptive-card
  config:
    card:
      type: AdaptiveCard
      version: "1.2"
      body:
        - type: TextBlock
          text: "Welcome!"
```

### File Attachments

```yaml
- id: send_file
  type: reply
  config:
    message: "Here's your document"
    files:
      - url: "https://example.com/doc.pdf"
```

## Next Steps

- [Slack Provider](/greentic-docs/providers/messaging/slack/)
- [Teams Provider](/greentic-docs/providers/messaging/teams/)
