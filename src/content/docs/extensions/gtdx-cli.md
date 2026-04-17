---
title: gtdx CLI
description: Command-line tool for installing, managing, and authoring Greentic Designer extensions.
---

`gtdx` is the CLI you use to install, list, update, search for, and
publish [designer extensions](./designer-extensions/). It ships with
the [`greentic-designer-extensions`](https://github.com/greentic-biz/greentic-designer-extensions)
repository and talks to the same runtime the designer hosts in-process.

## Install

```bash
git clone git@github.com:greentic-biz/greentic-designer-extensions.git
cd greentic-designer-extensions
cargo install --path crates/greentic-ext-cli --locked

gtdx version
gtdx --help
```

(Once published to crates.io: `cargo install greentic-ext-cli`.)

## Subcommands

### `gtdx validate <path>`

Static check of an extension source directory or unpacked `.gtxpack`.
Verifies `describe.json` against the v1 JSON Schema.

```bash
gtdx validate ./crates/adaptive-card-extension
# ✓ ./crates/adaptive-card-extension/describe.json valid
```

### `gtdx install <name>[@<version>]`

Install from a registry, an OCI ref, or a local `.gtxpack` file.

```bash
# From a local file (dev workflow)
gtdx install ./greentic.adaptive-cards-1.6.0.gtxpack -y --trust loose

# From the default registry (Greentic Store)
gtdx install greentic.adaptive-cards@^1.6

# From a custom registry
gtdx --registry oci install --registry oci://ghcr.io/greenticai/extensions \
  greentic.adaptive-cards
```

Flags:

| Flag | What it does |
|---|---|
| `--trust strict\|normal\|loose` | Override default trust policy for this install |
| `-y` / `--yes` | Skip the permission prompt (CI/scripting) |
| `--registry <name>` | Pick a non-default registry from `~/.greentic/config.toml` |
| `--home <dir>` | Override `~/.greentic/` install root (also `GREENTIC_HOME` env) |

Files install at `~/.greentic/extensions/<kind>/<name>-<version>/`.

### `gtdx list`

Show installed extensions grouped by kind.

```bash
gtdx list
# [design]
#   greentic.adaptive-cards@1.6.0  Design and validate Microsoft Adaptive Cards v1.6
# [bundle]
#   bundle-standard@0.1.0  Standard application pack with deterministic ZIP assembly
```

### `gtdx info <name>`

Show metadata for an extension (local or remote).

```bash
gtdx info greentic.adaptive-cards
```

### `gtdx search <query>`

Search the default registry.

```bash
gtdx search adaptive
gtdx search --kind bundle openshift
```

### `gtdx uninstall <name>[@<version>]`

Remove an installed extension. Without a version, removes all versions
of the named extension.

```bash
gtdx uninstall greentic.adaptive-cards@1.6.0
```

### `gtdx doctor`

Walk every installed extension's `describe.json` through the validator
and report any malformed entries.

```bash
gtdx doctor
# ✓ ~/.greentic/extensions/design/greentic.adaptive-cards-1.6.0/describe.json
# ✓ ~/.greentic/extensions/bundle/bundle-standard-0.1.0/describe.json
# 2 total, 0 bad
```

### `gtdx login` / `gtdx logout`

Manage authentication tokens for registries that require it.

```bash
gtdx login                   # default registry
gtdx login --registry custom
gtdx logout
```

Tokens land at `~/.greentic/credentials.toml` (chmod 0600 on Unix).

### `gtdx registries`

List, add, or remove configured registries (stored in
`~/.greentic/config.toml`).

```bash
gtdx registries list
gtdx registries add custom https://store.example.com/api/v1
gtdx registries remove custom
```

## Permission prompts

On the first install of an extension, `gtdx` shows a permission summary:

```
⚠️  Extension "adaptive-cards" v1.6.0 requests:
  - Network: openai.com, anthropic.com
  - Secrets: OPENAI_API_KEY
  - Cross-extension: may call bundle-kind extensions
Install? [y/N]
```

Subsequent updates re-prompt only for new permissions. Use `-y` in
scripts after vetting.

## Trust policies

Configure default in `~/.greentic/config.toml`:

```toml
[default]
trust-policy = "normal"   # strict | normal | loose
```

| Policy | Behaviour |
|---|---|
| `strict` | Must be developer-signed AND Greentic Store countersigned |
| `normal` | Must be developer-signed (matches cargo's default) |
| `loose` | Unsigned allowed (development only — prints a warning) |

Override per-install with `--trust`.

## Common workflows

### Try a new extension without installing globally

Use a temporary home:

```bash
TEST_HOME=$(mktemp -d)
gtdx --home "$TEST_HOME" install ./my-extension.gtxpack -y --trust loose
gtdx --home "$TEST_HOME" list
gtdx --home "$TEST_HOME" doctor
GREENTIC_HOME="$TEST_HOME" greentic-designer ui   # run designer with this home
rm -rf "$TEST_HOME"
```

### Pin a version

```bash
gtdx install greentic.adaptive-cards@1.6.0   # exact pin
gtdx install greentic.adaptive-cards@^1.6    # latest 1.6.x
gtdx install greentic.adaptive-cards@~1.6.0  # 1.6.x (no minor bumps)
```

Updates respect the pin — `gtdx install` will refuse to downgrade or
cross a major boundary unless you bump the spec.

### See what changed between two installed versions

```bash
gtdx info greentic.adaptive-cards@1.6.0
gtdx info greentic.adaptive-cards@1.7.0
diff <(gtdx info greentic.adaptive-cards@1.6.0) <(gtdx info greentic.adaptive-cards@1.7.0)
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic error (network, parse, etc.) |
| 2 | Permission denied (user declined prompt) |
| 3 | Signature verification failed |
| 4 | Capability resolution failed (would-be-degraded extension) |

## See also

- [Designer Extensions overview](./designer-extensions/)
- [Writing your own extension](./writing-extensions/)
- [Adaptive Cards reference extension](./adaptive-cards/)
