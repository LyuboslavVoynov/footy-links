import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { qualifiesForChallengePool, qualifiesForCuratedGame } from "@/lib/game/eligibility";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const tenures = await prisma.playerClub.findMany({
    select: {
      playerId: true,
      clubId: true,
      appearances: true,
      verificationStatus: true,
      reviewStatus: true,
      club: { select: { gameEligible: true } },
    },
  });
  const eligible = tenures.filter((tenure) => qualifiesForCuratedGame({
    appearances: tenure.appearances,
    verificationStatus: tenure.verificationStatus,
    reviewStatus: tenure.reviewStatus,
    clubGameEligible: tenure.club.gameEligible,
  }));
  const qualifyingCounts = new Map<string, number>();
  for (const tenure of eligible) qualifyingCounts.set(tenure.playerId, (qualifyingCounts.get(tenure.playerId) ?? 0) + 1);
  const qualifyingPlayerIds = [...qualifyingCounts].filter(([, count]) => qualifiesForChallengePool(count)).map(([playerId]) => playerId);
  const challengeEligible = eligible.filter((tenure) => qualifyingPlayerIds.includes(tenure.playerId));

  console.log(`Curated candidates: ${eligible.length} qualifying tenures across ${qualifyingCounts.size} players; ${challengeEligible.length} links across ${qualifyingPlayerIds.length} players can form challenge routes.`);
  if (!apply) {
    console.log("Dry run only. Add --apply after appearance records and club approvals have been reviewed.");
    return;
  }

  await prisma.$transaction([
    prisma.playerClub.updateMany({ data: { gameEligible: false } }),
    prisma.player.updateMany({ data: { eligibleForChallenge: false } }),
    ...challengeEligible.map((tenure) => prisma.playerClub.update({
      where: { playerId_clubId: { playerId: tenure.playerId, clubId: tenure.clubId } },
      data: { gameEligible: true },
    })),
    prisma.player.updateMany({ where: { id: { in: qualifyingPlayerIds } }, data: { eligibleForChallenge: true } }),
  ]);
  console.log("Curated game graph rebuilt.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
