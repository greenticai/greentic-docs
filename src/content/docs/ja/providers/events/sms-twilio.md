---
title: SMS (Twilio)
description: Twilio 経由で SMS message を送信する
---

## 概要

Twilio events provider を使うと、Twilio API を通じて SMS message を送信できます。

## 設定

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

## 設定オプション

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | provider を有効/無効にする |
| `account_sid` | Yes | Twilio Account SID |
| `auth_token` | Yes | Twilio Auth Token |
| `from_number` | Yes | 送信元 phone number（E.164 format） |

## SMS を送信する

### 基本的な SMS

```yaml
- id: send_sms
  type: event
  config:
    provider: events-sms-twilio
    action: send
    to: "+1987654321"
    body: "Your verification code is: {{code}}"
```

### Flow 内で使う

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

## SMS を受信する

受信 SMS を処理するには、Twilio webhook を設定します。

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## 次のステップ

- [Email (SendGrid)](/ja/providers/events/email-sendgrid/)
- [Events Overview](/ja/providers/events/overview/)
