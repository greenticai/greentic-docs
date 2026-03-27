---
title: Spesifikasi I18nId
description: Spesifikasi identifier internasionalisasi yang deterministik
---

## Ringkasan

Spesifikasi **I18nId v1** mendefinisikan bagaimana string dikonversi menjadi identifier yang deterministik dan tahan benturan untuk internasionalisasi.

## Format

```
i18n:v1:<hash>
```

Dengan keterangan:
- `i18n` - Identifier protokol
- `v1` - Versi spesifikasi
- `<hash>` - Hash BLAKE3 dari string yang telah dinormalisasi (encoded hex, 16 karakter)

## Contoh

| Source String | I18nId |
|---------------|--------|
| "Hello" | `i18n:v1:a5b9c3d7e8f0` |
| "Hello, World!" | `i18n:v1:b6c8d4e9f1a2` |
| "  Hello  " | `i18n:v1:a5b9c3d7e8f0` (sama setelah normalisasi) |

## Normalisasi

Sebelum hashing, string dinormalisasi:

1. **Trim whitespace** - Hapus spasi di awal/akhir
2. **Collapse internal whitespace** - Beberapa spasi → satu spasi
3. **Unicode normalization** - Bentuk NFC
4. **Lowercase** (opsional, dapat dikonfigurasi)

```rust
fn normalize(input: &str) -> String {
    input
        .trim()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
```

## Pembuatan Hash

```rust
use blake3::Hasher;

fn generate_i18n_id(text: &str) -> String {
    let normalized = normalize(text);
    let hash = blake3::hash(normalized.as_bytes());
    let hex = hex::encode(&hash.as_bytes()[..8]); // First 8 bytes = 16 hex chars
    format!("i18n:v1:{}", hex)
}
```

## Properti

### Deterministik

Input yang sama selalu menghasilkan output yang sama:

```rust
assert_eq!(
    generate_i18n_id("Hello"),
    generate_i18n_id("Hello")
);
```

### Tahan Benturan

BLAKE3 dengan 64 bit menyediakan birthday resistance sekitar ~2^32, cocok untuk sebagian besar aplikasi.

### Stabil

ID tetap stabil di berbagai:
- Platform yang berbeda
- Bahasa pemrograman yang berbeda
- Versi yang berbeda (di dalam v1)

## Penggunaan di Greentic

### Pesan Flow

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

### Template

```handlebars
{{t "i18n:v1:a5b9c3d7e8f0"}}
```

## Tool CLI

### Generate ID

```bash
greentic-i18n id "Hello, World!"
# Output: i18n:v1:b6c8d4e9f1a2
```

### Verifikasi ID

```bash
greentic-i18n verify "i18n:v1:b6c8d4e9f1a2" "Hello, World!"
# Output: Valid
```

## Migrasi dari Sistem Lain

### Dari Berbasis Key

```json
// Before
{ "greeting.hello": "Hello" }

// After (auto-migration)
{ "i18n:v1:a5b9c3d7e8f0": "Hello" }
```

### Script Migrasi

```bash
greentic-i18n migrate ./old-translations.json --output ./new-translations.json
```

## Praktik Terbaik

1. **Selalu gunakan CLI** untuk menghasilkan ID
2. **Jangan ubah ID secara manual** - generate ulang jika sumber berubah
3. **Simpan string sumber** bersama terjemahan untuk referensi
4. **Versikan file terjemahan Anda** - memungkinkan rollback
5. **Uji dengan banyak locale** - tangkap terjemahan yang hilang

## Langkah Berikutnya

- [Cards Translation](/id/i18n/cards-translation/)
- [i18n Overview](/id/i18n/overview/)
