---
title: I18nId 仕様
description: 決定論的な国際化 identifier の仕様
---

## 概要

**I18nId v1** 仕様は、文字列を国際化のための決定論的かつ衝突耐性のある identifier に変換する方法を定義します。

## 形式

```
i18n:v1:<hash>
```

内訳:
- `i18n` - protocol identifier
- `v1` - 仕様バージョン
- `<hash>` - 正規化した文字列の BLAKE3 hash（16 文字の hex encoded）

## 例

| Source String | I18nId |
|---------------|--------|
| "Hello" | `i18n:v1:a5b9c3d7e8f0` |
| "Hello, World!" | `i18n:v1:b6c8d4e9f1a2` |
| "  Hello  " | `i18n:v1:a5b9c3d7e8f0` （正規化後は同じ） |

## 正規化

hash 化の前に、文字列は次のように正規化されます。

1. **前後の空白を除去** - 先頭と末尾の空白を削除
2. **内部の空白を圧縮** - 複数の空白を 1 つにまとめる
3. **Unicode normalization** - NFC 形式
4. **小文字化**（任意、設定可能）

```rust
fn normalize(input: &str) -> String {
    input
        .trim()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
```

## Hash 生成

```rust
use blake3::Hasher;

fn generate_i18n_id(text: &str) -> String {
    let normalized = normalize(text);
    let hash = blake3::hash(normalized.as_bytes());
    let hex = hex::encode(&hash.as_bytes()[..8]); // First 8 bytes = 16 hex chars
    format!("i18n:v1:{}", hex)
}
```

## 特性

### 決定論的

同じ入力は常に同じ出力を生成します。

```rust
assert_eq!(
    generate_i18n_id("Hello"),
    generate_i18n_id("Hello")
);
```

### 衝突耐性

64 bit の BLAKE3 は約 2^32 の birthday resistance を提供し、ほとんどの用途で十分です。

### 安定性

ID は次の違いがあっても安定して維持されます。
- 異なるプラットフォーム
- 異なる programming language
- 異なるバージョン（v1 の範囲内）

## Greentic での利用

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

## CLI ツール

### ID を生成する

```bash
greentic-i18n id "Hello, World!"
# Output: i18n:v1:b6c8d4e9f1a2
```

### ID を検証する

```bash
greentic-i18n verify "i18n:v1:b6c8d4e9f1a2" "Hello, World!"
# Output: Valid
```

## 他システムからの移行

### Key-Based から

```json
// Before
{ "greeting.hello": "Hello" }

// After (auto-migration)
{ "i18n:v1:a5b9c3d7e8f0": "Hello" }
```

### 移行スクリプト

```bash
greentic-i18n migrate ./old-translations.json --output ./new-translations.json
```

## ベストプラクティス

1. **ID の生成には必ず CLI を使う**
2. **ID を手動で変更しない** - 元文字列が変わったら再生成する
3. **参照用に元文字列を翻訳と一緒に保存する**
4. **翻訳ファイルを version 管理する** - rollback を可能にする
5. **複数の locale でテストする** - 翻訳漏れを検出する

## 次のステップ

- [Cards Translation](/ja/i18n/cards-translation/)
- [i18n Overview](/ja/i18n/overview/)
