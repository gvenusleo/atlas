[简体中文](./README.zh-CN.md)

# Atlas

Atlas is an all-in-one platform for knowledge management and AI collaboration.

This repository is the active product foundation. It already includes auth, a protected personal workspace, and a Markdown editing flow, while broader knowledge and AI modules are still being built.

## What Atlas Is For

- Capture notes, documents, and structured knowledge in one place.
- Organize knowledge so it can be searched, linked, and reused.
- Support AI-assisted workflows such as writing, retrieval, summarization, and collaboration.

## Current Status

- The app runs on Next.js App Router, React 19, TypeScript, and Bun.
- UI uses shadcn/ui with the official `base` preset workflow and generated components managed from `components.json`.
- Auth is backed by PostgreSQL and Drizzle with persistent database sessions.
- The current homepage is a protected Markdown workspace with Vditor, document tree management, autosave, revisions, and outline browsing.

## Getting Started

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run format
```

## Repository Layout

```text
.
├── src/app/           # Next.js App Router entry
├── src/components/    # Shared UI and app-level composition
├── src/lib/           # Auth, database, documents, and domain services
├── public/            # Static assets
├── AGENTS.md          # Project-specific implementation guidance
├── biome.json         # Linting and formatting config
├── components.json    # shadcn registry configuration
├── next.config.ts     # Next.js config
├── package.json       # Scripts and dependencies
└── tsconfig.json      # TypeScript config
```

## Notes

- `AGENTS.md` contains project-specific implementation guidance for coding agents and repo automation.
- Generated shadcn primitives in `src/components/ui/*` should be added through the official CLI and treated as registry source, not hand-maintained custom components.
