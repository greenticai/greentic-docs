---
title: Messaging and Event Extensions
description: Build messaging channels and event sources as Greentic capability extension packs.
---

Messaging and event integrations are **extensions**. Older code and docs sometimes call them providers, but the current documentation model is an extension pack that offers capabilities through `greentic.ext.capabilities.v1`.

## Messaging Extensions

Messaging extensions connect digital workers to user-facing channels. The documented channel set includes:

- WebChat
- Slack
- Microsoft Teams
- Telegram
- WhatsApp
- Webex
- email

A messaging extension usually normalizes inbound channel payloads, routes them to the configured worker or flow, formats outbound replies, and applies tenant/team/channel setup.

## Event Extensions

Event extensions kickstart workers from system events instead of a chat message. Common event sources include:

- HTTP webhooks
- timers and schedules
- SendGrid email events
- Twilio SMS events
- queues
- pub/sub topics
- audit events
- metrics events
- custom domain events

An event extension validates inbound event payloads, maps them to Greentic runtime input, starts the configured worker or flow, and emits trace or observer metadata.

## Authoring Flow

Use the wizard and select `messaging` or `events` from the extension catalog:

```bash
gtc wizard
```

For non-interactive work:

```bash
gtc wizard --schema
gtc wizard --answers messaging-extension-answers.json
```

After the component exists, the offer links a capability id to the component operation:

```bash
gtc dev pack add-extension capability \
  --pack-dir ./webchat-extension \
  --offer-id messaging.webchat.inbound.01 \
  --cap-id greentic.cap.messaging.webchat.v1 \
  --version v1 \
  --component-ref webchat-extension \
  --op messaging.dispatch
```

Use the component wizard for the component itself. Coding agents can use `gtc wizard --schema` to create the component answers file and replay it with `gtc wizard --answers component-create-answers.json`.

## Setup, Secrets, and Tenancy

Real messaging and event integrations usually need setup questions and secret references:

- bot tokens
- webhook signing secrets
- OAuth client settings
- tenant and team routing
- allowed domains
- channel ids
- reply policies
- event subscription names

When `requires_setup: true`, the capability offer must point at setup QA data. At setup time, Greentic resolves that data for the target bundle, tenant, team, and environment.

## Why They Are Packs

Messaging and event integrations should be packs instead of loose components because the runtime behavior depends on more than code. The pack can carry components, flows, setup questions, i18n strings, static assets, and capability metadata together. That makes the integration installable, observable, controllable, and replaceable across deployments.

## Legacy Provider Path

Do not use `.gtxpack`, `gtdx`, `greentic-pack providers ...`, or `gtc dev pack add-extension provider ...` for new documentation unless that legacy path has been revalidated. New messaging and event integrations should be extension packs.
