#!/usr/bin/env node

/**
 * Translate Greentic docs to all configured languages using Codex CLI.
 *
 * Usage:
 *   node scripts/translate-docs.mjs [options]
 *
 * Options:
 *   --lang <codes>   Comma-separated language codes (default: all)
 *   --force          Overwrite existing translations
 *   --dry-run        Show what would be translated without calling Codex
 *   --model <model>  Model override for Codex (default: uses codex default)
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const DOCS_DIR = path.join(ROOT_DIR, "src", "content", "docs");

// ── Language config ──────────────────────────────────────────────────
const LANGUAGES = {
  id: "Indonesian (Bahasa Indonesia)",
  ja: "Japanese (日本語)",
  zh: "Simplified Chinese (中文简体)",
  es: "Spanish (Español)",
  de: "German (Deutsch)",
};

// ── CLI args ─────────────────────────────────────────────────────────
const { values: args } = parseArgs({
  options: {
    lang: { type: "string" },
    force: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    model: { type: "string" },
  },
});

const targetLangs = args.lang
  ? args.lang.split(",").map((l) => l.trim())
  : Object.keys(LANGUAGES);
const force = args.force;
const dryRun = args["dry-run"];
const model = args.model;

// ── Helpers ──────────────────────────────────────────────────────────
async function getAllDocs(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      // Skip locale directories
      if (dir === base && Object.keys(LANGUAGES).includes(entry.name)) continue;
      files.push(...(await getAllDocs(fullPath, base)));
    } else if (/\.(mdx?|md)$/.test(entry.name)) {
      files.push(relPath);
    }
  }
  return files;
}

function buildPrompt(langCode, langName, files) {
  const fileList = files.map(({ src, dest }) => `  ${src} → ${dest}`).join("\n");

  return `Translate the following Starlight/Astro documentation files from English to ${langName}.

Files to translate:
${fileList}

For each file:
1. Read the source file
2. Translate it following the rules below
3. Write the translated content to the destination path

Translation rules:
- Translate the frontmatter "title" and "description" fields
- Translate all prose text, table content, and list items
- Do NOT translate:
  - Code blocks and inline code
  - Command-line examples
  - File paths, variable names, config keys
  - Technical proper nouns: Greentic, WASM, WebAssembly, YAML, NATS, Redis, Rust, Tokio, Wasmtime, Axum, Docker, Ngrok, Cloudflared, etc.
  - Brand/product names: Slack, Teams, Telegram, WhatsApp, GitHub, etc.
  - Component/tool names: greentic-runner, greentic-flow, gtc, etc.
- Preserve all MDX/JSX syntax exactly (import statements, component tags like <Card>, <Steps>, <Tabs>, etc.)
- Preserve all markdown formatting (headers, links, tables, bold, etc.)
- For internal links: add /${langCode}/ prefix (e.g., /getting-started/ → /${langCode}/getting-started/)
  - Do NOT modify external links (https://...)
  - Do NOT modify links that already have a locale prefix
- Keep the same file structure and formatting

Process ALL files listed above. Do not skip any.`;
}

async function runCodex(prompt, langCode) {
  const cmdArgs = [
    "exec",
    "--full-auto",
    "-C", ROOT_DIR,
  ];

  if (model) {
    cmdArgs.push("-m", model);
  }

  cmdArgs.push(prompt);

  console.log(`\n  Running codex exec for ${langCode}...`);

  try {
    const { stdout, stderr } = await execFileAsync("codex", cmdArgs, {
      timeout: 600_000, // 10 min per language
      maxBuffer: 10 * 1024 * 1024,
      cwd: ROOT_DIR,
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (err) {
    console.error(`  FAIL [${langCode}]: ${err.message}`);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  // Validate target languages
  for (const lang of targetLangs) {
    if (!LANGUAGES[lang]) {
      console.error(`Unknown language: ${lang}`);
      console.error(`Available: ${Object.keys(LANGUAGES).join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`Engine:    Codex CLI`);
  if (model) console.log(`Model:     ${model}`);
  console.log(`Languages: ${targetLangs.join(", ")}`);
  console.log(`Force:     ${force}`);
  console.log("");

  const englishFiles = await getAllDocs(DOCS_DIR);
  console.log(`Found ${englishFiles.length} English docs\n`);

  for (const lang of targetLangs) {
    const langName = LANGUAGES[lang];
    const filesToTranslate = [];

    for (const relFile of englishFiles) {
      const srcPath = path.join("src/content/docs", relFile);
      const destPath = path.join("src/content/docs", lang, relFile);
      const destFull = path.join(DOCS_DIR, lang, relFile);

      // Skip if already exists and not forcing
      try {
        await fs.access(destFull);
        if (!force) {
          console.log(`  SKIP  ${lang}/${relFile} (exists)`);
          continue;
        }
      } catch {
        // File doesn't exist, proceed
      }

      if (dryRun) {
        console.log(`  WOULD ${lang}/${relFile}`);
        continue;
      }

      // Ensure target directory exists
      await fs.mkdir(path.dirname(destFull), { recursive: true });

      filesToTranslate.push({ src: srcPath, dest: destPath });
    }

    if (dryRun || filesToTranslate.length === 0) {
      if (filesToTranslate.length === 0 && !dryRun) {
        console.log(`  All ${lang} files already exist, skipping.`);
      }
      continue;
    }

    // Batch files per codex call (max 10 files per batch to keep prompts manageable)
    const BATCH_SIZE = 10;
    for (let i = 0; i < filesToTranslate.length; i += BATCH_SIZE) {
      const batch = filesToTranslate.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(filesToTranslate.length / BATCH_SIZE);

      console.log(
        `\n[${lang}] Batch ${batchNum}/${totalBatches} (${batch.length} files)`
      );
      batch.forEach(({ src, dest }) => console.log(`  ${src} → ${dest}`));

      const prompt = buildPrompt(lang, langName, batch);
      await runCodex(prompt, lang);
    }
  }

  console.log("\nFinished!");
}

main();
