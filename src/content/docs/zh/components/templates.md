---
title: 模板（Handlebars）
description: 用于动态内容的 Handlebars 模板组件
---

## 概述

**Templates** 组件基于 Handlebars 提供模板功能，用于生成动态内容。

## 基本用法

```yaml
- id: format_message
  type: template
  config:
    template: "Hello, {{name}}! Your order #{{order_id}} is ready."
  next: send_message
```

## 模板语法

### 变量

```handlebars
{{variable}}
{{nested.property}}
{{array.[0]}}
```

### 条件判断

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

### 循环

```handlebars
{{#each items}}
  Item: {{this.name}} - ${{this.price}}
{{/each}}

{{#each items as |item index|}}
  {{index}}. {{item.name}}
{{/each}}
```

### 内置辅助函数

```handlebars
{{#with user}}
  Name: {{name}}
  Email: {{email}}
{{/with}}

{{lookup items index}}

{{log "Debug message"}}
```

## 自定义辅助函数

### 字符串辅助函数

```handlebars
{{uppercase text}}        <!-- "HELLO" -->
{{lowercase text}}        <!-- "hello" -->
{{capitalize text}}       <!-- "Hello" -->
{{truncate text 50}}      <!-- "Hello wo..." -->
```

### 数字辅助函数

```handlebars
{{formatNumber 1234.56}}  <!-- "1,234.56" -->
{{currency amount}}       <!-- "$99.99" -->
{{percent value}}         <!-- "85%" -->
```

### 日期辅助函数

```handlebars
{{formatDate date "YYYY-MM-DD"}}
{{relativeTime timestamp}}  <!-- "2 hours ago" -->
{{now}}                     <!-- Current timestamp -->
```

## 模板示例

### 订单确认

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

### 状态更新

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

## 外部模板

从文件加载模板：

```yaml
- id: render_email
  type: template
  config:
    template_file: "templates/email/welcome.hbs"
    data:
      user: "{{user}}"
      company: "Acme Corp"
```

## 局部模板

### 注册局部模板

```yaml
components:
  templates:
    partials:
      header: "templates/partials/header.hbs"
      footer: "templates/partials/footer.hbs"
```

### 使用局部模板

```handlebars
{{> header}}

Main content here

{{> footer}}
```

## 下一步

- [Script (Rhai)](/zh/components/script-rhai/)
- [cards2pack](/zh/components/cards2pack/)
