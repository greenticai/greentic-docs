---
title: Pengenalan Greentic
description: Pelajari tentang Greentic, platform berbasis komponen WASM untuk digital worker berbasis AI
---

## Apa itu Greentic?

Greentic adalah **platform multi-tenant berbasis komponen WASM** untuk membangun dan menjalankan digital worker berbasis AI. Digital worker ini adalah pipeline otomasi agentic otonom yang dapat menangani workflow kompleks di berbagai channel dan layanan.

## Karakteristik Utama

### Arsitektur WebAssembly-First

Greentic menggunakan **WebAssembly (WASI Preview 2)** untuk eksekusi yang ter-sandbox dan portabel:
- Node flow
- Provider messaging
- Provider event
- Tool MCP

Ini berarti komponen bersifat:
- **Portabel** - Tulis sekali, jalankan di mana saja
- **Aman** - Lingkungan eksekusi ter-sandbox
- **Cepat** - Performa mendekati native
- **Agnostik bahasa** - Bangun dengan Rust, Go, atau bahasa apapun yang kompatibel dengan WASM

### Multi-Tenant secara Desain

Setiap aspek Greentic dirancang untuk multi-tenancy:
- **TenantCtx** - Konteks tenant mengalir melalui semua operasi
- **Sesi terisolasi** - Data setiap tenant terisolasi sepenuhnya
- **Deployment fleksibel** - Konfigurasi single-tenant atau multi-tenant

### Orkestrasi Berbasis Flow

Workflow didefinisikan sebagai **graf berarah** dalam file YAML (`.ygtc`):
- Definisi pipeline visual dan deklaratif
- Komponen node yang dapat dikomposisi
- Control flow dengan percabangan dan kondisi
- Sesi yang dapat dilanjutkan

## Komponen Platform

| Komponen | Fungsi |
|----------|--------|
| **greentic-runner** | Host runtime produksi |
| **greentic-flow** | Skema flow, IR, loader, validator |
| **greentic-pack** | CLI pembangun pack |
| **greentic-component** | CLI pembuatan komponen |
| **greentic-mcp** | Eksekutor MCP / bridge WASI |

## Tech Stack

| Aspek | Teknologi |
|-------|-----------|
| Bahasa | Rust (edisi 2024) |
| Async Runtime | Tokio v1 |
| WASM Runtime | Wasmtime v41 |
| WASM Target | `wasm32-wasip2` |
| HTTP Server | Axum v0.8 |
| Messaging Bus | NATS |
| Serialisasi | serde + CBOR + YAML |

## Kasus Penggunaan

Greentic unggul dalam membangun:

1. **Bot Layanan Pelanggan** - Dukungan multi-channel melalui Slack, Teams, WhatsApp
2. **Otomasi Helpdesk IT** - Routing tiket, reset password, query status
3. **Asisten HR** - Permintaan cuti, query kebijakan, workflow onboarding
4. **Otomasi Sales** - Kualifikasi lead, integrasi CRM
5. **Workflow Berbasis Event** - Handler webhook, tugas terjadwal, notifikasi

## Langkah Selanjutnya

- [Panduan Mulai Cepat](/id/getting-started/quick-start/) - Jalankan digital worker pertama Anda
- [Instalasi](/id/getting-started/installation/) - Instruksi instalasi lengkap
- [Ikhtisar Arsitektur](/id/concepts/architecture/) - Pelajari arsitektur platform secara mendalam
