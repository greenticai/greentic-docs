---
title: WhatsApp
description: Connect your digital worker to WhatsApp Business
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

The WhatsApp provider integrates with the WhatsApp Business API (via Meta). It supports:

- Text messages
- Template messages
- Interactive buttons
- List messages
- Media (images, documents, audio, video)
- Location sharing

## Prerequisites

- Meta Business account
- WhatsApp Business API access
- Verified phone number

## Setup

<Steps>

1. **Create Meta App**

   Go to [developers.facebook.com](https://developers.facebook.com):
   - Create a new app (Business type)
   - Add WhatsApp product
   - Set up WhatsApp Business API

2. **Get API Credentials**

   In your Meta app dashboard:
   - Go to WhatsApp → Getting Started
   - Copy **Phone Number ID**
   - Generate and copy **Permanent Access Token**
   - Note your **Business Account ID**

3. **Configure Webhook**

   In WhatsApp → Configuration:
   - Set Callback URL: `https://your-domain.com/webhook/whatsapp/{tenant}/{team}`
   - Set Verify Token (any string you choose)
   - Subscribe to: `messages`

4. **Configure Provider**

   ```json title="answers.json"
   {
     "messaging-whatsapp": {
       "enabled": true,
       "public_base_url": "https://your-domain.ngrok-free.app",
       "phone_number_id": "123456789012345",
       "access_token": "EAAxxxxx...",
       "verify_token": "your-verify-token",
       "business_account_id": "987654321098765"
     }
   }
   ```

5. **Run Setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `public_base_url` | Yes | Public URL for webhook |
| `phone_number_id` | Yes | WhatsApp phone number ID |
| `access_token` | Yes | Permanent access token |
| `verify_token` | Yes | Webhook verification token |
| `business_account_id` | No | WhatsApp Business Account ID |
| `api_version` | No | Graph API version (default: v18.0) |

## Features

### Text Messages

```yaml
- id: reply
  type: reply
  config:
    message: "Hello! How can I help you today?"
```

### Template Messages

<Aside type="caution">
WhatsApp requires pre-approved templates for initiating conversations. Templates must be approved by Meta before use.
</Aside>

```yaml
- id: send_template
  type: reply
  config:
    template:
      name: "order_confirmation"
      language: "en"
      components:
        - type: body
          parameters:
            - type: text
              text: "{{order_id}}"
            - type: text
              text: "{{customer_name}}"
```

### Interactive Buttons

```yaml
- id: ask_action
  type: reply
  config:
    interactive:
      type: button
      body:
        text: "What would you like to do?"
      action:
        buttons:
          - type: reply
            reply:
              id: "help"
              title: "Get Help"
          - type: reply
            reply:
              id: "status"
              title: "Check Status"
          - type: reply
            reply:
              id: "human"
              title: "Talk to Human"
```

### List Messages

```yaml
- id: show_menu
  type: reply
  config:
    interactive:
      type: list
      header:
        type: text
        text: "Support Menu"
      body:
        text: "Please select an option:"
      action:
        button: "View Options"
        sections:
          - title: "Support"
            rows:
              - id: "technical"
                title: "Technical Support"
                description: "Hardware and software issues"
              - id: "billing"
                title: "Billing"
                description: "Payment and invoices"
          - title: "Sales"
            rows:
              - id: "pricing"
                title: "Pricing"
                description: "Product pricing information"
```

### Send Images

```yaml
- id: send_image
  type: reply
  config:
    media:
      type: image
      link: "https://example.com/product.jpg"
      caption: "Here's the product image"
```

### Send Documents

```yaml
- id: send_document
  type: reply
  config:
    media:
      type: document
      link: "https://example.com/invoice.pdf"
      filename: "invoice.pdf"
      caption: "Your invoice is attached"
```

### Send Location

```yaml
- id: send_location
  type: reply
  config:
    location:
      latitude: 37.7749
      longitude: -122.4194
      name: "Our Office"
      address: "123 Main St, San Francisco, CA"
```

## Handling Button Clicks

```yaml title="flows/on_button.ygtc"
name: handle_button
version: "1.0"

nodes:
  - id: route_button
    type: branch
    config:
      conditions:
        - expression: "button.id == 'help'"
          next: show_help
        - expression: "button.id == 'status'"
          next: check_status
        - expression: "button.id == 'human'"
          next: escalate
      default: unknown

  - id: show_help
    type: reply
    config:
      message: "Here's how I can help..."

triggers:
  - type: interactive
    target: route_button
```

## Message Templates

### Creating Templates

1. Go to Meta Business Suite → WhatsApp Manager → Message Templates
2. Create a new template with required components
3. Submit for approval (usually 24-48 hours)

### Template Components

```yaml
- id: send_notification
  type: reply
  config:
    template:
      name: "appointment_reminder"
      language: "en"
      components:
        - type: header
          parameters:
            - type: image
              image:
                link: "https://example.com/logo.png"
        - type: body
          parameters:
            - type: text
              text: "{{customer_name}}"
            - type: text
              text: "{{appointment_time}}"
        - type: button
          sub_type: quick_reply
          index: 0
          parameters:
            - type: payload
              payload: "confirm"
```

## 24-Hour Window

<Aside type="note">
WhatsApp enforces a 24-hour messaging window. After 24 hours without user response, you must use template messages.
</Aside>

### Check Window Status

```yaml
- id: check_window
  type: branch
  config:
    conditions:
      - expression: "last_message_time + 86400 > now"
        next: send_freeform
      default: send_template

- id: send_freeform
  type: reply
  config:
    message: "Thanks for your message!"

- id: send_template
  type: reply
  config:
    template:
      name: "follow_up"
      language: "en"
```

## Troubleshooting

### Webhook Verification Failed

1. Verify `verify_token` matches configuration
2. Check webhook URL is publicly accessible
3. Ensure HTTPS is properly configured

### Message Not Delivered

- Check phone number format (include country code)
- Verify template is approved (if using templates)
- Check 24-hour window status
- Review Meta webhook logs

### Rate Limiting

WhatsApp has rate limits based on quality rating:
- Tier 1: 1,000 messages/day
- Tier 2: 10,000 messages/day
- Tier 3: 100,000 messages/day

Handle gracefully:

```yaml
- id: reply
  type: reply
  config:
    message: "Response"
    retry_on_rate_limit: true
```

## Security

<Aside type="caution">
Validate webhook signatures to ensure requests are from Meta.
</Aside>

Greentic validates:
- X-Hub-Signature-256 header
- Payload hash with app secret

## Best Practices

1. **Use templates wisely** - Create versatile, approved templates
2. **Respect the 24-hour window** - Track user engagement
3. **Handle opt-outs** - Respect STOP/UNSUBSCRIBE requests
4. **Keep messages concise** - WhatsApp is for quick communication
5. **Use rich media** - Images and documents enhance UX

## Next Steps

- [Telegram Provider](/greentic-docs/providers/messaging/telegram/) - Alternative messaging
- [Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/) - Meta's template rules
- [Flows Guide](/greentic-docs/concepts/flows/) - Build complex workflows
