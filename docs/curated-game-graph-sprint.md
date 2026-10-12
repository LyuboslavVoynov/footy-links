# Curated Game Graph sprint

## Product rule

- A club appears in gameplay only after editorial approval.
- A player-club relationship appears in gameplay only when it has a verified senior competitive appearance total of at least 50.
- A player becomes challenge-eligible only through qualifying relationships.
- A short tenure never becomes playable just because the player is notable elsewhere.

## Delivery plan

1. Keep provider imports in the archive with `gameEligible = false`.
2. Record official appearance totals and a source reference per tenure.
3. Approve the club catalogue through `Club.gameEligible`.
4. Run `npm run curate:game-graph -- --apply` to promote only qualifying relationships.
5. Generate challenges only from the curated graph and validate its connected component.

## Temporary development fallback

Until verified appearance data is loaded, the game uses the existing hand-curated fixture players and approved club catalogue. Imported Wikidata players never enter this fallback.
