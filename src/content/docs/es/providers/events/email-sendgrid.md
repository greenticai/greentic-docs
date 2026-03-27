---
title: Correo electrónico (SendGrid)
description: Enviar correos electrónicos transaccionales mediante SendGrid
---

## Resumen

El provider de eventos SendGrid permite enviar correos electrónicos transaccionales a través de la API de SendGrid.

## Configuración

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

## Opciones de configuración

| Opción | Requerido | Descripción |
|--------|----------|-------------|
| `enabled` | Sí | Habilitar/deshabilitar provider |
| `api_key` | Sí | API key de SendGrid |
| `from_email` | Sí | Correo electrónico predeterminado del remitente |
| `from_name` | No | Nombre predeterminado del remitente |

## Enviar correos electrónicos

### Correo básico

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

### Correo HTML

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

### Con plantilla

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

### Con adjuntos

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

## Próximos pasos

- [SMS (Twilio)](/es/providers/events/sms-twilio/)
- [Provider de Webhook](/es/providers/events/webhook/)
