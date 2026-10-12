const { PrismaClient } = require("@prisma/client");
const source = [...require("./data/representative-data"), ...require("./data/elite-expansion")];
const qualifyingClubs = require("./data/qualifying-clubs.json");

const prisma = new PrismaClient();
const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const qualifyingClubSlugs = new Set(qualifyingClubs.map((club) => slugify(club.name)));
  const clubs = new Map();
  const players = source.map(({ full_name, nationality, challenge_eligible }) => ({ name: full_name, slug: slugify(full_name), nationality, eligibleForChallenge: challenge_eligible }));
  const relationships = source.flatMap((player) => player.senior_careers.map((career) => {
    const clubSlug = slugify(career.club);
    clubs.set(clubSlug, { name: career.club, slug: clubSlug, country: career.country });
    return { playerSlug: slugify(player.full_name), clubSlug, loan: Boolean(career.loan), qualifyingEvidence: Boolean(career.qualifyingEvidence), sourceName: career.qualifyingEvidence ? "editorial-50-plus" : "representative-fixture" };
  }));

  const duplicate = relationships.find((edge, index) => relationships.findIndex((candidate) => candidate.playerSlug === edge.playerSlug && candidate.clubSlug === edge.clubSlug) !== index);
  if (duplicate) throw new Error(`Duplicate player-club relationship: ${duplicate.playerSlug}:${duplicate.clubSlug}`);

  await prisma.player.createMany({ data: players, skipDuplicates: true });
  await prisma.club.createMany({ data: [...clubs.values()], skipDuplicates: true });
  const [storedPlayers, storedClubs] = await Promise.all([prisma.player.findMany({ select: { id: true, slug: true } }), prisma.club.findMany({ select: { id: true, slug: true } })]);
  const playerIds = new Map(storedPlayers.map((player) => [player.slug, player.id]));
  const clubIds = new Map(storedClubs.map((club) => [club.slug, club.id]));
  await prisma.$transaction(relationships.map((edge) => {
    const playerId = playerIds.get(edge.playerSlug);
    const clubId = clubIds.get(edge.clubSlug);
    const data = { playerId, clubId, loan: edge.loan, appearances: null, sourceName: edge.sourceName, validatedAt: new Date(), verificationStatus: edge.qualifyingEvidence ? "editorial_50_plus" : "fixture", gameEligible: false };
    return prisma.playerClub.upsert({ where: { playerId_clubId: { playerId, clubId } }, update: { loan: edge.loan, ...(edge.qualifyingEvidence ? { appearances: null } : {}), sourceName: edge.sourceName, validatedAt: data.validatedAt, verificationStatus: data.verificationStatus, gameEligible: data.gameEligible }, create: data });
  }));
  const qualifyingPlayerIds = [...new Set(relationships.filter((edge) => qualifyingClubSlugs.has(edge.clubSlug)).map((edge) => playerIds.get(edge.playerSlug)))];
  const qualifyingPlayerSlugs = new Set(relationships.filter((edge) => qualifyingClubSlugs.has(edge.clubSlug)).map((edge) => edge.playerSlug));
  const visibleClubSlugs = [...new Set(relationships.filter((edge) => qualifyingPlayerSlugs.has(edge.playerSlug)).map((edge) => edge.clubSlug))];
  await prisma.$transaction([
    prisma.club.updateMany({ data: { gameEligible: false } }),
    prisma.club.updateMany({ where: { slug: { in: visibleClubSlugs } }, data: { gameEligible: true } }),
    prisma.playerClub.updateMany({ data: { gameEligible: false } }),
    prisma.playerClub.updateMany({ where: { playerId: { in: qualifyingPlayerIds } }, data: { gameEligible: true } }),
    prisma.player.updateMany({ data: { eligibleForChallenge: false } }),
    prisma.player.updateMany({ where: { id: { in: qualifyingPlayerIds } }, data: { eligibleForChallenge: true } }),
  ]);
  console.log(`Seeded ${players.length} players, ${clubs.size} clubs, and ${relationships.length} player-club relationships.`);
}

main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
