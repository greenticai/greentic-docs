---
title: cards2pack
description: Convert Adaptive Cards to Greentic packs
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

**cards2pack** is a CLI tool that converts Adaptive Card JSON files into Greentic packs. It:

- Scans cards, builds a dependency graph, generates `.ygtc` flows
- Extracts translatable strings for i18n
- Auto-translates cards via `greentic-i18n-translator`
- Packages everything into a deployable `.gtpack`

## Installation

```bash
cargo install greentic-cards2pack
```

Required tools:

```bash
cargo install greentic-flow greentic-pack
cargo install greentic-i18n-translator  # optional, for --auto-translate
```

## Quick Start

<Steps>

1. **Create Adaptive Cards**

   ```json title="cards/welcome.json"
   {
     "type": "AdaptiveCard",
     "version": "1.4",
     "body": [
       { "type": "TextBlock", "text": "Welcome!", "size": "Large" },
       { "type": "TextBlock", "text": "How can I help you today?" }
     ],
     "actions": [
       {
         "type": "Action.Submit",
         "title": "Get Started",
         "data": { "flow": "demo", "step": "next-card" }
       }
     ]
   }
   ```

2. **Generate pack**

   ```bash
   greentic-cards2pack generate \
     --cards ./cards \
     --out ./my-pack \
     --name my-pack
   ```

3. **Output**

   ```
   my-pack/
     pack.yaml
     flows/main.ygtc
     assets/cards/welcome.json
     dist/my-pack.gtpack
     .cards2pack/manifest.json
   ```

</Steps>

## CLI Reference

### `generate`

Main command — scan cards, generate flows, build pack.

```bash
greentic-cards2pack generate [OPTIONS]
```

| Flag | Description |
|------|-------------|
| `--cards <DIR>` | Directory of Adaptive Card JSON files (required) |
| `--out <DIR>` | Output workspace directory (required) |
| `--name <NAME>` | Pack name (required) |
| `--strict` | Errors on missing targets, duplicates, invalid JSON |
| `--group-by <MODE>` | Flow grouping: `folder` or `flow-field` |
| `--default-flow <NAME>` | Default flow name for ungrouped cards |
| `--prompt` | Enable prompt-based routing (adds `prompt2flow` node) |
| `--prompt-json <FILE>` | Answers JSON for prompt routing (requires `--prompt`) |
| `--auto-translate` | Auto-translate cards (requires `greentic-i18n-translator`) |
| `--langs <CODES>` | Comma-separated language codes (default: all 65+ supported locales) |
| `--glossary <FILE>` | Glossary JSON for consistent translations |
| `--verbose` | Print detailed output |

### `extract-i18n`

Extract translatable strings from cards into a JSON bundle.

```bash
greentic-cards2pack extract-i18n [OPTIONS]
```

| Flag | Description |
|------|-------------|
| `--input <DIR>` | Directory of card JSON files (required) |
| `--output <FILE>` | Output JSON path (default: `i18n/en.json`) |
| `--prefix <PREFIX>` | Key prefix (default: `card`) |
| `--include-existing` | Include strings that already contain `$t()` patterns |
| `--verbose` | Print extraction report |

## Card Identification

Cards are identified by (in order of priority):
1. `greentic.cardId` field in the card JSON
2. Filename stem (e.g., `welcome.json` → `welcome`)

Cards are grouped into flows by:
- `flow` field in action data
- `--group-by folder` (directory structure)
- `--default-flow` fallback

## i18n & Auto-Translation

### Extract strings

```bash
greentic-cards2pack extract-i18n \
  --input ./cards \
  --output i18n/en.json \
  --verbose
```

Output:

```json title="i18n/en.json"
{
  "card.welcome.body_0.text": "Welcome!",
  "card.welcome.body_1.text": "How can I help you today?",
  "card.welcome.actions_0.title": "Get Started"
}
```

<Aside type="note">
Keys follow the pattern `{prefix}.{cardId}.{json_path}.{field}`. The card ID comes from `greentic.cardId` or the filename.
</Aside>

### Extracted field types

| Field | Source |
|-------|--------|
| `text` | TextBlock content |
| `title` | Action titles, card titles, toggle titles |
| `label` | Input labels |
| `placeholder` | Input placeholders |
| `errorMessage` | Validation errors |
| `altText` | Image alt text |
| `fallbackText` | Fallback content |
| FactSet `title`/`value` | Fact entries |
| ChoiceSet `title` | Choice options |

### Auto-translate (one command)

```bash
greentic-cards2pack generate \
  --cards ./cards \
  --out ./my-pack \
  --name my-pack \
  --auto-translate \
  --langs fr,de
```

This extracts strings, translates via `greentic-i18n-translator`, and bundles everything:

```
my-pack/assets/i18n/
  en.json   # English (source)
  fr.json   # French
  de.json   # German
```

<Aside type="caution">
Translation failures are non-fatal — the pack still builds, with warnings in `.cards2pack/manifest.json`.
</Aside>

### Glossary

Use a glossary to keep brand names and technical terms consistent:

```json title="glossary.json"
{
  "Greentic": "Greentic",
  "Dashboard": "Dashboard"
}
```

```bash
greentic-cards2pack generate \
  --cards ./cards --out ./pack --name demo \
  --auto-translate --langs fr,de \
  --glossary glossary.json
```

## Flow Generation

Generated flow sections are wrapped in markers:

```yaml
# BEGIN GENERATED (cards2pack)
# ... generated nodes ...
# END GENERATED (cards2pack)

# Developer space below (preserved on regen)
```

Content outside the markers is preserved when you regenerate.

### Strict mode

With `--strict`:
- Missing route targets cause errors (instead of stub nodes)
- Duplicate `cardId` values cause errors
- Invalid JSON causes errors

## Template Variables

Use Handlebars syntax for dynamic content:

```json
{
  "type": "TextBlock",
  "text": "Hello, {{name}}!"
}
```

<Aside type="note">
Pure template expressions like `{{variable}}` are skipped during i18n extraction. Mixed text like `Hello, {{name}}!` is extracted.
</Aside>

## Example: Multi-Step Form with Translation

```bash
# Create cards in cards/ directory, then:
greentic-cards2pack generate \
  --cards ./cards \
  --out ./checkout-pack \
  --name checkout \
  --auto-translate \
  --langs fr,ja,es \
  --glossary glossary.json \
  --strict
```

See the [translate-demo example](https://github.com/greentic-ai/greentic-cards2pack/tree/master/examples/translate-demo) for a complete walkthrough.

## Next Steps

- [Cards Translation Guide](/i18n/cards-translation/)
- [i18n Overview](/i18n/overview/)
- [Flows Guide](/concepts/flows/)
- [Adaptive Cards Designer](https://adaptivecards.io/designer/)
