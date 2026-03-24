---
title: Script (Rhai)
description: Rhai scripting component for custom logic
---

## Overview

The **Script** component enables custom logic using the Rhai scripting language, a simple yet powerful embedded scripting language for Rust.

## Basic Usage

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

## Rhai Syntax

### Variables

```rhai
let x = 42;
let name = "Alice";
let items = [1, 2, 3];
let user = #{ name: "Bob", age: 30 };
```

### Functions

```rhai
fn greet(name) {
  "Hello, " + name + "!"
}

let message = greet("World");
```

### Control Flow

```rhai
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

### Working with Objects

```rhai
let user = #{
  name: "Alice",
  email: "alice@example.com"
};

let name = user.name;
user.age = 25;
```

## Flow Integration

### Access Context

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

### Conditional Logic

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

### Data Transformation

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

## Built-in Functions

### String Functions

```rhai
let s = "Hello World";

s.len()           // 11
s.to_upper()      // "HELLO WORLD"
s.to_lower()      // "hello world"
s.contains("lo")  // true
s.split(" ")      // ["Hello", "World"]
s.trim()          // Remove whitespace
s.sub_string(0,5) // "Hello"
```

### Array Functions

```rhai
let arr = [1, 2, 3, 4, 5];

arr.len()         // 5
arr.push(6)       // [1, 2, 3, 4, 5, 6]
arr.pop()         // Returns 6
arr.shift()       // Returns 1
arr.filter(|x| x > 2)  // [3, 4, 5]
arr.map(|x| x * 2)     // [2, 4, 6, 8, 10]
arr.reduce(|a, b| a + b, 0)  // 15
```

### Object Functions

```rhai
let obj = #{ a: 1, b: 2 };

obj.keys()        // ["a", "b"]
obj.values()      // [1, 2]
obj.contains("a") // true
```

## Error Handling

```rhai
try {
  let result = risky_operation();
  result
} catch (err) {
  print("Error: " + err);
  #{ error: err.to_string() }
}
```

## Example: Order Processing

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

## Next Steps

- [Templates Component](/components/templates/)
- [LLM OpenAI](/components/llm-openai/)
