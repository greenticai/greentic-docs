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

Use the wizard first:

```bash
gtc wizard
```

For non-interactive authoring:

```bash
gtc wizard --schema
gtc wizard --answers static-routes-answers.json
```

The generated extension artifacts under `extensions/` are JSON. Do not document YAML files in `extensions/` for this path; YAML is only the pack manifest representation.

## Relationship to Bundles

Static routes are not a separate `.gtxpack` bundle-extension system. They are pack metadata that survives `gtc dev pack build` and is consumed by `gtc start`.

See [Bundle Assets](/concepts/bundle-assets/) for the broader asset packaging model.
