import { buildFootballGraph, generateRandomChallenge } from "@/lib/game/graph";
import type { NormalizedDataset } from "@/types/football";

export type DataValidationReport = {
  players: number;
  clubs: number;
  connections: number;
  challengeEligiblePlayers: number;
  orphanPlayers: number;
  orphanClubs: number;
  brokenRelationships: number;
  likelyDuplicatePlayers: number;
  likelyDuplicateClubs: number;
  disconnectedEligiblePlayers: number;
  stressChallenges: number;
  invalidChallenges: number;
};

const duplicateCount = (values: string[]) => values.length - new Set(values.map((value) => value.toLocaleLowerCase())).size;

export function validateDataset(dataset: NormalizedDataset, challengeCount = 1_000): DataValidationReport {
  const playerSlugs = new Set(dataset.players.map((player) => player.slug));
  const clubSlugs = new Set(dataset.clubs.map((club) => club.slug));
  const brokenRelationships = dataset.playerClubs.filter((edge) => !playerSlugs.has(edge.playerSlug) || !clubSlugs.has(edge.clubSlug)).length;
  const graph = buildFootballGraph(dataset);
  const eligible = dataset.players.filter((player) => player.eligibleForChallenge);
  const connectedEligiblePlayers = eligible.filter((player) => {
    const seen = new Set([`player:${player.slug}`]);
    const queue = [`player:${player.slug}`];
    for (let index = 0; index < queue.length; index += 1) {
      for (const neighbour of graph.neighbours.get(queue[index]) ?? []) if (!seen.has(neighbour)) { seen.add(neighbour); queue.push(neighbour); }
    }
    return eligible.some((candidate) => candidate.slug !== player.slug && seen.has(`player:${candidate.slug}`));
  });
  let invalidChallenges = 0;
  for (let index = 0; index < challengeCount; index += 1) {
    try {
      const challenge = generateRandomChallenge(graph);
      const alternating = challenge.solution.path.every((entity, pathIndex) => entity.type === (pathIndex % 2 === 0 ? "player" : "club"));
      if (challenge.start.id === challenge.target.id || !alternating || challenge.solution.distance !== challenge.solution.path.length - 1) invalidChallenges += 1;
    } catch { invalidChallenges += 1; }
  }
  return {
    players: dataset.players.length,
    clubs: dataset.clubs.length,
    connections: dataset.playerClubs.length,
    challengeEligiblePlayers: eligible.length,
    orphanPlayers: dataset.players.filter((player) => !dataset.playerClubs.some((edge) => edge.playerSlug === player.slug)).length,
    orphanClubs: dataset.clubs.filter((club) => !dataset.playerClubs.some((edge) => edge.clubSlug === club.slug)).length,
    brokenRelationships,
    likelyDuplicatePlayers: duplicateCount(dataset.players.map((player) => player.name)),
    likelyDuplicateClubs: duplicateCount(dataset.clubs.map((club) => club.name)),
    disconnectedEligiblePlayers: eligible.length - connectedEligiblePlayers.length,
    stressChallenges: challengeCount,
    invalidChallenges,
  };
}
