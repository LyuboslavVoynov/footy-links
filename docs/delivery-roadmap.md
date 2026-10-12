# Delivery roadmap

## Sprint 1 — Asset rights registry (complete)

- Record every player portrait and club badge with source, licence, attribution and rights status.
- Backfill existing Wikimedia URLs as `needs_review`; no asset is assumed approved merely because it displays.
- Build an editorial coverage view for the curated, playable graph.

## Sprint 2 — Verified provider intake

- Configure the selected provider privately.
- Ingest major-club era packs to the candidate queue.
- Require source evidence, an approved club, 50+ appearances per tenure and two qualifying links per challenge player.
- Send provider portrait and badge URLs to the same rights-review queue; only approved assets can be displayed.

## Sprint 3 — Gameplay quality assurance

- Run high-volume challenge generation checks.
- Add issue reporting and editor-curated daily puzzles.
- Block routes with unapproved media before public launch.

## Sprint 4 — Production hardening

- Configure admin access and secrets.
- Add deployment CI, backups and monitoring.
- Ship GitHub → Vercel previews → production with Supabase.

## Sprint 5 — Growth

- Accounts, global leaderboard, share cards, friend challenges and club collections.
