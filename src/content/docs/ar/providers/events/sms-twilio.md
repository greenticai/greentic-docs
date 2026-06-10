---
title: SMS (Twilio)
description: Send SMS messages via Twilio
---

## Overview

The Twilio events extension sends SMS messages through the Twilio Messaging API and can receive inbound SMS through Twilio webhooks when the installed pack exposes an ingress handler.

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
| `from_number` | Yes | Sender phone number in E.164 format. It must belong to the Twilio account used by the extension. |

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

Configure a Twilio incoming message webhook to receive inbound SMS. For standard Greentic event ingress, use the generated setup URL or a route with this shape:

```text
POST https://your-domain.com/v1/events/ingress/events-sms-twilio/{tenant}/{team?}/{handler?}
```

Twilio includes message fields such as `From`, `To`, and `Body` in the webhook request. Route those into a flow through the event type produced by the installed Twilio extension:

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## Security Notes

- Use E.164 numbers for `to` and `from_number`.
- Validate inbound webhook requests with Twilio's `X-Twilio-Signature` header when the extension pack exposes signature validation.
- Keep the Twilio Auth Token in the Greentic secrets/setup path; do not commit it in bundle assets.

## Next Steps

- [Email (SendGrid)](/providers/events/email-sendgrid/)
- [Events Overview](/providers/events/overview/)
