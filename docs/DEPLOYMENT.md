# Deploying Football Links

The app is ready for a standard GitHub-to-Vercel deployment. Vercel recognises Next.js automatically; no `vercel.json` is required.

## 1. Create the GitHub repository

1. Create a new empty repository on GitHub called `football-links`.
2. Do **not** add a README, `.gitignore`, or licence there: this local project already has them.
3. Add the GitHub repository as the `origin` remote, then push the initial commit.

The `.env` file is ignored and must never be committed.

## 2. Import it into Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Leave the framework preset as **Next.js** and keep the project root as the repository root.
3. Use the default build command, `npm run build`. The `postinstall` script generates the Prisma client during installation.

## 3. Add Vercel environment variables

Add these under **Project → Settings → Environment Variables**. Apply required values to Production and Preview.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase pooled PostgreSQL connection string. |
| `INTAKE_ADMIN_PASSWORD` | Yes | Protects the `/admin/intake` workflow in production. Use a long unique value. |
| `FOOTBALL_DATA_API_KEY` | Optional | Used only when running the server-side crest-sync command. It is never sent to the browser. |
| `API_FOOTBALL_KEY` | Optional | Used only for controlled candidate-data export workflows. |

Do not set any of these with a `NEXT_PUBLIC_` prefix.

## 4. Deploy and verify

After deployment, open `/game` and confirm a practice challenge loads. The production app reads the existing Supabase data; it does not reseed or call football-data.org while a player is viewing a game.

If you later update data or crests, run the controlled scripts from a trusted environment with the same database credentials. Never expose provider keys in client code.
