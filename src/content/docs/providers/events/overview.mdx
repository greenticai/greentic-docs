---
title: Events Providers Overview
description: Handle events and triggers in your digital worker
---

import { Card, CardGrid, LinkCard } from '@astrojs/starlight/components';

## Introduction

**Events Providers** enable your digital worker to respond to external triggers beyond messaging. They handle:

- Webhooks from external services
- Scheduled tasks (timers/cron)
- Email notifications
- SMS notifications

## Available Providers

<CardGrid>
  <LinkCard
    title="Webhook"
    href="/greentic-docs/providers/events/webhook/"
    description="Receive HTTP webhooks from external services"
  />
  <LinkCard
    title="Timer"
    href="/greentic-docs/providers/events/timer/"
    description="Schedule tasks with cron expressions"
  />
  <LinkCard
    title="Email (SendGrid)"
    href="/greentic-docs/providers/events/email-sendgrid/"
    description="Send transactional emails via SendGrid"
  />
  <LinkCard
    title="SMS (Twilio)"
    href="/greentic-docs/providers/events/sms-twilio/"
    description="Send SMS messages via Twilio"
  />
</CardGrid>

## Architecture

```
External Service / Timer
    │
    ▼ HTTP / Schedule
┌─────────────────────────────────────────┐
│           Events Ingress                │
│     (Process incoming event)            │
└─────────────────────────────────────────┘
    │
    ▼ Normalized Event
┌─────────────────────────────────────────┐
│              NATS Bus                   │
│    greentic.events.{env}.{tenant}.{type}│
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│           Flow Executor                 │
│      (Process with event flows)         │
└─────────────────────────────────────────┘
```

## Event Normalization

All events are normalized to a common format:

```rust
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub source: String,
    pub timestamp: u64,
    pub payload: Value,
    pub metadata: Option<Value>,
}
```

## Configuration

### In Bundle

```yaml title="greentic.demo.yaml"
providers:
  events-webhook:
    pack: "providers/events/events-webhook.gtpack"

  events-timer:
    pack: "providers/events/events-timer.gtpack"
```

### Event Flows

```yaml title="flows/on_event.ygtc"
name: handle_event
version: "1.0"

nodes:
  - id: process
    type: script
    config:
      script: |
        // Process the event
        let payload = event.payload;
        process_payload(payload)
    next: respond

triggers:
  - type: event
    event_type: "order.created"
    target: process
```

## NATS Subjects

Events flow through NATS:

| Subject | Purpose |
|---------|---------|
| `greentic.events.{env}.{tenant}.{type}` | Event notifications |
| `greentic.events.{env}.{tenant}.{type}.result` | Event processing results |

## Common Patterns

### Event-Driven Notifications

```yaml
nodes:
  - id: on_order
    type: branch
    config:
      conditions:
        - expression: "event.event_type == 'order.created'"
          next: send_confirmation
        - expression: "event.event_type == 'order.shipped'"
          next: send_tracking
```

### Scheduled Tasks

```yaml
nodes:
  - id: daily_report
    type: http
    config:
      method: GET
      url: "https://api.example.com/reports/daily"
    next: send_email

triggers:
  - type: timer
    cron: "0 9 * * *"  # 9 AM daily
    target: daily_report
```

## Next Steps

- [Webhook Provider](/greentic-docs/providers/events/webhook/)
- [Timer Provider](/greentic-docs/providers/events/timer/)
- [Flows Guide](/greentic-docs/concepts/flows/)
