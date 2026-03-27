---
title: SMS (Twilio)
description: Enviar mensajes SMS mediante Twilio
---

## Resumen

El provider de eventos Twilio permite enviar mensajes SMS a través de la API de Twilio.

## Configuración

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

## Opciones de configuración

| Opción | Requerido | Descripción |
|--------|----------|-------------|
| `enabled` | Sí | Habilitar/deshabilitar provider |
| `account_sid` | Sí | Account SID de Twilio |
| `auth_token` | Sí | Auth Token de Twilio |
| `from_number` | Sí | Número de teléfono del remitente (formato E.164) |

## Enviar SMS

### SMS básico

```yaml
- id: send_sms
  type: event
  config:
    provider: events-sms-twilio
    action: send
    to: "+1987654321"
    body: "Your verification code is: {{code}}"
```

### En un flow

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

## Recibir SMS

Configura un webhook de Twilio para recibir SMS entrantes:

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## Próximos pasos

- [Correo electrónico (SendGrid)](/es/providers/events/email-sendgrid/)
- [Resumen de Eventos](/es/providers/events/overview/)
