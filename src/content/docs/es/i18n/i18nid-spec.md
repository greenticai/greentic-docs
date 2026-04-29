---
title: Translation Keys
description: Stable key naming for Greentic i18n catalogs
---

## Overview

Greentic translation catalogs are flat JSON key/value maps. Older docs referred to deterministic `I18nId` values, but the current demos and local tooling use readable stable keys such as:

```text
card.main_menu.body_0.text
card.customer_form.body_2.label
qa.install.title
cli.root.about
```

The practical rule is simple: keys must be stable, unique within the catalog, and meaningful enough that translators and reviewers can understand their context.

## Key Format

Recommended key shape:

```text
{domain}.{screen_or_component}.{path}.{field}
```

Examples:

| Key | Meaning |
| --- | --- |
| `card.main_menu.body_0.text` | First body text block in the main menu card. |
| `card.main_menu.actions_0.title` | First action title in the main menu card. |
| `card.customer_form.body_2.placeholder` | Placeholder text in a form input. |
| `qa.install.title` | Component setup UI title. |
| `qa.field.api_key.help` | Help text for a setup field. |

Some existing packs use variants such as `cards.about_card.body.i0.text`. Keep existing keys stable once a pack is published; do not rename keys only for style.

## Adaptive Card References

Use the key from the locale catalog in the card:

```json
{
  "type": "TextBlock",
  "text": "{{i18n:card.main_menu.body_0.text}}"
}
```

Then define the value in each locale:

```json title="assets/i18n/en.json"
{
  "card.main_menu.body_0.text": "Welcome"
}
```

```json title="assets/i18n/fr.json"
{
  "card.main_menu.body_0.text": "Bienvenue"
}
```

## Normalization and Fallback

The local Greentic i18n runtime normalizes BCP 47-ish locale tags before lookup:

- `en_US.UTF-8` becomes `en-US`
- `ja-JP` can fall back to `ja`
- unknown locales fall back to `en` when an English catalog is available
- missing keys fall back to the key or source text depending on the caller

This is locale fallback, not hash generation.

## Extracted Card Keys

Card extraction helpers usually derive keys from:

1. a prefix such as `card`
2. the card id or filename
3. the JSON path of the field
4. the translated field name

Example:

```text
card.welcome.body_0.text
card.welcome.actions_0.title
card.form.body_1.placeholder
card.form.body_0_choices_2.title
```

## Best Practices

1. Keep keys stable after release.
2. Do not translate keys, only values.
3. Keep placeholders intact, for example `{{name}}` or `{tenant}`.
4. Use `assets/i18n/en.json` as the source catalog unless your source language is different.
5. Add the same keys to every translated locale file.
6. Run `greentic-i18n-translator validate` for translated files.
7. Prefer readable keys over opaque hashes for pack assets and cards.

## Next Steps

- [Cards Translation](/i18n/cards-translation/)
- [i18n Overview](/i18n/overview/)
