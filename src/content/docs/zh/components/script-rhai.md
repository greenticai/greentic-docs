---
title: Script (Rhai)
description: 用于自定义逻辑的 Rhai 脚本组件
---

## 概述

**Script** 组件支持使用 Rhai 脚本语言编写自定义逻辑。Rhai 是一种简单但强大的 Rust 内嵌脚本语言。

## 基本用法

```yaml
- id: calculate
  type: script
  config:
    script: |
      let total = 0;
      for item in items {
        total += item.price * item.quantity;
      }
      total
  output: calculated_total
```

## Rhai 语法

### 变量

```js
let x = 42;
let name = "Alice";
let items = [1, 2, 3];
let user = #{ name: "Bob", age: 30 };
```

### 函数

```js
fn greet(name) {
  "Hello, " + name + "!"
}

let message = greet("World");
```

### 控制流

```js
if x > 10 {
  "big"
} else if x > 5 {
  "medium"
} else {
  "small"
}

// Loops
for item in items {
  process(item);
}

while condition {
  do_something();
}
```

### 处理对象

```js
let user = #{
  name: "Alice",
  email: "alice@example.com"
};

let name = user.name;
user.age = 25;
```

## Flow 集成

### 访问上下文

```yaml
- id: process
  type: script
  config:
    script: |
      // Access message
      let msg = message;

      // Access session state
      let count = state.get("visit_count");
      count = count + 1;
      state.set("visit_count", count);

      // Return result
      #{
        processed: true,
        visit_count: count
      }
```

### 条件逻辑

```yaml
- id: validate
  type: script
  config:
    script: |
      let email = input.email;

      if email.contains("@") && email.contains(".") {
        #{ valid: true }
      } else {
        #{ valid: false, error: "Invalid email format" }
      }
  to: check_result

- id: check_result
  type: branch
  config:
    conditions:
      - expression: "script_result.valid"
        to: continue_flow
    default: show_error
```

### 数据转换

```yaml
- id: transform
  type: script
  config:
    script: |
      let items = order.items;
      let transformed = [];

      for item in items {
        transformed.push(#{
          name: item.product_name,
          total: item.price * item.qty,
          formatted: "$" + (item.price * item.qty).to_string()
        });
      }

      transformed
```

## 内置函数

### 字符串函数

```js
let s = "Hello World";

s.len()           // 11
s.to_upper()      // "HELLO WORLD"
s.to_lower()      // "hello world"
s.contains("lo")  // true
s.split(" ")      // ["Hello", "World"]
s.trim()          // Remove whitespace
s.sub_string(0,5) // "Hello"
```

### 数组函数

```js
let arr = [1, 2, 3, 4, 5];

arr.len()         // 5
arr.push(6)       // [1, 2, 3, 4, 5, 6]
arr.pop()         // Returns 6
arr.shift()       // Returns 1
arr.filter(|x| x > 2)  // [3, 4, 5]
arr.map(|x| x * 2)     // [2, 4, 6, 8, 10]
arr.reduce(|a, b| a + b, 0)  // 15
```

### 对象函数

```js
let obj = #{ a: 1, b: 2 };

obj.keys()        // ["a", "b"]
obj.values()      // [1, 2]
obj.contains("a") // true
```

## 错误处理

```js
try {
  let result = risky_operation();
  result
} catch (err) {
  print("Error: " + err);
  #{ error: err.to_string() }
}
```

## 示例：订单处理

```yaml
- id: process_order
  type: script
  config:
    script: |
      let order = input.order;
      let discount_code = input.discount_code;

      // Calculate subtotal
      let subtotal = 0.0;
      for item in order.items {
        subtotal += item.price * item.quantity;
      }

      // Apply discount
      let discount = 0.0;
      if discount_code == "SAVE10" {
        discount = subtotal * 0.10;
      } else if discount_code == "SAVE20" {
        discount = subtotal * 0.20;
      }

      // Calculate tax (8%)
      let taxable = subtotal - discount;
      let tax = taxable * 0.08;

      // Calculate total
      let total = taxable + tax;

      #{
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        item_count: order.items.len()
      }
```

## 下一步

- [Templates Component](/zh/components/templates/)
- [LLM OpenAI](/zh/components/llm-openai/)
