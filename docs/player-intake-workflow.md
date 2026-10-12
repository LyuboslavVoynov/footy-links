# Curated player intake

The raw Wikidata archive is retained for provenance and duplicate resolution, but is marked `archived` and never appears in the editorial queue or gameplay graph.

## Intake flow

1. Export a small, licensed provider response into the candidate-pack format in `candidate-pack.example.json`. For API-Football, add `API_FOOTBALL_KEY` privately and run `npm run intake:export-api-football -- --team=<provider-team-id> --seasons=2022,2023,2024 --output=tmp/club-pack.json`. The exporter defaults to your 50-appearance candidate threshold, so a player is only considered for that exact club once they meet it. The free plan currently permits only three result pages; when using it, add `--pages=3`. This creates a deliberately page-limited candidate source, not a complete historical roster. Exports are paced to remain within the free plan's request-rate limit.
2. Check the generated JSON, then run `npm run intake:import -- <pack.json>`.
3. Approve the club catalogue entry if needed with `npm run approve:club-catalogue -- --apply`.
4. Review candidates at `/admin/intake`. Approval needs a source reference, an approved club, and at least 50 senior competitive appearances for that exact club.
5. Run `npm run curate:game-graph -- --apply` to atomically rebuild the playable graph from approved relationships. A player needs at least two qualifying links to become a challenge endpoint, so the game cannot route into a dead end.

The importer deliberately does not call a provider directly. The API-Football exporter reads its key only from the private environment and turns the response into a reviewable, reproducible pack. It must never be used to bypass a provider's plan, rate limit, or licence. Provider portraits and badges are stored in the asset registry as `needs_review`; they are not shown in gameplay until an editor records a licence and attribution, then approves them at `/admin/assets`.

## Visual assets

Run `npm run images:enrich-wikimedia -- --scope=playable --apply` for records that already have Wikidata IDs. Then run `npm run images:resolve-playable -- --limit=25 --apply` repeatedly for conservative, exact-name matching of remaining playable players and clubs. The resolver deliberately processes small batches to respect Wikimedia rate limits; review any unmatched names rather than substituting a guessed image.
