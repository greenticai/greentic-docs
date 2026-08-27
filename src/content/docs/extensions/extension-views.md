---
title: Extension Views
description: Contribute a custom UI page to the Greentic Designer or Admin console — declare it, scaffold it, and know what the sandboxed bridge lets it reach.
---

import { Aside } from '@astrojs/starlight/components';

A view is a UI page your extension contributes to the Greentic Designer or the Greentic
Admin console. You write the HTML, JS and CSS; they ship inside your `.gtxpack`; a host
that understands `contributions.views[]` serves them and renders your entry in a
sandboxed iframe. Use it for anything a node inspector's schema-driven form cannot
express — a usage dashboard, a per-tenant settings screen, any real layout.

<Aside type="caution" title="No released host renders a view yet">
Today's SDK lets you declare a view, scaffold one, lint it, schema-validate it, and pack
it into a signed `.gtxpack`. **No shipped Designer or Admin release renders one.** If you
publish a view-bearing extension now, it packs and signs cleanly — nothing displays it.
Treat `--with-view` as a way to build and test a page locally, not to ship it for general
use yet.
</Aside>

<Aside type="caution" title="The compat trap — read this before you publish">
`Contributions` is `#[serde(deny_unknown_fields)]`. A designer built against a
pre-views contract crate does not skip an unrecognised `views` key — it fails to parse
the whole `describe.json`, so the extension does not load at all. `gtdx new` fills
`compat.min_designer_version` from this SDK's `MIN_DESIGNER_VERSION` constant, which has
not been raised past `1.2.0` yet. So a view-bearing describe *claims* `>=1.2.0` while
actually being unloadable on every Designer release from 1.2.0 through 1.2.8 — the
entire released line as of this writing. Do not publish a `views[]`-carrying extension
for general use until a host release that understands it has shipped.
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

The last three are gated by `runtime.permissions.ui`:

```jsonc title="describe.json"
"permissions": {
  "ui": {
    "fetchHosts": ["https://api.example.com/*"],
    "platformApi": [{ "method": "GET", "path_pattern": "/api/flows" }]
  }
}
```

A view asks for results, never for keys:

- **`invokeTool`** runs one of the extension's own tools inside the sandbox, with access
  to the host's secrets — the only one of the three that can touch a credential at all.
- **`callApi`** reaches platform REST, but the effective grant is your declared
  allowlist **intersected with the calling user's own RBAC**. Declaring
  `/api/admin/tenants/*` does not let an ordinary tenant user read another tenant's
  data — the bridge can only ever narrow what that person could already do by hand.
- **`fetch`** is proxied server-side rather than issued by the frame, because an opaque
  origin's own `fetch()` sends `Origin: null`, which most third-party APIs reject at
  CORS.

Every bridge call, and the initial `init` handshake, times out after 10 seconds if the
host never replies — `greentic.ready` rejects, and a call promise rejects with a
"timed out" error rather than hanging forever. If your page reports "Could not connect
to the host," this is almost always why: no host is currently listening for
`postMessage` from this frame at all (see the callout at the top of this page), not a
slow network.

Never expect a secret to arrive in the browser. Ask the bridge for a result; the
credential stays on the server.

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
