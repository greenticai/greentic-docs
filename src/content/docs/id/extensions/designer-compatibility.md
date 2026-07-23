---
title: Kompatibilitas Designer
description: Versi Designer mana memuat apiVersion describe.json mana, mengapa extension yang baru dibangun bisa tidak muncul di Designer, dan bagaimana gtdx doctor melaporkan ketidakcocokannya.
---

Extension yang baru saja Anda bangun bisa terpasang dengan benar, lolos setiap
pemeriksaan lokal, namun tetap tidak pernah muncul di Designer. Penyebabnya hampir
selalu ketidakcocokan kontrak: `gtdx` yang Anda pakai untuk scaffold menargetkan
kontrak `describe.json` yang lebih baru daripada Designer yang sedang berjalan.

Halaman ini berisi matriks versi, gejalanya, dan perbaikannya.

## Matriks

`describe.json` membawa sebuah `apiVersion`. Ada dua generasi, dan Designer mulai
mendukung yang kedua pada **1.2.0**.

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | dimuat | **dilewati saat boot** | `0.4.x` |
| `>= 1.2.0` | dimuat (dimigrasikan saat dibaca) | dimuat | `1.2.x` dan lebih baru |

`gtdx` versi terkini selalu men-scaffold `greentic.ai/v2`. Jadi kombinasi yang bermasalah
secara spesifik adalah: **SDK terkini melawan Designer yang lebih lama dari 1.2.0.**

Di atas gerbang kontrak ini, setiap extension mendeklarasikan rentang Designer yang
dibutuhkannya — `compat.min_designer_version` pada describe v2, atau
`engine.greenticDesigner` pada v1. Keduanya diperiksa.

## Gejala

Extension hilang dari `/api/extensions` dan tidak ada di UI. Pada stderr saat boot,
Designer mencatat satu baris untuk tiap extension yang dilewati:

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

Build Designer yang lebih lama mencetak versi baris yang lebih pendek — `built for a
newer designer` — tanpa menyertakan versi. Jika itu yang Anda lihat, Anda berada pada
build yang mendahului pesan yang diperbaiki, dan halaman ini adalah bagian yang hilang.

## Diagnosis dengan `gtdx doctor`

`gtdx doctor` memeriksa extension yang terpasang terhadap Designer yang benar-benar Anda
miliki, sehingga Anda tahu sebelum menyusuri log boot:

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

Versi Designer diambil dari `greentic-designer --version`, yang didukung setiap lineage
hingga 1.1.x. Jika Anda menjalankan Designer dari checkout alih-alih dari `PATH`,
arahkan doctor ke build tersebut:

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

Bila Designer tidak ditemukan, pemeriksaan melaporkannya lalu melanjutkan — itu bukan
kegagalan.

Anda tidak perlu ingat untuk menjalankannya. `gtdx dev` dan `gtdx install` menjalankan
pemeriksaan yang sama begitu selesai memasang, sehingga Designer yang tidak akan memuat
apa yang baru Anda bangun akan memberitahukannya tepat di tempat Anda sedang melihat:

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## Perbaikan

**Tingkatkan Designer ke 1.2.0 atau lebih baru.** Itulah jalur yang didukung.

Secara sengaja tidak ada flag untuk membuat `gtdx` terkini memancarkan describe v1.
Menurunkan kontrak berarti memelihara dua bentuk describe tanpa batas waktu, dan tetap
akan salah merepresentasikan extension yang benar-benar bergantung pada fitur v2. Jika
Anda terpaku pada Designer lama karena alasan yang tidak bisa diubah, sematkan SDK agar
sesuai (`greentic-extension-sdk-* 0.4.x`) alih-alih menurunkan keluaran dari SDK yang
lebih baru.

## Alasan lain sebuah extension dilewati

Tidak setiap extension yang dilewati adalah masalah versi. Designer juga menyaring
instalasi yang tidak dapat dipakainya:

| Pesan boot | Penyebab | Perbaikan |
|------------|----------|-----------|
| `incomplete install (missing runtime component)` | `describe.json` menunjuk ke berkas komponen runtime yang tidak ada | Bangun ulang dan pasang ulang: `gtdx dev --once` |
| `runtime artifact unavailable` | Berkas komponen ada tetapi bukan komponen WASM — biasanya stub placeholder atau arsip yang belum diekstrak | Bangun ulang: `gtdx dev --once --release` |

## Lihat juga

- [gtdx CLI](/id/extensions/gtdx-cli/) — referensi perintah lengkap
- [Menulis Extension](/id/extensions/writing-extensions/) — jalur authoring menyeluruh
