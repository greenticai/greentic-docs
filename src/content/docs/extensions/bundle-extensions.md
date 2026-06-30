---
title: Static Routes and Assets
description: Expose packaged assets over HTTP with greentic.static-routes.v1.
---

The active bundle-related extension surface is `greentic.static-routes.v1`. It lets a pack expose selected files from `assets/` over public HTTP routes when `gtc start` runs a bundle.

Use static routes for:

- embedded WebChat UI
- setup screens
- lightweight admin, control, or observer dashboards
- public images, scripts, styles, and help assets
- generated app UI that belongs with an application or extension pack

## How It Works

Assets remain normal pack files under `assets/`. The extension metadata declares mount points:

```yaml title="pack.yaml"
extensions:
  greentic.static-routes.v1:
    kind: greentic.static-routes.v1
    version: 1.0.0
    inline:
      version: 1
      routes:
        - id: webchat-ui
          public_path: /v1/web/webchat/{tenant}
          source_root: assets/webchat
          scope:
            tenant: true
            team: false
          index_file: index.html
          spa_fallback: index.html
          cache:
            strategy: public-max-age
            max_age_seconds: 3600
          exports:
            base_url: webchat_base_url
            entry_url: webchat_entry_url
```

At startup, Greentic reads the packed manifest, validates route constraints, overlays bundle assets, and serves the referenced asset tree.

## Route Rules

Static route metadata is intentionally constrained:

- `public_path` must start with `/v1/web/`.
- Allowed placeholders are path segments such as `{tenant}` and `{team}`.
- `source_root` must point to a directory under `assets/`.
- `index_file` and `spa_fallback` are relative to `source_root`.
- `scope.team: true` requires `scope.tenant: true`.
- cache strategy is either `none` or `public-max-age`.
- exported URL names must be unique in the pack.

## Authoring

Author a bundle extension with the [`gtdx` CLI](/extensions/gtdx-cli/):

```bash
gtdx new my-bundle-ext --kind bundle
gtdx dev
```

`gtdx new --kind bundle` scaffolds the extension project and its `describe.json` manifest. See [Writing Extensions](/extensions/writing-extensions/) for the inner loop and [Publishing Extensions](/extensions/publishing-extensions/) for signing and distribution.

## Relationship to Bundles

Static routes are bundle-extension metadata: they declare how packaged `assets/` files are mounted, and `gtc start` serves them when it runs a bundle.

See [Bundle Assets](/concepts/bundle-assets/) for the broader asset packaging model.
