---
title: Greentic の紹介
description: AI 駆動の digital worker 向け WASM-component-based platform、Greentic について学ぶ
---

## Greentic とは?

Greentic は、AI 駆動の digital worker を構築して実行するための **WASM-component-based, multi-tenant platform** です。これらの digital worker は、複数の channel と service にまたがる複雑な workflow を処理できる、自律的な agentic automation pipeline です。

## 主な特徴

### WebAssembly-First アーキテクチャ

Greentic は、次を sandboxed かつ portable に実行するために **WebAssembly (WASI Preview 2)** を使用します:
- flow node
- messaging provider
- event provider
- MCP tool

これは component が次の性質を持つことを意味します:
- **Portable** - 一度書けばどこでも動く
- **Secure** - sandboxed execution environment
- **Fast** - ネイティブに近い performance
- **Language-agnostic** - Rust、Go、または任意の WASM-compatible language で構築できる

### 設計段階からの Multi-Tenant

Greentic のあらゆる側面は multi-tenancy を前提に設計されています:
- **TenantCtx** - tenant context がすべての操作に渡って流れる
- **Isolated sessions** - 各 tenant の data は完全に分離される
- **Flexible deployment** - single-tenant または multi-tenant configuration

### Flow ベースのオーケストレーション

workflow は YAML file (`.ygtc`) 内の **directed graph** として定義されます:
- 視覚的で宣言的な pipeline definition
- composable な node component
- branch と condition による control flow
- 再開可能な session

## Platform Components

| Component | 用途 |
|-----------|------|
| **greentic-runner** | production runtime host |
| **greentic-flow** | flow schema、IR、loader、validator |
| **greentic-pack** | pack builder CLI |
| **greentic-component** | component authoring CLI |
| **greentic-mcp** | MCP executor / WASI bridge |

## Tech Stack

| Aspect | Technology |
|--------|------------|
| Language | Rust (edition 2024) |
| Async Runtime | Tokio v1 |
| WASM Runtime | Wasmtime v41 |
| WASM Target | `wasm32-wasip2` |
| HTTP Server | Axum v0.8 |
| Message Routing | Internal runtime routing |
| Serialization | serde + CBOR + YAML |

## Use Cases

Greentic が特に適しているもの:

1. **Customer Service Bots** - Slack、Teams、WhatsApp をまたぐ multi-channel support
2. **IT Helpdesk Automation** - ticket routing、password reset、status query
3. **HR Assistants** - 休暇申請、policy query、onboarding workflow
4. **Sales Automation** - lead qualification、CRM integration
5. **Event-Driven Workflows** - webhook handler、scheduled task、notification

## 次のステップ

- [Quick Start Guide](/ja/getting-started/quick-start/) - 最初の digital worker を動かす
- [Installation](/ja/getting-started/installation/) - 詳細なインストール手順
- [Architecture Overview](/ja/concepts/architecture/) - platform architecture を詳しく見る
