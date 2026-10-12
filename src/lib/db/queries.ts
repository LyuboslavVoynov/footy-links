import { prisma } from "@/lib/db/prisma";

export async function getGraphDataset() {
  const strictGraphActive = (await prisma.playerClub.count({ where: { gameEligible: true } })) > 0;
  const playerWhere = strictGraphActive
    ? { eligibleForChallenge: true, playerClubs: { some: { gameEligible: true } } }
    : { eligibleForChallenge: true };
  const clubWhere = strictGraphActive
    ? { gameEligible: true, playerClubs: { some: { gameEligible: true } } }
    : { gameEligible: true };
  const edgeWhere = strictGraphActive
    ? { gameEligible: true }
    : { player: { eligibleForChallenge: true }, club: { gameEligible: true } };
  const [players, clubs, playerClubs] = await prisma.$transaction([
    prisma.player.findMany({ where: playerWhere, select: { name: true, slug: true, nationality: true, imageUrl: true, eligibleForChallenge: true } }),
    prisma.club.findMany({ where: clubWhere, select: { name: true, slug: true, country: true, crestUrl: true } }),
    prisma.playerClub.findMany({ where: edgeWhere, select: { player: { select: { slug: true } }, club: { select: { slug: true } }, startYear: true, endYear: true, loan: true, appearances: true } }),
  ]);
  return {
    players: players.map((player) => ({ ...player, nationality: player.nationality ?? undefined, imageUrl: player.imageUrl ?? undefined })),
    clubs: clubs.map((club) => ({ name: club.name, slug: club.slug, country: club.country ?? undefined, imageUrl: club.crestUrl ?? undefined })),
    playerClubs: playerClubs.map((edge) => ({ playerSlug: edge.player.slug, clubSlug: edge.club.slug, startYear: edge.startYear ?? undefined, endYear: edge.endYear ?? undefined, loan: edge.loan, appearances: edge.appearances ?? undefined })),
  };
}

async function strictGameGraphActive() {
  return (await prisma.playerClub.count({ where: { gameEligible: true } })) > 0;
}

export async function getGameplayPlayerBySlug(slug: string) {
  const strict = await strictGameGraphActive();
  return prisma.player.findFirst({
    where: { slug, eligibleForChallenge: true },
    include: {
      playerClubs: {
        where: strict ? { gameEligible: true } : { club: { gameEligible: true } },
        include: { club: true },
        orderBy: { club: { name: "asc" } },
      },
    },
  });
}

export async function getGameplayClubBySlug(slug: string) {
  const strict = await strictGameGraphActive();
  return prisma.club.findFirst({
    where: { slug, gameEligible: true },
    include: {
      playerClubs: {
        where: strict ? { gameEligible: true } : { player: { eligibleForChallenge: true } },
        include: { player: true },
        orderBy: { player: { name: "asc" } },
      },
    },
  });
}

export async function getDataSummary() {
  const [players, clubs, connections, challengePlayers, wikidataConnections, verifiedConnections] = await prisma.$transaction([
    prisma.player.count(),
    prisma.club.count(),
    prisma.playerClub.count(),
    prisma.player.count({ where: { eligibleForChallenge: true } }),
    prisma.playerClub.count({ where: { sourceName: "wikidata" } }),
    prisma.playerClub.count({ where: { verificationStatus: "verified" } }),
  ]);
  return { players, clubs, connections, challengePlayers, wikidataConnections, verifiedConnections };
}

export async function getIntakeDashboard() {
  const candidateWhere = { reviewStatus: "candidate" };
  const [candidates, approved, rejected, archived, rows, batches] = await prisma.$transaction([
    prisma.playerClub.count({ where: candidateWhere }),
    prisma.playerClub.count({ where: { reviewStatus: "approved" } }),
    prisma.playerClub.count({ where: { reviewStatus: "rejected" } }),
    prisma.playerClub.count({ where: { reviewStatus: "archived" } }),
    prisma.playerClub.findMany({
      where: candidateWhere,
      take: 40,
      orderBy: [{ appearances: "desc" }, { player: { name: "asc" } }],
      include: { player: true, club: true },
    }),
    prisma.ingestionBatch.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
  ]);

  return { candidates, approved, rejected, archived, rows, batches };
}

export async function getMediaAssetDashboard() {
  const playablePlayer = { eligibleForChallenge: true };
  const playableClub = { gameEligible: true };
  const [playablePlayers, playableClubs, portraitMissing, badgeMissing, awaitingReview, approved, assets] = await prisma.$transaction([
    prisma.player.count({ where: playablePlayer }),
    prisma.club.count({ where: playableClub }),
    prisma.player.count({ where: { ...playablePlayer, OR: [{ imageUrl: null }, { mediaAsset: { is: null } }] } }),
    prisma.club.count({ where: { ...playableClub, OR: [{ imageUrl: null }, { mediaAsset: { is: null } }] } }),
    prisma.mediaAsset.count({ where: { rightsStatus: "needs_review" } }),
    prisma.mediaAsset.count({ where: { rightsStatus: "approved" } }),
    prisma.mediaAsset.findMany({
      where: { rightsStatus: "needs_review" },
      take: 30,
      orderBy: { createdAt: "asc" },
      include: { player: { select: { name: true, eligibleForChallenge: true } }, club: { select: { name: true, gameEligible: true } } },
    }),
  ]);
  return { playablePlayers, playableClubs, portraitMissing, badgeMissing, awaitingReview, approved, assets };
}

export async function searchPlayers(query: string) {
  if (!query.trim()) return [];
  return prisma.player.findMany({ where: { eligibleForChallenge: true, name: { contains: query.trim(), mode: "insensitive" } }, orderBy: { name: "asc" }, take: 20, select: { name: true, slug: true, nationality: true } });
}

export async function getPlayerBySlug(slug: string) {
  return prisma.player.findUnique({ where: { slug }, include: { playerClubs: { include: { club: true }, orderBy: { club: { name: "asc" } } } } });
}

export async function getClubBySlug(slug: string) {
  return prisma.club.findUnique({ where: { slug }, include: { playerClubs: { include: { player: true }, orderBy: { player: { name: "asc" } } } } });
}
