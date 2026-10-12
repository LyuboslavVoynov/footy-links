import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fetchCompetitionTeams } from "../src/lib/data/sources/football-data";

const prisma = new PrismaClient();
const defaultCompetitions = ["PL", "PD", "SA", "BL1", "FL1", "DED", "PPL", "BSA"];
const competitions = process.env.FOOTBALL_DATA_COMPETITIONS?.split(",").map((code) => code.trim()).filter(Boolean) ?? defaultCompetitions;
const aliases: Record<string, string> = {
  "acf-fiorentina": "fiorentina",
  "afc-ajax": "ajax",
  "as-monaco": "monaco",
  "as-roma": "roma",
  "atalanta-bc": "atalanta",
  "athletic-club": "athletic-bilbao",
  "bayer-04-leverkusen": "bayer-leverkusen",
  "bayern-munchen": "bayern-munich",
  "club-atletico-de-madrid": "atletico-madrid",
  "fc-bayern-munchen": "bayern-munich",
  "fc-internazionale-milano": "inter-milan",
  "hamburger-sv": "hamburg",
  "internazionale": "inter-milan",
  "internazionale-milano": "inter-milan",
  "lille-osc": "lille",
  "olympique-de-marseille": "marseille",
  "olympique-lyonnais": "lyon",
  "paris-saint-germain": "paris-saint-germain",
  "racing-club-de-lens": "lens",
  "rc-celta-de-vigo": "celta-vigo",
  "real-betis-balompie": "real-betis",
  "real-sociedad-de-futbol": "real-sociedad",
  "psv": "psv-eindhoven",
  "ss-lazio": "lazio",
  "sc-corinthians-paulista": "corinthians",
  "sporting-clube-de-portugal": "sporting-cp",
  "sport-lisboa-e-benfica": "benfica",
  "ssc-napoli": "napoli",
  "stade-rennais-fc-1901": "rennes",
  "stade-rennais-1901": "rennes",
  "sv-werder-bremen": "werder-bremen",
  "vfb-stuttgart": "stuttgart",
};
const slugify = (value: string) => {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(fc|cf|calcio)\b/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return aliases[normalized] ?? normalized;
};

async function main() {
  let updated = 0;
  for (const code of competitions) {
    let teams;
    try {
      teams = await fetchCompetitionTeams(code);
    } catch (error) {
      console.error(error instanceof Error ? error.message : `football-data.org team sync failed for ${code}.`);
      continue;
    }
    for (const team of teams) {
      const club = await prisma.club.findUnique({ where: { slug: slugify(team.name) }, select: { id: true, crestUrl: true } });
      if (!club) continue;
      await prisma.club.update({ where: { id: club.id }, data: { providerTeamId: team.providerTeamId, ...(team.crestUrl ? { crestUrl: team.crestUrl } : {}) } });
      updated += 1;
    }
  }
  console.log(`Updated ${updated} club provider identities and persisted crest URLs.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Crest sync failed."); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
