import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { commonsFileUrl, imageFileFromClaims, type WikidataImageClaims } from "@/lib/data/sources/wikimedia";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const limit = Math.min(Math.max(Number(process.argv.find((argument) => argument.startsWith("--limit="))?.split("=")[1] ?? 25), 1), 50);

const normalise = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "").toLowerCase();

async function searchExact(name: string, type: "player" | "club") {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.search = new URLSearchParams({ action: "wbsearchentities", search: name, language: "en", limit: "10", format: "json" }).toString();
  const response = await fetchWithRetry(url);
  const payload = await response.json() as { search?: Array<{ id: string; label?: string; description?: string }> };
  const descriptionPattern = type === "player" ? /footballer|football player|association football/i : /football club|association football club|sports club/i;
  return payload.search?.find((result) => result.label && normalise(result.label) === normalise(name) && descriptionPattern.test(result.description ?? ""));
}

async function claimsFor(ids: string[]) {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.search = new URLSearchParams({ action: "wbgetentities", ids: ids.join("|"), props: "claims", format: "json" }).toString();
  const response = await fetchWithRetry(url);
  return (await response.json() as { entities?: Record<string, WikidataImageClaims> }).entities ?? {};
}

async function fetchWithRetry(url: URL) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "FootballLinks/0.1 image-resolution (local editorial tool)" } });
    if (response.status !== 429 || attempt === 3) {
      if (!response.ok) throw new Error(`Wikidata image lookup failed (${response.status}).`);
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000 * (attempt + 1)));
  }
  throw new Error("Wikidata image lookup failed after retries.");
}

async function main() {
  const [players, clubs] = await Promise.all([
    prisma.player.findMany({ where: { eligibleForChallenge: true, imageUrl: null }, take: limit, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.club.findMany({ where: { gameEligible: true, imageUrl: null }, take: limit, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const candidates = [
    ...players.map((item) => ({ ...item, type: "player" as const })),
    ...clubs.map((item) => ({ ...item, type: "club" as const })),
  ];
  const matches: Array<{ id: string; name: string; type: "player" | "club"; wikidataId: string }> = [];
  for (const candidate of candidates) {
    const result = await searchExact(candidate.name, candidate.type);
    if (result) matches.push({ ...candidate, wikidataId: result.id });
    await new Promise((resolve) => setTimeout(resolve, 1_050));
  }
  const updates: Array<{ id: string; type: "player" | "club"; url: string; name: string }> = [];
  for (let index = 0; index < matches.length; index += 50) {
    const chunk = matches.slice(index, index + 50);
    const entities = await claimsFor(chunk.map((item) => item.wikidataId));
    for (const match of chunk) {
      const file = imageFileFromClaims(entities[match.wikidataId] ?? {}, match.type);
      if (file) updates.push({ id: match.id, type: match.type, name: match.name, url: commonsFileUrl(file, match.type === "player" ? 480 : 240) });
    }
  }
  console.log(`Exact football identity matches: ${matches.length}/${candidates.length}; usable images: ${updates.length}.`);
  console.log(`Unmatched: ${candidates.filter((candidate) => !matches.some((match) => match.id === candidate.id)).map((candidate) => candidate.name).join(", ") || "none"}`);
  if (!apply) { console.log("Dry run only. Review the matched count, then re-run with --apply to save the conservative matches."); return; }
  await prisma.$transaction(updates.map((update) => update.type === "player"
    ? prisma.player.update({ where: { id: update.id }, data: { imageUrl: update.url } })
    : prisma.club.update({ where: { id: update.id }, data: { imageUrl: update.url } })));
  console.log(`Saved ${updates.length} exact-match image URLs.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
