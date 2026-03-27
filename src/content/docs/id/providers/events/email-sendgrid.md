---
title: Email (SendGrid)
description: Kirim email transaksional melalui SendGrid
---

## Ringkasan

Provider event SendGrid memungkinkan pengiriman email transaksional melalui API SendGrid.

## Konfigurasi

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

## Opsi Konfigurasi

| Opsi | Wajib | Deskripsi |
|------|-------|-----------|
| `enabled` | Ya | Aktifkan/nonaktifkan provider |
| `api_key` | Ya | API key SendGrid |
| `from_email` | Ya | Email pengirim default |
| `from_name` | Tidak | Nama pengirim default |

## Mengirim Email

### Email Dasar

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

### Email HTML

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

### Dengan Template

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

### Dengan Lampiran

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

## Langkah Berikutnya

- [SMS (Twilio)](/id/providers/events/sms-twilio/)
- [Provider Webhook](/id/providers/events/webhook/)
