---
title: Infrastructure Resources for Extensions
description: Declare that your extension needs a shared service such as Qdrant or Redis, read the connection at run time, and reach the operator's host without hard-coding it.
---

import { Aside } from '@astrojs/starlight/components';

Some extensions need a service that is not part of the worker: a vector store, a cache, a
database, a message bus. Your extension should never carry the address of that service. It
**declares a need**, and the operator decides which instance satisfies it. This page covers
what an extension author writes. Operators who add the resources themselves should read
[Resources (Qdrant, Redis and other services)](/operations/resources/).

<Aside type="caution" title="What has and has not been verified">
The declaration, the Resources page, the deploy gate and the staging of the connection have run
on a Kubernetes (kind) cluster with a Qdrant stand-in. A call to a real Qdrant Cloud or Upstash
endpoint has **not** been run end to end. The network grant (`infra://`, below) has been
exercised only in unit tests, not on a deployed workload. The Cloud Run lane has not been run
for any resource.
</Aside>

## 1. Declare the need with `x-requires`

Put a root-level `x-requires` array in the `config_schema` of a node type, or in the
`input_schema` of a tool:

```json
{
  "type": "object",
  "x-requires": [
    {
      "kind": "cache/redis",
      "label": "Redis",
      "hint": "Point this at an HTTPS REST endpoint for Redis (Upstash, or a REST proxy in front of your own Redis), not at a redis:// server.",
      "schemes": ["https"]
    }
  ],
  "properties": { }
}
```

`greentic.redis` declares exactly this on each of its tools.

<Aside type="danger" title="Do not add a new key under `contributions`">
`Contributions`, `NodeType` and `Tool` in the extension contract reject unknown fields. A new key
there makes every Designer that does not know it refuse the whole `describe.json` and unload your
extension. `config_schema` and `input_schema` are free-form schema strings, so an `x-` keyword
inside them is invisible to the typed contract and ignored by schema validators.
</Aside>

An entry has these fields:

| Field | Required | Rules |
|---|---|---|
| `kind` | yes | `<family>/<name>`: lowercase letters, digits and `-` in each part, for example `vector-store/qdrant` or `cache/redis`. |
| `label` | no | Display name for the kind. Trimmed, at most 64 characters, no control or format characters. An unusable label is dropped and the kind still counts. With no label the Designer shows the name part humanised (`database/mysql` becomes `Mysql`). |
| `hint` | no | Helper text shown under the kind picker in the Add dialog. Same rules as `label`, at most 200 characters. Shown as plain text, never as markup. |
| `schemes` | no | The connection schemes your extension can use, for example `["https"]`. |

Other rules:

- **`schemes` grammar.** Each entry must match `[a-z][a-z0-9+.-]{0,15}`. Invalid entries are
  dropped, duplicates collapse, at most 4 are kept, and a list that keeps nothing counts as absent.
- **Union rule.** When several installed extensions declare the same kind, the kind's scheme rule
  is the union of their lists. As soon as one declaring entry names no schemes, there is no rule
  at all, because that extension accepts any scheme. When the kind has a rule, the Add dialog
  offers only those schemes and refuses another one (`422 infra_resource_scheme_unsupported`).
  The create request itself accepts only alphanumeric schemes, so a declared token such as
  `postgres+tls` can be offered but not saved.
- **Two extensions, two labels.** If they label the same kind differently, the first by
  extension id wins. The same goes for `hint`.
- **Limits.** At most 256 entries are read from one schema.
- **A missing declaration means "needs nothing"** and never fails a build.
- **Older Designers** ignore `hint` and `schemes` (no hint, no scheme check) and load the
  extension as before.

## 2. There is no list of kinds

Neither the Designer nor the admin holds a catalogue of kinds. A kind exists because an installed
extension declares it, or because the admin already holds a resource of that kind. The Designer
validates a kind by syntax only and forwards any well-formed one; the admin may still refuse a
kind by its own policy. Inventing a new kind (`database/mysql`) therefore needs no platform
release, only your extension.

## 3. What your extension reads at run time

When a unit that uses your extension is deployed, the Designer stages one connection per kind into
the environment's secret store. Your extension reads it as a secret:

```
secret://infra/<kind with "/" and "-" replaced by "_">
```

For example `vector-store/qdrant` is `secret://infra/vector_store_qdrant`, and `cache/redis` is
`secret://infra/cache_redis`. Add that URI to `runtime.permissions.secrets` in your
`describe.json`, or the read is refused.

The value is a JSON document:

```json
{
  "host": "abc.eu-west.aws.cloud.qdrant.io",
  "port": 6333,
  "scheme": "https",
  "credential": "<secret>",
  "extras": { "collection_prefix": "gt__" }
}
```

