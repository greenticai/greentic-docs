---
title: Template (Handlebars)
description: Komponen templating Handlebars untuk konten dinamis
---

## Ringkasan

Komponen **Templates** menyediakan templating berbasis Handlebars untuk menghasilkan konten dinamis.

## Penggunaan Dasar

```yaml
- id: format_message
  type: template
  config:
    template: "Hello, {{name}}! Your order #{{order_id}} is ready."
  next: send_message
```

## Sintaks Template

### Variabel

```handlebars
{{variable}}
{{nested.property}}
{{array.[0]}}
```

### Kondisional

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

### Perulangan

```handlebars
{{#each items}}
  Item: {{this.name}} - ${{this.price}}
{{/each}}

{{#each items as |item index|}}
  {{index}}. {{item.name}}
{{/each}}
```

### Helper Bawaan

```handlebars
{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}

{{lookup items index}}

{{log "Debug message"}}
```

## Helper Kustom

### Helper String

```handlebars
{{uppercase text}}        <!-- "HELLO" -->
{{lowercase text}}        <!-- "hello" -->
{{capitalize text}}       <!-- "Hello" -->
{{truncate text 50}}      <!-- "Hello wo..." -->
```

### Helper Angka

```handlebars
{{formatNumber 1234.56}}  <!-- "1,234.56" -->
{{currency amount}}       <!-- "$99.99" -->
{{percent value}}         <!-- "85%" -->
```

### Helper Tanggal

```handlebars
{{formatDate date "YYYY-MM-DD"}}
{{relativeTime timestamp}}  <!-- "2 hours ago" -->
{{now}}                     <!-- Current timestamp -->
```

## Contoh Template

### Konfirmasi Pesanan

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

### Pembaruan Status

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

## Template Eksternal

Muat template dari file:

```yaml
- id: render_email
  type: template
  config:
    template_file: "templates/email/welcome.hbs"
    data:
      user: "{{user}}"
      company: "Acme Corp"
```

## Partial

### Mendaftarkan Partial

```yaml
components:
  templates:
    partials:
      header: "templates/partials/header.hbs"
      footer: "templates/partials/footer.hbs"
```

### Menggunakan Partial

```handlebars
{{> header}}

Main content here

{{> footer}}
```

## Langkah Berikutnya

- [Script (Rhai)](/id/components/script-rhai/)
- [cards2pack](/id/components/cards2pack/)
