# Convomatic Rewrite: Design & Roadmap

## Background and Current State
Convomatic was originally implemented on Sails.js with server-rendered EJS views and a bundled Parasails/Vue admin shell. Real-time chat pairing is handled directly in the `ChatController`, which tracks waiting participants in a global in-memory map, spins up chats once a quorum is met, and multicasts Socket.io messages while persisting the transcript to the ORM.【F:api/controllers/ChatController.js†L8-L106】 Projects capture experiment configuration, including timed prompts and welcome/farewell messaging, with prompt metadata serialized as JSON after being parsed from array-style form submissions.【F:api/controllers/ProjectController.js†L34-L60】【F:api/models/Project.js†L16-L43】 The embedded chat view injects a large number of legacy scripts, drives the Socket.io client, and sequentially delivers prompts and farewell text to participants based on the project configuration.【F:views/chat/embed.ejs†L8-L141】 Researchers currently distribute Qualtrics iframe snippets and CSV transcript downloads from the project dashboard.【F:views/project/show.ejs†L20-L67】 While functional, the monolithic Sails stack is heavy, stores pairing state in memory only, and makes it difficult to evolve toward cloud-native infrastructure or modern front-end ergonomics.

## Goals for the Rewrite
- Deliver a lean, maintainable, TypeScript-first codebase using modern but lightweight frameworks.
- Preserve core researcher workflows: project setup, participant pairing, timed prompt delivery, transcript logging/exports, and Qualtrics/MTurk distribution.
- Improve resilience (stateless scaling, durable pairing state, recoverable transcripts) and observability.
- Provide a slim, mobile-friendly participant embed and a focused admin UI without Parasails cruft.
- Enable automated testing and continuous delivery.

## Non-Goals
- Re-implement the original Sails authentication/billing boilerplate. The rewrite will defer to an external identity provider or provide minimal passwordless auth.
- Build MTurk task publishing or Qualtrics survey authoring tools; we only manage chat pairing embeds and logging.
- Migrate historical data automatically; transcripts can be re-imported manually if needed.

## Proposed Architecture
### High-Level Overview
Adopt a modular, services-light architecture with a single deployable backend (Fastify + TypeScript) and two front-end clients (participant embed + admin dashboard) delivered via a Vite build pipeline. Use PostgreSQL with Prisma ORM for structured data and Redis for transient matchmaking state.

```
[Qualtrics/MTurk iframe]
        |
   Participant Embed (SvelteKit)
        |
   WebSocket Gateway  ——  Fastify REST API  ——  PostgreSQL (Prisma)
        |                     |                 |
   Redis (waiting rooms)   Admin Dashboard (Vite + SvelteKit)
```

### Backend Service
- **Framework**: Fastify with TypeScript for low overhead, schema-driven routing, and first-class async support.
- **Transport**: REST/JSON APIs for CRUD operations, secured via JWT or signed links. Use Zod schemas for validation and OpenAPI generation.
- **Persistence**: PostgreSQL via Prisma models for projects, prompts, chats, messages, participants, and experiment runs. Support soft deletes and audit timestamps.
- **Authentication**: Integrate with Auth0 or Clerk for admins; participant embeds use signed session tokens generated per Qualtrics response/MTurk assignment.
- **Storage**: Store transcripts in relational tables; optionally archive to S3 for CSV exports.

### Real-Time Pairing & Messaging
- **Gateway**: Fastify WebSocket plugin (or Socket.io if reconnection semantics are preferred) mounted under `/ws`. WebSockets keep the stack lightweight while enabling message broadcasting.
- **Matchmaking**: Replace the in-memory `sails.waitingrooms` with a Redis-backed queue keyed by project ID, storing participant metadata and expirations. Workers pop `quorum` participants atomically to start a chat session, ensuring horizontal scalability.
- **Session Lifecycle**: Persist chat sessions immediately, associate participants, and emit a session token. The gateway relays messages and system prompts, appending transcripts to PostgreSQL in a transactional way.
- **Prompt Scheduling**: Represent prompts with absolute offsets and optional assets. Server streams prompt events so late subscribers receive missed messages, preventing the race conditions seen in the current client-timer approach.【F:views/chat/embed.ejs†L95-L141】

### Front-End Clients
- **Participant Embed**: SvelteKit single-page widget compiled to a lightweight bundle (<50 kB). It connects to the WebSocket gateway, renders prompts/messages, supports accessibility (ARIA live regions), and exposes hooks for Qualtrics completion codes.
- **Admin Dashboard**: SvelteKit multi-page app with routing for project CRUD, real-time monitoring, and transcript exports. Fetch data via REST or a generated client SDK. Provide WYSIWYG prompt ordering and preview features inspired by the current server-rendered tables.【F:views/project/show.ejs†L20-L42】
- **Design System**: Tailwind CSS + Radix UI for consistent styling without Bootstrap.

