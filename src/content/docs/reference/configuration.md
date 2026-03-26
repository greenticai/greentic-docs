---
title: Configuration Reference
description: Complete configuration options for Greentic
---

## Overview

Greentic uses multiple configuration files:

| File | Purpose |
|------|---------|
| `greentic.toml` | Runtime configuration |
| `greentic.demo.yaml` | Bundle configuration |
| `answers.json` | Provider setup answers |

## greentic.toml

Runtime configuration file.

### Complete Schema

```toml
# Server configuration
[server]
host = "0.0.0.0"
port = 8080
workers = 4                     # Number of worker threads
graceful_shutdown_timeout = 30  # Seconds

# NATS messaging configuration
[nats]
enabled = true
url = "nats://localhost:4222"
# For cluster:
# urls = ["nats://nats1:4222", "nats://nats2:4222"]
connection_timeout = 5          # Seconds
max_reconnects = 10
reconnect_delay = 2             # Seconds

# Redis session/state store
[redis]
url = "redis://localhost:6379"
pool_size = 10
connection_timeout = 5

# Session management
[session]
store = "memory"                # "memory" | "redis"
default_timeout = 1800          # 30 minutes
max_sessions_per_tenant = 10000

# Logging
[logging]
level = "info"                  # "trace" | "debug" | "info" | "warn" | "error"
format = "pretty"               # "pretty" | "json"
file = "/var/log/greentic.log"  # Optional: log to file
include_timestamp = true
include_target = true

# Telemetry (OpenTelemetry)
[telemetry]
enabled = true
service_name = "greentic"
otlp_endpoint = "http://localhost:4317"
otlp_protocol = "grpc"          # "grpc" | "http"
sampling_ratio = 1.0            # 0.0 to 1.0

# Security
[security]
trusted_publishers = [
    "greentic-official.pub",
    "my-org.pub"
]
reject_unsigned_packs = true
rate_limit_per_tenant = 100     # Requests per second
cors_allowed_origins = ["*"]

# WASM runtime
[wasm]
max_memory_mb = 256
max_execution_time_ms = 30000
enable_wasi_logging = true
component_cache_size = 100      # Number of cached instances

# Secrets provider
[secrets]
provider = "env"                # "env" | "vault" | "aws" | "azure" | "gcp"
# Provider-specific config:
# [secrets.vault]
# address = "https://vault.example.com"
# token = "${VAULT_TOKEN}"
```

## greentic.demo.yaml

Bundle configuration file.

### Complete Schema

```yaml
# Bundle metadata
name: my-digital-worker
version: "1.0.0"
description: "My digital worker bundle"

# Provider configurations
providers:
  messaging-telegram:
    pack: "providers/messaging/messaging-telegram.gtpack"
    setup_flow: "setup_default"
    verify_flow: "verify_webhooks"
    config:
      api_base_url: "https://api.telegram.org"

  messaging-slack:
    pack: "providers/messaging/messaging-slack.gtpack"
    setup_flow: "setup_default"
    config:
      api_base_url: "https://slack.com/api"

  events-webhook:
    pack: "providers/events/events-webhook.gtpack"

  events-timer:
    pack: "providers/events/events-timer.gtpack"

# Application configurations
apps:
  support-bot:
    pack: "apps/support-bot.gtpack"          # Or inline:
    # path: "apps/support-bot"                # Local directory
    default_flow: "on_message"
    config:
      greeting: "Hello!"

  helpdesk:
    path: "apps/helpdesk"
    default_flow: "main"

# Tenant configurations
tenants:
  demo:
    name: "Demo Tenant"
    settings:
      timezone: "Asia/Jakarta"
      language: "id"
    teams:
      default:
        name: "Default Team"
        channels:
          telegram:
            provider: messaging-telegram
            app: support-bot
          slack:
            provider: messaging-slack
            app: support-bot
            config:
              channel_id: "C123456"

      vip:
        name: "VIP Support"
        channels:
          telegram:
            provider: messaging-telegram
            app: helpdesk

# Internationalization
i18n:
  default_locale: "en"
  locales:
    en: "i18n/en.json"
    id: "i18n/id.json"
    ja: "i18n/ja.json"

# Component configurations
components:
  fast2flow:
    pack: "components/fast2flow.gtpack"
    config:
      default_confidence_threshold: 0.7

  llm-openai:
    pack: "components/llm-openai.gtpack"
    config:
      default_model: "gpt-4"

# MCP tools
mcp:
  tools:
    - name: database_query
      component: "tools/db-query.wasm"
      manifest: "tools/db-query.yaml"
    - name: send_email
      component: "tools/email.wasm"

# Seeds (initial data)
seeds:
  file: "seeds.yaml"
```

## answers.json

Provider setup answers file.

### Complete Schema

```json
{
  "messaging-telegram": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app",
    "bot_token": "123456789:ABCdefGHI..."
  },

  "messaging-slack": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app",
    "api_base_url": "https://slack.com/api",
    "bot_token": "xoxb-xxx-xxx",
    "slack_app_id": "A07XXXXXX",
    "slack_configuration_token": "xoxe.xoxp-xxx",
    "signing_secret": "xxx"
  },

  "messaging-teams": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app",
    "app_id": "xxx",
    "app_password": "xxx",
    "tenant_id": "xxx"
  },

  "messaging-whatsapp": {
    "enabled": false,
    "public_base_url": "https://example.ngrok-free.app",
    "phone_number_id": "xxx",
    "access_token": "EAAxxxxx",
    "verify_token": "xxx"
  },

  "messaging-webchat": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app",
    "allowed_origins": ["https://mysite.com"]
  },

  "events-webhook": {
    "enabled": true,
    "public_base_url": "https://example.ngrok-free.app"
  },

  "events-timer": {
    "enabled": true,
    "timezone": "Asia/Jakarta"
  },

  "events-email-sendgrid": {
    "enabled": true,
    "api_key": "SG.xxx",
    "from_email": "noreply@example.com"
  },

  "component-llm-openai": {
    "api_key": "sk-xxx",
    "default_model": "gpt-4"
  }
}
```

## Environment Variables

All configuration can be overridden via environment variables:

| Variable | Config Path | Description |
|----------|-------------|-------------|
| `GREENTIC_HOST` | `server.host` | Bind address |
| `GREENTIC_PORT` | `server.port` | HTTP port |
| `GREENTIC_LOG_LEVEL` | `logging.level` | Log verbosity |
| `GREENTIC_LOG_FORMAT` | `logging.format` | Log format |
| `GREENTIC_NATS_URL` | `nats.url` | NATS server URL |
| `GREENTIC_REDIS_URL` | `redis.url` | Redis URL |
| `GREENTIC_OTLP_ENDPOINT` | `telemetry.otlp_endpoint` | OTLP endpoint |

## Configuration Precedence

1. Environment variables (highest)
2. Config file (`greentic.toml`)
3. Default values (lowest)

## Next Steps

- [gtc start](/cli/start/)
- [gtc setup](/cli/setup/)
