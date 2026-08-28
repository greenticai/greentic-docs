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

<Aside type="note" title="`callApi` and `fetch` are Admin-only">
Both hosts render a view, serve its assets, and run **`invokeTool`** for real — each
routes the call through its own tool-dispatch path, RBAC-checked and audited.

**`callApi`** and **`fetch`** are Admin-only. The Designer surface has no platform-API
proxy and no outbound-fetch proxy, so a view that depends on either still renders there
but cannot complete those two calls.

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
  allowlist **intersected with the calling user's own RBAC**. Declaring
  `/api/admin/tenants/*` does not let an ordinary tenant user read another tenant's
  data — the bridge can only ever narrow what that person could already do by hand.
  Admin only. On the Designer surface the call *resolves* with a placeholder payload
  marked `stub: true` rather than rejecting — check for that flag if a Designer view
  seems to be reading empty data.
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
