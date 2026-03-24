---
title: Building Packs
description: Create, build, and manage Greentic packs
---

import { Aside, FileTree, Steps } from '@astrojs/starlight/components';

## Overview

Packs are the distribution unit in Greentic. This guide covers creating, building, signing, and publishing packs using the CLI tools.

## Pack CLI Commands

### gtc pack

```bash
gtc pack <COMMAND>

Commands:
  build     Build a pack from source directory
  verify    Verify pack signature and contents
  info      Display pack metadata
  extract   Extract pack contents
  sign      Sign a pack
  publish   Publish pack to registry
```

## Creating a Pack

<Steps>

1. **Create pack directory structure**

   ```bash
   mkdir -p my-pack/{flows,components,assets}
   ```

2. **Create pack manifest**

   ```toml title="my-pack/pack.toml"
   [pack]
   name = "my-feature"
   version = "1.0.0"
   description = "My awesome feature pack"
   authors = ["Your Name <you@example.com>"]

   [capabilities]
   id = "greentic.cap.app.v1"
   provides = ["my-feature"]

   [flows]
   main = "flows/main.ygtc"

   [components]
   processor = "components/processor.wasm"

   [assets]
   templates = "assets/templates/"
   ```

3. **Add flows**

   ```yaml title="my-pack/flows/main.ygtc"
   name: main
   version: "1.0"
   description: Main flow

   nodes:
     - id: process
       type: reply
       config:
         message: "Hello from my pack!"

   triggers:
     - type: message
       target: process
   ```

4. **Add components** (if any)

   Build WASM components and place in `components/`:

   ```bash
   cd my-component
   cargo build --target wasm32-wasip2 --release
   cp target/wasm32-wasip2/release/my_component.wasm ../my-pack/components/
   ```

</Steps>

## Building Packs

### Basic Build

```bash
gtc pack build ./my-pack

# Output: my-feature-1.0.0.gtpack
```

### Build with Options

```bash
# Specify output path
gtc pack build ./my-pack --output ./dist/my-feature.gtpack

# Skip WASM optimization
gtc pack build ./my-pack --no-optimize

# Include debug info
gtc pack build ./my-pack --debug
```

### Build Output

<FileTree>
- my-feature-1.0.0.gtpack
  - manifest.cbor
  - flows/
    - main.ygtc
  - components/
    - processor.wasm
  - assets/
    - templates/
  - sbom.json
</FileTree>

## Signing Packs

<Aside type="caution">
Always sign packs before distribution. Unsigned packs may be rejected by the runtime in production.
</Aside>

### Generate Signing Key

```bash
# Generate new Ed25519 key pair
gtc pack keygen --output my-signing-key

# Creates:
# - my-signing-key.pem (private key - keep secret!)
# - my-signing-key.pub (public key - distribute)
```

### Sign a Pack

```bash
gtc pack sign my-feature-1.0.0.gtpack --key my-signing-key.pem

# Output: my-feature-1.0.0.gtpack (updated with signature)
```

### Verify Signature

```bash
gtc pack verify my-feature-1.0.0.gtpack --pubkey my-signing-key.pub

# Output: Signature valid
```

## Pack Inspection

### View Metadata

```bash
gtc pack info my-feature-1.0.0.gtpack
```

Output:
```
Pack: my-feature
Version: 1.0.0
Description: My awesome feature pack
Authors: Your Name <you@example.com>

Capabilities:
  ID: greentic.cap.app.v1
  Provides: my-feature

Contents:
  Flows: 1
  Components: 1
  Assets: 2 directories

Signature: Valid (signed by: ABC123...)
```

### List Contents

```bash
gtc pack info my-feature-1.0.0.gtpack --list

# Lists all files in the pack
```

### Extract Pack

```bash
gtc pack extract my-feature-1.0.0.gtpack --output ./extracted/

# Extracts pack contents for inspection
```

## Flow Validation

### Validate Flows

```bash
# Validate all flows in a directory
gtc flow doctor ./my-pack/flows/

# Validate specific flow
gtc flow validate ./my-pack/flows/main.ygtc
```

### Doctor Output

```bash
gtc flow doctor ./flows/

# Output:
# Checking flows/main.ygtc... OK
# Checking flows/helper.ygtc... OK
#
# 2 flows checked, 0 errors, 0 warnings
```

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Unknown node type` | Invalid node type | Check available node types |
| `Missing target node` | Edge points to non-existent node | Fix node ID reference |
| `Circular dependency` | Nodes form a cycle | Break the cycle |
| `No trigger defined` | Flow has no entry point | Add a trigger |

## Publishing Packs

### Publish to OCI Registry

```bash
# Login to registry
gtc pack login ghcr.io --username USER --password TOKEN

# Publish pack
gtc pack publish my-feature-1.0.0.gtpack --registry ghcr.io/greentic
```

### Pull from Registry

```bash
gtc pack pull ghcr.io/greentic/my-feature:1.0.0
```

### Use in Bundle

```yaml title="greentic.demo.yaml"
apps:
  my-app:
    pack: "oci://ghcr.io/greentic/my-feature:1.0.0"
```

## Pack Templates

### Provider Pack Template

```toml title="pack.toml"
[pack]
name = "messaging-custom"
version = "1.0.0"
description = "Custom messaging provider"

[capabilities]
id = "greentic.cap.messaging.provider.v1"
provides = ["custom"]

[flows]
setup_default = "flows/setup.ygtc"
verify_webhooks = "flows/verify.ygtc"

[components]
ingress = "components/ingress.wasm"
egress = "components/egress.wasm"
operator = "components/operator.wasm"

[secrets]
required = ["api_key"]
optional = ["webhook_secret"]
```

### Application Pack Template

```toml title="pack.toml"
[pack]
name = "helpdesk-bot"
version = "1.0.0"
description = "IT Helpdesk bot"

[capabilities]
id = "greentic.cap.app.v1"
provides = ["helpdesk"]

[dependencies]
greentic-templates = "^0.4"
greentic-llm-openai = "^0.4"

[flows]
on_message = "flows/on_message.ygtc"
on_ticket = "flows/on_ticket.ygtc"

[assets]
cards = "assets/cards/"
templates = "assets/templates/"
```

## Best Practices

1. **Version semantically** - Use semver (MAJOR.MINOR.PATCH)
2. **Sign all releases** - Never distribute unsigned packs
3. **Include SBOM** - Document dependencies for security audits
4. **Test before publishing** - Validate flows and test components
5. **Document thoroughly** - Include README in pack
6. **Keep packs focused** - One feature or provider per pack
7. **Use CI/CD** - Automate build and publish

## CI/CD Example

```yaml title=".github/workflows/pack.yml"
name: Build and Publish Pack

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@1.90.0

      - name: Build Pack
        run: gtc pack build ./my-pack

      - name: Sign Pack
        run: |
          echo "${{ secrets.SIGNING_KEY }}" > key.pem
          gtc pack sign my-feature-*.gtpack --key key.pem

      - name: Publish
        run: |
          gtc pack login ghcr.io --username ${{ github.actor }} --password ${{ secrets.GITHUB_TOKEN }}
          gtc pack publish my-feature-*.gtpack --registry ghcr.io/${{ github.repository }}
```

## Next Steps

- [Pack Format Reference](/reference/pack-format/) - Complete specification
- [Flow Schema Reference](/reference/flow-schema/) - YAML schema
- [Components Guide](/concepts/components/) - Building WASM components
