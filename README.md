[简体中文](./README.zh-CN.md)

# Atlas

Atlas is an all-in-one platform for knowledge management and AI collaboration.

This repository is the early foundation of the product. It currently contains the app scaffold, base tooling, and project documentation; the main product modules are still under construction.

## What Atlas Is For

- Capture notes, documents, and structured knowledge in one place.
- Organize knowledge so it can be searched, linked, and reused.
- Support AI-assisted workflows such as writing, retrieval, summarization, and collaboration.

## Current Status

- The project is based on Next.js App Router, React, TypeScript, and Bun.
- Core infrastructure and repo conventions are being established.
- Database integration, editor integration, and product workflows are still being implemented.

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
├── public/            # Static assets
├── AGENTS.md          # Project-specific implementation guidance
├── biome.json         # Linting and formatting config
├── next.config.ts     # Next.js config
├── package.json       # Scripts and dependencies
└── tsconfig.json      # TypeScript config
```

## Notes

- `AGENTS.md` contains project-specific implementation guidance for coding agents and repo automation.
- The current landing page is still the default starter UI and does not represent the final product direction.
