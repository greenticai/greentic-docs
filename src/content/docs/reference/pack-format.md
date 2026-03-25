---
title: Pack Format
description: Technical specification for .gtpack archives
---

## Overview

A `.gtpack` file is a signed archive containing flows, components, and assets for Greentic.

## File Structure

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

The `manifest.cbor` file contains pack metadata in CBOR format:

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

## pack.toml Specification

### Full Schema

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

## Capability IDs

Standard capability identifiers:

| Capability ID | Purpose |
|---------------|---------|
| `greentic.cap.app.v1` | Application pack |
| `greentic.cap.messaging.provider.v1` | Messaging provider |
| `greentic.cap.events.provider.v1` | Events provider |
| `greentic.cap.component.v1` | Reusable component |
| `greentic.cap.tool.v1` | MCP tool |

## Content Hashing

All pack contents are hashed using BLAKE3:

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

## Signature Format

Packs are signed with Ed25519:

```
signature.sig:
- Algorithm: Ed25519
- Message: content_hash
- Format: Raw 64-byte signature
```

Verification:

```rust
let public_key = load_public_key("publisher.pub");
let signature = pack.read_signature();
let content_hash = pack.compute_content_hash();

verify(&public_key, content_hash, signature)?;
```

## SBOM Format

Software Bill of Materials in SPDX JSON format:

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

## Compression

Pack contents are compressed with zstd at level 3:

```rust
let compressed = zstd::encode_all(contents, 3)?;
```

## Version Compatibility

Pack format version is stored in manifest:

```rust
struct PackManifest {
    pack_format_version: u32,  // Currently: 1
    // ...
}
```

## Pack Loading

Runtime pack loading process:

1. **Extract archive** - Decompress zstd
2. **Parse manifest** - Decode CBOR metadata
3. **Verify signature** - Check Ed25519 signature
4. **Validate hashes** - Verify content integrity
5. **Check capabilities** - Ensure compatible capability
6. **Load flows** - Parse YAML flow definitions
7. **Instantiate components** - Load WASM modules
8. **Register** - Add to runtime registry

### Component Operation Splitting

When flows reference a WASM component with an operation (e.g., `component-templates.render`), the pack compiler stores the full `"component-id.operation"` string as a single component ID in the manifest. At runtime, the loader splits this value on the **last dot** to extract the component ID and the operation name separately.

For example, a flow node referencing `component-templates.render`:

- **Stored in manifest**: `"component-templates.render"` (single key)
- **Runtime resolution**: splits into component `component-templates` and operation `render`

This splitting strategy uses the last dot as the delimiter, which allows component IDs themselves to contain dots without ambiguity. The runtime then looks up the component by its extracted ID and invokes the specified operation on the loaded WASM module.

```
Manifest key                          Component ID              Operation
─────────────────────────────────     ───────────────────────   ──────────
component-templates.render        →   component-templates       render
component-llm-openai.chat         →   component-llm-openai      chat
org.custom.my-tool.execute        →   org.custom.my-tool        execute
```

This behavior is transparent to flow authors -- flows simply reference `component-id.operation` in node configuration, and the pack compiler and runtime handle the rest.

## CLI Reference

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

## Next Steps

- [WIT Interfaces](/greentic-docs/reference/wit-interfaces/)
- [Building Packs](/greentic-docs/cli/building-packs/)
