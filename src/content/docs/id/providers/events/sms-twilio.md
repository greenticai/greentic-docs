---
title: SMS (Twilio)
description: Kirim pesan SMS melalui Twilio
---

## Ringkasan

Provider event Twilio memungkinkan pengiriman pesan SMS melalui API Twilio.

## Konfigurasi

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

## Opsi Konfigurasi

| Opsi | Wajib | Deskripsi |
|------|-------|-----------|
| `enabled` | Ya | Aktifkan/nonaktifkan provider |
| `account_sid` | Ya | Account SID Twilio |
| `auth_token` | Ya | Auth Token Twilio |
| `from_number` | Ya | Nomor telepon pengirim (format E.164) |

## Mengirim SMS

### SMS Dasar

```yaml
- id: send_sms
  type: event
  config:
    provider: events-sms-twilio
    action: send
    to: "+1987654321"
    body: "Your verification code is: {{code}}"
```

### Di Flow

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

## Menerima SMS

Konfigurasikan webhook Twilio untuk menerima SMS masuk:

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## Langkah Berikutnya

- [Email (SendGrid)](/id/providers/events/email-sendgrid/)
- [Ringkasan Events](/id/providers/events/overview/)
