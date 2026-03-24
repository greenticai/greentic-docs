---
title: cards2pack
description: Convert Adaptive Cards to Greentic packs
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

**cards2pack** is a CLI tool that converts Adaptive Cards JSON files into Greentic packs. It enables:

- Card-based UI generation
- Automatic flow creation from cards
- i18n string extraction
- Card validation

## Installation

```bash
cargo install greentic-cards2pack
```

Or from source:

```bash
cd greentic-cards2pack
cargo build --release
```

## Basic Usage

<Steps>

1. **Create Adaptive Card**

   ```json title="cards/welcome.json"
   {
     "type": "AdaptiveCard",
     "version": "1.4",
     "body": [
       {
         "type": "TextBlock",
         "text": "Welcome!",
         "size": "Large",
         "weight": "Bolder"
       },
       {
         "type": "TextBlock",
         "text": "How can I help you today?"
       }
     ],
     "actions": [
       {
         "type": "Action.Submit",
         "title": "Get Help",
         "data": { "action": "help" }
       },
       {
         "type": "Action.Submit",
         "title": "Contact Support",
         "data": { "action": "support" }
       }
     ]
   }
   ```

2. **Convert to Pack**

   ```bash
   cards2pack build ./cards --output my-cards.gtpack
   ```

3. **Use in Flow**

   ```yaml
   - id: show_welcome
     type: adaptive-card
     config:
       card: "cards/welcome"
   ```

</Steps>

## CLI Commands

### Build

```bash
cards2pack build <INPUT_DIR> [OPTIONS]

Options:
  --output, -o <FILE>    Output pack file
  --validate             Validate cards before building
  --extract-i18n         Extract strings for translation
  --i18n-output <FILE>   i18n output file
```

### Validate

```bash
cards2pack validate <INPUT_DIR> [OPTIONS]

Options:
  --strict               Strict validation mode
  --version <VERSION>    Target Adaptive Card version
```

### Extract i18n

```bash
cards2pack extract-i18n <INPUT_DIR> --output strings.json
```

## Card Features

### Text Blocks

```json
{
  "type": "TextBlock",
  "text": "Hello, {{name}}!",
  "size": "Large",
  "weight": "Bolder",
  "color": "Accent"
}
```

### Images

```json
{
  "type": "Image",
  "url": "https://example.com/logo.png",
  "size": "Medium",
  "altText": "Company Logo"
}
```

### Input Fields

```json
{
  "type": "Input.Text",
  "id": "email",
  "label": "Email Address",
  "placeholder": "you@example.com",
  "isRequired": true
}
```

### Choice Sets

```json
{
  "type": "Input.ChoiceSet",
  "id": "category",
  "label": "Select Category",
  "choices": [
    { "title": "Technical", "value": "technical" },
    { "title": "Billing", "value": "billing" },
    { "title": "General", "value": "general" }
  ]
}
```

### Actions

```json
{
  "type": "ActionSet",
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Submit",
      "style": "positive",
      "data": { "action": "submit" }
    },
    {
      "type": "Action.OpenUrl",
      "title": "Learn More",
      "url": "https://example.com"
    }
  ]
}
```

## Template Variables

Use Handlebars syntax for dynamic content:

```json
{
  "type": "AdaptiveCard",
  "body": [
    {
      "type": "TextBlock",
      "text": "Order #{{order_id}}"
    },
    {
      "type": "TextBlock",
      "text": "Status: {{status}}"
    },
    {
      "type": "FactSet",
      "facts": [
        { "title": "Customer", "value": "{{customer_name}}" },
        { "title": "Total", "value": "${{total}}" }
      ]
    }
  ]
}
```

In your flow:

```yaml
- id: show_order
  type: adaptive-card
  config:
    card: "cards/order_status"
    data:
      order_id: "{{order.id}}"
      status: "{{order.status}}"
      customer_name: "{{customer.name}}"
      total: "{{order.total}}"
```

## i18n Integration

<Aside type="note">
cards2pack integrates with greentic-i18n for internationalization.
</Aside>

### Extract Strings

```bash
cards2pack extract-i18n ./cards --output i18n/strings.json
```

Output:

```json
{
  "i18n:v1:abc123": "Welcome!",
  "i18n:v1:def456": "How can I help you today?",
  "i18n:v1:ghi789": "Get Help",
  "i18n:v1:jkl012": "Contact Support"
}
```

### Translate

Create translations:

```json title="i18n/id.json"
{
  "i18n:v1:abc123": "Selamat Datang!",
  "i18n:v1:def456": "Bagaimana saya bisa membantu Anda hari ini?",
  "i18n:v1:ghi789": "Dapatkan Bantuan",
  "i18n:v1:jkl012": "Hubungi Dukungan"
}
```

### Build with Translations

```bash
cards2pack build ./cards \
  --i18n-dir ./i18n \
  --output my-cards.gtpack
```

## Validation

### Validate Cards

```bash
cards2pack validate ./cards --strict
```

Checks for:
- Valid JSON structure
- Required fields present
- Version compatibility
- Action data integrity

### Supported Versions

| Version | Support |
|---------|---------|
| 1.0 | Full |
| 1.1 | Full |
| 1.2 | Full |
| 1.3 | Full |
| 1.4 | Full |
| 1.5 | Partial |

## Best Practices

1. **Keep cards focused** - One purpose per card
2. **Use templates** - Leverage Handlebars for dynamic content
3. **Validate early** - Run validation before deployment
4. **Extract i18n** - Support multiple languages from the start
5. **Test across platforms** - Cards render differently on each platform
6. **Use semantic actions** - Clear action data for flow handling

## Example: Multi-Step Form

```json title="cards/checkout_step1.json"
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "Checkout - Step 1 of 3",
      "size": "Medium",
      "weight": "Bolder"
    },
    {
      "type": "TextBlock",
      "text": "Shipping Information",
      "size": "Small",
      "isSubtle": true
    },
    {
      "type": "Input.Text",
      "id": "name",
      "label": "Full Name",
      "isRequired": true
    },
    {
      "type": "Input.Text",
      "id": "address",
      "label": "Address",
      "isMultiline": true,
      "isRequired": true
    },
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "stretch",
          "items": [
            {
              "type": "Input.Text",
              "id": "city",
              "label": "City",
              "isRequired": true
            }
          ]
        },
        {
          "type": "Column",
          "width": "auto",
          "items": [
            {
              "type": "Input.Text",
              "id": "zip",
              "label": "ZIP Code",
              "isRequired": true
            }
          ]
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Continue to Payment",
      "style": "positive",
      "data": {
        "action": "checkout_step2"
      }
    }
  ]
}
```

## Next Steps

- [i18n Overview](/i18n/overview/)
- [Adaptive Cards Designer](https://adaptivecards.io/designer/)
- [Flows Guide](/concepts/flows/)
