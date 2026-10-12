import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import clubUniverse from "../prisma/data/club-universe.json";
import { slugify } from "@/lib/data/normalize";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const slugs = clubUniverse.map(slugify);

async function main() {
  const count = await prisma.club.count({ where: { slug: { in: slugs } } });
  console.log(`${count} existing clubs match the approved catalogue.`);
  if (!apply) { console.log("Dry run only. Add --apply to approve the current catalogue."); return; }
  await prisma.club.updateMany({ where: { slug: { in: slugs } }, data: { gameEligible: true } });
  console.log("Approved club catalogue applied.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
