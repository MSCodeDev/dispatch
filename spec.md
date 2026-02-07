# Dispatch — Project Specification

## Purpose

Dispatch is a personal, locally-hosted web application for managing tasks, notes, projects, and daily workflows in a single unified interface. It is a private tool — built, hosted, and consumed by a single user on their local machine.

## Core Principles

- **Local-first**: Runs on `localhost`, data stays on disk in a SQLite file. No cloud dependency for data storage.
- **Single user, authenticated**: OAuth2 login (GitHub) gates access. Even though it's local, auth prevents accidental exposure if the port is reachable on the network.
- **REST API driven**: The UI is a React SPA that communicates with Next.js API Route Handlers over standard REST (JSON request/response). No GraphQL.
- **Simple and fast**: SQLite for zero-ops persistence. No external database server to manage.

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Framework      | Next.js 16 (App Router)          |
| Language       | TypeScript                        |
| UI             | React 19, Tailwind CSS v4         |
| Database       | SQLite via better-sqlite3         |
| ORM            | Drizzle ORM                       |
| Authentication | NextAuth.js v5 (OAuth2 / GitHub) |
| Runtime        | Node.js                           |

## Authentication

- OAuth2 via NextAuth.js with GitHub as the provider.
- All API routes (except `/api/auth/*`) require a valid session.
- The `withAuth` wrapper in `src/lib/api.ts` enforces this at the route level.
- Sessions are managed by NextAuth.js (JWT-based by default).

## Data Model

### Auth Tables
- **users** — Profile info synced from the OAuth provider.
- **accounts** — OAuth provider link records (supports multiple providers per user).
- **sessions** — Active session tracking.

### Domain Tables
- **tasks** — User tasks with title, description, status (open/in_progress/done), priority (low/medium/high), dueDate, and optional projectId. Supports soft-delete via `deletedAt`.
- **notes** — Markdown notes with title and content. Supports soft-delete via `deletedAt`.
- **projects** — Groupings of tasks with name, description, status (active/paused/completed), and color. Supports soft-delete via `deletedAt`.
- **dispatches** — Daily workflow entries with date (unique per user per day), summary, and finalized flag.
- **dispatch_tasks** — Join table linking tasks to dispatches.

### Soft-Delete & Recycle Bin
- Tasks, notes, and projects use soft-delete: `DELETE` sets a `deletedAt` timestamp instead of removing the row.
- Soft-deleted items are excluded from all list, get, and search queries.
- The Recycle Bin (`/recycle-bin`) shows all soft-deleted items with the option to restore or permanently delete.
- Items are automatically purged after 30 days.

## API Design

- Routes live under `src/app/api/`.
- Each resource gets its own directory (e.g., `src/app/api/tasks/route.ts`).
- Standard HTTP verbs: `GET` (list/read), `POST` (create), `PUT` (update), `DELETE` (soft-delete).
- All responses use a consistent JSON envelope via `jsonResponse()` and `errorResponse()` helpers.
- Route params for single-resource operations use Next.js dynamic segments (e.g., `src/app/api/tasks/[id]/route.ts`).
- Pagination via `?page=&limit=` query params on list endpoints.
- Global search via `GET /api/search?q=` across tasks, notes, dispatches, and projects.
- Recycle bin via `GET /api/recycle-bin` (list deleted items) and `POST /api/recycle-bin` (restore or permanently delete).

### Resource Endpoints
| Resource   | List/Create            | Get/Update/Delete           | Extras                                          |
| ---------- | ---------------------- | --------------------------- | ----------------------------------------------- |
| Tasks      | `/api/tasks`           | `/api/tasks/[id]`           | Filters: status, priority, projectId            |
| Notes      | `/api/notes`           | `/api/notes/[id]`           | Filter: search (title)                          |
| Projects   | `/api/projects`        | `/api/projects/[id]`        | `/api/projects/[id]/tasks`, `?include=stats`    |
| Dispatches | `/api/dispatches`      | `/api/dispatches/[id]`      | `/api/dispatches/[id]/tasks`, `.../complete`    |
| Recycle Bin| `/api/recycle-bin`     | —                           | POST with action: restore / delete              |
| Search     | `/api/search?q=`       | —                           | Cross-entity search                             |
| Profile    | `/api/me`              | —                           | Current user info                               |

## UI Structure

- Next.js App Router pages under `src/app/`.
- Client-side data fetching from REST APIs via a typed API client (`src/lib/client.ts`).
- Reusable components in `src/components/`.
- Tailwind CSS v4 for all styling.
- Collapsible left sidebar with navigation sections: Overview, Workspace, Projects, and Account.
- Dark mode support via Tailwind `dark:` variants, toggled in the sidebar.
- Toast notifications for mutation feedback.
- Keyboard shortcuts for common actions.

### Pages
| Route           | Description                                              |
| --------------- | -------------------------------------------------------- |
| `/`             | Dashboard with quick actions, stats, and recent activity |
| `/dispatch`     | Daily dispatch view with summary editor and task links   |
| `/inbox`        | Priority inbox for high-priority and overdue tasks       |
| `/tasks`        | Task list with filters, sorting, and inline status edits |
| `/notes`        | Note list with search, create, and inline delete         |
| `/notes/[id]`   | Markdown note editor with live preview and auto-save     |
| `/projects`     | Project list with stats, create/edit, and detail views   |
| `/recycle-bin`  | Recycle bin for restoring or permanently deleting items   |
| `/profile`      | User profile with account details and usage stats        |
| `/login`        | OAuth sign-in page                                       |

## Hosting

- Runs locally via `npm run dev` during development.
- Production mode via `npm run build && npm run start` for a more optimized local server.
- No deployment target — this is a personal localhost application.

## Testing

- Vitest for unit and integration tests, colocated with source under `__tests__/` directories.
- Test helpers provide in-memory SQLite database factory and auth mocking.
- When appropriate, test with the chrome-devtools MCP for visual/interactive verification. Check to see if a dev server is already running before trying to start a new one.