### External Integrations
- **Qualtrics**: Generate iframe/snippet templates with signed query parameters (e.g., project ID, participant token). Offer webhook endpoint to receive Qualtrics event callbacks for automated enrollment.
- **MTurk**: Provide API endpoints to register assignment IDs and mark chats complete, enabling reward automation.
- **Email/Webhooks**: Optional notifications for researchers when chats complete or if participants time out.

### Data Model Sketch
- `Project`: name, quorum, welcome/farewell copy, prompt sequence, status.
- `Prompt`: order, body, delay seconds, optional asset URL, asset type.
- `ChatSession`: project FK, state (waiting/active/closed), started/ended timestamps.
- `Participant`: anonymized ID, external reference (Qualtrics response ID), role metadata.
- `SessionParticipant`: join table between sessions and participants with join/leave timestamps.
- `Message`: session FK, sender type (participant/system), payload, delivered_at.
- `PromptEvent`: records each system prompt sent for auditing and replay.

### API Surface (illustrative)
- `POST /api/projects` create/update projects, `GET /api/projects/:id` fetch configuration, `POST /api/projects/:id/publish` generate embed tokens.
- `POST /api/sessions/join` register participant, returns WebSocket token.
- `GET /api/sessions/:id/messages` paginated transcript, `GET /api/sessions/:id/export` CSV download.
- `POST /api/webhooks/qualtrics` receive survey events, `POST /api/mturk/callback` mark completions.

### Observability & Operations
- Instrument Fastify with pino + OpenTelemetry to emit metrics (session counts, wait times, message throughput).
- Add health and readiness probes for container orchestration.
- Provide feature flags via environment-based config.
- Use GitHub Actions for CI (lint, unit tests, integration tests with docker-compose).

## Migration & Rollout Strategy
1. Stand up the new backend alongside the legacy system; implement dual-write logging adapters so current chats can be mirrored for validation.
2. Replace the embed in a pilot project by loading the SvelteKit widget inside the existing iframe distribution while still invoking Sails APIs. Validate UX and network reliability.
3. Gradually migrate project CRUD and exports to the new admin dashboard; once parity is reached, cut over DNS and retire Sails services.
4. Archive the Sails repository and document how to recover transcripts from legacy storage if needed.

## Roadmap & Milestones
1. **Discovery & Foundations (2 weeks)**
   - Finalize requirements with research stakeholders and catalog legacy data needs.
   - Scaffold Fastify + Prisma backend, set up CI/CD, and configure PostgreSQL/Redis infrastructure.
   - Implement base data models and migrations.

2. **Real-Time Core (3 weeks)**
   - Build Redis-backed matchmaking service and WebSocket gateway.
   - Implement message persistence, prompt scheduling pipeline, and CSV export endpoints.
   - Write automated load tests simulating MTurk traffic.

3. **Participant Embed (2 weeks)**
   - Develop SvelteKit widget with responsive UI, accessibility, and reconnection handling.
   - Integrate prompt playback timeline and system messaging parity with legacy behavior.【F:views/chat/embed.ejs†L95-L141】
   - Ship instrumentation for latency/error tracking (Sentry, LogRocket optional).

4. **Admin Dashboard (3 weeks)**
   - Implement project CRUD forms, prompt editors, and live session monitor inspired by current dashboard workflows.【F:views/project/show.ejs†L20-L67】【F:api/controllers/ProjectController.js†L34-L133】
   - Add authentication + RBAC, CSV export triggers, and Qualtrics snippet generation.
   - Provide automated regression tests (Playwright) for key flows.

5. **Integration & Cutover (2 weeks)**
   - Wire Qualtrics/MTurk hooks, migrate existing projects, and document embedding instructions.
   - Run parallel pilot, monitor metrics, and execute final switchover with rollback plan.

## Risks & Open Questions
- **Scaling**: Redis queues must handle bursty MTurk arrivals; consider sharding if concurrency exceeds single-node limits.
- **Browser Constraints**: Qualtrics iframes may block WebSockets on certain networks; need SSE fallback.
- **Compliance**: Storing MTurk identifiers may invoke privacy requirements (GDPR/IRB). Determine data retention policies early.
- **Prompt Assets**: Hosting researcher-provided images/files securely (signed S3 URLs) requires validation pipeline.
- **Extensibility**: Future experiments may need branching logic or audio/video; ensure protocol design allows extensible message types.

