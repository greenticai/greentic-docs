---
title: テンプレート (Handlebars)
description: 動的コンテンツのための Handlebars テンプレート component
---

## 概要

**Templates** component は、動的コンテンツを生成するための Handlebars ベースのテンプレート機能を提供します。

## 基本的な使い方

```yaml
- id: format_message
  type: template
  config:
    template: "Hello, {{name}}! Your order #{{order_id}} is ready."
  to: send_message
```

## テンプレート構文

### 変数

```handlebars
{{variable}}
{{nested.property}}
{{array.[0]}}
```

### 条件分岐

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

### ループ

```handlebars
{{#each items}}
  Item: {{this.name}} - ${{this.price}}
{{/each}}

{{#each items as |item index|}}
  {{index}}. {{item.name}}
{{/each}}
```

### 組み込みヘルパー

```handlebars
{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}

{{lookup items index}}

{{log "Debug message"}}
```

## カスタムヘルパー

### 文字列ヘルパー

```handlebars
{{uppercase text}}        <!-- "HELLO" -->
{{lowercase text}}        <!-- "hello" -->
{{capitalize text}}       <!-- "Hello" -->
{{truncate text 50}}      <!-- "Hello wo..." -->
```

### 数値ヘルパー

```handlebars
{{formatNumber 1234.56}}  <!-- "1,234.56" -->
{{currency amount}}       <!-- "$99.99" -->
{{percent value}}         <!-- "85%" -->
```

### 日付ヘルパー

```handlebars
{{formatDate date "YYYY-MM-DD"}}
{{relativeTime timestamp}}  <!-- "2 hours ago" -->
{{now}}                     <!-- Current timestamp -->
```

## テンプレート例

### 注文確認

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

### ステータス更新

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

## 外部テンプレート

ファイルからテンプレートを読み込みます:

```yaml
- id: render_email
  type: template
  config:
    template_file: "templates/email/welcome.hbs"
    data:
      user: "{{user}}"
      company: "Acme Corp"
```

## partials

### Partial の登録

```yaml
components:
  templates:
    partials:
      header: "templates/partials/header.hbs"
      footer: "templates/partials/footer.hbs"
```

### Partial の使用

```handlebars
{{> header}}

Main content here

{{> footer}}
```

## 次のステップ

- [Script (Rhai)](/ja/components/script-rhai/)
- [cards2pack](/ja/components/cards2pack/)
