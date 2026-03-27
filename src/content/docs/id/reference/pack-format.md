---
title: Format Pack
description: Spesifikasi teknis untuk arsip .gtpack
---

## Ringkasan

File `.gtpack` adalah arsip bertanda tangan yang berisi flow, komponen, dan aset untuk Greentic.

## Struktur File

```
my-feature.gtpack
├── manifest.cbor       # Pack metadata (CBOR encoded)
├── flows/              # Flow definitions
│   ├── main.ygtc
│   └── helper.ygtc
├── components/         # WASM components
│   └── processor.wasm
├── assets/             # Static assets
│   ├── templates/
│   └── cards/
├── sbom.json           # Software Bill of Materials
└── signature.sig       # Ed25519 signature
```

## Skema Manifest

File `manifest.cbor` berisi metadata pack dalam format CBOR:

```rust
struct PackManifest {
    name: String,
    version: String,
    description: Option<String>,
    authors: Vec<String>,
    capabilities: Capabilities,
    flows: HashMap<String, FlowEntry>,
    components: HashMap<String, ComponentEntry>,
    assets: HashMap<String, AssetEntry>,
    dependencies: HashMap<String, VersionReq>,
    secrets: SecretsConfig,
    created_at: u64,
    content_hash: String,
}

struct Capabilities {
    id: String,
    provides: Vec<String>,
}

struct FlowEntry {
    path: String,
    hash: String,
}

struct ComponentEntry {
    path: String,
    hash: String,
    interface: Option<String>,
}

struct AssetEntry {
    path: String,
    hash: String,
}

struct SecretsConfig {
    required: Vec<String>,
    optional: Vec<String>,
}
```

## Spesifikasi pack.toml

### Skema Lengkap

```toml
[pack]
name = "my-feature"
version = "1.0.0"
description = "Feature description"
authors = ["Name <email>"]
license = "MIT"
repository = "https://github.com/org/repo"
homepage = "https://example.com"
readme = "README.md"

[capabilities]
id = "greentic.cap.app.v1"
provides = ["feature-name"]

[dependencies]
greentic-templates = "^0.4"
greentic-llm-openai = "^0.4"

[flows]
main = "flows/main.ygtc"
setup = "flows/setup.ygtc"
# key = path

[components]
processor = "components/processor.wasm"
# key = path

[assets]
templates = "assets/templates/"
cards = "assets/cards/"
# key = directory

[secrets]
required = ["api_key", "bot_token"]
optional = ["webhook_secret"]

[config]
# Default configuration values
default_model = "gpt-4"
max_retries = 3
```

## Capability ID

Pengidentifikasi capability standar:

| Capability ID | Purpose |
|---------------|---------|
| `greentic.cap.app.v1` | Pack aplikasi |
| `greentic.cap.messaging.provider.v1` | Provider messaging |
| `greentic.cap.events.provider.v1` | Provider events |
| `greentic.cap.component.v1` | Komponen yang dapat digunakan ulang |
| `greentic.cap.tool.v1` | Tool MCP |

## Content Hashing

Seluruh isi pack di-hash menggunakan BLAKE3:

```
content_hash = blake3(
    flows_hash ||
    components_hash ||
    assets_hash
)

flows_hash = blake3(
    flow1_hash ||
    flow2_hash ||
    ...
)
```

## Format Tanda Tangan

Pack ditandatangani dengan Ed25519:

```
signature.sig:
- Algorithm: Ed25519
- Message: content_hash
- Format: Raw 64-byte signature
```

Verifikasi:

```rust
let public_key = load_public_key("publisher.pub");
let signature = pack.read_signature();
let content_hash = pack.compute_content_hash();

verify(&public_key, content_hash, signature)?;
```

## Format SBOM

Software Bill of Materials dalam format SPDX JSON:

```json
{
  "spdxVersion": "SPDX-2.3",
  "dataLicense": "CC0-1.0",
  "SPDXID": "SPDXRef-DOCUMENT",
  "name": "my-feature-sbom",
  "packages": [
    {
      "name": "my-feature",
      "version": "1.0.0",
      "downloadLocation": "https://example.com"
    }
  ],
  "relationships": []
}
```

## Kompresi

Isi pack dikompresi dengan zstd pada level 3:

```rust
let compressed = zstd::encode_all(contents, 3)?;
```

## Kompatibilitas Versi

Versi format pack disimpan di manifest:

```rust
struct PackManifest {
    pack_format_version: u32,  // Currently: 1
    // ...
}
```

## Memuat Pack

Proses pemuatan pack di runtime:

1. **Ekstrak arsip** - Dekompresi zstd
2. **Parse manifest** - Decode metadata CBOR
3. **Verifikasi tanda tangan** - Periksa tanda tangan Ed25519
4. **Validasi hash** - Verifikasi integritas konten
5. **Periksa capability** - Pastikan capability kompatibel
6. **Muat flow** - Parse definisi flow YAML
7. **Instansiasi komponen** - Muat modul WASM
8. **Registrasikan** - Tambahkan ke registry runtime

### Pemisahan Operasi Komponen

Saat flow mereferensikan komponen WASM dengan sebuah operasi (misalnya, `component-templates.render`), pack compiler menyimpan string lengkap `"component-id.operation"` sebagai satu component ID tunggal di manifest. Pada runtime, loader membagi nilai ini pada **titik terakhir** untuk mengekstrak component ID dan nama operasinya secara terpisah.

Sebagai contoh, node flow yang mereferensikan `component-templates.render`:

- **Disimpan di manifest**: `"component-templates.render"` (satu key)
- **Resolusi runtime**: dipecah menjadi komponen `component-templates` dan operasi `render`

Strategi pemisahan ini menggunakan titik terakhir sebagai delimiter, sehingga component ID sendiri tetap dapat mengandung titik tanpa ambigu. Runtime kemudian mencari komponen berdasarkan ID yang telah diekstrak dan memanggil operasi yang ditentukan pada modul WASM yang telah dimuat.

```
Manifest key                          Component ID              Operation
─────────────────────────────────     ───────────────────────   ──────────
component-templates.render        →   component-templates       render
component-llm-openai.chat         →   component-llm-openai      chat
org.custom.my-tool.execute        →   org.custom.my-tool        execute
```

Perilaku ini transparan bagi penulis flow. Flow cukup mereferensikan `component-id.operation` di konfigurasi node, dan pack compiler serta runtime akan menangani sisanya.

## Referensi CLI

```bash
# Build pack
greentic-pack build ./my-pack --output my-feature.gtpack

# Sign pack
greentic-pack sign my-feature.gtpack --key signing-key.pem

# Verify pack
greentic-pack verify my-feature.gtpack --pubkey publisher.pub

# Inspect pack
greentic-pack info my-feature.gtpack

# Extract pack
greentic-pack extract my-feature.gtpack --output ./extracted/
```

## Langkah Selanjutnya

- [WIT Interfaces](/id/reference/wit-interfaces/)
- [Building Packs](/id/cli/building-packs/)
