---
title: SMS (Twilio)
description: SMS-Nachrichten über Twilio senden
---

## Überblick

Der Twilio-Events-Provider ermöglicht das Senden von SMS-Nachrichten über die Twilio API.

## Konfiguration

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

## Konfigurationsoptionen

| Option | Erforderlich | Beschreibung |
|--------|----------|-------------|
| `enabled` | Ja | Provider aktivieren/deaktivieren |
| `account_sid` | Ja | Twilio Account SID |
| `auth_token` | Ja | Twilio Auth Token |
| `from_number` | Ja | Absender-Telefonnummer (E.164-Format) |

## SMS senden

### Einfache SMS

```yaml
- id: send_sms
  type: event
  config:
    provider: events-sms-twilio
    action: send
    to: "+1987654321"
    body: "Your verification code is: {{code}}"
```

### Im Flow

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

## SMS empfangen

Konfigurieren Sie einen Twilio-Webhook, um eingehende SMS zu empfangen:

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## Nächste Schritte

- [E-Mail (SendGrid)](/de/providers/events/email-sendgrid/)
- [Events-Überblick](/de/providers/events/overview/)
