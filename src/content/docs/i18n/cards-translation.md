---
title: Cards Translation
description: Translating Adaptive Cards with i18n
---

## Overview

Greentic supports translating Adaptive Cards using the i18n system. This enables multi-language card UIs.

## Workflow

```
Adaptive Card (English)
       │
       ▼
┌─────────────────────────────────┐
│    cards2pack extract-i18n      │
│    (Extract translatable text)  │
└─────────────────────────────────┘
       │
       ▼
strings.json (I18nIds → English)
       │
       ▼
┌─────────────────────────────────┐
│       Translation               │
│   (Manual or API)              │
└─────────────────────────────────┘
       │
       ▼
id.json, ja.json, etc.
       │
       ▼
┌─────────────────────────────────┐
│    cards2pack build             │
│    (Inject translations)        │
└─────────────────────────────────┘
       │
       ▼
Localized .gtpack
```

## Step-by-Step

### 1. Create Card

```json title="cards/welcome.json"
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "Welcome!",
      "size": "Large"
    },
    {
      "type": "TextBlock",
      "text": "How can I help you today?"
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Get Help"
    },
    {
      "type": "Action.Submit",
      "title": "Contact Support"
    }
  ]
}
```

### 2. Extract Strings

```bash
cards2pack extract-i18n ./cards --output i18n/en.json
```

Output:

```json title="i18n/en.json"
{
  "i18n:v1:abc123": "Welcome!",
  "i18n:v1:def456": "How can I help you today?",
  "i18n:v1:ghi789": "Get Help",
  "i18n:v1:jkl012": "Contact Support"
}
```

### 3. Translate

Create translation files:

```json title="i18n/id.json"
{
  "i18n:v1:abc123": "Selamat Datang!",
  "i18n:v1:def456": "Bagaimana saya bisa membantu Anda hari ini?",
  "i18n:v1:ghi789": "Dapatkan Bantuan",
  "i18n:v1:jkl012": "Hubungi Dukungan"
}
```

```json title="i18n/ja.json"
{
  "i18n:v1:abc123": "ようこそ！",
  "i18n:v1:def456": "今日はどのようにお手伝いできますか？",
  "i18n:v1:ghi789": "ヘルプを見る",
  "i18n:v1:jkl012": "サポートに連絡"
}
```

### 4. Build with Translations

```bash
cards2pack build ./cards \
  --i18n-dir ./i18n \
  --output cards.gtpack
```

## Runtime Translation

### Configure Locales

```yaml title="greentic.demo.yaml"
i18n:
  default_locale: "en"
  locales:
    en: "i18n/en.json"
    id: "i18n/id.json"
    ja: "i18n/ja.json"
```

### Use in Flow

```yaml
- id: detect_language
  type: branch
  config:
    conditions:
      - expression: "message.text contains 'bahasa'"
        next: set_indonesian
      - expression: "message.text contains '日本語'"
        next: set_japanese
    default: use_english

- id: set_indonesian
  type: state
  config:
    key: "locale"
    value: "id"
  next: show_welcome

- id: show_welcome
  type: adaptive-card
  config:
    card: "cards/welcome"
    # Card text automatically translated based on session locale
```

## Translation APIs

### Using DeepL

```bash
cards2pack translate ./i18n/en.json \
  --target id \
  --api deepl \
  --api-key $DEEPL_KEY \
  --output ./i18n/id.json
```

### Using Google Translate

```bash
cards2pack translate ./i18n/en.json \
  --target ja \
  --api google \
  --credentials $GOOGLE_CREDENTIALS \
  --output ./i18n/ja.json
```

## Best Practices

1. **Extract early** - Extract strings at the start of development
2. **Use placeholders** - `Welcome, {{name}}!` instead of `Welcome, John!`
3. **Context matters** - Keep translations close to usage
4. **Review machine translations** - Always have humans verify
5. **Test all locales** - Ensure cards render correctly in all languages

## Troubleshooting

### Missing Translation

If a translation is missing, the original (source) text is used:

```yaml
# If "i18n:v1:xyz" is not in id.json, falls back to en.json
```

### Placeholder Issues

Ensure placeholders are preserved in translations:

```json
// Correct
{ "i18n:v1:abc": "Halo, {{name}}!" }

// Wrong
{ "i18n:v1:abc": "Halo, nama!" }  // Lost placeholder
```

## Next Steps

- [cards2pack](/components/cards2pack/)
- [I18nId Specification](/i18n/i18nid-spec/)
