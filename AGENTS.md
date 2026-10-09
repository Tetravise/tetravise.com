# AGENTS.md

## Communication Protocol
- Concise output only. No pleasantries, greetings, preambles, or post-summaries.
- Never explain code unless requested. Return only working code blocks.
- Do not narrate intermediate steps or planning unless explicitly asked.
- On error: output only the exact error cause and fixed code/command.

## Core Rules
- Strictly follow project style/architecture.
- Keep output formats compact: plain lists or compact JSON over markdown tables/long text.
- Stop immediately after providing the request.

## Project Rules
- Static site: edit `index.html`, `assets/` and `scripts/` directly; do not add npm dependencies or a framework.
- Preserve relative paths, accessibility, responsive behavior, SEO metadata and the Italian/English translations in `assets/i18n.json`.
- Keep generated `_site/` out of commits; do not modify build/deploy configuration unless requested.
- Inspect nearby code before editing and make the smallest focused change.
- Validate relevant changes with `node --test scripts/build-pages.test.mjs`; run `node scripts/build-pages.mjs` when build output is affected.
- Do not commit secrets, personal data, unverified URLs or generated artifacts.
