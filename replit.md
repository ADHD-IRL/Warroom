# WARROOM

## Overview

Full-stack AI-powered red-team and strategic analysis platform. Users build expert agent libraries, design compound threat chains, organize scenarios, and run structured two-round debate sessions with AI-generated assessments.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (`artifacts/warroom/`) — served at `/`
- **API framework**: Express 5 (`artifacts/api-server/`) — served at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: Anthropic Claude API via Replit AI Integrations (no user key required)
- **Build**: esbuild (CJS bundle)

## Color System

- Background primary: `#0D1B2A` (deepest navy)
- Accent amber: `#F0A500`
- Severity: CRITICAL=`#C0392B`, HIGH=`#D68910`, MEDIUM=`#2E86AB`, LOW=`#27AE60`

## Structure

```text
artifacts/
├── api-server/         # Express API server with all routes
│   └── src/routes/     # domains, scenarios, threats, agents, chains, sessions, reports, stats
└── warroom/            # React+Vite frontend (8 pages)
    └── src/
        ├── pages/      # Dashboard, Domains, Scenarios, Threats, Agents, Chains, Sessions, Reports
        ├── components/ # Sidebar, AgentCard, SeverityBadge, VectorBar, EmptyState
        └── hooks/      # use-sse (SSE streaming for AI generation)
lib/
├── api-spec/           # OpenAPI spec + Orval codegen config
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas
└── db/                 # Drizzle ORM schema + DB connection
    └── src/schema/warroom.ts  # All WARROOM tables
scripts/
└── src/seed-warroom.ts # Database seed script
```

## Database Tables

- `domains` - Top-level org categories (Defense Acquisition, Energy, Geopolitics)
- `agents` - Expert archetypes with vector weights and cognitive biases
- `scenarios` - Situation briefings with context documents
- `threats` - Adversary tactics/vulnerabilities linked to scenarios
- `chains` - Multi-step compound threat sequences
- `chain_steps` - Individual steps within chains
- `sessions` - Two-round debate events
- `session_agents` - Agent assessments per session (Round 1 + Round 2)
- `session_findings` - Extracted findings from sessions
- `session_synthesis` - AI-generated synthesis reports
- `reports` - Exported markdown/JSON reports

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/warroom run dev` — Frontend
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API types
- `pnpm --filter @workspace/db run push` — Push schema to DB
- `pnpm --filter @workspace/scripts run seed-warroom` — Seed database

## AI Integration

Uses Replit AI Integrations for Anthropic Claude (claude-sonnet-4-6). No API key needed.
- Agent generation: `POST /api/agents/generate`
- Scenario AI assist: `POST /api/scenarios/:id/ai-assist`
- Threat generation: `POST /api/threats/generate`
- Chain generation: `POST /api/chains/generate`
- Session Round 1 (SSE streaming): `POST /api/sessions/:id/generate-round1`
- Session Round 2 (SSE streaming): `POST /api/sessions/:id/generate-round2`
- Synthesis: `POST /api/sessions/:id/generate-synthesis`

## Seed Data

- 3 Domains: Defense Acquisition (navy), Energy & Infrastructure (amber), Geopolitics & Economics (teal)
- 8 Defense Acquisition agents + 5 Energy agents
- 2 Scenarios with full context documents
- 2 Chains with 4 steps each ("The Silent Compromise", "Price Cascade")