- `extras` is an optional map of strings the operator filled in. Both published examples require a
  namespace prefix there (`collection_prefix` for Qdrant, `key_prefix` for Redis) so that one
  workspace never sees another's data. Fail closed with a clear message when it is missing.
- An IPv6 `host` is stored without brackets. Add them yourself when you build a URL.
- The connection exists only on a **deployed** unit. The Designer's own in-process host (Run Demo
  and in-process Test chat) does not serve `secret://infra/...`, so your extension will see "not
  found" there. Handle that case with a message that says the resource is not connected.
- Only the Cloud Run and Kubernetes environment-canvas lanes connect resources. Other targets are
  refused before the admin is asked.

## 4. An extension guest has no TCP

An extension runs in a sandbox with HTTP(S) only, through the host. It cannot open a socket. An
extension for a database or a broker must therefore talk to an **HTTPS REST gateway** that sits in
front of the service, not to the server itself:

- a SQL-to-HTTP gateway for a database,
- an Upstash-style REST endpoint for Redis,
- RESTHeart for MongoDB,
- the RabbitMQ management API for RabbitMQ.

A `redis://` URL can never be used. Use `hint` and `schemes` to say so at add time instead of
failing at call time.

## 5. Reaching the operator's host: the `infra://` network grant

Your `permissions.network` is a fixed allow-list. The operator's host is entered long after you
publish, so no static pattern can name it. Without more, any host outside your patterns is refused
with `network not allowed for url`.

To opt in, list a grant token in the same `permissions.network` array:

```json
"permissions": {
  "network": [
    "https://*.qdrant.io/*",
    "https://api.openai.com/*",
    "infra://vector-store/qdrant"
  ],
  "secrets": ["secret://infra/vector_store_qdrant"]
}
```

No new `describe.json` key is involved. On a runtime that does not know the token it is an
`infra`-scheme pattern that can never match an https request, so it is inert and the extension
still loads.

How the grant works:

- It takes effect **only after** your extension has successfully read the matching
  `secret://infra/<kind>` document. The runtime then allows one extra pattern,
  `https://<host>:<port>/*`, **for the current dispatch only**. It does not reach another
  extension or another tenant's call.
- The host comes from the operator, so it is checked first. **https only.** Refused: userinfo,
  wildcards, `localhost`, names ending `.internal` or `.local`, and loopback, private (RFC 1918),
  CGNAT, link-local (including the cloud metadata address), unspecified, multicast and
  IPv4-in-IPv6 addresses. A hostname must resolve to public addresses only.
- A refused grant does not fail the secret read. It adds nothing, so the next request is refused
  exactly as before.
- Redirects are re-checked against the same widened list, so an allowed host cannot send the
  sandbox somewhere the operator did not name.
- `redis://` is never granted, which is one more reason to use a REST gateway.
- An operator can switch every grant off with `GREENTIC_INFRA_GRANT=0` on the runtime.

<Aside type="note" title="Publishing a manifest with an `infra://` token">
Publishing a `describe.json` that contains `infra://` tokens needs `gtdx` 1.2.26 or later.
</Aside>

## 6. Worked example: `greentic.rag-qdrant`

`greentic.rag-qdrant` (RAG over Qdrant) shows both approaches side by side.

**Fixed allow-list.** Its `permissions.network` names `https://*.qdrant.io/*`,
`https://*.qdrant.io:6333/*` and `https://api.openai.com/*` (the last for embeddings). That is
enough for Qdrant Cloud, whose hosts look like `<id>.<region>.<cloud>.cloud.qdrant.io`. It is
**not** enough for a Qdrant the operator runs on another domain: the request is refused with
`network not allowed for url`. The Add dialog does not check the host against these patterns, so
such a host is accepted when added and only fails at run time.

**With the grant.** Adding `infra://vector-store/qdrant` to the same list lets the extension
reach whatever public https host the operator connected, for the dispatch that read the
connection. The fixed patterns stay for the embeddings endpoint.

The extension also reads `secret://infra/vector_store_qdrant`, requires `collection_prefix` in
`extras`, and answers that no `collection` is configured when the tenant's extension
configuration has none. Collections are named `<prefix><collection>`.

Not verified: a call to a real Qdrant Cloud cluster, and the grant on a deployed workload. The
grant and the published `greentic.rag-qdrant` versions are separate releases; check the version you
install before relying on it.

## See also

- [Resources (Qdrant, Redis and other services)](/operations/resources/): the operator side.
- [Writing Extension Packs](/extensions/writing-extensions/)
- [Extension Tools & Node Types](/extensions/extension-tools/)
- [Publishing Extension Packs](/extensions/publishing-extensions/)
