# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skill Distiller (女娲 Nuwa) is a browser-based SPA that ingests documents, images, or URLs and runs a 4-agent LLM pipeline to distill a person's digital footprint into a reusable AI skill profile (system prompt). No backend — all processing happens client-side.

## Commands

- `npm run dev` — Vite dev server on port 3000, bind to 0.0.0.0
- `npm run build` — production build
- `npm run lint` — TypeScript type check only (`tsc --noEmit`)
- `npm run clean` — removes `dist/`

Node.js 20+ required (22.13+ recommended — `pdfjs-dist` 6 declares `>=22.13.0 || >=24`; npm emits a non-fatal `EBADENGINE` warning on older 22.x).

## Environment Variables

Defined in `.env.local` (copy from `.env.example`). Vite injects these at build time via the `define` block in `vite.config.ts`:

- `OPENAI_API_KEY` — fallback API key, used when no key is set in the Settings UI

Keys are also stored in `localStorage` under `nuwa_api_config` and take precedence over env vars at runtime.

`vite.config.ts` uses `define` for static text replacement, not `import.meta.env` — client code reads `process.env.OPENAI_API_KEY` directly (typed via `@types/node`). The value is wrapped in `?? ''` because `JSON.stringify(undefined)` returns the *value* `undefined`, so Vite drops the entry entirely and a bare identifier survives into the browser bundle as `ReferenceError: process is not defined`.

## Architecture

### Data Flow

```
FileUploader / URL Fetch
  → UploadedFile[] { name, mimeType, base64, text?, size, isProcessing? }
  → distillSkill() in src/lib/distill.ts
  → SkillProfile (structured JSON)
  → SkillProfileView (display + export)
```

### Active Distillation Engine

`src/lib/distill.ts` is the sole import target for `distillSkill`, `SkillProfile`, `generateMarkdown`, and `generateSkillFiles`. There is one provider path only — OpenAI-compatible `/chat/completions` over raw `fetch`. There is no `openai` npm package; the requests are hand-built.

### 4-Agent Pipeline

LLM calls within a single `distillSkill()` invocation:

1. **Linguistic Profiler** — tone, catchphrases, vocabulary, communication style
2. **Cognitive Psychologist** — mental models, decision heuristics, values, anti-patterns
3. **Roleplay Engineer** — identity card, 3-step workflow
4. **Master Synthesizer** — merges outputs from agents 1–3 into a single JSON `SkillProfile`

Agents 1–3 run in parallel via `Promise.all`; agent 4 runs after them.

Agents 1–3 share one `openAiMessages` request body (a single `user` message holding the document text plus optional image parts). **Declaration order matters**: `runOpenAiAgent` closes over `openAiMessages` before the `const` that defines it. It works only because the first call happens after that declaration — don't reorder that block.

### Chunking Strategy

If combined text exceeds 40,000 characters, it is split into chunks. Each chunk is summarized by an LLM call before the 4-agent pipeline begins; summaries run in batches of 3 (`CONCURRENCY_LIMIT`). The joined summaries become `processedTextContext`, which is what the agents receive.

### File Normalization (FileUploader.tsx)

Each dropped file is immediately pushed to state with `isProcessing: true`, then handled by type:

- Text/code files → read as plain text
- `.docx` → `mammoth.extractRawText()`
- `.pdf` → `pdfjs-dist` page-by-page text extraction
- Images → `tesseract.js` OCR (`chi_sim+eng` languages)

All files also get a base64 data URL read in parallel. `distill.ts` builds the LLM request body from it: an image with no OCR text is sent as `image_url` content using a `data:` URL; an image with OCR text is replaced by a text note instead (local models often choke on `image_url`). When no images are present the body degrades to a plain string for maximum local-model compatibility.

### URL Import

URLs are fetched via the Jina Reader API (`https://r.jina.ai/<url>`), which returns clean markdown. The resulting text is injected as a synthetic `UploadedFile` with `mimeType: 'text/markdown'`.

### Export Formats

- **Single Markdown** (`generateMarkdown`) — flat `SKILL.md`-style document
- **Multi-file ZIP** (`generateSkillFiles`) — package with `README.md`, `SKILL.md`, `references/identity.md`, `references/voice.md`, `references/timeline.md`
- **PNG image** — `html-to-image` captures the profile card element for sharing

## Coding Conventions

- Functional React components with hooks; no class components
- Bilingual UI via `language: 'zh' | 'en'` prop passed down from `App.tsx`
- Error messages are localized at call site (zh/en ternary), not in a dictionary
- API config is persisted to `localStorage('nuwa_api_config')`; theme to `localStorage('nuwa_theme')`
- Dark mode is applied by toggling the `.dark` class on `document.documentElement`
- Neo-brutalist visual style: `brutal-border`, `brutal-btn`, neon-green accent (`text-neon-green`, `bg-neon-green`)

## Key Pitfalls

- **localStorage migration**: `App.tsx` reads `nuwa_api_config` with a bare `JSON.parse`, not a merge against defaults. Any field removed from `ApiConfig` must be handled at load time, or a stale stored value (e.g. a `gemini-*` model name) gets posted verbatim to `/chat/completions`.
- **`src/index.css:1` Google Fonts `@import`** feeds `--font-display`/`--font-sans`/`--font-mono`. It looks like a Gemini leftover but is not — deleting it silently degrades the neo-brutalist typography to system fonts.
- **CORS**: AI API calls are made from the browser. If an endpoint blocks cross-origin requests, users must configure a CORS-friendly proxy URL in Settings.
- **localStorage API keys**: unencrypted; not suitable for high-security contexts.
- **OCR dependency**: `tesseract.js` loads a large language model in the browser at runtime; first-use latency is noticeable.
- **JSON retry**: Agent 4 retries up to 3 times on empty, unparseable, or malformed responses; failures beyond that throw a localized error.
- **No persistence**: profile data is lost on page refresh; there is no backend storage.
