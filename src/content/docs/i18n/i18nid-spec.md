---
title: I18nId Specification
description: Deterministic internationalization identifier specification
---

## Overview

The **I18nId v1** specification defines how strings are converted to deterministic, collision-resistant identifiers for internationalization.

## Format

```
i18n:v1:<hash>
```

Where:
- `i18n` - Protocol identifier
- `v1` - Specification version
- `<hash>` - BLAKE3 hash of normalized string (hex encoded, 16 characters)

## Examples

| Source String | I18nId |
|---------------|--------|
| "Hello" | `i18n:v1:a5b9c3d7e8f0` |
| "Hello, World!" | `i18n:v1:b6c8d4e9f1a2` |
| "  Hello  " | `i18n:v1:a5b9c3d7e8f0` (same after normalization) |

## Normalization

Before hashing, strings are normalized:

1. **Trim whitespace** - Remove leading/trailing spaces
2. **Collapse internal whitespace** - Multiple spaces → single space
3. **Unicode normalization** - NFC form
4. **Lowercase** (optional, configurable)

```rust
fn normalize(input: &str) -> String {
    input
        .trim()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
```

## Hash Generation

```rust
use blake3::Hasher;

fn generate_i18n_id(text: &str) -> String {
    let normalized = normalize(text);
    let hash = blake3::hash(normalized.as_bytes());
    let hex = hex::encode(&hash.as_bytes()[..8]); // First 8 bytes = 16 hex chars
    format!("i18n:v1:{}", hex)
}
```

## Properties

### Deterministic

Same input always produces same output:

```rust
assert_eq!(
    generate_i18n_id("Hello"),
    generate_i18n_id("Hello")
);
```

### Collision Resistant

BLAKE3 with 64 bits provides ~2^32 birthday resistance, suitable for most applications.

### Stable

IDs remain stable across:
- Different platforms
- Different programming languages
- Different versions (within v1)

## Usage in Greentic

### Flow Messages

```yaml
- id: greet
  type: reply
  config:
    message_key: "i18n:v1:a5b9c3d7e8f0"
```

### Cards

```json
{
  "type": "TextBlock",
  "text": "{{i18n:i18n:v1:a5b9c3d7e8f0}}"
}
```

### Templates

```handlebars
{{t "i18n:v1:a5b9c3d7e8f0"}}
```

## CLI Tools

### Generate ID

```bash
greentic-i18n id "Hello, World!"
# Output: i18n:v1:b6c8d4e9f1a2
```

### Verify ID

```bash
greentic-i18n verify "i18n:v1:b6c8d4e9f1a2" "Hello, World!"
# Output: Valid
```

## Migration from Other Systems

### From Key-Based

```json
// Before
{ "greeting.hello": "Hello" }

// After (auto-migration)
{ "i18n:v1:a5b9c3d7e8f0": "Hello" }
```

### Migration Script

```bash
greentic-i18n migrate ./old-translations.json --output ./new-translations.json
```

## Best Practices

1. **Always use the CLI** to generate IDs
2. **Don't modify IDs manually** - regenerate if source changes
3. **Store source strings** alongside translations for reference
4. **Version your translation files** - enables rollback
5. **Test with multiple locales** - catch missing translations

## Next Steps

- [Cards Translation](/greentic-docs/i18n/cards-translation/)
- [i18n Overview](/greentic-docs/i18n/overview/)
