# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Project Creek

Company management and operations dashboard for a goods production and trading company. Built with Next.js 15 (App Router), TypeScript, shadcn/ui, TanStack Query, and Zod.

## Bilingual Requirement

**Every UI change must include both English and Simplified Chinese.** This is a hard requirement.

- Translation files: `messages/en.json` and `messages/zh-CN.json`
- Add new strings to **both** files before using them in code
- Server components: `const t = await getTranslations('namespace')`
- Client components: `const t = useTranslations('namespace')`
- Navigation: always import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`, not from `next/navigation`
- Routes are `/en/...` and `/zh-CN/...`; pages live at `src/app/[locale]/(dashboard)/<module>/page.tsx`

## Dev Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm run typecheck  # Type check (run after any code change)
npm run lint       # Lint with ESLint
```

Run a specific API route manually:
```bash
curl http://localhost:3000/api/finance
```

## Architecture

### Data Layer (Repository Pattern)

Data lives in `data/*.json` files. Access is always through repositories — never read JSON files directly in components or API routes.

- **Interfaces**: `src/lib/repositories/interfaces.ts` — TypeScript interfaces every repo must implement
- **JSON implementations**: `src/lib/repositories/json/` — current implementations reading from `data/`
- **Active exports**: `src/lib/repositories/index.ts` — import repos from here; swap implementations here when migrating to a DB

To migrate to a database: create `src/lib/repositories/db/` with the same interface, then update `src/lib/repositories/index.ts`. No API routes or components change.

### Schemas & Types

Zod schemas in `src/schemas/` are the single source of truth. TypeScript types are inferred:
```ts
import { z } from 'zod'
import { InvoiceSchema } from '@/schemas/finance'
type Invoice = z.infer<typeof InvoiceSchema>
```

Never define types separately from schemas.

### API Routes

`src/app/api/<module>/route.ts` — thin handlers that call repository methods and return Zod-validated JSON. Business logic stays in repositories.

### Module Map

| Module | Route | API | Repo | Schema |
|---|---|---|---|---|
| Overview | `/dashboard` | — | all repos | — |
| Finance | `/finance` | `/api/finance` | `financeRepo` | `src/schemas/finance.ts` |
| Sales/CRM | `/sales` | `/api/sales` | `salesRepo` | `src/schemas/sales.ts` |
| Inventory | `/inventory` | `/api/inventory` | `inventoryRepo` | `src/schemas/inventory.ts` |
| Production | `/production` | `/api/production` | `productionRepo` | `src/schemas/production.ts` |
| HR | `/hr` | `/api/hr` | `hrRepo` | `src/schemas/hr.ts` |
| Reports | `/reports` | `/api/reports` | all repos | — |

### Adding a New Module

1. Add Zod schema to `src/schemas/<module>.ts`
2. Add interface to `src/lib/repositories/interfaces.ts`
3. Implement JSON repo in `src/lib/repositories/json/<module>.ts`
4. Export from `src/lib/repositories/index.ts`
5. Add API route at `src/app/api/<module>/route.ts`
6. Add page at `src/app/[locale]/(dashboard)/<module>/page.tsx`
7. Add nav link in `src/components/layout/Sidebar.tsx`
8. Add seed data to `data/<module>.json`

## UI Conventions

- Use shadcn/ui components from `src/components/ui/` — add new ones with `npx shadcn@latest add <component>`
- Feature components go in `src/components/modules/<module>/`
- Layout components (sidebar, header) in `src/components/layout/`
- Use TanStack Query for all data fetching from API routes

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
