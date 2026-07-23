---
title: Designer 兼容性
description: 哪个 Designer 版本加载哪个 describe.json apiVersion，为什么刚构建的扩展可能在 Designer 中不可见，以及 gtdx doctor 如何报告不匹配。
---

你刚构建的扩展可能正确安装、通过每一项本地检查，却仍然从不出现在 Designer 中。原因几乎
总是契约不匹配：你用来 scaffold 的 `gtdx` 所面向的 `describe.json` 契约比你正在运行的
Designer 更新。

本页是版本矩阵、症状与修复方法。

## 矩阵

`describe.json` 带有一个 `apiVersion`。共有两代，Designer 在 **1.2.0** 获得了对第二代的
支持。

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | 加载 | **启动时跳过** | `0.4.x` |
| `>= 1.2.0` | 加载（读取时迁移） | 加载 | `1.2.x` 及更新 |

当前的 `gtdx` 始终 scaffold 为 `greentic.ai/v2`。因此有问题的组合具体是：**当前 SDK
搭配早于 1.2.0 的 Designer。**

在此契约门槛之上，每个扩展还会声明它所需的 Designer 范围——v2 describe 上的
`compat.min_designer_version`，或 v1 上的 `engine.greenticDesigner`。两者都会被检查。

## 症状

扩展从 `/api/extensions` 中缺失，且在 UI 中不存在。启动时在 stderr 上，Designer 会为每个
被跳过的扩展记录一行：

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

较旧的 Designer 构建会打印该行的较短版本——`built for a newer designer`——其中不含版本。
如果你看到的是这个，说明你所在的构建早于改进后的消息，而本页就是缺失的另一半。

## 用 `gtdx doctor` 诊断

`gtdx doctor` 会将你已安装的扩展与你实际拥有的 Designer 进行核对，让你在翻查启动日志之前
就能发现问题：

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

Designer 版本来自 `greentic-designer --version`，所有直到 1.1.x 的谱系都支持它。如果你从
checkout 而非从 `PATH` 运行 Designer，请让 doctor 指向该构建：

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

当找不到 Designer 时，检查会报告并继续——这不是失败。

你不必记着去运行它。`gtdx dev` 和 `gtdx install` 会在安装完成的那一刻运行同样的检查，因此
不会加载你刚构建内容的 Designer 会在你已经在看的地方告诉你：

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## 修复

**将 Designer 升级到 1.2.0 或更新版本。** 这是受支持的路径。

我们有意不提供任何标志让当前的 `gtdx` 输出 v1 describe。降级契约将意味着无限期维护两种
describe 形态，并且仍会错误地表示那些真正依赖 v2 功能的扩展。如果你因无法改变的原因被固定
在较旧的 Designer 上，请将 SDK 固定为匹配版本（`greentic-extension-sdk-* 0.4.x`），而不是
降级更新版本的输出。

## 扩展被跳过的其他原因

并非每个被跳过的扩展都是版本问题。Designer 也会筛除它无法使用的安装：

| 启动消息 | 原因 | 修复 |
|----------|------|------|
| `incomplete install (missing runtime component)` | `describe.json` 指向一个不存在的运行时组件文件 | 重新构建并重新安装：`gtdx dev --once` |
| `runtime artifact unavailable` | 组件文件存在，但不是 WASM 组件——通常是占位存根或未解压的归档 | 重新构建：`gtdx dev --once --release` |

## 另请参阅

- [gtdx CLI](/zh/extensions/gtdx-cli/) — 完整的命令参考
- [编写扩展](/zh/extensions/writing-extensions/) — 从头到尾的 authoring 路径
