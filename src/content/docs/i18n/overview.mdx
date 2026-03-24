---
title: i18n Overview
description: Internationalization support in Greentic
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Introduction

Greentic provides comprehensive internationalization (i18n) support through the **greentic-i18n** library. It enables:

- Deterministic string identifiers
- Locale-based message retrieval
- Adaptive Card translation
- Runtime language switching

## Key Features

<CardGrid>
  <Card title="Deterministic IDs" icon="puzzle">
    I18nId v1 spec uses BLAKE3 hashing for consistent, collision-resistant identifiers.
  </Card>
  <Card title="Multi-Format" icon="document">
    Support for JSON, YAML, PO, and XLIFF translation formats.
  </Card>
  <Card title="Cards Integration" icon="setting">
    Built-in support for translating Adaptive Cards.
  </Card>
  <Card title="Runtime Switching" icon="random">
    Change languages per-session without restart.
  </Card>
</CardGrid>

## How It Works

```
Source String: "Hello, World!"
       │
       ▼
┌─────────────────────────────────┐
│     BLAKE3 Hash Function        │
│  blake3(normalize(string))      │
└─────────────────────────────────┘
       │
       ▼
I18nId: "i18n:v1:abc123def456"
       │
       ▼
┌─────────────────────────────────┐
│      Translation Lookup         │
│   locale_map[id] → "Halo!"     │
└─────────────────────────────────┘
```

## Quick Start

### 1. Extract Strings

For Adaptive Cards:

```bash
greentic-cards2pack extract-i18n --input ./cards --output i18n/en.json
```

### 2. Translate

Using `greentic-i18n-translator` (powered by Codex CLI):

```bash
greentic-i18n-translator translate --langs fr,de,ja --en i18n/en.json
```

Or auto-translate during pack generation:

```bash
greentic-cards2pack generate \
  --cards ./cards --out ./pack --name demo \
  --auto-translate --langs fr,de,ja
```

### 3. Load in Runtime

```yaml
i18n:
  default_locale: "en"
  locales:
    en: "translations/en.json"
    id: "translations/id.json"
    ja: "translations/ja.json"
```

### 4. Use in Flows

```yaml
- id: greet
  type: reply
  config:
    message_key: "i18n:v1:abc123"  # Resolved based on session locale
```

## Locale Resolution

The locale is resolved in this order:

1. Session-level locale (set per user)
2. Team-level default
3. Tenant-level default
4. Global default

```yaml
# Set session locale
- id: set_language
  type: state
  config:
    action: set
    key: "locale"
    value: "id"  # Indonesian
```

## Supported Languages

Any language is supported. Common configurations:

| Locale | Language |
|--------|----------|
| `en` | English |
| `id` | Indonesian |
| `ja` | Japanese |
| `zh` | Chinese |
| `es` | Spanish |
| `de` | German |

## Next Steps

- [I18nId Specification](/greentic-docs/i18n/i18nid-spec/)
- [Cards Translation](/greentic-docs/i18n/cards-translation/)
