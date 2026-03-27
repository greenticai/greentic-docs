---
title: E-Mail (SendGrid)
description: Transaktionale E-Mails über SendGrid senden
---

## Überblick

Der SendGrid-Events-Provider ermöglicht das Senden transaktionaler E-Mails über die SendGrid API.

## Konfiguration

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

## Konfigurationsoptionen

| Option | Erforderlich | Beschreibung |
|--------|----------|-------------|
| `enabled` | Ja | Provider aktivieren/deaktivieren |
| `api_key` | Ja | SendGrid API-Schlüssel |
| `from_email` | Ja | Standard-Absenderadresse |
| `from_name` | Nein | Standard-Absendername |

## E-Mails senden

### Einfache E-Mail

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

### HTML-E-Mail

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

### Mit Template

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

### Mit Anhängen

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

## Nächste Schritte

- [SMS (Twilio)](/de/providers/events/sms-twilio/)
- [Webhook-Provider](/de/providers/events/webhook/)
