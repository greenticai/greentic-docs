---
title: SMS (Twilio)
description: Send SMS messages via Twilio
---

## Overview

The Twilio events provider enables sending SMS messages through the Twilio API.

## Configuration

```json title="answers.json"
{
  "events-sms-twilio": {
    "enabled": true,
    "account_sid": "ACxxx...",
    "auth_token": "xxx...",
    "from_number": "+1234567890"
  }
}
```

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `account_sid` | Yes | Twilio Account SID |
| `auth_token` | Yes | Twilio Auth Token |
| `from_number` | Yes | Sender phone number (E.164 format) |

## Sending SMS

### Basic SMS

```yaml
- id: send_sms
  type: event
  config:
    provider: events-sms-twilio
    action: send
    to: "+1987654321"
    body: "Your verification code is: {{code}}"
```

### In Flow

```yaml title="flows/send_notification.ygtc"
name: send_notification
version: "1.0"

nodes:
  - id: send_alert
    type: event
    config:
      provider: events-sms-twilio
      action: send
      to: "{{user_phone}}"
      body: "Alert: {{alert_message}}"

triggers:
  - type: event
    event_type: "alert.critical"
    target: send_alert
```

## Receiving SMS

Configure a Twilio webhook to receive incoming SMS:

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## Next Steps

- [Email (SendGrid)](/providers/events/email-sendgrid/)
- [Events Overview](/providers/events/overview/)
