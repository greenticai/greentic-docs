---
title: Vorlagen (Handlebars)
description: Handlebars-Templating-Komponente für dynamische Inhalte
---

## Überblick

Die **Templates**-Komponente bietet Handlebars-basiertes Templating zur Erzeugung dynamischer Inhalte.

## Grundlegende Verwendung

```yaml
- id: format_message
  type: template
  config:
    template: "Hello, {{name}}! Your order #{{order_id}} is ready."
  to: send_message
```

## Template-Syntax

### Variablen

```handlebars
{{variable}}
{{nested.property}}
{{array.[0]}}
```

### Bedingungen

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

### Schleifen

```handlebars
{{#each items}}
  Item: {{this.name}} - ${{this.price}}
{{/each}}

{{#each items as |item index|}}
  {{index}}. {{item.name}}
{{/each}}
```

### Integrierte Helper

```handlebars
{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}

{{lookup items index}}

{{log "Debug message"}}
```

## Benutzerdefinierte Helper

### String-Helper

```handlebars
{{uppercase text}}        <!-- "HELLO" -->
{{lowercase text}}        <!-- "hello" -->
{{capitalize text}}       <!-- "Hello" -->
{{truncate text 50}}      <!-- "Hello wo..." -->
```

### Zahlen-Helper

```handlebars
{{formatNumber 1234.56}}  <!-- "1,234.56" -->
{{currency amount}}       <!-- "$99.99" -->
{{percent value}}         <!-- "85%" -->
```

### Datums-Helper

```handlebars
{{formatDate date "YYYY-MM-DD"}}
{{relativeTime timestamp}}  <!-- "2 hours ago" -->
{{now}}                     <!-- Current timestamp -->
```

## Beispiel-Templates

### Bestellbestätigung

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

### Statusaktualisierung

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

## Externe Templates

Templates aus Dateien laden:

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

### Partial registrieren

```yaml
components:
  templates:
    partials:
      header: "templates/partials/header.hbs"
      footer: "templates/partials/footer.hbs"
```

### Partial verwenden

```handlebars
{{> header}}

Main content here

{{> footer}}
```

## Nächste Schritte

- [Script (Rhai)](/de/components/script-rhai/)
- [cards2pack](/de/components/cards2pack/)
