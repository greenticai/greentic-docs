---
title: I18nId-Spezifikation
description: Deterministische Spezifikation für Internationalisierungs-IDs
---

## Überblick

Die Spezifikation **I18nId v1** definiert, wie Zeichenfolgen für die Internationalisierung in deterministische, kollisionsresistente Kennungen umgewandelt werden.

## Format

```
i18n:v1:<hash>
```

Dabei gilt:
- `i18n` - Protokollkennung
- `v1` - Spezifikationsversion
- `<hash>` - BLAKE3-Hash der normalisierten Zeichenfolge (hex-kodiert, 16 Zeichen)

## Beispiele

| Quellzeichenfolge | I18nId |
|---------------|--------|
| "Hello" | `i18n:v1:a5b9c3d7e8f0` |
| "Hello, World!" | `i18n:v1:b6c8d4e9f1a2` |
| "  Hello  " | `i18n:v1:a5b9c3d7e8f0` (gleich nach der Normalisierung) |

## Normalisierung

Vor dem Hashing werden Zeichenfolgen normalisiert:

1. **Leerraum trimmen** - Führende und nachgestellte Leerzeichen entfernen
2. **Internen Leerraum zusammenfassen** - Mehrere Leerzeichen → ein Leerzeichen
3. **Unicode-Normalisierung** - NFC-Form
4. **Kleinschreibung** (optional, konfigurierbar)

```rust
fn normalize(input: &str) -> String {
    input
        .trim()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
```

## Hash-Generierung

```rust
use blake3::Hasher;

fn generate_i18n_id(text: &str) -> String {
    let normalized = normalize(text);
    let hash = blake3::hash(normalized.as_bytes());
    let hex = hex::encode(&hash.as_bytes()[..8]); // First 8 bytes = 16 hex chars
    format!("i18n:v1:{}", hex)
}
```

## Eigenschaften

### Deterministisch

Dieselbe Eingabe erzeugt immer dieselbe Ausgabe:

```rust
assert_eq!(
    generate_i18n_id("Hello"),
    generate_i18n_id("Hello")
);
```

### Kollisionsresistent

BLAKE3 mit 64 Bit bietet etwa `2^32` Birthday-Resistance und ist für die meisten Anwendungen geeignet.

### Stabil

IDs bleiben stabil über:
- Verschiedene Plattformen
- Verschiedene Programmiersprachen
- Verschiedene Versionen (innerhalb von v1)

## Verwendung in Greentic

### Flow-Nachrichten

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

### Templates

```handlebars
{{t "i18n:v1:a5b9c3d7e8f0"}}
```

## CLI-Tools

### ID generieren

```bash
greentic-i18n id "Hello, World!"
# Output: i18n:v1:b6c8d4e9f1a2
```

### ID verifizieren

```bash
greentic-i18n verify "i18n:v1:b6c8d4e9f1a2" "Hello, World!"
# Output: Valid
```

## Migration aus anderen Systemen

### Von schlüsselbasierten Systemen

```json
// Before
{ "greeting.hello": "Hello" }

// After (auto-migration)
{ "i18n:v1:a5b9c3d7e8f0": "Hello" }
```

### Migrationsskript

```bash
greentic-i18n migrate ./old-translations.json --output ./new-translations.json
```

## Best Practices

1. **Verwenden Sie immer die CLI**, um IDs zu generieren
2. **Ändern Sie IDs nicht manuell** - neu generieren, wenn sich die Quelle ändert
3. **Speichern Sie Quellzeichenfolgen** zusammen mit Übersetzungen als Referenz
4. **Versionieren Sie Ihre Übersetzungsdateien** - ermöglicht Rollbacks
5. **Testen Sie mit mehreren Locales** - fehlende Übersetzungen früh erkennen

## Nächste Schritte

- [Übersetzung von Cards](/de/i18n/cards-translation/)
- [i18n-Überblick](/de/i18n/overview/)
