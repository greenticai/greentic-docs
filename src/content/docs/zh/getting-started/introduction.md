---
title: Greentic 简介
description: 了解 Greentic，这个基于 WASM components 的 AI 驱动数字员工平台
---

## 什么是 Greentic？

Greentic 是一个 **基于 WASM components 的多租户平台**，用于构建和运行 AI 驱动的数字员工。这些数字员工是自主式的 agentic 自动化流水线，能够跨多个渠道和服务处理复杂工作流。

## 核心特性

### WebAssembly 优先架构

Greentic 使用 **WebAssembly (WASI Preview 2)** 来对以下内容进行沙箱化、可移植执行：
- Flow 节点
- Messaging providers
- Event providers
- MCP tools

这意味着 components 具备以下特点：
- **Portable** - 一次编写，到处运行
- **Secure** - 沙箱化执行环境
- **Fast** - 接近原生的性能
- **Language-agnostic** - 可使用 Rust、Go 或任何兼容 WASM 的语言构建

### 天生支持多租户

Greentic 的每个方面都围绕多租户设计：
- **TenantCtx** - 租户上下文贯穿所有操作
- **Isolated sessions** - 每个租户的数据都完全隔离
- **Flexible deployment** - 支持单租户或多租户配置

### 基于 Flow 的编排

工作流以 YAML 文件（`.ygtc`）中的 **有向图** 形式定义：
- 可视化、声明式的流水线定义
- 可组合的节点组件
- 使用分支和条件控制流程
- 可恢复的 sessions

## 平台组件

| 组件 | 用途 |
|-----------|---------|
| **greentic-runner** | 生产运行时宿主 |
| **greentic-flow** | Flow schema、IR、加载器、校验器 |
| **greentic-pack** | Pack builder CLI |
| **greentic-component** | Component authoring CLI |
| **greentic-mcp** | MCP 执行器 / WASI bridge |

## 技术栈

| 方面 | 技术 |
|--------|------------|
| 语言 | Rust (edition 2024) |
| 异步运行时 | Tokio v1 |
| WASM Runtime | Wasmtime v41 |
| WASM Target | `wasm32-wasip2` |
| HTTP Server | Axum v0.8 |
| Messaging Bus | NATS |
| 序列化 | serde + CBOR + YAML |

## 使用场景

Greentic 擅长构建：

1. **客户服务机器人** - 跨 Slack、Teams、WhatsApp 的多渠道支持
2. **IT 服务台自动化** - 工单路由、密码重置、状态查询
3. **HR 助手** - 请假申请、政策查询、入职流程
4. **销售自动化** - 线索筛选、CRM 集成
5. **事件驱动工作流** - Webhook 处理器、定时任务、通知

## 下一步

- [Quick Start Guide](/zh/getting-started/quick-start/) - 运行你的第一个数字员工
- [Installation](/zh/getting-started/installation/) - 详细安装说明
- [Architecture Overview](/zh/concepts/architecture/) - 深入了解平台架构
