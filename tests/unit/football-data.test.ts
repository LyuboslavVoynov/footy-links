import { describe, expect, it } from "vitest";
import { normalizeFootballDataTeam, validHttpsAssetUrl } from "@/lib/data/sources/football-data";

describe("football-data crest normalization", () => {
  it("accepts provider HTTPS crest URLs", () => {
    expect(normalizeFootballDataTeam({ id: 65, name: "Manchester City FC", crest: "https://crests.football-data.org/65.png" })).toEqual({ providerTeamId: 65, name: "Manchester City FC", crestUrl: "https://crests.football-data.org/65.png" });
  });
  it("makes missing or invalid crests optional", () => {
    expect(validHttpsAssetUrl("http://example.test/crest.png")).toBeNull();
    expect(normalizeFootballDataTeam({ id: 1, name: "Example", crest: "not-a-url" })?.crestUrl).toBeNull();
  });
});
