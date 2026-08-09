# GenOffice (open fork)

An AI-native office suite for macOS and Windows: word processor, spreadsheet,
presentations, and PDF — four Electron editors sharing one engine layer, built
around AI editing as a first-class workflow rather than a bolted-on chat box.

> This repository is a **fork of [genspark-ai/genoffice](https://github.com/genspark-ai/genoffice)**.
> The upstream project is source-available yet routes AI through a hosted,
> sign-in-based service. This fork strips that out: **no account, no sign-in,
> no cloud dependency — you bring your own AI keys, and your files never leave
> your device.**

## Why this fork

- **No sign-in, ever.** All account/login flows were removed. There is nothing
  to sign up for and no hosted service to authenticate against.
- **Your files stay on your device.** Documents are opened, edited, and saved
  locally. Content is only ever sent to the model provider **you** configured,
  as a prompt — never stored, never uploaded to a file service.
- **No barrier to using any model.** Bring your own API key (BYOK) and use
  Anthropic, Gemini, DeepSeek, OpenAI — or **any** OpenAI-compatible endpoint
  (Ollama, OpenRouter, Groq, LM Studio, local servers, …). Protocol, base URL,
  and model id are freely configurable; nothing is locked to one vendor.
- **Fully open source.** All app and engine code is Apache-2.0; you can build,
  audit, and modify everything yourself.

## Features

- **GenOffice Docs (`.docx`)** — byte-preserving round trip: only dirty
  paragraphs are regenerated, everything else keeps its original bytes, so
  layout never breaks in Word. Paginated view, tracked changes, comments,
  styles, equations, ink.
- **GenOffice Sheets (`.xlsx`)** — built on the open-source
  [Univer](https://github.com/dream-num/univer) core (Apache-2.0) with a large
  layer of in-house extensions; in-house Rust import/export sidecar
  (calamine + IronCalc), in-house chart rendering (Konva), pivot tables,
  slicers, conditional formatting, formula tracing.
- **GenOffice Slides (`.pptx`)** — in-house parse/render/edit engine with
  masters, charts, cropping, ink, and HarfBuzz text shaping.
- **GenOffice PDF (`.pdf`)** — viewer/editor on pdf.js + pdf-lib: annotations,
  forms, outlines, stamps, signatures, page operations, printing.
- **GenOffice Shell** — the suite shell: home screen, tabbed hosting of the
  four editors, auto-update.

Every app embeds the same AI panel: block-granular AI editing with version
snapshots and diffs in docs, and a tool-calling agent over workbook/slide/PDF
state in the others.

## AI: bring your own key

No API keys are bundled, and no model is locked in. Configure once in
Settings:

- **Providers:** `anthropic` · `gemini` · `deepseek` · `openai` · `custom`
- **Custom provider:** any OpenAI-compatible base URL + free-text model id —
  covers Ollama, OpenRouter, Groq, LM Studio, vLLM, and local servers.
  The key field is optional for local endpoints that need none.

Stored keys stay in your app's local user-data settings. There is no routing
through any third-party service.

## Engine packages

All pure TypeScript, no Electron dependency, unit-tested (except the UI kit):

- `packages/docx-engine` — docx parsing → block tree (with `docxIndex`
  anchors and passthrough), OOXML fragment generation, byte-level paragraph
  patching.
- `packages/pptx-engine` / `packages/pptx-render` — pptx model and rendering.
- `packages/file-parse` — text extraction for AI attachments (office formats,
  text formats).
- `packages/agent-core` — the AI agent loop and skill composition shared by
  every app.
- `packages/ai-provider` — provider abstraction and streaming for the model
  backends (Anthropic, Gemini, DeepSeek, OpenAI, OpenAI-compatible custom).
- `packages/ai-search` — web/image search tools for the agent (Serper +
  DuckDuckGo; no auth service).
- `packages/i18n`, `packages/ui`, `packages/project-store`,
  `packages/electron-utils` — shared i18n core, React UI kit, recent-files
  store, and Electron main-process helpers.

## Development

```bash
npm install
npm run fixtures     # generate test .docx fixtures
npm test             # engine + app unit tests (docs/sheets/slides need no display)
npm run typecheck    # tsc --noEmit across every workspace
npm run dev          # all four editors + shell against Vite dev servers
npm run dev:docs     # a single app (same pattern works per workspace)
npm run dist:mac     # package macOS dmg (regenerates third-party notices)
npm run dist:win     # package Windows nsis installer
```

The sheets app additionally needs a Rust toolchain for its xlsx sidecar
(`cargo` on PATH); `npm run build -w @genoffice/sheets` compiles it
automatically.

Local UI/e2e driver scripts (Playwright + Electron, for local acceptance, not
committed by default) live in [`scripts/drivers/`](scripts/drivers/README.md).

## Architecture notes (docx round trip)

```
open docx ─► archive original by hash (never touched)
          ─► docx-engine parses word/document.xml top-level elements (w:p / w:tbl / …)
          ─► Block tree, each block anchored by docxIndex + original XML slice
          ─► Tiptap streaming editor (manual + AI editing, dirty tracking)
save      ─► dirty blocks → OOXML fragments (referencing existing styles only)
          ─► splice into original document.xml (untouched blocks keep original bytes)
          ─► repack zip; all other entries copied byte-for-byte
```

The same philosophy holds in sheets and slides: the original file is the
source of truth, edits are applied as narrow patches, and everything the
editor didn't touch survives the round trip untouched.

## Security

See [SECURITY.md](SECURITY.md) for the process security posture (renderer
sandboxing, IPC validation, external-link gating) and the threat models for
AI-generated content.

## Third-party notices

`npm run notices` regenerates the bundled third-party license summary
(`tools/gen-third-party-notices.mjs`); all runtime dependencies are
MIT/Apache-2.0/OFL, and the bundled fonts (Liberation, Carlito, Caladea, Noto
CJK subsets) are OFL/Apache.

## License

GenOffice is licensed under the [Apache License 2.0](LICENSE), with one
exception: the `ee/` directory is reserved for future enterprise modules and
is covered by the [GenOffice Enterprise License](ee/LICENSE).

The GenOffice and Genspark names and logos are trademarks of Mainfunc, Inc.
The Apache-2.0 license does not grant permission to use them (see section 6);
forks should use their own branding.

---

*This is an independent fork. It is not affiliated with, endorsed by, or
sponsored by Mainfunc, Inc. or Genspark.*