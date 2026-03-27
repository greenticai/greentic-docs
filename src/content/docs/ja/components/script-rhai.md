---
title: Script (Rhai)
description: カスタムロジックのための Rhai scripting component
---

## 概要

**Script** component は、Rust 向けのシンプルながら強力な埋め込み scripting language である Rhai を使ってカスタムロジックを実装できるようにします。

## 基本的な使い方

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

## Rhai の構文

### 変数

```js
let x = 42;
let name = "Alice";
let items = [1, 2, 3];
let user = #{ name: "Bob", age: 30 };
```

### 関数

```js
fn greet(name) {
  "Hello, " + name + "!"
}

let message = greet("World");
```

### 制御フロー

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

### オブジェクトの操作

```js
let user = #{
  name: "Alice",
  email: "alice@example.com"
};

let name = user.name;
user.age = 25;
```

## Flow との統合

### Context にアクセスする

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

### 条件付きロジック

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
  next: check_result

- id: check_result
  type: branch
  config:
    conditions:
      - expression: "script_result.valid"
        next: continue_flow
    default: show_error
```

### データ変換

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

## 組み込み関数

### 文字列関数

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

### 配列関数

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

### オブジェクト関数

```js
let obj = #{ a: 1, b: 2 };

obj.keys()        // ["a", "b"]
obj.values()      // [1, 2]
obj.contains("a") // true
```

## エラーハンドリング

```js
try {
  let result = risky_operation();
  result
} catch (err) {
  print("Error: " + err);
  #{ error: err.to_string() }
}
```

## 例: 注文処理

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

## 次のステップ

- [Templates Component](/ja/components/templates/)
- [LLM OpenAI](/ja/components/llm-openai/)
