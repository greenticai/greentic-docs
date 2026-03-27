---
title: Especificación de I18nId
description: Especificación determinista de identificadores de internacionalización
---

## Resumen

La especificación **I18nId v1** define cómo las cadenas se convierten en identificadores deterministas y resistentes a colisiones para internacionalización.

## Formato

```
i18n:v1:<hash>
```

Donde:
- `i18n` - Identificador del protocolo
- `v1` - Versión de la especificación
- `<hash>` - Hash BLAKE3 de la cadena normalizada (codificado en hex, 16 caracteres)

## Ejemplos

| Cadena de origen | I18nId |
|---------------|--------|
| "Hello" | `i18n:v1:a5b9c3d7e8f0` |
| "Hello, World!" | `i18n:v1:b6c8d4e9f1a2` |
| "  Hello  " | `i18n:v1:a5b9c3d7e8f0` (igual después de la normalización) |

## Normalización

Antes de generar el hash, las cadenas se normalizan:

1. **Recortar espacios** - Eliminar espacios al inicio y al final
2. **Colapsar espacios internos** - Varios espacios → un solo espacio
3. **Normalización Unicode** - Forma NFC
4. **Minúsculas** (opcional, configurable)

```rust
fn normalize(input: &str) -> String {
    input
        .trim()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
```

## Generación del hash

```rust
use blake3::Hasher;

fn generate_i18n_id(text: &str) -> String {
    let normalized = normalize(text);
    let hash = blake3::hash(normalized.as_bytes());
    let hex = hex::encode(&hash.as_bytes()[..8]); // First 8 bytes = 16 hex chars
    format!("i18n:v1:{}", hex)
}
```

## Propiedades

### Determinista

La misma entrada siempre produce la misma salida:

```rust
assert_eq!(
    generate_i18n_id("Hello"),
    generate_i18n_id("Hello")
);
```

### Resistente a colisiones

BLAKE3 con 64 bits proporciona una resistencia de cumpleaños de ~2^32, adecuada para la mayoría de las aplicaciones.

### Estable

Los IDs se mantienen estables entre:
- Diferentes plataformas
- Diferentes lenguajes de programación
- Diferentes versiones (dentro de v1)

## Uso en Greentic

### Mensajes de flujo

```yaml
- id: greet
  type: reply
  config:
    message_key: "i18n:v1:a5b9c3d7e8f0"
```

### Tarjetas

```json
{
  "type": "TextBlock",
  "text": "{{i18n:i18n:v1:a5b9c3d7e8f0}}"
}
```

### Plantillas

```handlebars
{{t "i18n:v1:a5b9c3d7e8f0"}}
```

## Herramientas CLI

### Generar ID

```bash
greentic-i18n id "Hello, World!"
# Output: i18n:v1:b6c8d4e9f1a2
```

### Verificar ID

```bash
greentic-i18n verify "i18n:v1:b6c8d4e9f1a2" "Hello, World!"
# Output: Valid
```

## Migración desde otros sistemas

### Desde claves

```json
// Before
{ "greeting.hello": "Hello" }

// After (auto-migration)
{ "i18n:v1:a5b9c3d7e8f0": "Hello" }
```

### Script de migración

```bash
greentic-i18n migrate ./old-translations.json --output ./new-translations.json
```

## Buenas prácticas

1. **Usa siempre el CLI** para generar IDs
2. **No modifiques los IDs manualmente** - regénéralos si cambia el origen
3. **Guarda las cadenas fuente** junto con las traducciones como referencia
4. **Versiona tus archivos de traducción** - permite hacer rollback
5. **Prueba con múltiples locales** - detecta traducciones faltantes

## Próximos pasos

- [Traducción de Tarjetas](/es/i18n/cards-translation/)
- [Resumen de i18n](/es/i18n/overview/)
