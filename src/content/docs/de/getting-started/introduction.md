---
title: Einführung in Greentic
description: Lernen Sie Greentic kennen, die WASM-komponentenbasierte Plattform für KI-gesteuerte digitale Worker
---

## Was ist Greentic?

Greentic ist eine **WASM-komponentenbasierte Multi-Tenant-Plattform** zum Erstellen und Ausführen KI-gesteuerter digitaler Worker. Diese digitalen Worker sind autonome agentische Automatisierungspipelines, die komplexe Workflows über mehrere Kanäle und Dienste hinweg abwickeln können.

## Wichtige Merkmale

### WebAssembly-First-Architektur

Greentic verwendet **WebAssembly (WASI Preview 2)** für die sandboxed, portable Ausführung von:
- Flow-Nodes
- Messaging-Providern
- Event-Providern
- MCP-Tools

Das bedeutet, dass Komponenten:
- **Portabel** - Einmal schreiben, überall ausführen
- **Sicher** - Isolierte Ausführungsumgebung
- **Schnell** - Nahezu native Performance
- **Sprachunabhängig** - In Rust, Go oder jeder WASM-kompatiblen Sprache gebaut werden können

### Multi-Tenancy by Design

Jeder Aspekt von Greentic ist für Multi-Tenancy ausgelegt:
- **TenantCtx** - Tenant-Kontext fließt durch alle Operationen
- **Isolierte Sessions** - Die Daten jedes Tenants sind vollständig isoliert
- **Flexible Deployments** - Single-Tenant- oder Multi-Tenant-Konfigurationen

### Flow-basierte Orchestrierung

Workflows werden als **gerichtete Graphen** in YAML-Dateien (`.ygtc`) definiert:
- Visuelle, deklarative Pipeline-Definitionen
- Komponierbare Node-Komponenten
- Kontrollfluss mit Verzweigungen und Bedingungen
- Wiederaufnehmbare Sessions

## Plattformkomponenten

| Komponente | Zweck |
|-----------|-------|
| **greentic-runner** | Produktions-Runtime-Host |
| **greentic-flow** | Flow-Schema, IR, Loader, Validator |
| **greentic-pack** | Pack-Builder-CLI |
| **greentic-component** | CLI zum Erstellen von Komponenten |
| **greentic-mcp** | MCP-Executor / WASI-Bridge |

## Tech-Stack

| Aspekt | Technologie |
|--------|------------|
| Sprache | Rust (edition 2024) |
| Async Runtime | Tokio v1 |
| WASM Runtime | Wasmtime v41 |
| WASM Target | `wasm32-wasip2` |
| HTTP Server | Axum v0.8 |
| Messaging Bus | NATS |
| Serialization | serde + CBOR + YAML |

## Anwendungsfälle

Greentic eignet sich besonders für den Bau von:

1. **Customer-Service-Bots** - Multi-Channel-Support über Slack, Teams, WhatsApp
2. **IT-Helpdesk-Automatisierung** - Ticket-Routing, Passwort-Resets, Statusabfragen
3. **HR-Assistenten** - Urlaubsanträge, Richtlinienabfragen, Onboarding-Workflows
4. **Sales-Automatisierung** - Lead-Qualifizierung, CRM-Integration
5. **Ereignisgesteuerte Workflows** - Webhook-Handler, geplante Aufgaben, Benachrichtigungen

## Nächste Schritte

- [Schnellstart-Anleitung](/de/getting-started/quick-start/) - Ihren ersten digitalen Worker starten
- [Installation](/de/getting-started/installation/) - Detaillierte Installationsanweisungen
- [Architekturüberblick](/de/concepts/architecture/) - Tiefer Einblick in die Plattformarchitektur
