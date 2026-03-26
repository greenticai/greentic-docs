---
title: Timer
description: Schedule tasks with cron expressions
---

import { Aside } from '@astrojs/starlight/components';

## Overview

The Timer events provider enables scheduled task execution using cron expressions. Use it for:

- Daily reports
- Periodic cleanup
- Scheduled notifications
- Regular data sync

## Configuration

```json title="answers.json"
{
  "events-timer": {
    "enabled": true,
    "timezone": "America/New_York"
  }
}
```

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `timezone` | No | Default timezone (default: UTC) |

## Defining Schedules

### In Flow

```yaml title="flows/scheduled_tasks.ygtc"
name: scheduled_tasks
version: "1.0"

nodes:
  - id: daily_report
    type: http
    config:
      method: GET
      url: "https://api.example.com/reports/daily"
    next: send_report

  - id: send_report
    type: reply
    config:
      channel: "slack-reports"
      message: "Daily report: {{http_response}}"

triggers:
  - type: timer
    cron: "0 9 * * *"
    target: daily_report
    timezone: "America/New_York"
```

### Cron Expression Format

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * *
```

## Common Schedules

| Schedule | Cron Expression | Description |
|----------|-----------------|-------------|
| Every minute | `* * * * *` | Runs every minute |
| Every hour | `0 * * * *` | Runs at minute 0 |
| Daily at 9 AM | `0 9 * * *` | Runs daily at 9:00 |
| Weekly Monday | `0 9 * * 1` | Runs Monday at 9:00 |
| Monthly 1st | `0 0 1 * *` | Runs 1st of month at midnight |

## Examples

### Daily Cleanup

```yaml
nodes:
  - id: cleanup
    type: http
    config:
      method: DELETE
      url: "https://api.example.com/sessions/expired"

triggers:
  - type: timer
    cron: "0 2 * * *"  # 2 AM daily
    target: cleanup
```

### Weekly Summary

```yaml
nodes:
  - id: generate_summary
    type: llm
    config:
      model: "gpt-4"
      prompt: "Generate weekly summary from: {{data}}"
    next: send_summary

triggers:
  - type: timer
    cron: "0 9 * * 1"  # Monday 9 AM
    target: generate_summary
```

### Periodic Health Check

```yaml
nodes:
  - id: health_check
    type: http
    config:
      method: GET
      url: "https://api.example.com/health"
    next: check_result

  - id: check_result
    type: branch
    config:
      conditions:
        - expression: "http_response.status != 200"
          next: alert
      default: done

  - id: alert
    type: reply
    config:
      channel: "slack-alerts"
      message: "Health check failed!"

triggers:
  - type: timer
    cron: "*/5 * * * *"  # Every 5 minutes
    target: health_check
```

## Timezone Handling

<Aside type="note">
Cron expressions are evaluated in the configured timezone.
</Aside>

```yaml
triggers:
  - type: timer
    cron: "0 9 * * *"
    target: daily_task
    timezone: "Europe/London"  # 9 AM London time
```

## Next Steps

- [Webhook Provider](/providers/events/webhook/)
- [Flows Guide](/concepts/flows/)
