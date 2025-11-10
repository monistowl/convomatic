# Convomatic Rewrite

Convomatic is a research chat orchestration platform rebuilt from scratch around a TypeScript-first stack. This repository hosts a multi-app workspace with a Fastify backend, SvelteKit participant embed, and SvelteKit-powered admin dashboard. The rewrite follows the roadmap defined in [`docs/rewrite-roadmap.md`](docs/rewrite-roadmap.md) and focuses on resilient real-time pairing, durable transcripts, and lightweight front-end bundles.

## Project Structure

```
.
├── apps
│   ├── backend         # Fastify + Prisma API and WebSocket gateway
│   ├── admin           # Researcher dashboard (SvelteKit)
│   └── embed           # Participant-facing embed (SvelteKit)
├── packages
│   └── shared          # Shared TypeScript types and utilities
├── docs                # Architectural background and roadmap
└── README.md           # You are here
```

The repository uses npm workspaces so dependencies for each app remain isolated while still allowing shared packages.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `apps/backend/.env.example` to `.env` and update the secrets for your environment.

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. **Generate Prisma client and run migrations**

   ```bash
   npm run prisma:generate --workspace backend
   npm run prisma:migrate --workspace backend
   ```

4. **Start the development servers**

   ```bash
   npm run dev --workspaces
   ```

   This command launches the Fastify API (port 3333 by default) and both SvelteKit applications. Adjust ports in each app's `package.json` if needed.

## Backend Overview

The backend (`apps/backend`) provides REST APIs, WebSocket pairing, and durable storage:

- Fastify with Zod schemas and OpenAPI metadata for type-safe routing.
- Prisma models for projects, prompts, sessions, and messages (`apps/backend/prisma/schema.prisma`).
- Redis-backed matchmaking queues to coordinate participant pairing across nodes.
- CSV transcript exports and prompt replay endpoints.
- Observability via Pino logging and OpenTelemetry-friendly hooks.

See [`apps/backend/src/index.ts`](apps/backend/src/index.ts) and the `routes/` directory for details.

## Front-End Clients

The repository contains two SvelteKit applications:

- **Admin Dashboard** (`apps/admin`): Project management, prompt editing, live session monitor, and transcript downloads. Tailwind CSS powers the design system.
- **Participant Embed** (`apps/embed`): Lightweight widget for Qualtrics/MTurk iframes with real-time chat and prompt playback.

Each app consumes the shared API types from `packages/shared` to stay aligned with the backend contracts.

## Testing and Quality

- Run unit tests with `npm test --workspaces`.
- Lint code with `npm run lint --workspaces`.
- End-to-end tests will live alongside each SvelteKit application (`apps/*/tests`).

Continuous integration executes linting, testing, and type checks across all workspaces. Refer to `.github/workflows/ci.yml` (to be added) for pipeline details.

## Roadmap Alignment

This rewrite establishes the architectural foundation described in the roadmap:

- Modular Fastify backend with Prisma models and Redis matchmaking queues.
- Dedicated participant embed and admin dashboard SvelteKit clients.
- Shared type definitions for consistent API contracts.
- Scripts and configuration to support automated testing and deployment.

Future milestones include expanding automated tests, integrating authentication providers, and implementing production-ready observability and deployment scripts.

## License

MIT
