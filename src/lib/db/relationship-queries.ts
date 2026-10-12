import { alphabetizePlayers } from "@/lib/db/data-access";
import type { NormalizedDataset } from "@/types/football";

export function clubsForPlayer(dataset: NormalizedDataset, playerSlug: string) {
  const clubSlugs = new Set(dataset.playerClubs.filter((edge) => edge.playerSlug === playerSlug).map((edge) => edge.clubSlug));
  return dataset.clubs.filter((club) => clubSlugs.has(club.slug)).sort((a, b) => a.name.localeCompare(b.name));
}

export function playersForClub(dataset: NormalizedDataset, clubSlug: string) {
  const playerSlugs = new Set(dataset.playerClubs.filter((edge) => edge.clubSlug === clubSlug).map((edge) => edge.playerSlug));
  return alphabetizePlayers(dataset.players.filter((player) => playerSlugs.has(player.slug)));
}
