---
title: Designer Compatibility
description: Which Designer version loads which describe.json apiVersion, why a freshly built extension can be invisible in Designer, and how gtdx doctor reports the mismatch.
---

An extension you just built can be installed correctly, pass every local check, and
still never appear in Designer. Almost always the cause is a contract mismatch: the
`gtdx` you scaffolded with targets a newer `describe.json` contract than the Designer
you have running.

This page is the version matrix, the symptom, and the fix.

## The matrix

`describe.json` carries an `apiVersion`. There are two generations, and Designer gained
support for the second one in **1.2.0**.

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | loads | **skipped at boot** | `0.4.x` |
| `>= 1.2.0` | loads (migrated on read) | loads | `1.2.x` and newer |

A current `gtdx` always scaffolds `greentic.ai/v2`. So the broken combination is
specifically: **a current SDK against a Designer older than 1.2.0.**

On top of this contract gate, each extension declares the Designer range it needs —
`compat.min_designer_version` on a v2 describe, or `engine.greenticDesigner` on a v1
one. Both are checked.

## The symptom

The extension is missing from `/api/extensions` and absent from the UI. On stderr at
boot, Designer logs one line per skipped extension:

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

Older Designer builds print a shorter version of that line — `built for a newer
designer` — with no version in it. If that is what you see, you are on a build that
predates the improved message, and this page is the missing half.

## Diagnose it with `gtdx doctor`

`gtdx doctor` checks your installed extensions against the Designer you actually have,
so you find out before you go looking through boot logs:

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

The Designer version comes from `greentic-designer --version`, supported by every
lineage back to 1.1.x. If you run Designer from a checkout rather than from `PATH`,
point doctor at that build:

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

When no Designer is found, the check reports that and moves on — it is not a failure.

You do not have to remember to run it. `gtdx dev` and `gtdx install` run the same
check the moment they finish installing, so a designer that will not load what you
just built says so where you are already looking:

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## The fix

**Upgrade Designer to 1.2.0 or newer.** That is the supported path.

There is deliberately no flag to make a current `gtdx` emit a v1 describe. Downgrading
the contract would mean maintaining two describe shapes indefinitely, and it would
still misrepresent extensions that genuinely depend on v2 features. If you are pinned
to an older Designer for reasons you cannot change, pin the SDK to match
(`greentic-extension-sdk-* 0.4.x`) rather than downgrading output from a newer one.

## Other reasons an extension is skipped

Not every skipped extension is a version problem. Designer also screens out installs it
cannot use:

| Boot message | Cause | Fix |
|--------------|-------|-----|
| `incomplete install (missing runtime component)` | `describe.json` points at a runtime component file that is not there | Rebuild and reinstall: `gtdx dev --once` |
| `runtime artifact unavailable` | The component file exists but is not a WASM component — usually a placeholder stub or an unextracted archive | Rebuild: `gtdx dev --once --release` |

## See also

- [gtdx CLI](/extensions/gtdx-cli/) — full command reference
- [Writing Extensions](/extensions/writing-extensions/) — the authoring path end to end
