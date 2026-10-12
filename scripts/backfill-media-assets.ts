import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const [players, clubs] = await Promise.all([
    prisma.player.findMany({ where: { imageUrl: { not: null }, mediaAsset: null }, select: { id: true, imageUrl: true } }),
    prisma.club.findMany({ where: { imageUrl: { not: null }, mediaAsset: null }, select: { id: true, imageUrl: true } }),
  ]);
  console.log(`Found ${players.length} player portraits and ${clubs.length} club badges without registry records.`);
  if (!apply) { console.log("Dry run only. Re-run with --apply to create reviewable media records."); return; }
  await prisma.$transaction([
    ...players.map((player) => prisma.mediaAsset.create({ data: { playerId: player.id, kind: "portrait", assetUrl: player.imageUrl!, sourceName: "Wikimedia Commons", sourceUrl: player.imageUrl, rightsStatus: "needs_review" } })),
    ...clubs.map((club) => prisma.mediaAsset.create({ data: { clubId: club.id, kind: "badge", assetUrl: club.imageUrl!, sourceName: "Wikimedia Commons", sourceUrl: club.imageUrl, rightsStatus: "needs_review" } })),
  ]);
  console.log("Media asset registry backfilled. Existing assets intentionally require licence review before approval.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
