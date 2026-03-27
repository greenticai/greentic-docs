---
title: Pack-Format
description: Technische Spezifikation für `.gtpack`-Archive
---

## Überblick

Eine `.gtpack`-Datei ist ein signiertes Archiv, das Flows, Komponenten und Assets für Greentic enthält.

## Dateistruktur

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

## Manifest-Schema

Die Datei `manifest.cbor` enthält Pack-Metadaten im CBOR-Format:

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

## `pack.toml`-Spezifikation

### Vollständiges Schema

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

## Capability-IDs

Standard-Capability-Identifikatoren:

| Capability ID | Zweck |
|---------------|-------|
| `greentic.cap.app.v1` | Application-Pack |
| `greentic.cap.messaging.provider.v1` | Messaging-Provider |
| `greentic.cap.events.provider.v1` | Events-Provider |
| `greentic.cap.component.v1` | Wiederverwendbare Komponente |
| `greentic.cap.tool.v1` | MCP-Tool |

## Content-Hashing

Alle Pack-Inhalte werden mit BLAKE3 gehasht:

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

## Signaturformat

Packs werden mit Ed25519 signiert:

```
signature.sig:
- Algorithm: Ed25519
- Message: content_hash
- Format: Raw 64-byte signature
```

Verifizierung:

```rust
let public_key = load_public_key("publisher.pub");
let signature = pack.read_signature();
let content_hash = pack.compute_content_hash();

verify(&public_key, content_hash, signature)?;
```

## SBOM-Format

Software Bill of Materials im SPDX-JSON-Format:

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

## Komprimierung

Pack-Inhalte werden mit zstd auf Level 3 komprimiert:

```rust
let compressed = zstd::encode_all(contents, 3)?;
```

## Versionskompatibilität

Die Version des Pack-Formats wird im Manifest gespeichert:

```rust
struct PackManifest {
    pack_format_version: u32,  // Currently: 1
    // ...
}
```

## Laden von Packs

Prozess zum Laden eines Packs zur Laufzeit:

1. **Archiv entpacken** - zstd dekomprimieren
2. **Manifest parsen** - CBOR-Metadaten dekodieren
3. **Signatur verifizieren** - Ed25519-Signatur prüfen
4. **Hashes validieren** - Integrität des Inhalts verifizieren
5. **Capabilities prüfen** - Kompatible Capability sicherstellen
6. **Flows laden** - YAML-Flow-Definitionen parsen
7. **Komponenten instanziieren** - WASM-Module laden
8. **Registrieren** - Zur Runtime-Registry hinzufügen

### Aufteilung von Komponentenoperationen

Wenn Flows auf eine WASM-Komponente mit einer Operation verweisen, z. B. `component-templates.render`, speichert der Pack-Compiler im Manifest den vollständigen String `"component-id.operation"` als einzelne Komponenten-ID. Zur Laufzeit teilt der Loader diesen Wert am **letzten Punkt**, um die Komponenten-ID und den Operationsnamen getrennt zu extrahieren.

Zum Beispiel bei einem Flow-Knoten, der auf `component-templates.render` verweist:

- **Im Manifest gespeichert**: `"component-templates.render"` (einzelner Schlüssel)
- **Runtime-Auflösung**: wird in die Komponente `component-templates` und die Operation `render` aufgeteilt

Diese Aufteilungsstrategie verwendet den letzten Punkt als Trennzeichen. Dadurch können Komponenten-IDs selbst Punkte enthalten, ohne Mehrdeutigkeit zu erzeugen. Die Runtime sucht die Komponente dann anhand ihrer extrahierten ID und ruft die angegebene Operation auf dem geladenen WASM-Modul auf.

```
Manifest key                          Component ID              Operation
─────────────────────────────────     ───────────────────────   ──────────
component-templates.render        →   component-templates       render
component-llm-openai.chat         →   component-llm-openai      chat
org.custom.my-tool.execute        →   org.custom.my-tool        execute
```

Dieses Verhalten ist für Flow-Autoren transparent. Flows verweisen in der Knotenkonfiguration einfach auf `component-id.operation`, und der Pack-Compiler sowie die Runtime übernehmen den Rest.

## CLI-Referenz

```bash
# Build pack
greentic-pack build ./my-pack --output my-feature.gtpack

# Sign pack
greentic-pack sign my-feature.gtpack --key signing-key.pem

# Verify pack
greentic-pack verify my-feature.gtpack --pubkey publisher.pub

# Inspect pack
greentic-pack info my-feature.gtpack
```
