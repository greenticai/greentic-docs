---
title: Pack フォーマット
description: .gtpack アーカイブの技術仕様
---

## 概要

`.gtpack` ファイルは、Greentic のフロー、コンポーネント、アセットを含む署名付きアーカイブです。

## ファイル構造

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

## マニフェストスキーマ

`manifest.cbor` ファイルには、CBOR 形式の Pack メタデータが含まれます。

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

## pack.toml 仕様

### 完全なスキーマ

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

標準の capability 識別子:

| Capability ID | 用途 |
|---------------|---------|
| `greentic.cap.app.v1` | アプリケーション Pack |
| `greentic.cap.messaging.provider.v1` | メッセージングプロバイダー |
| `greentic.cap.events.provider.v1` | イベントプロバイダー |
| `greentic.cap.component.v1` | 再利用可能なコンポーネント |
| `greentic.cap.tool.v1` | MCP ツール |

## コンテンツハッシュ

すべての Pack 内容は BLAKE3 を使用してハッシュ化されます。

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

## 署名フォーマット

Pack は Ed25519 で署名されます。

```
signature.sig:
- Algorithm: Ed25519
- Message: content_hash
- Format: Raw 64-byte signature
```

検証:

```rust
let public_key = load_public_key("publisher.pub");
let signature = pack.read_signature();
let content_hash = pack.compute_content_hash();

verify(&public_key, content_hash, signature)?;
```

## SBOM フォーマット

SPDX JSON 形式の Software Bill of Materials:

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

## 圧縮

Pack 内容はレベル 3 の zstd で圧縮されます。

```rust
let compressed = zstd::encode_all(contents, 3)?;
```

## バージョン互換性

Pack フォーマットのバージョンはマニフェストに格納されます。

```rust
struct PackManifest {
    pack_format_version: u32,  // Currently: 1
    // ...
}
```

## Pack の読み込み

ランタイムの Pack 読み込みプロセス:

1. **アーカイブを展開** - zstd を展開
2. **マニフェストを解析** - CBOR メタデータをデコード
3. **署名を検証** - Ed25519 署名を確認
4. **ハッシュを検証** - コンテンツ整合性を確認
5. **capability を確認** - 互換性のある capability を保証
6. **フローを読み込み** - YAML フロー定義を解析
7. **コンポーネントをインスタンス化** - WASM モジュールを読み込み
8. **登録** - ランタイムレジストリに追加

### コンポーネント操作の分割

フローが操作付きの WASM コンポーネント（例: `component-templates.render`）を参照する場合、Pack コンパイラは完全な `"component-id.operation"` 文字列を、単一のコンポーネント ID としてマニフェストに保存します。ランタイムでは、この値を **最後のドット** で分割して、コンポーネント ID と操作名を別々に取り出します。

たとえば、`component-templates.render` を参照するフローノードの場合:

- **マニフェストに保存される値**: `"component-templates.render"`（単一キー）
- **ランタイムでの解決**: コンポーネント `component-templates` と操作 `render` に分割

この分割戦略では最後のドットを区切り文字として使うため、コンポーネント ID 自体にドットが含まれていても曖昧さがありません。その後ランタイムは、抽出した ID でコンポーネントを検索し、読み込まれた WASM モジュール上で指定された操作を呼び出します。

```
Manifest key                          Component ID              Operation
─────────────────────────────────     ───────────────────────   ──────────
component-templates.render        →   component-templates       render
component-llm-openai.chat         →   component-llm-openai      chat
org.custom.my-tool.execute        →   org.custom.my-tool        execute
```

この挙動はフロー作成者に対して透過的です。フローではノード設定内で `component-id.operation` を参照するだけでよく、残りは Pack コンパイラとランタイムが処理します。

## CLI リファレンス

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

## 次のステップ

- [WIT Interfaces](/ja/reference/wit-interfaces/)
- [Pack のビルド](/ja/cli/building-packs/)
