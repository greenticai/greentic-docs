---
title: Legacy gtdx CLI
description: Historical notes for the old gtdx extension CLI.
---

`gtdx` was part of an older `.gtxpack` design-time extension proposal. It is not the current extension authoring path documented for Greentic.

Use the current CLI instead:

```bash
gtc wizard
gtc wizard --schema
gtc wizard --answers extension-pack-answers.json
```

For low-level pack edits, use `gtc dev pack add-extension capability` for `greentic.ext.capabilities.v1` offers. See [Writing Extensions](/extensions/writing-extensions/).
