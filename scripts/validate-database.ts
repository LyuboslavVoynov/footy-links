import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { validateDataset } from "@/lib/data/validate";

const prisma = new PrismaClient();

async function main() {
  const [players, clubs, edges] = await Promise.all([
    prisma.player.findMany({ select: { name: true, slug: true, nationality: true, imageUrl: true, eligibleForChallenge: true } }),
    prisma.club.findMany({ select: { name: true, slug: true, country: true, imageUrl: true } }),
    prisma.playerClub.findMany({ include: { player: { select: { slug: true } }, club: { select: { slug: true } } } }),
  ]);
  const report = validateDataset({ players: players.map((player) => ({ ...player, nationality: player.nationality ?? undefined, imageUrl: player.imageUrl ?? undefined })), clubs: clubs.map((club) => ({ ...club, country: club.country ?? undefined, imageUrl: club.imageUrl ?? undefined })), playerClubs: edges.map((edge) => ({ playerSlug: edge.player.slug, clubSlug: edge.club.slug, startYear: edge.startYear ?? undefined, endYear: edge.endYear ?? undefined, loan: edge.loan, appearances: edge.appearances ?? undefined, sourceName: edge.sourceName ?? undefined, sourceReference: edge.sourceReference ?? undefined, validatedAt: edge.validatedAt ?? undefined })) });
  console.log(report);
  if (report.orphanPlayers || report.orphanClubs || report.brokenRelationships || report.likelyDuplicatePlayers || report.likelyDuplicateClubs || report.disconnectedEligiblePlayers || report.invalidChallenges) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
