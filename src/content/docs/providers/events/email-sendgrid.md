---
title: Email (SendGrid)
description: Send transactional emails via SendGrid
---

## Overview

The SendGrid events provider enables sending transactional emails through the SendGrid API.

## Configuration

```json title="answers.json"
{
  "events-email-sendgrid": {
    "enabled": true,
    "api_key": "SG.xxx...",
    "from_email": "noreply@example.com",
    "from_name": "My App"
  }
}
```

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `api_key` | Yes | SendGrid API key |
| `from_email` | Yes | Default sender email |
| `from_name` | No | Default sender name |

## Sending Emails

### Basic Email

```yaml
- id: send_email
  type: event
  config:
    provider: events-email-sendgrid
    action: send
    to: "user@example.com"
    subject: "Welcome!"
    content: "Thank you for signing up."
```

### HTML Email

```yaml
- id: send_html
  type: event
  config:
    provider: events-email-sendgrid
    action: send
    to: "user@example.com"
    subject: "Your Order Confirmation"
    html: |
      <h1>Order Confirmed!</h1>
      <p>Order #{{order_id}} has been confirmed.</p>
```

### With Template

```yaml
- id: send_template
  type: event
  config:
    provider: events-email-sendgrid
    action: send_template
    to: "user@example.com"
    template_id: "d-abc123..."
    dynamic_data:
      name: "{{user_name}}"
      order_id: "{{order_id}}"
```

### With Attachments

```yaml
- id: send_with_attachment
  type: event
  config:
    provider: events-email-sendgrid
    action: send
    to: "user@example.com"
    subject: "Your Invoice"
    content: "Please find your invoice attached."
    attachments:
      - filename: "invoice.pdf"
        content: "{{base64_content}}"
        type: "application/pdf"
```

## Next Steps

- [SMS (Twilio)](/providers/events/sms-twilio/)
- [Webhook Provider](/providers/events/webhook/)
