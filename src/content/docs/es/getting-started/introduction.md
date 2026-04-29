---
title: Introducción a Greentic
description: Aprende sobre Greentic, la plataforma basada en componentes WASM para trabajadores digitales impulsados por AI
---

## ¿Qué es Greentic?

Greentic es una **plataforma multi-tenant basada en componentes WASM** para crear y ejecutar trabajadores digitales impulsados por AI. Estos trabajadores digitales son pipelines autónomos de automatización agentic que pueden manejar flujos de trabajo complejos a través de múltiples canales y servicios.

## Características principales

### Arquitectura centrada en WebAssembly

Greentic usa **WebAssembly (WASI Preview 2)** para la ejecución aislada y portátil de:
- Nodes de flow
- Providers de mensajería
- Providers de eventos
- Herramientas MCP

Esto significa que los componentes son:
- **Portátiles** - Escribe una vez, ejecuta en cualquier lugar
- **Seguros** - Entorno de ejecución aislado
- **Rápidos** - Rendimiento cercano al nativo
- **Independientes del lenguaje** - Crea en Rust, Go o cualquier lenguaje compatible con WASM

### Multi-Tenant por diseño

Cada aspecto de Greentic está diseñado para multi-tenancy:
- **TenantCtx** - El contexto del tenant fluye a través de todas las operaciones
- **Sesiones aisladas** - Los datos de cada tenant están completamente aislados
- **Despliegue flexible** - Configuraciones single-tenant o multi-tenant

### Orquestación basada en flows

Los flujos de trabajo se definen como **grafos dirigidos** en archivos YAML (`.ygtc`):
- Definiciones visuales y declarativas de pipelines
- Componentes node componibles
- Flujo de control con ramas y condiciones
- Sesiones reanudables

## Componentes de la plataforma

| Componente | Propósito |
|-----------|-----------|
| **greentic-runner** | Runtime host de producción |
| **greentic-flow** | Esquema de flow, IR, cargador, validador |
| **greentic-pack** | CLI de construcción de packs |
| **greentic-component** | CLI de creación de componentes |
| **greentic-mcp** | Ejecutor MCP / puente WASI |

## Stack tecnológico

| Aspecto | Tecnología |
|--------|------------|
| Lenguaje | Rust (edition 2024) |
| Runtime asíncrono | Tokio v1 |
| Runtime WASM | Wasmtime v41 |
| Target WASM | `wasm32-wasip2` |
| Servidor HTTP | Axum v0.8 |
| Enrutamiento de mensajes | Enrutamiento interno del runtime |
| Serialización | serde + CBOR + YAML |

## Casos de uso

Greentic destaca para crear:

1. **Bots de atención al cliente** - Soporte multicanal en Slack, Teams, WhatsApp
2. **Automatización de helpdesk de IT** - Enrutamiento de tickets, restablecimiento de contraseñas, consultas de estado
3. **Asistentes de RR. HH.** - Solicitudes de permisos, consultas de políticas, flujos de onboarding
4. **Automatización de ventas** - Calificación de leads, integración con CRM
5. **Flujos de trabajo impulsados por eventos** - Manejadores de webhooks, tareas programadas, notificaciones

## Siguientes pasos

- [Guía de inicio rápido](/es/getting-started/quick-start/) - Pon en marcha tu primer trabajador digital
- [Instalación](/es/getting-started/installation/) - Instrucciones detalladas de instalación
- [Resumen de la arquitectura](/es/concepts/architecture/) - Profundiza en la arquitectura de la plataforma
