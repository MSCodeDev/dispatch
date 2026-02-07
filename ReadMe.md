# Dispatch

Dispatch is a local-first, single-user task and note hub built with Next.js, SQLite, and NextAuth. It runs entirely on `localhost` and keeps your data on disk.

## Features
- Tasks with status, priority, due dates, and projects
- Projects with stats and task rollups
- Notes with Markdown preview and export
- Daily dispatch view for planning and rollovers
- Global search across tasks, notes, and dispatches
- Dark mode, keyboard shortcuts, and polished UI motion

## Tech Stack
- Next.js App Router, React, TypeScript
- SQLite via `better-sqlite3` + Drizzle ORM
- NextAuth (GitHub OAuth + dev credentials)
- Tailwind CSS v4

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` (gitignored) with:
```bash
# Required for NextAuth
AUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (optional but recommended)
AUTH_GITHUB_ID=your_github_oauth_client_id
AUTH_GITHUB_SECRET=your_github_oauth_client_secret

# Optional (defaults to ./dispatch.db)
DATABASE_URL=./dispatch.db
```

3. Apply migrations (first run or after schema changes):
```bash
npm run db:migrate
```

4. Start the dev server:
```bash
npm run dev
```

### Dev Login (optional)
In development, a credentials-based login is available.

- Seeded credentials account: `test@dispatch.local` / `test`
- You can also register a new local account from the login page.

## Useful Scripts
- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run start` — start the production server
- `npm run db:generate` — generate migrations
- `npm run db:migrate` — apply migrations
- `npm run db:seed` — seed sample data
- `npm test` — run tests

## Notes
- This app is designed to run locally on your machine.
- Data is stored in SQLite (default: `./dispatch.db`).
