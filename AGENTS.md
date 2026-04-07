# Atlas Agent Guide

## Product Context

- Atlas is an all-in-one platform for knowledge management and AI collaboration.
- Product decisions should favor long-term maintainability, composable building blocks, and data structures that are friendly to retrieval, automation, and AI workflows.
- When a requirement is ambiguous, prefer solutions that improve knowledge capture, organization, search, editing, and AI-assisted collaboration instead of one-off page-level implementations.

## Required Stack

- Framework: Next.js 16 full-stack app with App Router.
- Runtime and language: React 19 + TypeScript.
- Package manager and command runner: Bun only.
- Database: PostgreSQL.
- Vector capabilities: pgvector.
- UI component library: HeroUI.
- Rich text / Markdown editor: Vditor.
- Styling and formatting: Tailwind CSS v4 + Biome.

## Non-Negotiable Rules

- Use Bun for dependency management and scripts. Do not use `npm`, `pnpm`, or `yarn`.
- Use HeroUI as the primary component library. Do not introduce another general-purpose UI kit unless the user explicitly asks for it.
- Use Vditor for rich text or Markdown editing experiences instead of adding a competing editor by default.
- Design persistent data for PostgreSQL first, not for lowest-common-denominator database portability.
- Build vector search and embedding-related features around pgvector unless the user explicitly decides to add a separate vector database.
- Before making architectural choices that are not already established in the repo, inspect the existing implementation first and ask only if the decision is genuinely product-shaping.

## Repository Conventions

- The app uses App Router under `src/app`.
- Prefer `@/*` imports for modules under `src/*`.
- Shared UI should live in `src/components`.
- Shared server-side capabilities, database access, retrieval logic, and AI orchestration should live in `src/lib` or clearly named domain folders.
- Route-internal helpers may use private folders prefixed with `_`, such as `src/app/(workspace)/_components`.
- Keep route structure aligned with Next.js file conventions. Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, and `route.ts` intentionally instead of inventing parallel conventions.

## Next.js Rules

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Data and AI Design Rules

- Keep structured data queryable. Do not hide important business fields inside opaque JSON blobs if they should be filterable, joinable, auditable, or indexed.
- Model knowledge content, content blocks, references, tags, embeddings, and AI outputs with clear boundaries so they can evolve independently.
- Preserve traceability for AI workflows when relevant: input source, prompt or workflow version, model identifier, execution status, and generated output should be inspectable.
- Keep secrets, credentials, provider keys, and database access on the server side only.
- When introducing retrieval or recommendation logic, design for deterministic fallbacks and debuggable ranking signals where possible.

## UI and Editor Rules

- Prefer HeroUI primitives and theming before building custom replacements for buttons, dialogs, form controls, lists, or navigation.
- Keep interface decisions aligned with the product domain: dense information layouts, long-form editing, retrieval flows, and collaborative actions matter more than landing-page aesthetics.
- Vditor is a browser-heavy editor. Integrate it in Client Components, and use dynamic loading or clear hydration boundaries when needed to avoid SSR issues.
- Avoid large custom editor abstractions until the actual product workflow requires them. Start with a thin integration layer around Vditor.

## Tooling Rules

- Install dependencies with `bun add` or `bun add -d`.
- Run the dev server with `bun run dev`.
- Build with `bun run build`.
- Lint with `bun run lint`.
- Format with `bun run format`.
- Respect Biome formatting and linting rules. The repo uses 2-space indentation.

## Decision Boundaries

- Do not introduce an ORM, migration tool, auth provider, queue system, or object storage abstraction unless the repo already chose one or the user explicitly asks you to make that decision.
- If a task depends on product-shaping choices that are still unknown, ask the user before locking in:
- authentication and identity model
- single-tenant vs multi-tenant workspace model
- ORM / migrations strategy
- deployment target
- file storage strategy
- AI provider and model routing strategy
- background jobs / queue strategy

## Change Expectations

- Make changes that are end-to-end coherent: data model, server logic, validation, UI feedback, and failure states should line up.
- Avoid placeholder abstractions that do not yet pay for themselves.
- Prefer direct, readable implementations over clever indirection.
- When editing docs or scaffolding, keep guidance aligned with the current repo state instead of generic framework defaults.
