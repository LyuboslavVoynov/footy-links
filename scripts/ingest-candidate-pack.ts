import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

type CandidatePack = {
  sourceName: string;
  sourceReference?: string;
  players: Array<{
    name: string;
    nationality?: string;
    playerExternalId?: string;
    clubName: string;
    clubCountry?: string;
    clubExternalId?: string;
    appearances?: number;
    sourceReference: string;
    imageUrl?: string;
    clubImageUrl?: string;
    startYear?: number;
    endYear?: number;
    loan?: boolean;
  }>;
};

const prisma = new PrismaClient();
const filePath = process.argv[2];

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  if (!filePath) throw new Error("Usage: npm run intake:import -- path/to/club-era-pack.json");
  const pack = JSON.parse(await readFile(filePath, "utf8")) as CandidatePack;
  if (!pack.sourceName || !Array.isArray(pack.players) || !pack.players.length) throw new Error("The pack needs sourceName and at least one player tenure.");

  const uniqueLinks = new Set<string>();
  for (const item of pack.players) {
    if (!item.name || !item.clubName || !item.sourceReference) throw new Error("Every candidate needs name, clubName, and sourceReference.");
    if (item.appearances !== undefined && (!Number.isInteger(item.appearances) || item.appearances < 0)) throw new Error(`Invalid appearances for ${item.name}.`);
    const key = `${slugify(item.name)}:${slugify(item.clubName)}`;
    if (uniqueLinks.has(key)) throw new Error(`Duplicate player-club candidate in pack: ${item.name} → ${item.clubName}.`);
    uniqueLinks.add(key);
  }

  const batch = await prisma.ingestionBatch.create({ data: { sourceName: pack.sourceName, sourceReference: pack.sourceReference, status: "processing", candidateCount: pack.players.length } });
  try {
    for (const item of pack.players) {
      // Match the editorial catalogue by normalised name so provider exports enrich
      // existing fixture players instead of silently creating duplicate identities.
      // Ambiguous same-name cases stay in review and need an editorial decision.
      const playerSlug = slugify(item.name);
      const clubSlug = slugify(item.clubName);
      const player = await prisma.player.upsert({
        where: { slug: playerSlug },
        update: { nationality: item.nationality ?? undefined },
        create: { name: item.name, slug: playerSlug, nationality: item.nationality },
      });
      const club = await prisma.club.upsert({
        where: { slug: clubSlug },
        update: { country: item.clubCountry ?? undefined },
        create: { name: item.clubName, slug: clubSlug, country: item.clubCountry },
      });
      // Provider imagery is evidence for an editor to review, never an automatic
      // public asset. An approved record is deliberately left untouched.
      if (item.imageUrl) {
        const existingAsset = await prisma.mediaAsset.findUnique({ where: { playerId: player.id } });
        if (existingAsset?.rightsStatus !== "approved") {
          await prisma.mediaAsset.upsert({
            where: { playerId: player.id },
            update: { kind: "portrait", assetUrl: item.imageUrl, sourceName: pack.sourceName, sourceUrl: item.sourceReference, license: null, attribution: null, rightsStatus: "needs_review", verifiedAt: null },
            create: { playerId: player.id, kind: "portrait", assetUrl: item.imageUrl, sourceName: pack.sourceName, sourceUrl: item.sourceReference, rightsStatus: "needs_review" },
          });
        }
      }
      if (item.clubImageUrl) {
        const existingAsset = await prisma.mediaAsset.findUnique({ where: { clubId: club.id } });
        if (existingAsset?.rightsStatus !== "approved") {
          await prisma.mediaAsset.upsert({
            where: { clubId: club.id },
            update: { kind: "badge", assetUrl: item.clubImageUrl, sourceName: pack.sourceName, sourceUrl: item.sourceReference, license: null, attribution: null, rightsStatus: "needs_review", verifiedAt: null },
            create: { clubId: club.id, kind: "badge", assetUrl: item.clubImageUrl, sourceName: pack.sourceName, sourceUrl: item.sourceReference, rightsStatus: "needs_review" },
          });
        }
      }
      await prisma.playerClub.upsert({
        where: { playerId_clubId: { playerId: player.id, clubId: club.id } },
        update: {
          appearances: item.appearances,
          startYear: item.startYear,
          endYear: item.endYear,
          loan: Boolean(item.loan),
          sourceName: pack.sourceName,
          sourceReference: item.sourceReference,
          verificationStatus: "unverified",
          reviewStatus: "candidate",
          reviewerNote: null,
          reviewedAt: null,
          gameEligible: false,
        },
        create: {
          playerId: player.id, clubId: club.id, appearances: item.appearances, startYear: item.startYear, endYear: item.endYear, loan: Boolean(item.loan),
          sourceName: pack.sourceName, sourceReference: item.sourceReference, verificationStatus: "unverified", reviewStatus: "candidate",
        },
      });
    }
    await prisma.ingestionBatch.update({ where: { id: batch.id }, data: { status: "completed", processedAt: new Date() } });
    console.log(`Imported ${pack.players.length} candidates from ${pack.sourceName}. Review them at /admin/intake.`);
  } catch (error) {
    await prisma.ingestionBatch.update({ where: { id: batch.id }, data: { status: "failed", processedAt: new Date() } });
    throw error;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
