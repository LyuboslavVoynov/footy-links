import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { BIG_FIVE, fetchWikidataCareers } from "@/lib/data/sources/wikidata";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const offsetArgument = process.argv.find((argument) => argument.startsWith("--offset="));
const leagueArgument = process.argv.find((argument) => argument.startsWith("--league="));
const iterationsArgument = process.argv.find((argument) => argument.startsWith("--iterations="));
const limit = Math.min(Math.max(Number(limitArgument?.split("=")[1] ?? 100), 1), 250);
const offset = Math.max(Number(offsetArgument?.split("=")[1] ?? 0), 0);
const iterations = Math.min(Math.max(Number(iterationsArgument?.split("=")[1] ?? 1), 1), 200);
const league = leagueArgument?.split("=")[1] ?? "premierLeague";
const competitionId = BIG_FIVE[league as keyof typeof BIG_FIVE];
if (!competitionId) throw new Error(`Unsupported league '${league}'. Choose: ${Object.keys(BIG_FIVE).join(", ")}.`);
const prisma = new PrismaClient();

async function persistBatch(batchOffset: number) {
  const data = await fetchWikidataCareers({ competitionId, limit, offset: batchOffset });
  console.log(`Wikidata ${league} batch (offset ${batchOffset}): ${data.players.length} players, ${data.clubs.length} clubs, ${data.relationships.length} relationships.`);
  if (!apply) { console.log("Dry run only. Re-run with --apply to persist this batch."); return { players: 0, clubs: 0, relationships: 0, empty: data.relationships.length === 0 }; }

  const playerIds = new Map<string, string>();
  const clubIds = new Map<string, string>();
  let createdPlayers = 0;
  let createdClubs = 0;
  for (const player of data.players) {
    const existing = await prisma.player.findFirst({ where: { OR: [{ wikidataId: player.wikidataId }, { slug: player.slug }] }, select: { id: true } });
    const stored = existing ? await prisma.player.update({ where: { id: existing.id }, data: { wikidataId: player.wikidataId }, select: { id: true } }) : await prisma.player.create({ data: { name: player.name, slug: player.slug, nationality: player.nationality, wikidataId: player.wikidataId, eligibleForChallenge: false }, select: { id: true } });
    if (!existing) createdPlayers += 1;
    playerIds.set(player.wikidataId, stored.id);
  }
  for (const club of data.clubs) {
    const existing = await prisma.club.findFirst({ where: { OR: [{ wikidataId: club.wikidataId }, { slug: club.slug }] }, select: { id: true } });
    const stored = existing ? await prisma.club.update({ where: { id: existing.id }, data: { wikidataId: club.wikidataId }, select: { id: true } }) : await prisma.club.create({ data: { name: club.name, slug: club.slug, country: club.country, wikidataId: club.wikidataId }, select: { id: true } });
    if (!existing) createdClubs += 1;
    clubIds.set(club.wikidataId, stored.id);
  }
  let createdRelationships = 0;
  for (const relationship of data.relationships) {
    const playerId = playerIds.get(relationship.playerWikidataId);
    const clubId = clubIds.get(relationship.clubWikidataId);
    if (!playerId || !clubId) continue;
    const existing = await prisma.playerClub.findUnique({ where: { playerId_clubId: { playerId, clubId } }, select: { playerId: true } });
    if (existing) continue;
    try {
      await prisma.playerClub.create({ data: { playerId, clubId, startYear: relationship.startYear, endYear: relationship.endYear, loan: false, sourceName: "wikidata", sourceReference: relationship.sourceReference, validatedAt: new Date(), verificationStatus: "unverified" } });
      createdRelationships += 1;
    } catch (error) {
      // Another intake worker may have persisted this exact link after our lookup.
      // The compound database constraint is the final source of truth in that race.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
  }
  console.log(`Persisted ${createdPlayers} players, ${createdClubs} clubs, and ${createdRelationships} new unverified relationships.`);
  return { players: createdPlayers, clubs: createdClubs, relationships: createdRelationships, empty: data.relationships.length === 0 };
}

async function persist() {
  console.log(`All imported relationships remain unverified and are not challenge-eligible. Running ${iterations} ${iterations === 1 ? "batch" : "batches"}.`);
  const totals = { players: 0, clubs: 0, relationships: 0 };
  for (let batch = 0; batch < iterations; batch += 1) {
    const result = await persistBatch(offset + (batch * limit));
    totals.players += result.players;
    totals.clubs += result.clubs;
    totals.relationships += result.relationships;
    if (result.empty) break;
    if (batch < iterations - 1) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  console.log(`Import total: ${totals.players} players, ${totals.clubs} clubs, ${totals.relationships} relationships.`);
}

persist().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
