import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import qualifyingClubs from "../prisma/data/qualifying-clubs.json";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const qualifyingClubSlugs = qualifyingClubs.map((club) => slugify(club.name));

async function main() {
  const edges = await prisma.playerClub.findMany({
    select: { playerId: true, club: { select: { slug: true } } },
  });
  const qualifyingEdges = edges.filter((edge) => qualifyingClubSlugs.includes(edge.club.slug));
  const playerIds = [...new Set(qualifyingEdges.map((edge) => edge.playerId))];

  const allCareerEdges = edges.filter((edge) => playerIds.includes(edge.playerId));
  const visibleClubSlugs = [...new Set(allCareerEdges.map((edge) => edge.club.slug))];
  console.log(`Prestige rule: ${qualifyingClubSlugs.length} qualifying clubs admit ${playerIds.length} players. Their complete recorded careers expose ${allCareerEdges.length} links across ${visibleClubSlugs.length} clubs.`);
  if (!apply) {
    console.log("Dry run only. Add --apply to update the gameplay pool; raw player and club records are preserved.");
    return;
  }

  await prisma.$transaction([
    prisma.club.updateMany({ data: { gameEligible: false } }),
    prisma.club.updateMany({ where: { slug: { in: visibleClubSlugs } }, data: { gameEligible: true } }),
    prisma.playerClub.updateMany({ data: { gameEligible: false } }),
    prisma.playerClub.updateMany({ where: { playerId: { in: playerIds } }, data: { gameEligible: true } }),
    prisma.player.updateMany({ data: { eligibleForChallenge: false } }),
    prisma.player.updateMany({ where: { id: { in: playerIds } }, data: { eligibleForChallenge: true } }),
  ]);
  console.log("Prestige gameplay pool applied.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
