---
title: Templates (Handlebars)
description: Handlebars templating component for dynamic content
---

## Overview

The **Templates** component provides Handlebars-based templating for generating dynamic content.

## Basic Usage

```yaml
- id: format_message
  type: template
  config:
    template: "Hello, {{name}}! Your order #{{order_id}} is ready."
  next: send_message
```

## Template Syntax

### Variables

```handlebars
{{variable}}
{{nested.property}}
{{array.[0]}}
```

### Conditionals

```handlebars
{{#if condition}}
  Content when true
{{else}}
  Content when false
{{/if}}

{{#unless condition}}
  Content when false
{{/unless}}
```

### Loops

```handlebars
{{#each items}}
  Item: {{this.name}} - ${{this.price}}
{{/each}}

{{#each items as |item index|}}
  {{index}}. {{item.name}}
{{/each}}
```

### Built-in Helpers

```handlebars
{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}

{{lookup items index}}

{{log "Debug message"}}
```

## Custom Helpers

### String Helpers

```handlebars
{{uppercase text}}        <!-- "HELLO" -->
{{lowercase text}}        <!-- "hello" -->
{{capitalize text}}       <!-- "Hello" -->
{{truncate text 50}}      <!-- "Hello wo..." -->
```

### Number Helpers

```handlebars
{{formatNumber 1234.56}}  <!-- "1,234.56" -->
{{currency amount}}       <!-- "$99.99" -->
{{percent value}}         <!-- "85%" -->
```

### Date Helpers

```handlebars
{{formatDate date "YYYY-MM-DD"}}
{{relativeTime timestamp}}  <!-- "2 hours ago" -->
{{now}}                     <!-- Current timestamp -->
```

## Example Templates

### Order Confirmation

```yaml
- id: order_confirmation
  type: template
  config:
    template: |
      # Order Confirmation

      **Order #{{order.id}}**

      Hi {{customer.name}},

      Thank you for your order!

      ## Items:
      {{#each order.items}}
      - {{name}} x {{quantity}} - ${{price}}
      {{/each}}

      **Subtotal:** ${{order.subtotal}}
      **Tax:** ${{order.tax}}
      **Total:** ${{order.total}}

      Expected delivery: {{formatDate order.delivery_date "MMMM D, YYYY"}}
```

### Status Update

```yaml
- id: status_template
  type: template
  config:
    template: |
      {{#if is_complete}}
      Your request has been completed!
      {{else if is_pending}}
      Your request is being processed...
      {{else}}
      We've received your request.
      {{/if}}

      {{#if notes}}
      Notes: {{notes}}
      {{/if}}
```

## External Templates

Load templates from files:

```yaml
- id: render_email
  type: template
  config:
    template_file: "templates/email/welcome.hbs"
    data:
      user: "{{user}}"
      company: "Acme Corp"
```

## Partials

### Register Partial

```yaml
components:
  templates:
    partials:
      header: "templates/partials/header.hbs"
      footer: "templates/partials/footer.hbs"
```

### Use Partial

```handlebars
{{> header}}

Main content here

{{> footer}}
```

## Next Steps

- [Script (Rhai)](/greentic-docs/components/script-rhai/)
- [cards2pack](/greentic-docs/components/cards2pack/)
