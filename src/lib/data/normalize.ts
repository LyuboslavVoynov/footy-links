import { assertUniqueRelationships } from "@/lib/db/data-access";
import type { NormalizedDataset, NormalizedPlayerClub } from "@/types/football";
import clubUniverse from "../../../prisma/data/club-universe.json";

export type ProviderPlayer = {
  full_name: string;
  nationality?: string;
  challenge_eligible: boolean;
  senior_careers: Array<{ club: string; country: string; start_year?: number; end_year?: number; loan?: boolean; appearances?: number; source_reference?: string }>;
};

export const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function normalizeProviderData(source: ProviderPlayer[]): NormalizedDataset {
  const permittedClubs = new Set(clubUniverse);
  const clubs = new Map<string, { name: string; slug: string; country: string }>();
  const players = source.map((player) => ({ name: player.full_name, slug: slugify(player.full_name), nationality: player.nationality, eligibleForChallenge: player.challenge_eligible }));
  const playerClubs: NormalizedPlayerClub[] = source.flatMap((player) => player.senior_careers.filter((career) => permittedClubs.has(career.club)).map((career) => {
    const clubSlug = slugify(career.club);
    clubs.set(clubSlug, { name: career.club, slug: clubSlug, country: career.country });
    return { playerSlug: slugify(player.full_name), clubSlug, startYear: career.start_year, endYear: career.end_year, loan: career.loan ?? false, appearances: career.appearances, sourceName: "representative-fixture", sourceReference: career.source_reference, validatedAt: new Date() };
  }));
  assertUniqueRelationships(playerClubs);
  return { players, clubs: [...clubs.values()], playerClubs };
}
