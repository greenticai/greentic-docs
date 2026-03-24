---
title: Email
description: Send and receive emails as messages
---

import { Steps } from '@astrojs/starlight/components';

## Overview

The Email messaging provider allows your digital worker to communicate via email. It supports:

- Sending emails
- Receiving emails (via webhooks)
- HTML formatting
- Attachments

## Setup

<Steps>

1. **Configure SMTP Settings**

   ```json title="answers.json"
   {
     "messaging-email": {
       "enabled": true,
       "smtp_host": "smtp.example.com",
       "smtp_port": 587,
       "smtp_user": "your-email@example.com",
       "smtp_password": "your-password",
       "from_address": "support@example.com",
       "from_name": "Support Bot"
     }
   }
   ```

2. **Configure Inbound (Optional)**

   For receiving emails, set up a webhook with your email provider:
   - SendGrid Inbound Parse
   - Mailgun Routes
   - AWS SES

3. **Run Setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `smtp_host` | Yes | SMTP server hostname |
| `smtp_port` | Yes | SMTP port (typically 587 or 465) |
| `smtp_user` | Yes | SMTP username |
| `smtp_password` | Yes | SMTP password |
| `from_address` | Yes | Default from address |
| `from_name` | No | Display name for from address |
| `webhook_url` | No | Inbound webhook endpoint |

## Features

### Send Plain Text

```yaml
- id: send_email
  type: reply
  config:
    to: "{{user_email}}"
    subject: "Your Support Request"
    message: "Thank you for contacting us. We'll get back to you shortly."
```

### Send HTML

```yaml
- id: send_html_email
  type: reply
  config:
    to: "{{user_email}}"
    subject: "Welcome!"
    html: |
      <html>
        <body>
          <h1>Welcome to Our Service!</h1>
          <p>Thank you for signing up.</p>
          <a href="https://example.com/start">Get Started</a>
        </body>
      </html>
```

### With Attachments

```yaml
- id: send_with_attachment
  type: reply
  config:
    to: "{{user_email}}"
    subject: "Your Report"
    message: "Please find your report attached."
    attachments:
      - url: "https://example.com/report.pdf"
        filename: "report.pdf"
```

### CC and BCC

```yaml
- id: send_copy
  type: reply
  config:
    to: "{{user_email}}"
    cc: "manager@example.com"
    bcc: "archive@example.com"
    subject: "Support Update"
    message: "Your ticket has been resolved."
```

## Handling Inbound Email

```yaml title="flows/on_email.ygtc"
name: handle_email
version: "1.0"

nodes:
  - id: process
    type: reply
    config:
      to: "{{from_address}}"
      subject: "Re: {{subject}}"
      message: "Thank you for your email. We've received your message."

triggers:
  - type: email
    target: process
```

## Next Steps

- [SendGrid Events Provider](/providers/events/email-sendgrid/)
- [Flows Guide](/concepts/flows/)
