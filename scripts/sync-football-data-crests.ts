import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fetchCompetitionTeams } from "../src/lib/data/sources/football-data";

const prisma = new PrismaClient();
const competitions = ["PL", "PD", "SA", "BL1", "FL1"];
const aliases: Record<string, string> = { "atletico-de-madrid": "atletico-madrid", "paris-saint-germain": "paris-saint-germain", "internazionale": "inter-milan", "real-betis-balompie": "real-betis" };
const slugify = (value: string) => {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(fc|cf|calcio)\b/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return aliases[normalized] ?? normalized;
};

async function main() {
  let updated = 0;
  for (const code of competitions) {
    const teams = await fetchCompetitionTeams(code);
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
