---
title: Creating MCP Tools
description: Build custom MCP tools for Greentic
---

import { Steps } from '@astrojs/starlight/components';

## Overview

Create custom MCP tools to extend your digital worker's capabilities with external integrations, custom logic, and data access.

## Creating a Tool

<Steps>

1. **Define WIT Interface**

   ```wit title="wit/tool.wit"
   package greentic:my-tool;

   interface tool {
       record input {
           query: string,
           options: option<string>,
       }

       record output {
           success: bool,
           data: option<string>,
           error: option<string>,
       }

       execute: func(input: input) -> output;
   }

   world my-tool {
       export tool;
   }
   ```

2. **Implement in Rust**

   ```rust title="src/lib.rs"
   use wit_bindgen::generate;

   generate!({
       world: "my-tool",
       path: "wit",
   });

   struct MyTool;

   impl tool::Guest for MyTool {
       fn execute(input: tool::Input) -> tool::Output {
           // Your tool logic here
           let result = process_query(&input.query);

           tool::Output {
               success: true,
               data: Some(result),
               error: None,
           }
       }
   }

   fn process_query(query: &str) -> String {
       format!("Processed: {}", query)
   }

   export!(MyTool);
   ```

3. **Build WASM Component**

   ```bash
   cargo build --target wasm32-wasip2 --release
   ```

4. **Create Tool Manifest**

   ```yaml title="tool.yaml"
   name: my_tool
   version: "1.0.0"
   description: My custom MCP tool

   parameters:
     - name: query
       type: string
       description: The query to process
       required: true
     - name: options
       type: string
       description: Optional configuration
       required: false

   returns:
     type: object
     properties:
       success:
         type: boolean
       data:
         type: string
       error:
         type: string

   capabilities:
     - network:outbound
   ```

5. **Register Tool**

   ```yaml title="greentic.demo.yaml"
   mcp:
     tools:
       - name: my_tool
         component: "tools/my-tool.wasm"
         manifest: "tools/my-tool.yaml"
   ```

</Steps>

## Tool Examples

### HTTP Request Tool

```rust
impl tool::Guest for HttpTool {
    fn execute(input: tool::Input) -> tool::Output {
        let url = &input.url;
        let method = input.method.unwrap_or("GET".to_string());

        match http_request(&method, url, input.body.as_deref()) {
            Ok(response) => tool::Output {
                success: true,
                data: Some(response),
                error: None,
            },
            Err(e) => tool::Output {
                success: false,
                data: None,
                error: Some(e.to_string()),
            },
        }
    }
}
```

### Database Query Tool

```rust
impl tool::Guest for DbTool {
    fn execute(input: tool::Input) -> tool::Output {
        // Get connection string from secrets
        let conn_str = get_secret("database_url")?;

        // Execute query (pseudo-code)
        let results = db_query(&conn_str, &input.query)?;

        tool::Output {
            success: true,
            data: Some(serde_json::to_string(&results)?),
            error: None,
        }
    }
}
```

### Email Tool

```rust
impl tool::Guest for EmailTool {
    fn execute(input: tool::Input) -> tool::Output {
        let api_key = get_secret("sendgrid_api_key")?;

        let result = send_email(
            &api_key,
            &input.to,
            &input.subject,
            &input.body,
        );

        match result {
            Ok(_) => tool::Output {
                success: true,
                data: Some("Email sent".to_string()),
                error: None,
            },
            Err(e) => tool::Output {
                success: false,
                data: None,
                error: Some(e.to_string()),
            },
        }
    }
}
```

## Using Tools in Flows

### Direct Invocation

```yaml
- id: call_tool
  type: mcp-tool
  config:
    tool: "my_tool"
    parameters:
      query: "{{user_query}}"
  output: tool_result
```

### With LLM Agent

```yaml
- id: agent
  type: llm
  config:
    model: "gpt-4"
    system_prompt: |
      You are an assistant with access to tools.
      Use tools when needed to help the user.
    tools:
      - my_tool
      - http_request
      - send_email
    tool_choice: "auto"
```

## Testing Tools

### Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execute() {
        let input = tool::Input {
            query: "test".to_string(),
            options: None,
        };

        let output = MyTool::execute(input);

        assert!(output.success);
        assert!(output.data.is_some());
    }
}
```

### Integration Test

```bash
# Test with sample input
echo '{"query": "test"}' | greentic-mcp test ./my-tool.wasm
```

## Best Practices

1. **Handle all errors** - Never panic, always return error in output
2. **Validate input** - Check parameters before processing
3. **Use secrets** - Never hardcode credentials
4. **Add logging** - Help with debugging
5. **Document thoroughly** - Clear descriptions in manifest
6. **Test edge cases** - Handle empty inputs, large data, etc.

## Next Steps

- [MCP Overview](/greentic-docs/mcp/overview/)
- [Components Guide](/greentic-docs/concepts/components/)
