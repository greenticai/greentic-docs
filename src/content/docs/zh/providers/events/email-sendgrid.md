---
title: Email (SendGrid)
description: 通过 SendGrid 发送事务型邮件
---

## 概述

SendGrid events provider 支持通过 SendGrid API 发送事务型邮件。

## 配置

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

## 配置选项

| 选项 | 必需 | 描述 |
|--------|----------|-------------|
| `enabled` | 是 | 启用/禁用 provider |
| `api_key` | 是 | SendGrid API key |
| `from_email` | 是 | 默认发件人邮箱 |
| `from_name` | 否 | 默认发件人名称 |

## 发送邮件

### 基础邮件

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

### HTML 邮件

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

### 使用模板

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

### 携带附件

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

## 下一步

- [SMS (Twilio)](/zh/providers/events/sms-twilio/)
- [Webhook Provider](/zh/providers/events/webhook/)
