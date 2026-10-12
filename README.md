# Football Links

A football knowledge game where players connect two footballers through the clubs in their senior careers.

Each challenge has a minimum route of:

`Player → Club → Player → Club → Player`

The game uses a curated player and club graph, so eligible players are selected for recognisable careers rather than simply broad data coverage.

## Stack

- Next.js App Router and React
- TypeScript
- PostgreSQL on Supabase
- Prisma ORM
- Vitest and Playwright
- Vercel for deployment

## Run locally

1. Install Node.js 20 or 22.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template and add your database connection:

   ```bash
   cp .env.example .env
   ```

4. Generate Prisma's client and seed the database when setting up a fresh local database:

   ```bash
   npm run prisma:generate
   npm run db:seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000/game](http://localhost:3000/game).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the local development server. |
| `npm run test` | Run unit tests. |
| `npm run build` | Create and validate a production build. |
| `npm run db:seed` | Seed the database with curated football data. |
| `npm run curate:prestige-pool -- --apply` | Refresh the playable player pool using the eligibility rules. |
| `npm run sync:football-data-crests` | Refresh approved team crest URLs from football-data.org. |

## Environment variables

Copy `.env.example` to `.env`. The values in `.env` are private and must never be committed.

| Variable | Required | Use |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `INTAKE_ADMIN_PASSWORD` | Production | Protects the data-intake workflow. |
| `FOOTBALL_DATA_API_KEY` | Optional | Server-side football-data.org crest sync only. |
| `API_FOOTBALL_KEY` | Optional | Controlled candidate-data export only. |

Do not expose any of these values in client-side code or name them with `NEXT_PUBLIC_`.

## Deployment

The production deployment runs on Vercel and connects to the existing Supabase database. See [the deployment guide](docs/DEPLOYMENT.md) for the required Vercel variables and release checks.

## Contribution workflow

Changes are made on a branch and proposed through a pull request. After review and merge into `main`, Vercel deploys the updated application.
