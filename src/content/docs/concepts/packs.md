---
title: Packs
description: Understanding Greentic packs - signed archives for distributing flows and components
---

import { Aside, FileTree } from '@astrojs/starlight/components';

## What is a Pack?

A **Pack** is a signed `.gtpack` archive that contains everything needed to deploy a feature or provider:

- Flows (`.ygtc` files)
- WASM components
- Assets (images, templates, etc.)
- Metadata (SBOM, signatures)

Packs are the primary distribution unit in Greentic, enabling:
- **Portability** - Ship complete features as single files
- **Security** - Signed and verified before execution
- **Versioning** - Semantic versioning for dependencies

## Pack Structure

<FileTree>
- my-feature.gtpack
  - manifest.cbor (Pack metadata)
  - flows/
    - main.ygtc
    - helpers.ygtc
  - components/
    - processor.wasm
  - assets/
    - templates/
      - welcome.hbs
    - cards/
      - greeting.json
  - sbom.json (Software Bill of Materials)
  - signature.sig (Ed25519 signature)
</FileTree>

## Creating a Pack

### Directory Structure

First, create a pack directory:

```bash
mkdir -p my-pack/{flows,components,assets}
```

### Pack Manifest

Create a `pack.toml` or `pack.yaml` manifest:

```toml title="pack.toml"
[pack]
name = "my-feature"
version = "1.0.0"
description = "A feature pack for handling customer inquiries"
authors = ["Your Name <you@example.com>"]

[capabilities]
id = "greentic.cap.app.v1"
provides = ["customer-service"]

[dependencies]
greentic-templates = "^0.4"

[flows]
main = "flows/main.ygtc"
setup = "flows/setup.ygtc"

[components]
processor = "components/processor.wasm"

[assets]
templates = "assets/templates/"
cards = "assets/cards/"
```

### Build the Pack

Use the pack builder CLI:

```bash
# Build the pack
greentic-pack build ./my-pack

# Or with the GTC CLI
gtc pack build ./my-pack

# Output: my-feature-1.0.0.gtpack
```

### Sign the Pack

Packs are signed with Ed25519 keys:

```bash
# Generate a signing key (one-time)
greentic-pack keygen --output my-key.pem

# Sign the pack
greentic-pack sign my-feature-1.0.0.gtpack --key my-key.pem

# Verify signature
greentic-pack verify my-feature-1.0.0.gtpack --pubkey my-key.pub
```

## Pack Types

### Provider Packs

Provider packs implement messaging or event integrations:

```toml title="messaging-telegram.gtpack/pack.toml"
[pack]
name = "messaging-telegram"
version = "1.0.0"
description = "Telegram messaging provider"

[capabilities]
id = "greentic.cap.messaging.provider.v1"
provides = ["telegram"]

[flows]
setup_default = "flows/setup.ygtc"
verify_webhooks = "flows/verify.ygtc"

[components]
ingress = "components/ingress.wasm"
egress = "components/egress.wasm"
operator = "components/operator.wasm"

[secrets]
required = ["telegram_bot_token"]
optional = ["public_base_url"]
```

### Application Packs

Application packs contain business logic:

```toml title="customer-service.gtpack/pack.toml"
[pack]
name = "customer-service"
version = "1.0.0"
description = "Customer service bot application"

[capabilities]
id = "greentic.cap.app.v1"
provides = ["customer-service"]

[dependencies]
greentic-templates = "^0.4"
greentic-llm-openai = "^0.4"

[flows]
on_message = "flows/on_message.ygtc"
on_escalation = "flows/escalation.ygtc"

[assets]
cards = "assets/cards/"
```

### Component Packs

Component packs provide reusable WASM components:

```toml title="llm-openai.gtpack/pack.toml"
[pack]
name = "llm-openai"
version = "0.4.0"
description = "OpenAI LLM component"

[capabilities]
id = "greentic.cap.component.v1"
provides = ["llm"]

[components]
llm = "components/llm-openai.wasm"

[config]
default_model = "gpt-4"
max_tokens = 4096
```

## Using Packs

### In a Bundle

Reference packs in your bundle configuration:

```yaml title="greentic.demo.yaml"
providers:
  messaging-telegram:
    pack: "providers/messaging/messaging-telegram.gtpack"
    setup_flow: "setup_default"
    verify_flow: "verify_webhooks"

apps:
  customer-service:
    pack: "apps/customer-service.gtpack"
    default_flow: "on_message"
```

### Installing from Registry

Download packs from an OCI registry:

```bash
# Pull from registry
gtc pack pull ghcr.io/greentic/messaging-telegram:1.0.0

# Or specify in bundle
providers:
  messaging-telegram:
    pack: "oci://ghcr.io/greentic/messaging-telegram:1.0.0"
```

## Pack Validation

<Aside type="caution">
Always validate packs before deployment to catch issues early.
</Aside>

```bash
# Validate pack structure
greentic-pack validate ./my-pack.gtpack

# Validate flows within pack
greentic-flow doctor --pack ./my-pack.gtpack

# Full verification (signature + content)
greentic-pack verify --full ./my-pack.gtpack
```

## Pack Metadata (CBOR)

Pack metadata is stored in CBOR format for efficiency:

```rust
// manifest.cbor structure
struct PackManifest {
    name: String,
    version: String,
    description: String,
    capabilities: Capabilities,
    flows: HashMap<String, FlowEntry>,
    components: HashMap<String, ComponentEntry>,
    assets: HashMap<String, AssetEntry>,
    dependencies: HashMap<String, VersionReq>,
    signatures: Vec<Signature>,
}
```

## Security Considerations

### Content Hashing

All pack contents are hashed with BLAKE3:

```
pack-hash = blake3(
    manifest_hash ||
    flows_hash ||
    components_hash ||
    assets_hash
)
```

### Signature Verification

Packs are signed and verified with Ed25519:

```bash
# Verification happens automatically during loading
# Manual verification:
greentic-pack verify my-pack.gtpack --pubkey trusted-keys/publisher.pub
```

### Trusted Publishers

Configure trusted publishers in your runtime:

```yaml title="greentic.toml"
[security]
trusted_publishers = [
    "greentic-official.pub",
    "my-org.pub"
]
reject_unsigned = true
```

## Best Practices

1. **Version semantically** - Use semver for compatibility tracking
2. **Document dependencies** - List all required capabilities
3. **Include SBOM** - Software Bill of Materials for security audits
4. **Sign all releases** - Never deploy unsigned packs in production
5. **Test before publishing** - Validate flows and components
6. **Keep packs focused** - One feature or provider per pack

## Next Steps

- [Components](/greentic-docs/concepts/components/) - Build WASM components for packs
- [Building Packs](/greentic-docs/cli/building-packs/) - CLI commands for pack management
- [Pack Format Reference](/greentic-docs/reference/pack-format/) - Complete specification
