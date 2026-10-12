import { describe, expect, it } from "vitest";
import { buildFootballGraph, clubNodeId, connectedEntities, generateRandomChallenge, generateSeededChallenge, MINIMUM_CHALLENGE_DISTANCE, playerNodeId, shortestPath } from "@/lib/game/graph";
import type { NormalizedDataset } from "@/types/football";

const fixture: NormalizedDataset = {
  players: [
    { name: "Ada", slug: "ada", eligibleForChallenge: true },
    { name: "Bea", slug: "bea", eligibleForChallenge: true },
    { name: "Cia", slug: "cia", eligibleForChallenge: true },
    { name: "Dee", slug: "dee", eligibleForChallenge: true },
    { name: "Eli", slug: "eli", eligibleForChallenge: false },
    { name: "Fox", slug: "fox", eligibleForChallenge: true },
  ],
  clubs: [{ name: "Alpha", slug: "alpha" }, { name: "Beta", slug: "beta" }, { name: "Loan Club", slug: "loan-club" }],
  playerClubs: [
    { playerSlug: "ada", clubSlug: "alpha", loan: false }, { playerSlug: "bea", clubSlug: "alpha", loan: false },
    { playerSlug: "bea", clubSlug: "beta", loan: false }, { playerSlug: "cia", clubSlug: "beta", loan: false },
    { playerSlug: "dee", clubSlug: "loan-club", loan: true }, { playerSlug: "eli", clubSlug: "loan-club", loan: false },
  ],
};

const graph = buildFootballGraph(fixture);

describe("football graph engine", () => {
  it("gets clubs for a player and players for a club", () => {
    expect(connectedEntities(graph, playerNodeId("ada")).map((entity) => entity.name)).toEqual(["Alpha"]);
    expect(connectedEntities(graph, clubNodeId("alpha")).map((entity) => entity.name)).toEqual(["Ada", "Bea"]);
  });

  it("finds direct shared-club and minimum-length challenge paths", () => {
    expect(shortestPath(graph, playerNodeId("ada"), playerNodeId("bea"))?.distance).toBe(2);
    expect(shortestPath(graph, playerNodeId("ada"), playerNodeId("cia"))?.distance).toBe(MINIMUM_CHALLENGE_DISTANCE);
  });

  it("handles cycles, same players, disconnected players, and loan edges", () => {
    expect(shortestPath(graph, playerNodeId("ada"), playerNodeId("ada"))).toMatchObject({ distance: 0 });
    expect(shortestPath(graph, playerNodeId("ada"), playerNodeId("fox"))).toBeNull();
    expect(shortestPath(graph, playerNodeId("dee"), playerNodeId("eli"))?.distance).toBe(2);
  });

  it("returns the alternating player-club route for a valid challenge", () => {
    const result = shortestPath(graph, playerNodeId("ada"), playerNodeId("cia"));
    expect(result?.distance).toBe(MINIMUM_CHALLENGE_DISTANCE);
    expect(result?.path.map((entity) => entity.type)).toEqual(["player", "club", "player", "club", "player"]);
  });

  it("always generates different, solvable, alternating eligible-player challenges", () => {
    for (let index = 0; index < 100; index += 1) {
      const challenge = generateRandomChallenge(graph);
      expect(challenge.start.id).not.toBe(challenge.target.id);
      expect(challenge.solution.path[0].type).toBe("player");
      expect(challenge.solution.path.at(-1)?.type).toBe("player");
      expect(challenge.solution.path.every((entity, pathIndex) => entity.type === (pathIndex % 2 === 0 ? "player" : "club"))).toBe(true);
      expect(challenge.solution.distance).toBe(challenge.solution.path.length - 1);
      expect(challenge.solution.distance).toBeGreaterThanOrEqual(MINIMUM_CHALLENGE_DISTANCE);
    }
  });

  it("rejects a graph where every player-to-player route is too short", () => {
    const shortOnlyGraph = buildFootballGraph({
      players: fixture.players.slice(0, 2),
      clubs: fixture.clubs.slice(0, 1),
      playerClubs: fixture.playerClubs.slice(0, 2),
    });

    expect(() => generateRandomChallenge(shortOnlyGraph, () => 0)).toThrow(
      `${MINIMUM_CHALLENGE_DISTANCE}-link minimum`,
    );
  });

  it("generates the same daily challenge from the same seed", () => {
    const first = generateSeededChallenge(graph, "2026-10-09", "standard");
    const second = generateSeededChallenge(graph, "2026-10-09", "standard");
    expect(first.start.id).toBe(second.start.id);
    expect(first.target.id).toBe(second.target.id);
  });
});
