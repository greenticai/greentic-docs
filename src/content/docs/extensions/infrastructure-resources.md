---
title: Infrastructure Resources for Extensions
description: Declare that your extension needs a shared service such as Qdrant or Redis, optionally say how the platform can host it, read the connection at run time, and reach the operator's host without hard-coding it.
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


<Aside type="note" title="Status and roadmap">
**Live today**
- Declaring a need with `x-requires` (`kind`, `label`, `hint`, `schemes`), the Resources page, the deploy gate, and staging the connection into Cloud Run and Kubernetes environments.
- Managed Qdrant hosting on AWS ECS Fargate with EFS storage: https through the shared load balancer, a per-resource API key, deletion that removes everything, admin log lines and CloudWatch container logs. The hosting spec for Qdrant is built into the admin.

**Merged, active after the next releases**
- Hosting targets and the image policy in the admin (see [Hosting Targets](/admin/hosting-targets/)).
- Per-provider overrides (`hosting.targets`) in the extension declaration.
- The Designer reading the `hosting` declaration.
- The `greentic.rag-qdrant` 0.6.5 declaration. It is **not yet published** to the Store.

**In progress, not available**
- Hosting for Redis, RabbitMQ, PostgreSQL, MySQL and MongoDB. They need a database and a gateway in one instance.
- Kubernetes hosting beyond a private ClusterIP service, which has been proven only on a local kind cluster, and a real Kubernetes cluster target.
- Provisioning logic running inside extensions. This is a design only.

See [Hosted Infrastructure](/concepts/hosted-infrastructure/) for the model.
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


## Declare how the service can be hosted: `hosting`

An `x-requires` entry may also say how the platform can run the service as a dedicated instance.
The extension **declares**; the admin **deploys and connects**. Without `hosting`, the kind can
only be connected to a service you already run.

```json
{
  "kind": "vector-store/qdrant",
  "label": "Qdrant",
  "schemes": ["https"],
  "hosting": {
    "image": "qdrant/qdrant",
    "tag": "v1.12.5",
    "port": 6333,
    "protocol": "http",
    "auth":   { "env": "QDRANT__SERVICE__API_KEY", "header": "api-key" },
    "health": { "path": "/healthz" },
    "data":   { "path": "/qdrant/storage" },
    "env":    { "QDRANT__STORAGE__SNAPSHOTS_PATH": "/qdrant/storage/snapshots" },
    "run_as": { "uid": 1000 },
    "sizes":  { "small": { "cpu": 512, "memory_mib": 1024 } }
  }
}
```

This is the declaration `greentic.rag-qdrant` 0.6.5 carries on each tool. As with the rest of
`x-requires`, it lives inside a free-form schema string, so older Designers and admins ignore it.

### Fields

Only `image`, `tag` and `port` are required. Unknown fields are refused at every level.

| Field | Meaning | Default |
|---|---|---|
| `image` | Container repository: lowercase `[a-z0-9./_-]`, at most 128 characters, no tag, digest or registry port. | required |
| `tag` | A pinned tag, or `sha256:<64 hex>` (rendered as `repo@sha256:...`). `latest`, an empty or a malformed tag is refused. | required |
| `port` | The service port, 1024 to 65535. The container never runs as root. | required |
| `protocol` | `http`. | `http` |
| `auth.env` | Environment variable that sets the service API key. | none |
| `auth.header` | Header clients send the key in. | none |
| `health.path` | Absolute readiness path. | none |
| `data.path` | Absolute directory to persist. Never `/`. | none (no volume) |
| `env` | Fixed extra environment: literal configuration only. | none |
| `run_as.uid` | User id, 1 to 65534. Root is refused. | `1000` |
| `sizes.<name>` | Named sizes `small`, `medium`, `large`, each with `cpu` and `memory_mib`. | platform defaults |

The size, shape and secret rules the admin applies:

