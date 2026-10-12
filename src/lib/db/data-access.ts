import type { NormalizedPlayerClub } from "@/types/football";

export function assertUniqueRelationships(edges: NormalizedPlayerClub[]) {
  const seen = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.playerSlug}:${edge.clubSlug}`;
    if (seen.has(key)) throw new Error(`Duplicate player-club relationship: ${key}`);
    seen.add(key);
  }
}

export function alphabetizePlayers<T extends { name: string }>(players: T[]) {
  return [...players].sort((a, b) => a.name.localeCompare(b.name));
}
