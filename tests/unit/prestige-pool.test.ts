import { describe, expect, it } from "vitest";
import qualifyingClubs from "../../prisma/data/qualifying-clubs.json";

describe("prestige-club catalogue", () => {
  it("contains only documented qualification entries", () => {
    expect(qualifyingClubs.length).toBeGreaterThan(30);
    expect(qualifyingClubs.every((club) => club.name && club.qualification.includes("2000–2026"))).toBe(true);
  });

  it("keeps the core clubs needed for well-known routes", () => {
    expect(qualifyingClubs.map((club) => club.name)).toEqual(expect.arrayContaining([
      "Manchester City", "Liverpool", "Barcelona", "Real Madrid", "Bayern Munich", "AC Milan",
    ]));
  });
});
