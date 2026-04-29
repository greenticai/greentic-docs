---
title: Email (SendGrid)
description: Send transactional emails via SendGrid
---

## Overview

The SendGrid events extension sends transactional email through the Twilio SendGrid Mail Send API. Use it for worker-initiated notifications such as confirmations, reports, escalation emails, and summaries.

This pack is for outbound email delivery. If you need incoming email events, use a webhook-capable pack with SendGrid Inbound Parse or a custom email event extension.

## Configuration

```json title="answers.json"
{
  "events-email-sendgrid": {
    "enabled": true,
    "sendgrid_api_key": "SG.xxx...",
    "from_email": "noreply@example.com",
    "from_name": "My App"
  }
}
```

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `sendgrid_api_key` | Yes | SendGrid API key with permission to send mail |
| `from_email` | Yes | Default sender email; it must be valid for your SendGrid account and sender/domain setup |
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
    dynamic_template_data:
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
        disposition: "attachment"
```

## Delivery Notes

- SendGrid dynamic templates use a `template_id` and `dynamic_template_data`.
- Attachment content is sent as base64-encoded data with a MIME `type`.
- Use SendGrid sender authentication and narrow API key scopes for production workers.

## Next Steps

- [SMS (Twilio)](/providers/events/sms-twilio/)
- [Webhook Provider](/providers/events/webhook/)
