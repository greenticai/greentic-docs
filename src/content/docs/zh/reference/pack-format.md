---
title: Pack 格式
description: ".gtpack 归档的技术规范"
---

## 概述

`.gtpack` 文件是一个已签名归档，包含 Greentic 的 flow、组件和资源。

## 文件结构

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

## Manifest Schema

`manifest.cbor` 文件以 CBOR 格式包含 pack 元数据：

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

## `pack.toml` 规范

### 完整 Schema

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

标准 capability 标识符：

| Capability ID | 用途 |
|---------------|---------|
| `greentic.cap.app.v1` | 应用 pack |
| `greentic.cap.messaging.provider.v1` | 消息提供方 |
| `greentic.cap.events.provider.v1` | 事件提供方 |
| `greentic.cap.component.v1` | 可复用组件 |
| `greentic.cap.tool.v1` | MCP tool |

## 内容哈希

所有 pack 内容都使用 BLAKE3 进行哈希：

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

## 签名格式

Pack 使用 Ed25519 签名：

```
signature.sig:
- Algorithm: Ed25519
- Message: content_hash
- Format: Raw 64-byte signature
```

验证：

```rust
let public_key = load_public_key("publisher.pub");
let signature = pack.read_signature();
let content_hash = pack.compute_content_hash();

verify(&public_key, content_hash, signature)?;
```

## SBOM 格式

采用 SPDX JSON 格式的 Software Bill of Materials：

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

## 压缩

Pack 内容使用级别 3 的 zstd 压缩：

```rust
let compressed = zstd::encode_all(contents, 3)?;
```

## 版本兼容性

Pack 格式版本存储在 manifest 中：

```rust
struct PackManifest {
    pack_format_version: u32,  // Currently: 1
    // ...
}
```

## Pack 加载

运行时 pack 加载流程：

1. **提取归档** - 解压 zstd
2. **解析 manifest** - 解码 CBOR 元数据
3. **验证签名** - 检查 Ed25519 签名
4. **校验哈希** - 验证内容完整性
5. **检查 capability** - 确保 capability 兼容
6. **加载 flow** - 解析 YAML flow 定义
7. **实例化组件** - 加载 WASM 模块
8. **注册** - 添加到运行时注册表

### 组件操作拆分

当 flow 以操作名引用 WASM 组件时（例如 `component-templates.render`），pack 编译器会将完整的 `"component-id.operation"` 字符串作为单个组件 ID 存储在 manifest 中。在运行时，加载器会在**最后一个点号**处分割该值，以分别提取组件 ID 和操作名。

例如，一个 flow 节点引用 `component-templates.render`：

- **存储在 manifest 中**：`"component-templates.render"`（单个键）
- **运行时解析**：拆分为组件 `component-templates` 和操作 `render`

这种拆分策略以最后一个点号作为分隔符，因此组件 ID 本身也可以包含点号而不会产生歧义。随后运行时会根据提取出的 ID 查找组件，并在已加载的 WASM 模块上调用指定操作。

```
Manifest key                          Component ID              Operation
─────────────────────────────────     ───────────────────────   ──────────
component-templates.render        →   component-templates       render
component-llm-openai.chat         →   component-llm-openai      chat
org.custom.my-tool.execute        →   org.custom.my-tool        execute
```

这种行为对 flow 作者是透明的，flow 只需在节点配置中引用 `component-id.operation`，其余部分由 pack 编译器和运行时处理。

## CLI 参考

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

## 后续步骤

- [WIT Interfaces](/zh/reference/wit-interfaces/)
- [Building Packs](/zh/cli/building-packs/)
