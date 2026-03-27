---
title: SMS (Twilio)
description: 通过 Twilio 发送 SMS 消息
---

## 概述

Twilio events provider 支持通过 Twilio API 发送 SMS 消息。

## 配置

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

## 配置选项

| 选项 | 必需 | 描述 |
|--------|----------|-------------|
| `enabled` | 是 | 启用/禁用 provider |
| `account_sid` | 是 | Twilio Account SID |
| `auth_token` | 是 | Twilio Auth Token |
| `from_number` | 是 | 发件号码（E.164 格式） |

## 发送 SMS

### 基础 SMS

```yaml
- id: send_sms
  type: event
  config:
    provider: events-sms-twilio
    action: send
    to: "+1987654321"
    body: "Your verification code is: {{code}}"
```

### 在 Flow 中

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

## 接收 SMS

配置一个 Twilio webhook 来接收传入的 SMS：

```yaml
triggers:
  - type: event
    event_type: "twilio.sms.incoming"
    target: handle_sms
```

## 下一步

- [Email (SendGrid)](/zh/providers/events/email-sendgrid/)
- [Events 概览](/zh/providers/events/overview/)
