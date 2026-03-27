---
title: Formato de Pack
description: Especificación técnica para archivos .gtpack
---

## Resumen

Un archivo `.gtpack` es un archivo firmado que contiene flows, componentes y recursos para Greentic.

## Estructura de Archivo

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

## Esquema de Manifest

El archivo `manifest.cbor` contiene los metadatos del pack en formato CBOR:

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

## Especificación de pack.toml

### Esquema Completo

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

## IDs de Capability

Identificadores estándar de capability:

| ID de Capability | Propósito |
|---------------|---------|
| `greentic.cap.app.v1` | Pack de aplicación |
| `greentic.cap.messaging.provider.v1` | Proveedor de mensajería |
| `greentic.cap.events.provider.v1` | Proveedor de eventos |
| `greentic.cap.component.v1` | Componente reutilizable |
| `greentic.cap.tool.v1` | Herramienta MCP |

## Hashing de Contenido

Todo el contenido del pack se resume con BLAKE3:

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

## Formato de Firma

Los packs se firman con Ed25519:

```
signature.sig:
- Algorithm: Ed25519
- Message: content_hash
- Format: Raw 64-byte signature
```

Verificación:

```rust
let public_key = load_public_key("publisher.pub");
let signature = pack.read_signature();
let content_hash = pack.compute_content_hash();

verify(&public_key, content_hash, signature)?;
```

## Formato SBOM

Software Bill of Materials en formato SPDX JSON:

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

## Compresión

El contenido del pack se comprime con zstd en nivel 3:

```rust
let compressed = zstd::encode_all(contents, 3)?;
```

## Compatibilidad de Versiones

La versión del formato de pack se almacena en el manifest:

```rust
struct PackManifest {
    pack_format_version: u32,  // Currently: 1
    // ...
}
```

## Carga de Packs

Proceso de carga de packs en runtime:

1. **Extract archive** - Descomprimir zstd
2. **Parse manifest** - Decodificar metadatos CBOR
3. **Verify signature** - Comprobar firma Ed25519
4. **Validate hashes** - Verificar integridad del contenido
5. **Check capabilities** - Asegurar capability compatible
6. **Load flows** - Analizar definiciones de flow YAML
7. **Instantiate components** - Cargar módulos WASM
8. **Register** - Añadir al registro de runtime

### División de Operaciones de Componentes

Cuando los flows hacen referencia a un componente WASM con una operación (por ejemplo, `component-templates.render`), el compilador de packs almacena la cadena completa `"component-id.operation"` como un único ID de componente en el manifest. En runtime, el cargador divide este valor en el **último punto** para extraer por separado el ID del componente y el nombre de la operación.

Por ejemplo, un nodo de flow que hace referencia a `component-templates.render`:

- **Stored in manifest**: `"component-templates.render"` (clave única)
- **Runtime resolution**: se divide en el componente `component-templates` y la operación `render`

Esta estrategia de división usa el último punto como delimitador, lo que permite que los propios IDs de componente contengan puntos sin ambigüedad. Luego, el runtime busca el componente por su ID extraído e invoca la operación especificada en el módulo WASM cargado.

```
Manifest key                          Component ID              Operation
─────────────────────────────────     ───────────────────────   ──────────
component-templates.render        →   component-templates       render
component-llm-openai.chat         →   component-llm-openai      chat
org.custom.my-tool.execute        →   org.custom.my-tool        execute
```

Este comportamiento es transparente para los autores de flows; los flows simplemente hacen referencia a `component-id.operation` en la configuración del nodo, y el compilador de packs y el runtime se encargan del resto.

## Referencia de CLI

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

## Siguientes Pasos

- [Interfaces WIT](/es/reference/wit-interfaces/)
- [Compilar Packs](/es/cli/building-packs/)
