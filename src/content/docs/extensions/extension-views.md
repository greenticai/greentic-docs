---
title: Extension Views
description: Contribute a custom UI page to the Greentic Designer or Admin console — declare it, scaffold it, and know what the sandboxed bridge lets it reach.
---

import { Aside } from '@astrojs/starlight/components';

A view is a UI page your extension contributes to the Greentic Designer or the Greentic
Admin console. You write the HTML, JS and CSS; they ship inside your `.gtxpack`; the host
serves them and renders your entry in a sandboxed iframe. Use it for anything a node
inspector's schema-driven form cannot express — a usage dashboard, a per-tenant settings
screen, any real layout.

<Aside type="note" title="`callApi` is live on the Designer; `fetch` is still Admin-only">
Both hosts render a view, serve its assets, and run **`invokeTool`** for real — each
routes the call through its own tool-dispatch path, RBAC-checked and audited.

**`callApi`** is live on both surfaces, but the two hosts grant different things. Admin
grants whatever your declared allowlist and the calling user's RBAC intersect to. The
Designer grants only `GET` against a fixed, host-owned list of routes — see
[What `callApi` can reach on the Designer](#what-callapi-can-reach-on-the-designer) —
plus, from the Designer release that includes the campus routes (1.2.511-dev or later), an
ungated write door onto your own extension's stored assets: no `platformApi` declaration
needed for that door, since the store already belongs to your extension. Newer Designer
builds add exactly one more write — sending a chat message to a deployed worker — and that
one **does** need a declared grant (see [Talking to a deployed
worker](#talking-to-a-deployed-worker)). A path outside the GET list, the asset door and
the chat door is refused with a stable `view_api_*` code, not a silent stub.

**`fetch`** is still Admin-only. The Designer has no outbound-fetch proxy, so a view that
depends on it still renders there but gets `not_implemented` back from that call.

A view built on `greentic.ready`, `invokeTool`, `resize`, `navigate` and `toast` works
the same on both surfaces.
</Aside>

<Aside type="caution" title="The compat trap — read this before you publish">
`Contributions` is `#[serde(deny_unknown_fields)]`, and `describe-v2.json` sets
`additionalProperties: false` on the `contributions` block. A host built against a
pre-views contract does not ignore a `views` key it does not recognise — it fails to
parse the whole `describe.json`. The extension then does not load at all, not merely
without its view.

Meanwhile `gtdx new` fills `compat.min_designer_version` from the SDK's
`MIN_DESIGNER_VERSION` constant, which is still `1.2.0`. So a view-bearing describe
*claims* `>=1.2.0` while actually requiring a host that has both adopted the v2 contract
**and** learned the `views` field — a later release than that floor admits. The range in
your own describe will not stop an older host from choking on your pack.

Until the hosts your users run understand `contributions.views[]`, treat `--with-view` as
a way to build and test a page against a host that does, rather than as something to
publish for general use. When you do ship one, raise `compat.min_designer_version` by
hand to the first host version that supports views — the scaffolded default is too low.
</Aside>

## Scaffold one

```bash
gtdx new my-ext --kind design --with-view
```

`--with-view` is rejected for `--kind mcp`: `wasix:mcp/router` artifacts carry no
`contributions` block for a view to attach to.

## What ships

```
assets/views/<view-id>/index.html
assets/views/<view-id>/bridge.js
assets/views/<view-id>/app.js
assets/views/<view-id>/style.css
```

`bridge.js` is the postMessage transport `index.html` loads before `app.js`, exposed to
`app.js` as `window.greentic`. The scaffold's `index.html` hard-requires it — pruning it
from the list above breaks your own page.

The packer already copies `assets/` verbatim and `manifest.json` already records a
sha256 for every entry, so your page is tamper-evident without you doing anything extra.

Everything your page loads must ship inside that directory. `gtdx lint` rejects a remote
`<script src>` / `<img src>` or `<link href>` in your **entry HTML** as
`E_VIEW_REMOTE_ASSET` — an ordinary `<a href>` hyperlink is fine, since it isn't fetched.
The manifest hash would otherwise cover a file that then pulls unverified code at
runtime. The scope is narrow: lint only scans the entry HTML file itself. A remote
reference built up at runtime inside `app.js` — a script tag inserted dynamically, or
`import()` of a remote URL — is not caught by this rule.

`--with-view` also fills `views[].tools` for you: it takes the first tool in the
extension's own `contributions.tools`, whatever the chosen `--kind` happens to
contribute (`design` → `echo`, `llm` → `complete`, and so on). A kind that contributes no
tools (`deploy`, `provider`) gets `tools: []` — the view still ships, it just can't call
one yet.

## Declaring it

```jsonc title="describe.json"
"contributions": {
  "views": [{
    "id": "usage-dashboard",
    "surface": "admin",
    "title_key": "view.usage.label",
    "title_fallback": "Usage",
    "entry": "index.html",
    "placement": { "slot": "admin.tenantDetail", "path": ["access"], "order": 20 },
    "min_visibility": "tenant_admin",
    "tools": ["fetch_usage"]
  }]
}
```

| Field | Notes |
| --- | --- |
| `id` | Unique within the extension. The host namespaces it as `<extension_id>/<id>`. |
| `surface` | `designer` or `admin`. A view that belongs in both declares two entries — placement differs per surface anyway, so one entry could never carry both. |
| `title_key` / `title_fallback` | An i18n key resolved against the top-level `localization` block, plus a literal shown when the key has no entry for the active locale. |
| `entry` | Entry HTML, relative to `assets/views/<id>/` inside the pack. |
| `placement` | The author's *suggested* `slot` / `path` / `order`. Every configuration layer below may override it — see the next section. |
| `min_visibility` | `member`, `tenant_admin`, or `platform_admin`. A floor, not a guarantee. |
| `tools` | Names of this extension's own contributed tools the view may invoke through the bridge. Every name must also appear in `contributions.tools[].name`. |

### Placement is a suggestion, not a demand

Platform admins decide which tenants get your extension at all. Tenant admins decide
where your view actually lands and which of their teams can see it. `min_visibility` is
a floor that a tenant's own configuration can only narrow further, never loosen.

Known slots today: `designer.sidebar`, `admin.sidebar`, `admin.tenantDetail`. An unknown
slot is a lint *warning* rather than an error, because this list is a snapshot taken at
your `gtdx` build, and hosts add slots between releases. A host that cannot resolve your
placement mounts the view under an "Extensions" section instead and records a
diagnostic — it will not disappear on you.

## What your page can reach

The iframe is `sandbox="allow-scripts"` — deliberately with **no** `allow-same-origin`.
That gives the page an opaque origin: no host cookies, no `localStorage`, no access to
the parent DOM, and its own `fetch()` would send `Origin: null`. Everything goes through
the bridge instead, and the host — never the page — holds the credentials:

```js
await greentic.ready                                  // locale, theme, surface, context
await greentic.invokeTool("fetch_usage", { days: 30 }) // your own tool
await greentic.callApi("GET", "/api/flows")            // platform REST
await greentic.fetch("https://api.example.com/x")      // proxied server-side
```

The last two are gated by `runtime.permissions.ui`. `invokeTool` is not — it is gated
per view, and the difference matters (see below):

```jsonc title="describe.json"
"permissions": {
  "ui": {
    "fetchHosts": ["https://api.example.com/*"],
    "platformApi": [{ "method": "GET", "path_pattern": "/api/flows" }]
  }
}
```

Those two keys are the whole block. **`permissions.ui` has no `tools` field and cannot
be given one:** `UiPermissions` is `#[serde(deny_unknown_fields)]` with exactly
`fetchHosts` and `platformApi`, and the schema sets `additionalProperties: false` on it.
Writing `permissions.ui.tools` gets your describe rejected outright — by `gtdx validate`,
by the deserialiser, and by the store. Which tools a view may call is declared per view,
in `views[].tools`; see [below](#invoketool-is-deliberately-narrow).

A view asks for results, never for keys:

- **`invokeTool`** runs one of the extension's own tools inside the sandbox, with access
  to the host's secrets — the only one of the three that can touch a credential at all.
  Live and audited on both surfaces, under identical rules.
- **`callApi`** reaches platform REST, but the effective grant is your declared
  allowlist **intersected with the host's own rules** — the exact intersection differs
  per surface:
  - **Admin** intersects your allowlist with **the calling user's own RBAC**. Declaring
    `/api/admin/tenants/*` does not let an ordinary tenant user read another tenant's
    data — the bridge can only ever narrow what that person could already do by hand.
  - **Designer** intersects your allowlist with a **fixed, host-owned list of `GET`
    routes** — see [What `callApi` can reach on the
    Designer](#what-callapi-can-reach-on-the-designer). Declaring a route the host
    doesn't also allow gets you `view_api_not_readable`, not a wider grant. Separately,
    from the release that includes the campus routes (1.2.511-dev or later), the
    Designer also opens a write door onto your own extension's stored assets — that one
    needs no `platformApi` declaration at all — and newer builds a chat door to a
    deployed worker, which does.
- **`fetch`** is proxied server-side rather than issued by the frame, because an opaque
  origin's own `fetch()` sends `Origin: null`, which most third-party APIs reject at
  CORS. Admin only; on the Designer surface it rejects with `not_implemented`.

### `invokeTool` is deliberately narrow

A view may only invoke a tool that **its own extension contributes** *and* that **the
view itself declares** in `views[].tools` — both conditions, not either. Both hosts
enforce exactly this rule, with the same two codes, so a view that calls its tools
correctly behaves the same on either surface. Miss one condition and you get a 403, not
a silent no-op:

| Error | Means |
| --- | --- |
| `E_TOOL_NOT_CONTRIBUTED` | The named tool isn't one of this extension's own tools at all. |
| `E_TOOL_NOT_DECLARED_BY_VIEW` | The tool is yours, but this view didn't list it under `views[].tools`. |

`E_TOOL_NOT_DECLARED_BY_VIEW` reads like a permissions bug the first time you hit it. It
isn't — it means "fix your `describe.json`": add the tool's name to this view's `tools`
array. `E_TOOL_NOT_CONTRIBUTED` is the other kind of problem entirely: the extension has
no such tool, so the page is asking for something it was never given, and the host treats
that as an escalation attempt rather than a typo.

Declaring tools per view rather than once per extension is deliberately the tighter of
the two options: an extension with a privileged tool and three views grants it to the one
view that needs it, instead of to all three.

The host also stamps identity into the call itself and overwrites whatever the page
supplied: an `invokeTool` call is dispatched with the caller's own tenant, not one the
page names. Don't send a tenant or collection id of your own in the args and expect it to
be honoured — ask for the result and let the host attach who's asking.

Every bridge call, and the initial `init` handshake, times out after 10 seconds if the
host never replies — `greentic.ready` rejects, and a call promise rejects with a
"timed out" error rather than hanging forever. If your page reports "Could not connect
to the host," check that you are loading it through an actual Designer or Admin instance
rather than opening the HTML file directly — a standalone file has nothing listening for
`postMessage` at all.

Never expect a secret to arrive in the browser. Ask the bridge for a result; the
credential stays on the server.

## What `callApi` can reach on the Designer

The Designer does not consult your describe's `platformApi` list on its own — for a
`GET` other than your own extension's asset store, it intersects your list with a
**second, host-owned list** it never publishes for you to widen. Your declared route
has to appear in *both* lists. No query string is accepted anywhere on the asset store,
even on the collection `GET`.

| Method | Path | Allowed query keys | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/env-canvas/campus` | — | Every team the signed-in viewer belongs to, each with its env-canvas environments (name, deploy state, and `{nodes, wires}` composition). |
| `GET` | `/api/env-canvas` | — | The caller's own env-canvas environments (name, channel/bundle/pack counts, deploy state) — no node/wire composition. |
| `GET` | `/api/env-canvas/*` | — | One environment's full composition: `{nodes, wires, positions}`. |
| `GET` | `/api/env-canvas/*/deployment` | — | The durable deploy row for that environment — status, endpoint, and step-by-step progress — or `null` if it has never been deployed. |
| `GET` | `/api/env-canvas/*/units/*/metrics` | `window` (`1h`, `24h`, `7d`) | Time-series request counts and p50/p99 latency for one deployed unit. |
| `GET` | `/api/audit/runs/summary` | `env`, `unit`, `flow`, `window`, `since`, `until`, `basis` | Per-flow run-status counts over the window — completed / dropped-off / technical-error / in-progress / agentic. No per-person or per-run data. |
| `GET` | `/api/audit/runs/by-worker` | `env`, `unit`, `flow`, `window`, `since`, `until`, `basis` | The same status counts, broken out per worker and start date. |
| `GET` — *the release that includes the campus routes (1.2.511-dev or later)* | `/api/env-canvas/campus/metrics` | — | Per member team, per environment, EVERY environment: `{idle, requests, p50, p99}` per unit when a read succeeds; `error: "no_signal"` (never deployed, a local-lane environment, or a target that isn't Cloud Run) or `error: "unavailable"` (the read itself failed — credential, admin, or Cloud Monitoring refusal) when it doesn't. No numbers this host doesn't already serve through the single-unit metrics route above. |
| `GET` — *same release* | `/api/env-canvas/campus/links` | — | Which deployed units are **configured** to call which agents, read from each unit's own on-disk pack — labelled that way because it is configuration, never observed traffic. Each agent's `target` is a campus `{team, envId, unitId}` only when its route matches **exactly one** A2A-exposed unit's public address; zero or more than one match and `target` is `null`. |
| `GET`/`POST` — *same release* | `/api/extensions/{own}/assets` | — (no query string at all) | List, or create, your own extension's stored assets. `{own}` is always the calling view's own extension id — the host decides it from the route, never the frame — and no `platformApi` declaration is needed for this door at all. See [Storing view state](#storing-view-state). |
| `GET`/`PUT`/`DELETE` — *same release* | `/api/extensions/{own}/assets/{id}` | — | Read, replace, or delete one of your own extension's stored assets by id. Same `{own}` scoping and same no-declaration-needed rule as above. |
| `POST` — *builds that include the unit-chat route* | `/api/env-canvas/*/units/*/chat` | — (no query string at all) | Send one message to a deployed worker and get its reply: `{reply, status, conversationId}`. **Needs** a `POST` grant for exactly this pattern. See [Talking to a deployed worker](#talking-to-a-deployed-worker). |

Two routes match the `/api/env-canvas/*` pattern by shape but are **never** proxied,
whatever your describe declares: `/api/env-canvas/available-units` and
`/api/env-canvas/capability-packs`. The host's list carves them out explicitly.

### The grant is an intersection, not a request

Declaring a route in `permissions.ui.platformApi` is necessary but not sufficient for
any of the `GET` rows above the asset store — it only ever *narrows* what the table
already allows. Ask for a route the host doesn't serve to views and you get
`view_api_not_readable`, not a wider grant; ask for a query key the route doesn't
accept and you get `view_api_query_not_allowed`. A view built to read campus metrics
and links declares exactly those routes and nothing wider:

```jsonc title="describe.json"
"permissions": {
  "ui": {
    "platformApi": [
      { "method": "GET", "path_pattern": "/api/env-canvas/campus" },
      { "method": "GET", "path_pattern": "/api/env-canvas/campus/metrics" },
      { "method": "GET", "path_pattern": "/api/env-canvas/campus/links" },
      { "method": "GET", "path_pattern": "/api/env-canvas/*" },
      { "method": "GET", "path_pattern": "/api/env-canvas/*/deployment" },
      { "method": "GET", "path_pattern": "/api/env-canvas/*/units/*/metrics" },
      { "method": "GET", "path_pattern": "/api/audit/runs/summary" },
      { "method": "GET", "path_pattern": "/api/audit/runs/by-worker" }
    ]
  }
}
```

The asset-store rows are absent from that list on purpose: the Designer decides access
to your own extension's asset store purely from which extension is hosting the view, so
declaring `GET`/`POST`/`PUT`/`DELETE` entries for `/api/extensions/<your-id>/assets...`
changes nothing either way. Some published extensions declare them anyway for
readability; it's harmless, just not load-bearing. The chat route is the opposite: it is
absent from that list only because it is a separate decision — add
`{ "method": "POST", "path_pattern": "/api/env-canvas/*/units/*/chat" }` if and only if
your view talks to workers.

### A minimal `describe.json` for a Designer view

Everything a campus-style view needs, and nothing it doesn't:

```jsonc title="describe.json"
{
  "runtime": {
    "permissions": {
      "network": [],
      "secrets": [],
      "callExtensionKinds": [],
      "ui": {
        "fetchHosts": [],
        "platformApi": [
          { "method": "GET",  "path_pattern": "/api/env-canvas/campus" },
          { "method": "GET",  "path_pattern": "/api/env-canvas/campus/metrics" },
          { "method": "GET",  "path_pattern": "/api/env-canvas/campus/links" },
          { "method": "GET",  "path_pattern": "/api/env-canvas/*/units/*/metrics" },
          { "method": "POST", "path_pattern": "/api/env-canvas/*/units/*/chat" }
        ]
      }
    }
  },
  "contributions": {
    "views": [{
      "id": "office",
      "surface": "designer",
      "title_key": "view.office.label",
      "title_fallback": "Worker Office",
      "entry": "index.html",
      "placement": { "slot": "designer.sidebar" },
      "tools": []
    }]
  }
}
```

The asset store needs no entry here. Drop the `POST` line if the view never chats with a
worker — a grant you don't use is still one a reviewer has to reason about.

## Navigating the host

`greentic.navigate(to)` never takes a URL or a path — a view names a **destination**
from a closed list, and the host resolves it to its own route:

```js
await greentic.navigate({ route: "env-canvas", envId: "…", unitId: "…" })
await greentic.navigate({ route: "audit", envId: "…", unitId: "…", team: "…" })
```

- `route` is `"env-canvas"` or `"audit"`; anything else is ignored.
- `envId` is required; `unitId` is optional and, when present, opens that unit's own
  modal on the target canvas instead of the environment as a whole.
- Both ids must match `^[A-Za-z0-9._~-]{1,128}$` — no `/`, `?`, `#` or `%`, so an id can
  never reshape the path it's placed into.
- `team` is optional and, when present, must be a valid team slug: lowercase letters,
  digits and hyphens, 1–63 characters, never starting or ending with a hyphen. **A
  malformed `team` refuses the WHOLE `navigate` call**, not just the team switch — so a
  typo can never fall through to opening a same-named environment in the wrong team.
  When a well-formed `team` names a team other than the one the viewer is currently
  acting as, the host switches the active team first (the same membership-checked
  `POST /api/teams/active` a team switcher uses) and only then navigates. **A refused
  team switch — the viewer isn't a member — toasts the error and navigates nowhere.**
- `navigate` only fires after a real user gesture (`navigator.userActivation.isActive`).
  Calling it from your view's own load handler is silently ignored — the browsers that
  support the check would otherwise let a view trap the Back button by re-navigating on
  every mount.

## Storing view state

From the release that includes the campus routes (1.2.511-dev or later), a view may
keep its own small amount of state across sessions through the write door in the
`callApi` table above — building layouts, a chosen time window, whatever your view
needs to remember.

**Asset ids are minted by the server — never invent one.** `id` is the row's bare
primary key across the whole store, not scoped per tenant or team, so a fixed literal
id like `"my-view-state"` belongs to whichever tenant happens to create it first; every
other tenant's write to that same id is silently refused (`404`, indistinguishable from
"no such asset"). The pattern that works on every install:

1. `GET /api/extensions/{own}/assets` on load. It returns every asset your extension
   has stored for the caller's team, unfiltered — there is no query-string filtering
   through this door, so if you keep more than one asset, tell them apart by
   `assetType` or `name` client-side.
2. Found your row already → remember its `id` and `PUT
   /api/extensions/{own}/assets/{id}` to update it, sending `{ assetType, name, content
   }`.
3. Found nothing → `POST /api/extensions/{own}/assets` with `{ assetType, name, content
   }` and **no `id` field** — the server mints one and hands it back in the response.
   Remember that id for the next write.
4. `DELETE /api/extensions/{own}/assets/{id}` removes a row you no longer need.

Limits, as they stand in the Designer's code today — they apply to every caller of the
asset routes, not only views, and are checked before anything is written:

| Limit | Value | Refusal |
| --- | --- | --- |
| Body fields forwarded by the bridge | `assetType`, `name`, `content` — all three required by the server; `id`, timestamps and anything naming an extension are dropped | `invalid_request` if the body isn't a JSON object |
| `content` size | 256 KiB (measured in bytes) | `413 extension_asset_too_large` |
| Writes (`POST`, `PUT`, `DELETE`) | 30 per minute per (tenant, team, user, extension), in memory per Designer process | `429 extension_asset_rate_limited` |
| `name`, `assetType` length | No bound beyond `content`'s | — |

Debounce your saves — one write every few seconds at most — and back off after a `429`
rather than retrying immediately.

Four more things worth knowing:

- **It's team-shared, not per-person.** The store is keyed `(tenant, team,
  extension_id, asset id)` — every member of the team who opens your view reads and
  writes the same rows. Fine for shared state like "which floor is expanded"; wrong for
  anything that should differ per viewer.
- **`content` is opaque text.** The host never parses it — store whatever JSON (or
  anything else) your view wants, serialized to a string, and parse it back yourself.
- **Only your own extension's namespace.** `{own}` in every path is decided by the host
  from which view is calling, never from anything the frame sends, so there's no way to
  read or write another extension's assets even if you know its id.
- **Degrade silently on older hosts.** A Designer that predates this release has no
  asset door at all: a write is refused as an unrecognised method, and a `GET` falls
  through to the ordinary read gate, which refuses it too — the assets routes aren't in
  that allow-list either. Treat any of those refusals the same way you'd treat any
  other: keep the state in memory for the session and don't surface an error for it.

## Talking to a deployed worker

Builds of the Designer that include the unit-chat route let a view send one message to a
deployed env-canvas unit and read its reply — the "click a worker, ask it something"
interaction. It is the only write a view can make outside its own asset store, and the
bridge holds it to more than the read gate:

```js
const res = await greentic.callApi(
  "POST",
  `/api/env-canvas/${envId}/units/${unitId}/chat`,
  { message: "What did you do today?", conversationId },
)
// res = { reply: "…" | null, status: "completed" | "input_required" | "working" | "failed", conversationId }
```

What the host enforces before anything leaves the browser:

- **A declared grant.** Your extension must list `POST` for the pattern
  `/api/env-canvas/*/units/*/chat` in `permissions.ui.platformApi`; otherwise
  `view_api_not_granted`. The asset store is the only write that needs no grant.
- **Exactly that path shape.** Ids of unreserved characters (`A-Z a-z 0-9 . _ ~ -`),
  never `.` or `..`, no query string or fragment (`view_api_query_not_allowed`), and only
  `POST` (`view_api_method_not_allowed`).
- **A rebuilt body.** The bridge forwards only `message` and `conversationId`, both of
  which must be strings (`invalid_request` otherwise). Anything else your page puts in
  the body is dropped.

What the server then checks:

| Rule | Value in code |
| --- | --- |
| `message` | Trimmed, 1–4000 characters. |
| `conversationId` | `^[A-Za-z0-9_-]{8,64}$`. Generate one per conversation and reuse it to keep context; a new id starts a fresh conversation. The server derives the worker-side session key from it together with the viewer's identity, so two viewers who send the same id do not share a conversation. |
| Scope | The environment must belong to the viewer's **active team** and carry that unit; otherwise `404` (`env_unit_not_found` or the environment's own not-found). Switch team with [`navigate`](#navigating-the-host) first. |
| Rate | 20 messages per minute per (viewer, environment, unit), in memory per Designer process — `429 unit_chat_rate_limited`. The worker's own `429` maps to the same code. |
| Timeout | 60 seconds — `422 unit_chat_timeout`. |
| Reply | Capped at 8000 characters. A turn that ran and failed is a `200` with `reply: null, status: "failed"`, never the engine's own error text. |

Which units can answer:

| Lane | Works? | How |
| --- | --- | --- |
| env-canvas **Cloud Run** | Only when the unit has "Answer other AI agents" (A2A) switched on **and** has been deployed since | The unit's own A2A endpoint, with a credential the last deploy shipped. Otherwise `409 unit_chat_not_exposed` or `409 unit_chat_no_credential`. |
| env-canvas **local** | Yes | The local worker on loopback. |
| env-canvas **Kubernetes** | No | `422 unit_chat_unreachable` — a ClusterIP worker has no address the Designer can reach. |

<Aside type="caution" title="Two things to design for">
**Every message spends the worker's LLM budget.** The call runs as the signed-in viewer,
but the tokens are the worker owner's. Send a message only from an explicit user action —
never on load, on a timer, or to "warm up" a unit — and don't retry automatically on
failure.

**A reply is untrusted model output.** Render it as plain text (`textContent`, never
`innerHTML`), don't follow links or run anything it contains, and don't feed it back into
another call without the user seeing it first. The sandbox protects the host from your
page; nothing protects your page from what a model says.
</Aside>

## Errors a view should expect

Every refused or failed bridge call rejects with `{ code, message }`. The `code` is
stable; the `message` is for logs, not for branching.

**Refused by the host before any request** (the call never reached the server):

| Code | Means |
| --- | --- |
| `view_api_invalid_path` | Not a plain `/api/...` path — traversal, percent-encoding, an empty or odd segment. |
| `view_api_method_not_allowed` | A method the target doesn't accept from a view: anything but `GET` on the read list, a verb the asset door doesn't serve at that shape, anything but `POST` on the chat door. On an older Designer, **every** write gets this. |
| `view_api_not_granted` | Your `permissions.ui.platformApi` doesn't declare this route (read list or chat). |
| `view_api_not_readable` | You declared it, but the host doesn't serve that `GET` to views at all. |
| `view_api_query_not_allowed` | A query key the route doesn't accept, or any query string on the asset or chat door. |
| `view_api_not_own_extension` | An asset-store path naming an extension other than the one hosting the view. |
| `invalid_request` | A write whose body isn't a JSON object, or a chat body without string `message` and `conversationId`. |
| `not_implemented` | `greentic.fetch` on the Designer. |

**Answered by the server** (the host forwards the server's code; a response with no code
arrives as `http_<status>`, and a request that could not be sent as `network_error`):

| Code | Status | Route |
| --- | --- | --- |
| `not_found` | 404 | Asset store: no such asset in your extension and team — or, on create/replace, an id that belongs to someone else. |
| `extension_asset_too_large` | 413 | Asset store: `content` over the cap. |
| `extension_asset_rate_limited` | 429 | Asset store: too many writes this minute. |
| `unit_chat_invalid` | 400 | Chat: bad `message` or `conversationId`. |
| `env_unit_not_found` | 404 | Chat: the environment has no such unit (in the viewer's active team). |
| `unit_chat_not_deployed` | 409 | Chat: no running deployment, or no route for that unit. |
| `unit_chat_not_exposed` | 409 | Chat: Cloud Run unit without A2A exposure deployed. |
| `unit_chat_no_credential` | 409 | Chat: no credential a deploy has shipped, or the worker refused it. |
| `unit_chat_unreachable` | 422 | Chat: Kubernetes or unknown lane, or the worker could not be reached. |
| `unit_chat_failed` | 422 | Chat: the worker answered with something unusable. |
| `unit_chat_timeout` | 422 | Chat: 60 seconds elapsed. |
| `unit_chat_rate_limited` | 429 | Chat: too many messages to this unit this minute. |

**On an older Designer**, a route it doesn't know shows up one of two ways: the host gate
doesn't list it yet (`view_api_not_readable`, or `view_api_method_not_allowed` for a
write), or the host lists it and the server doesn't serve it (typically a `404`). Treat
both as "this feature isn't here", hide the part of the UI that depends on it, and stop
calling it for the session — don't surface an error, and don't retry in a loop.

## How the host serves and sizes your page

None of this needs anything from you. It is worth knowing because the first part decides
what you may safely put in a file, and the last saves you writing layout code you do not
need.

### Your view's files are served without a session

A sandboxed frame has an opaque origin, so every subresource it requests counts as
`Sec-Fetch-Site: cross-site` and the browser withholds the host's `SameSite=Lax` session
cookie. The entry document itself still loads — the host navigates the frame, and that
navigation is same-site — but `app.js` and `style.css` would come back as `401` JSON,
which `nosniff` then refuses to execute as script or apply as a stylesheet.

Both hosts therefore exempt the view-asset route from their session gate, for `GET` and
`HEAD` only. The consequence for you is simple: **your view's files are readable by
anyone who can reach the host, so never ship a secret in view assets.** Put it behind a
tool and ask the bridge for the result.

The bridge route itself is not exempt. Anything that makes your extension *do* something
still requires a session.

### `script-src 'self'` works in the sandbox

Assets are served under `default-src 'none'; script-src 'self'; style-src 'self'
'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'self'`.