- Paths are absolute, use only `[A-Za-z0-9/._~-]`, contain no `..` or `//`, and are at most 128 characters.
- `env` has at most 16 entries, values at most 256 characters with no control characters.
- Variable names are `[A-Z_][A-Z0-9_]*`. The prefixes `AWS_`, `ECS_`, `KUBERNETES_`, `LD_`, `DYLD_` and `GREENTIC_`, and names such as `PATH` and `HOME`, are refused.
- No secrets in `env`. Names containing KEY, SECRET, TOKEN, PASSWORD, CREDENTIAL or AUTH are refused, and so are values that look like secrets (for example an `sk-` or `ghp_` prefix, a PEM block, a URL with a user name, or any unbroken token of 32 characters or more). You cannot set the auth variable to a literal either. The platform generates a per-resource key and injects it.
- `sizes` must be a valid Fargate cpu and memory pair, with memory at most 16 GiB.
- The declaration must be an object of at most 4096 bytes serialised and 6 levels deep. The Designer drops one that is larger, and the kind still works as a connect-only kind.

### Per-provider overrides: `hosting.targets`

Add a `targets` object with one section per hosting target kind, `aws_ecs` and `kubernetes`. A
section holds the same members as the common declaration, except `protocol`. The section for the
target a resource runs on is merged over the common fields: `env` and `sizes` merge member by
member, every other member replaces.

```json
"hosting": {
  "image": "qdrant/qdrant", "tag": "v1.12.5", "port": 6333,
  "sizes": { "small": { "cpu": 512, "memory_mib": 1024 } },
  "targets": {
    "aws_ecs":    { "sizes": { "small": { "cpu": 1024, "memory_mib": 2048 } } },
    "kubernetes": { "env": { "QDRANT__LOG_LEVEL": "info" } }
  }
}
```

- A flat declaration with no `targets` stays valid and means the same on every target.
- A section is validated by the same parser and the same image policy as a flat declaration, after merging. If a known section fails, the whole declaration is refused. Nothing is applied partially.
- An unknown target kind (`gcp`, `vm`, and so on) is ignored with a warning, so an extension can declare a provider before the admin knows it.
- A storage class is a setting of the Kubernetes target, not of the extension.

### When the platform refuses a declaration

The admin checks the declaration when it ingests your extension from the Store, and again when it
builds its registry. A declaration is applied only when all of these hold:

1. The extension is published by the platform (store-synced or uploaded by the platform, never a workspace's private upload), is published and has no sync conflict.
2. The image passes the platform's image policy (`any` by default, or an allow-list; see [Hosting Targets](/admin/hosting-targets/)).
3. Every field passes the rules above.

A failure skips that declaration with a fixed code in the admin log, such as
`hosting_tag_not_pinned`. The extension's own text is never echoed. The kind then falls back to the
built-in spec (Qdrant only) or cannot be hosted, and a request to host it is answered with
`422 infra_kind_not_provisionable`. The declaration is never partly applied. When several
extensions declare the same kind, the first by extension id with a valid declaration wins.

### Checklist: write a hosted-kind extension

1. Add a `hosting` object to the `x-requires` entry for your kind.
2. Pin the image by tag or by digest. Never `latest`.
3. Put no secrets in `env`. Declare `auth.env` and `auth.header` and let the platform inject the key.
4. Use a port of 1024 or higher and a non-root `run_as.uid`.
5. Give a `health.path` and a `data.path`, so the instance is checked and keeps its data.
6. Choose `sizes` that are valid cpu and memory pairs.
7. Republish the extension. The platform admin decides whether the image repository is admitted.
8. If the service does not speak HTTP (a database or a broker), your extension talks to an HTTP
   gateway, and the hosting image must contain both the service and that gateway. **The gateway
   image belongs to your extension's repository, never to the admin.** Hosting for these kinds is
   not available yet; see the status box above.
9. Remember what your extension reads at run time is still the staged connection (section 3
   below), whether the service is hosted or one you connect.

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
- [Hosted Infrastructure](/concepts/hosted-infrastructure/): the model in plain words.
- [Hosting Targets](/admin/hosting-targets/): where the platform runs hosted instances.
- [Writing Extension Packs](/extensions/writing-extensions/)
- [Extension Tools & Node Types](/extensions/extension-tools/)
- [Publishing Extension Packs](/extensions/publishing-extensions/)
