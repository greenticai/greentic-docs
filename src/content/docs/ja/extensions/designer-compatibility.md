---
title: Designer 互換性
description: どの Designer バージョンがどの describe.json の apiVersion を読み込むか、ビルドしたての拡張機能が Designer に表示されないことがある理由、そして gtdx doctor が不一致をどう報告するか。
---

ビルドしたばかりの拡張機能が正しくインストールされ、すべてのローカルチェックに合格しても、
Designer にまったく表示されないことがあります。原因はほぼ常に契約の不一致です。scaffold に
使った `gtdx` が、実行中の Designer よりも新しい `describe.json` 契約を対象にしているのです。

このページはバージョンマトリクス、症状、そして修正方法です。

## マトリクス

`describe.json` は `apiVersion` を持ちます。世代は 2 つあり、Designer は 2 つ目のサポートを
**1.2.0** で得ました。

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | 読み込む | **起動時にスキップ** | `0.4.x` |
| `>= 1.2.0` | 読み込む（読み取り時に移行） | 読み込む | `1.2.x` 以降 |

現在の `gtdx` は常に `greentic.ai/v2` を scaffold します。したがって問題となる組み合わせは
具体的に、**現在の SDK に対して 1.2.0 より古い Designer** です。

この契約ゲートに加えて、各拡張機能は必要とする Designer の範囲を宣言します。v2 describe では
`compat.min_designer_version`、v1 では `engine.greenticDesigner` です。どちらもチェックされます。

## 症状

拡張機能は `/api/extensions` から欠落し、UI にも表示されません。起動時の stderr に、Designer は
スキップした拡張機能ごとに 1 行を記録します。

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

古い Designer ビルドは、その行の短い版 — `built for a newer designer` — をバージョンなしで
出力します。これが表示されている場合、改善されたメッセージより前のビルドを使っており、この
ページが欠けていた半分です。

## `gtdx doctor` で診断する

`gtdx doctor` は、インストール済みの拡張機能を実際に持っている Designer と照合するので、起動
ログを探し始める前にわかります。

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

Designer のバージョンは `greentic-designer --version` から取得され、1.1.x まで遡るすべての系統で
サポートされています。`PATH` からではなくチェックアウトから Designer を実行している場合は、その
ビルドに doctor を向けてください。

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

Designer が見つからない場合、チェックはそれを報告して続行します。これは失敗ではありません。

実行を覚えておく必要はありません。`gtdx dev` と `gtdx install` はインストールが終わった瞬間に
同じチェックを実行するので、ビルドしたばかりのものを読み込まない Designer は、あなたがすでに
見ている場所でそれを知らせます。

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## 修正

**Designer を 1.2.0 以降にアップグレードしてください。** それがサポートされている方法です。

現在の `gtdx` に v1 describe を出力させるフラグは意図的にありません。契約をダウングレードすると、
describe の形を 2 つ無期限に維持することになり、しかも v2 機能に本当に依存している拡張機能を
誤って表現し続けます。変えられない理由で古い Designer に固定されている場合は、新しい SDK の出力を
ダウングレードするのではなく、SDK を一致するように固定してください（`greentic-extension-sdk-* 0.4.x`）。

## 拡張機能がスキップされるその他の理由

スキップされた拡張機能がすべてバージョンの問題とは限りません。Designer は使用できない
インストールも除外します。

| 起動メッセージ | 原因 | 修正 |
|----------------|------|------|
| `incomplete install (missing runtime component)` | `describe.json` が存在しないランタイムコンポーネントファイルを指している | 再ビルドして再インストール: `gtdx dev --once` |
| `runtime artifact unavailable` | コンポーネントファイルは存在するが WASM コンポーネントではない — 通常はプレースホルダーのスタブか未展開のアーカイブ | 再ビルド: `gtdx dev --once --release` |

## 関連項目

- [gtdx CLI](/ja/extensions/gtdx-cli/) — コマンドの完全なリファレンス
- [拡張機能を書く](/ja/extensions/writing-extensions/) — 端から端までの authoring パス
