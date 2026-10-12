import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { commonsFileUrl, imageFileFromClaims, type WikidataImageClaims } from "@/lib/data/sources/wikimedia";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const scope = process.argv.find((argument) => argument.startsWith("--scope="))?.split("=")[1] ?? "playable";
const limit = Math.min(Math.max(Number(process.argv.find((argument) => argument.startsWith("--limit="))?.split("=")[1] ?? 250), 1), 2000);

async function fetchClaims(ids: string[]) {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("props", "claims");
  url.searchParams.set("format", "json");
  const response = await fetch(url, { headers: { "User-Agent": "FootballLinks/0.1 image-enrichment" } });
  if (!response.ok) throw new Error(`Wikidata image lookup failed (${response.status}).`);
  return (await response.json() as { entities?: Record<string, WikidataImageClaims> }).entities ?? {};
}

async function main() {
  if (!["playable", "archive", "all"].includes(scope)) throw new Error("--scope must be playable, archive, or all.");
  const playerWhere = scope === "playable" ? { eligibleForChallenge: true, imageUrl: null, wikidataId: { not: null } } : { imageUrl: null, wikidataId: { not: null } };
  const clubWhere = scope === "playable" ? { gameEligible: true, imageUrl: null, wikidataId: { not: null } } : { imageUrl: null, wikidataId: { not: null } };
  const [players, clubs] = await Promise.all([
    prisma.player.findMany({ where: playerWhere, take: limit, select: { id: true, name: true, wikidataId: true } }),
    prisma.club.findMany({ where: clubWhere, take: limit, select: { id: true, name: true, wikidataId: true } }),
  ]);
  const candidates = [
    ...players.flatMap((item) => item.wikidataId ? [{ ...item, type: "player" as const }] : []),
    ...clubs.flatMap((item) => item.wikidataId ? [{ ...item, type: "club" as const }] : []),
  ];
  const updates: Array<{ id: string; type: "player" | "club"; url: string }> = [];
  for (let index = 0; index < candidates.length; index += 50) {
    const chunk = candidates.slice(index, index + 50);
    const entities = await fetchClaims(chunk.map((item) => item.wikidataId!));
    for (const item of chunk) {
      const file = imageFileFromClaims(entities[item.wikidataId!] ?? {}, item.type);
      if (file) updates.push({ id: item.id, type: item.type, url: commonsFileUrl(file, item.type === "player" ? 480 : 240) });
    }
  }
  console.log(`Found ${updates.length} Wikimedia images from ${candidates.length} ${scope} candidates.`);
  if (!apply) { console.log("Dry run only. Re-run with --apply to save these image URLs."); return; }
  await prisma.$transaction(updates.map((update) => update.type === "player"
    ? prisma.player.update({ where: { id: update.id }, data: { imageUrl: update.url } })
    : prisma.club.update({ where: { id: update.id }, data: { imageUrl: update.url } })));
  console.log(`Saved ${updates.length} image URLs. Wikimedia file pages remain the source of licence and attribution details.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
