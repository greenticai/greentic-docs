---
title: Cards Translation
description: Translating Adaptive Cards with i18n
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

Greentic supports translating Adaptive Cards into multiple languages. You can either:
- **One command:** `generate --auto-translate` (extracts + translates + builds)
- **Step by step:** extract → translate → build

## Quick Start (one command)

```bash
greentic-cards2pack generate \
  --cards ./cards \
  --out ./my-pack \
  --name my-pack \
  --auto-translate \
  --langs fr,de,ja
```

Done. The pack includes `assets/i18n/en.json`, `fr.json`, `de.json`, `ja.json`.

## Step-by-Step Workflow

<Steps>

1. **Create cards**

   ```json title="cards/welcome.json"
   {
     "type": "AdaptiveCard",
     "version": "1.4",
     "body": [
       { "type": "TextBlock", "text": "Welcome!", "size": "Large" },
       { "type": "TextBlock", "text": "How can I help you today?" }
     ],
     "actions": [
       { "type": "Action.Submit", "title": "Get Help" },
       { "type": "Action.Submit", "title": "Contact Support" }
     ]
   }
   ```

2. **Extract translatable strings**

   ```bash
   greentic-cards2pack extract-i18n \
     --input ./cards \
     --output i18n/en.json
   ```

   Output:

   ```json title="i18n/en.json"
   {
     "card.welcome.body_0.text": "Welcome!",
     "card.welcome.body_1.text": "How can I help you today?",
     "card.welcome.actions_0.title": "Get Help",
     "card.welcome.actions_1.title": "Contact Support"
   }
   ```

3. **Translate with greentic-i18n-translator**

   ```bash
   greentic-i18n-translator translate \
     --langs fr,ja \
     --en i18n/en.json
   ```

   This creates `i18n/fr.json` and `i18n/ja.json` in the same directory.

   <Aside type="note">
   `greentic-i18n-translator` uses Codex CLI for translation. Install via `cargo install greentic-i18n-translator`.
   </Aside>

4. **Generate pack**

   ```bash
   greentic-cards2pack generate \
     --cards ./cards \
     --out ./my-pack \
     --name my-pack
   ```

</Steps>

## Key Format

Extracted keys follow the pattern:

```
{prefix}.{cardId}.{json_path}.{field}
```

| Part | Source | Example |
|------|--------|---------|
| `prefix` | `--prefix` flag (default: `card`) | `card` |
| `cardId` | `greentic.cardId` field or filename | `welcome` |
| `json_path` | Position in card structure | `body_0`, `actions_1` |
| `field` | Field name | `text`, `title`, `label` |

Examples:
- `card.welcome.body_0.text` → first TextBlock's text
- `card.welcome.actions_0.title` → first action's title
- `card.form.body_1.placeholder` → second body element's placeholder
- `card.form.body_0_choices_2.title` → third choice option's title

## Glossary

Keep brand names and technical terms consistent across translations:

```json title="glossary.json"
{
  "Greentic": "Greentic",
  "Dashboard": "Dashboard",
  "CLI": "CLI"
}
```

Use with either approach:

```bash
# One command
greentic-cards2pack generate \
  --cards ./cards --out ./pack --name demo \
  --auto-translate --langs fr,de \
  --glossary glossary.json

# Step by step
greentic-i18n-translator translate \
  --langs fr,de \
  --en i18n/en.json \
  --glossary glossary.json
```

## What Gets Extracted

| Field | Source Element |
|-------|--------------|
| `text` | TextBlock, RichTextBlock |
| `title` | Actions, toggles, fact titles |
| `label` | Input labels |
| `placeholder` | Input placeholders |
| `errorMessage` | Validation messages |
| `altText` | Image alt text |
| `fallbackText` | Fallback content |
| `value` | Fact values |

**Skipped automatically:**
- Empty strings
- Pure Handlebars templates: `{{variable}}`
- Variable references: `${var}`
- Existing i18n patterns: `$t(key)` (unless `--include-existing`)

## Runtime Translation

### Configure locales

```yaml title="greentic.demo.yaml"
i18n:
  default_locale: "en"
  locales:
    en: "assets/i18n/en.json"
    fr: "assets/i18n/fr.json"
    ja: "assets/i18n/ja.json"
```

### Set locale in flow

```yaml
- id: set_language
  type: state
  config:
    key: "locale"
    value: "fr"
  next: show_welcome

- id: show_welcome
  type: adaptive-card
  config:
    card: "cards/welcome"
    # Card text automatically resolved based on session locale
```

## Error Handling

Translation failures are **non-fatal**. If `greentic-i18n-translator` fails for a language:
- The pack still builds successfully
- A warning appears in `.cards2pack/manifest.json`
- The English bundle (`en.json`) is always created

Check warnings:

```bash
cat my-pack/.cards2pack/manifest.json | jq '.warnings[] | select(.kind == "translation")'
```

## Troubleshooting

### Translator not found

```
auto-translation failed: failed to execute greentic-i18n-translator
```

Install: `cargo install greentic-i18n-translator`

Or set a custom path: `export GREENTIC_I18N_TRANSLATOR_BIN=/path/to/translator`

### Missing translations at runtime

If a key is missing in the target language bundle, the runtime falls back to the English source text.

### Placeholders lost in translation

Ensure Handlebars placeholders are preserved:

```json
// Correct
{ "card.welcome.body_0.text": "Bonjour, {{name}} !" }

// Wrong — placeholder lost
{ "card.welcome.body_0.text": "Bonjour, nom !" }
```

## Next Steps

- [cards2pack CLI Reference](/greentic-docs/components/cards2pack/)
- [I18nId Specification](/greentic-docs/i18n/i18nid-spec/)
- [i18n Overview](/greentic-docs/i18n/overview/)
