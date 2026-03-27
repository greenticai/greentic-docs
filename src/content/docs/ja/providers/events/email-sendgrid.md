---
title: Email (SendGrid)
description: SendGrid 経由で transactional email を送信する
---

## 概要

SendGrid events provider を使うと、SendGrid API を通じて transactional email を送信できます。

## 設定

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

## 設定オプション

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | provider を有効/無効にする |
| `api_key` | Yes | SendGrid API key |
| `from_email` | Yes | デフォルトの送信元 email |
| `from_name` | No | デフォルトの送信者名 |

## Email を送信する

### 基本的な Email

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

### HTML Email

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

### template を使う

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

### 添付ファイル付き

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

## 次のステップ

- [SMS (Twilio)](/ja/providers/events/sms-twilio/)
- [Webhook Provider](/ja/providers/events/webhook/)
