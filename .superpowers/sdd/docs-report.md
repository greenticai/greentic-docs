# docs-openapi Branch Report

## Files Changed

### 1. `src/content/docs/mcp/creating-tools.mdx`
Added a new `## Generate a Publish-Ready MCP Extension` section immediately before the existing `## Generate From OpenAPI` section. The new section uses `<Steps>` and covers:
- Step 1: Install `greentic-mcp-generator` via `cargo binstall` with `GITHUB_TOKEN`, plus `wasm32-wasip2` target.
- Step 2: Run `gtdx new --kind mcp --from-openapi ./openapi/weatherapi.yaml`, explaining that `gtdx` shells out to `greentic-mcp-gen` and auto-authors `describe.json` with `runtime.permissions.network` (from spec servers) and `secret_requirements` (from security schemes).
- Step 3: What gets produced — directory layout, then `gtdx validate` / `gtdx lint --publish`.
- Step 4: `gtdx publish --wasm ... --manifest ... --registry store.greentic.cloud --sign --key-id my-key .`
Added a closing note about `greentic-dev mcp gen <args...>` as a sibling passthrough.

### 2. `src/content/docs/mcp/overview.mdx`
Updated `## Generating MCP Components` to lead with `gtdx new --kind mcp --from-openapi` as the high-level wrapper before describing the raw `greentic-mcp-gen` call. Mentions `wasix:mcp/router` world, auto-authored `describe.json`, and links to Creating MCP Tools.

### 3. `src/content/docs/cli/overview.mdx`
Two changes:
- Updated the `gtc dev` row in the CLI Architecture table to note `gtc dev mcp gen` as an example passthrough.
- Added a `gtc dev mcp gen` example to the Development Workflow section with a note that `gtdx new --kind mcp --from-openapi` is the higher-level path for publish-ready extensions.

### 4. `astro.config.mjs`
Added `{ label: 'gtdx CLI', slug: 'extensions/gtdx-cli' }` as the second item in the `Extensions` sidebar group (after Overview, before Writing Extension Packs). The file was previously orphaned from the sidebar.

### 5. `src/content/docs/extensions/gtdx-cli.md`
No changes needed. The file already has the title "gtdx CLI" (not "Legacy gtdx CLI") and accurately describes `gtdx` as the current authoring/validate/sign/publish tool. The `--wasm <PATH>` flag for externally produced components (like generated MCP components) is already documented.

### 6. `.superpowers/sdd/docs-report.md`
This file (the report you are reading).

## Legacy gtdx Warnings Reconciled

Searched all English root pages (`src/content/docs/**`, excluding localized subdirectories) for "do not use gtdx", "gtdx is deprecated", "legacy gtdx", and similar phrases.

**Result: zero such warnings found in English root pages.** The English root files already treat `gtdx` positively as the current tool.

Localized copies (ar/, id/, zh/, etc.) contain outdated warnings such as:
- `ar/concepts/extensions.mdx` line 167: "Those names describe the legacy design-time proposal, not the current runtime extension path."
- `ar/extensions/designer-extensions.md` line 71: ".gtxpack, gtdx, and design-time extension classes are not the current extension-pack authoring path."

These are in **generated localized copies** which the task instructions explicitly exclude from editing. They are left as-is. A follow-up translation regeneration pass should propagate the English-root corrections to all locales.

Warnings left as-is and why:
- `ar/`, `id/`, `zh/`, `ja/`, `es/`, `de/`, `fr/` localized files: GENERATED — do not hand-edit per task constraint. Follow-up: regenerate translations.
- `reference/cli/*.md` auto-generated CLI help files: do not hand-edit per task instructions.

## npm run build Result

```
[build] 662 page(s) built in 19.08s
[build] Complete!
```
Build succeeded with no errors.

## Follow-Ups

1. **Translations**: Localized copies (ar, id, zh, ja, es, de, fr) contain stale "gtdx is deprecated" / "legacy" warnings about gtdx. These should be regenerated from the updated English sources.
2. **reference/cli/*.md**: Auto-generated — if `gtdx new --from-openapi` surface is exposed via a `gtdx --help` dump, the generated CLI reference should be regenerated to include it.
3. **gtdx-cli.md `--from-openapi`**: The gtdx-cli.md reference page does not yet document the `--from-openapi` flag under `gtdx new`. Add it once the flag is confirmed stable.

## Concerns

None. The English root pages were already internally consistent about `gtdx` being the current tool; the only contradiction was the sidebar orphaning of `gtdx-cli.md` and the missing documentation of the `--from-openapi` flow, both now addressed.
