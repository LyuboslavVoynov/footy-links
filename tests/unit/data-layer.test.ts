import { describe, expect, it } from "vitest";
import { assertUniqueRelationships } from "@/lib/db/data-access";
import { normalizeProviderData } from "@/lib/data/normalize";
import { clubsForPlayer, playersForClub } from "@/lib/db/relationship-queries";

const fixture = normalizeProviderData([
  { full_name: "Cristiano Ronaldo", nationality: "Portugal", challenge_eligible: true, senior_careers: [{ club: "Sporting CP", country: "Portugal" }, { club: "Manchester United", country: "England" }] },
  { full_name: "Wayne Rooney", nationality: "England", challenge_eligible: true, senior_careers: [{ club: "Everton", country: "England" }, { club: "Manchester United", country: "England" }] },
  { full_name: "Aaron Example", nationality: "England", challenge_eligible: false, senior_careers: [{ club: "Manchester United", country: "England", loan: true }] },
]);

describe("football graph data layer", () => {
  it("rejects duplicate player-club relationships", () => {
    expect(() => assertUniqueRelationships([{ playerSlug: "a", clubSlug: "b", loan: false }, { playerSlug: "a", clubSlug: "b", loan: false }])).toThrow("Duplicate");
  });

  it("retains loan relationships", () => {
    expect(fixture.playerClubs.find((edge) => edge.playerSlug === "aaron-example")?.loan).toBe(true);
  });

  it("retrieves clubs for a player", () => {
    expect(clubsForPlayer(fixture, "cristiano-ronaldo").map((club) => club.name)).toEqual(["Manchester United", "Sporting CP"]);
  });

  it("retrieves a club's players in alphabetical order", () => {
    expect(playersForClub(fixture, "manchester-united").map((player) => player.name)).toEqual(["Aaron Example", "Cristiano Ronaldo", "Wayne Rooney"]);
  });
});
