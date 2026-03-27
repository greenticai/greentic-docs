---
title: I18nId 规范
description: 确定性的国际化标识符规范
---

## 概述

**I18nId v1** 规范定义了如何将字符串转换为用于国际化的确定性、抗冲突标识符。

## 格式

```
i18n:v1:<hash>
```

其中：
- `i18n` - 协议标识符
- `v1` - 规范版本
- `<hash>` - 归一化字符串的 BLAKE3 哈希（hex 编码，16 个字符）

## 示例

| 源字符串 | I18nId |
|---------------|--------|
| "Hello" | `i18n:v1:a5b9c3d7e8f0` |
| "Hello, World!" | `i18n:v1:b6c8d4e9f1a2` |
| "  Hello  " | `i18n:v1:a5b9c3d7e8f0`（归一化后相同） |

## 归一化

在进行哈希之前，字符串会先被归一化：

1. **Trim whitespace** - 去除首尾空格
2. **Collapse internal whitespace** - 多个空格 → 单个空格
3. **Unicode normalization** - NFC 形式
4. **Lowercase**（可选，可配置）

```rust
fn normalize(input: &str) -> String {
    input
        .trim()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
```

## 哈希生成

```rust
use blake3::Hasher;

fn generate_i18n_id(text: &str) -> String {
    let normalized = normalize(text);
    let hash = blake3::hash(normalized.as_bytes());
    let hex = hex::encode(&hash.as_bytes()[..8]); // First 8 bytes = 16 hex chars
    format!("i18n:v1:{}", hex)
}
```

## 属性

### 确定性

相同输入总是产生相同输出：

```rust
assert_eq!(
    generate_i18n_id("Hello"),
    generate_i18n_id("Hello")
);
```

### 抗冲突

采用 64 位的 BLAKE3 可提供约 `2^32` 的生日攻击抗性，适用于大多数应用场景。

### 稳定性

ID 在以下情况下保持稳定：
- 不同平台
- 不同编程语言
- 不同版本（在 v1 范围内）

## 在 Greentic 中的用法

### Flow 消息

```yaml
- id: greet
  type: reply
  config:
    message_key: "i18n:v1:a5b9c3d7e8f0"
```

### 卡片

```json
{
  "type": "TextBlock",
  "text": "{{i18n:i18n:v1:a5b9c3d7e8f0}}"
}
```

### 模板

```handlebars
{{t "i18n:v1:a5b9c3d7e8f0"}}
```

## CLI 工具

### 生成 ID

```bash
greentic-i18n id "Hello, World!"
# Output: i18n:v1:b6c8d4e9f1a2
```

### 校验 ID

```bash
greentic-i18n verify "i18n:v1:b6c8d4e9f1a2" "Hello, World!"
# Output: Valid
```

## 从其他系统迁移

### 从基于键的方式迁移

```json
// Before
{ "greeting.hello": "Hello" }

// After (auto-migration)
{ "i18n:v1:a5b9c3d7e8f0": "Hello" }
```

### 迁移脚本

```bash
greentic-i18n migrate ./old-translations.json --output ./new-translations.json
```

## 最佳实践

1. **始终使用 CLI** 生成 ID
2. **不要手动修改 ID** - 如果源文本变化，请重新生成
3. **将源字符串与翻译一并存储**，便于参考
4. **对翻译文件做版本管理** - 支持回滚
5. **使用多个 locale 测试** - 及时发现缺失翻译

## 下一步

- [Cards 翻译](/zh/i18n/cards-translation/)
- [i18n 概览](/zh/i18n/overview/)
