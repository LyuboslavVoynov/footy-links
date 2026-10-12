import type { NormalizedDataset } from "@/types/football";

export type GraphEntity = {
  id: string;
  type: "player" | "club";
  name: string;
  eligibleForChallenge?: boolean;
  imageUrl?: string;
};

export type FootballGraph = {
  entities: Map<string, GraphEntity>;
  neighbours: Map<string, string[]>;
};

export type ShortestPath = { distance: number; path: GraphEntity[] };
export type Challenge = { start: GraphEntity; target: GraphEntity; solution: ShortestPath };
export type ChallengeDifficulty = "easy" | "standard" | "hard";

export const playerNodeId = (slug: string) => `player:${slug}`;
export const clubNodeId = (slug: string) => `club:${slug}`;

export function buildFootballGraph(dataset: NormalizedDataset): FootballGraph {
  const entities = new Map<string, GraphEntity>();
  const neighbours = new Map<string, string[]>();
  const addEntity = (entity: GraphEntity) => {
    entities.set(entity.id, entity);
    neighbours.set(entity.id, []);
  };

  for (const player of dataset.players) addEntity({ id: playerNodeId(player.slug), type: "player", name: player.name, eligibleForChallenge: player.eligibleForChallenge, imageUrl: player.imageUrl });
  for (const club of dataset.clubs) addEntity({ id: clubNodeId(club.slug), type: "club", name: club.name, imageUrl: club.imageUrl });
  for (const edge of dataset.playerClubs) {
    const playerId = playerNodeId(edge.playerSlug);
    const clubId = clubNodeId(edge.clubSlug);
    if (!entities.has(playerId) || !entities.has(clubId)) continue;
    neighbours.get(playerId)?.push(clubId);
    neighbours.get(clubId)?.push(playerId);
  }
  return { entities, neighbours };
}

export function connectedEntities(graph: FootballGraph, entityId: string) {
  return (graph.neighbours.get(entityId) ?? []).map((id) => graph.entities.get(id)).filter((entity): entity is GraphEntity => Boolean(entity));
}

export function shortestPath(graph: FootballGraph, startId: string, targetId: string): ShortestPath | null {
  if (!graph.entities.has(startId) || !graph.entities.has(targetId)) return null;
  if (startId === targetId) return { distance: 0, path: [graph.entities.get(startId)!] };

  const queue = [startId];
  const previous = new Map<string, string | null>([[startId, null]]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const neighbour of graph.neighbours.get(current) ?? []) {
      if (previous.has(neighbour)) continue;
      previous.set(neighbour, current);
      if (neighbour === targetId) {
        const ids: string[] = [];
        for (let node: string | null = targetId; node; node = previous.get(node) ?? null) ids.unshift(node);
        return { distance: ids.length - 1, path: ids.map((id) => graph.entities.get(id)!) };
      }
      queue.push(neighbour);
    }
  }
  return null;
}

function connectedEligibleComponents(graph: FootballGraph) {
  const eligible = [...graph.entities.values()].filter((entity) => entity.type === "player" && entity.eligibleForChallenge);
  const visited = new Set<string>();
  const components: GraphEntity[][] = [];
  for (const player of eligible) {
    if (visited.has(player.id)) continue;
    const reachable = new Set<string>([player.id]);
    const queue = [player.id];
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      for (const neighbour of graph.neighbours.get(current) ?? []) if (!reachable.has(neighbour)) { reachable.add(neighbour); queue.push(neighbour); }
    }
    const component = eligible.filter((candidate) => reachable.has(candidate.id));
    component.forEach((candidate) => visited.add(candidate.id));
    if (component.length > 1) components.push(component);
  }
  return components;
}

export function generateRandomChallenge(graph: FootballGraph, random: () => number = Math.random): Challenge {
  const components = connectedEligibleComponents(graph);
  if (!components.length) throw new Error("No solvable challenge pairs are available");
  const component = components[Math.floor(random() * components.length)];
  const start = component[Math.floor(random() * component.length)];
  const targetOffset = 1 + Math.floor(random() * (component.length - 1));
  const target = component[(component.indexOf(start) + targetOffset) % component.length];
  const solution = shortestPath(graph, start.id, target.id);
  if (!solution) throw new Error("Generated challenge was not solvable");
  return { start, target, solution };
}

function seededRandom(seed: string) {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return () => {
    value += value << 13; value ^= value >>> 7; value += value << 3; value ^= value >>> 17; value += value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function matchesDifficulty(distance: number, difficulty: ChallengeDifficulty) {
  if (difficulty === "easy") return distance <= 4;
  if (difficulty === "hard") return distance >= 8;
  return distance >= 5 && distance <= 7;
}

export function generateSeededChallenge(graph: FootballGraph, seed: string, difficulty: ChallengeDifficulty): Challenge {
  const random = seededRandom(`${seed}:${difficulty}`);
  let fallback: Challenge | undefined;
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const challenge = generateRandomChallenge(graph, random);
    fallback ??= challenge;
    if (matchesDifficulty(challenge.solution.distance, difficulty)) return challenge;
  }
  return fallback!;
}