`'self'` keeps working even though the document's origin is opaque: a policy captures its
own self-origin when it is created (CSP3 §2.2), and that resolves to the origin the
policy was delivered from. So an external `<script src="app.js">` in your entry HTML runs
normally. Substituting a concrete origin for `'self'` would be strictly worse — it breaks
the page anywhere the guess fails to match.

### The frame fills the content pane

```
height = max(available pane height, content height reported via `resize`)
```

The pane height is a floor, so a short page fills the pane and looks right without you
doing anything. The bridge's `resize` message can only ever grow the frame past that
floor, never shrink it below — send it when your content is taller than the pane, and
the pane scrolls.

## Lint codes

| Code | Meaning |
| --- | --- |
| `E_VIEW_ID_PATTERN` | `id` does not match `^[a-z0-9][a-z0-9._-]*$` |
| `E_VIEW_ENTRY_MISSING` | `entry` names a file that is not in your project |
| `E_VIEW_ENTRY_PATH` | `entry` escapes `assets/views/<id>/` |
| `E_VIEW_ENTRY_UNREADABLE` | `entry` names a file that exists but couldn't be read (not UTF-8, or a permissions error) |
| `E_VIEW_REMOTE_ASSET` | the entry HTML has a remote `<script src>` / `<img src>` or `<link href>` |
| `W_VIEW_SLOT_UNKNOWN` | `placement.slot` is not in this `gtdx` build's snapshot |

<Aside type="note">
`gtdx lint` works from the raw JSON and never deserializes into the typed describe, so it
stays silent on two things that **are** rejected when the describe is *parsed* — by
`gtdx validate`, by installation, and by anything else in the SDK that loads a
`describe.json`: a duplicate view `id`, and a `tools[]` entry naming a tool the extension
does not contribute. Always run `gtdx validate` as well as `gtdx lint` before you ship.
</Aside>

## Next

- [Writing Extensions](/extensions/writing-extensions/) — the rest of `contributions`,
  and the authoring loop this fits into
- [Extension Tools and Node Types](/extensions/extension-tools/) — the tools a view is
  allowed to invoke
- [Designer Compatibility](/extensions/designer-compatibility/) — the broader
  `apiVersion` / Designer version matrix the compat trap above sits inside
- [gtdx CLI](/extensions/gtdx-cli/) — every flag, including `--with-view`
- [Publishing Extension Packs](/extensions/publishing-extensions/) — signing and the
  store
