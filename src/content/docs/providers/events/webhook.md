---
title: Webhook
description: Receive HTTP webhooks from external services
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

The Webhook events provider allows your digital worker to receive HTTP webhooks from external services like GitHub, Stripe, Shopify, etc.

## Setup

<Steps>

1. **Configure Provider**

   ```json title="answers.json"
   {
     "events-webhook": {
       "enabled": true,
       "public_base_url": "https://your-domain.ngrok-free.app"
     }
   }
   ```

2. **Run Setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

3. **Register Webhook**

   Use the generated webhook URL in your external service:
   ```
   https://your-domain.com/events/webhook/{tenant}/{event_type}
   ```

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `public_base_url` | Yes | Public URL for webhooks |
| `secret_header` | No | Header name for signature validation |
| `secret_key` | No | Secret key for signature validation |

## Webhook URL Format

```
POST https://your-domain.com/events/webhook/{tenant}/{event_type}
```

Example:
```
POST https://your-domain.com/events/webhook/demo/order.created
```

## Handling Webhooks

### Basic Handler

```yaml title="flows/on_webhook.ygtc"
name: handle_webhook
version: "1.0"

nodes:
  - id: process
    type: script
    config:
      script: |
        let data = event.payload;
        // Process webhook data
        data
    next: respond

  - id: respond
    type: http_response
    config:
      status: 200
      body:
        success: true

triggers:
  - type: event
    event_type: "order.created"
    target: process
```

### GitHub Webhook

```yaml
nodes:
  - id: check_event
    type: branch
    config:
      conditions:
        - expression: "headers['x-github-event'] == 'push'"
          next: handle_push
        - expression: "headers['x-github-event'] == 'pull_request'"
          next: handle_pr
      default: ignore

  - id: handle_push
    type: script
    config:
      script: |
        let commits = event.payload.commits;
        format!("Received {} commits", commits.len())

triggers:
  - type: event
    event_type: "github"
    target: check_event
```

### Stripe Webhook

```yaml
nodes:
  - id: handle_stripe
    type: branch
    config:
      conditions:
        - expression: "event.payload.type == 'payment_intent.succeeded'"
          next: payment_success
        - expression: "event.payload.type == 'payment_intent.failed'"
          next: payment_failed

triggers:
  - type: event
    event_type: "stripe"
    target: handle_stripe
```

## Signature Validation

<Aside type="caution">
Always validate webhook signatures in production to prevent unauthorized requests.
</Aside>

### HMAC Validation

```json title="answers.json"
{
  "events-webhook": {
    "enabled": true,
    "public_base_url": "https://your-domain.com",
    "signatures": {
      "github": {
        "header": "X-Hub-Signature-256",
        "algorithm": "sha256",
        "secret": "your-github-secret"
      },
      "stripe": {
        "header": "Stripe-Signature",
        "algorithm": "stripe",
        "secret": "whsec_xxx"
      }
    }
  }
}
```

## Response Handling

### Immediate Response

Most webhook providers expect a quick response:

```yaml
- id: ack
  type: http_response
  config:
    status: 200
  next: async_process  # Process async after responding
```

### Async Processing

For long-running tasks, acknowledge first:

```yaml
nodes:
  - id: acknowledge
    type: http_response
    config:
      status: 202
      body:
        message: "Processing"
    next: process_async

  - id: process_async
    type: async
    config:
      flow: "process_webhook_data"
      payload: "{{event.payload}}"
```

## Testing Webhooks

### Using curl

```bash
curl -X POST https://your-domain.com/events/webhook/demo/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from webhook"}'
```

### Using ngrok inspector

```bash
ngrok http 8080
# Visit http://localhost:4040 to inspect requests
```

## Troubleshooting

### Webhook Not Received

1. Check URL is correct
2. Verify public URL is accessible
3. Check firewall/security groups
4. Review external service logs

### Signature Validation Failed

1. Verify secret key matches
2. Check header name is correct
3. Ensure raw body is used for validation

## Next Steps

- [Timer Provider](/greentic-docs/providers/events/timer/)
- [Flows Guide](/greentic-docs/concepts/flows/)
