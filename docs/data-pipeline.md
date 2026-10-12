# Data pipeline

Football Links imports provider-shaped raw records, normalizes them into application-owned player, club, and player-club objects, validates them, and only then persists them through Prisma.

The checked-in representative fixture is intentionally limited development data. It is not evidence of complete senior appearance histories and must not be presented as production-quality coverage.

Before adopting an external source, confirm that its licence permits this use and map its identifiers into the normalization layer. Preserve source name and reference per relationship, validate imports with `npm run validate:data`, and only then seed the database.

## Wikidata

`npm run import:wikidata -- --limit=50 --offset=0` runs a bounded Premier League candidate batch as a dry run. Add `--apply` only after reviewing its totals. Increment `--offset` for later batches. Wikidata-derived links are stored with `verificationStatus = "unverified"` and are deliberately not challenge-eligible until independently verified as senior competitive appearances.
