import { describe, expect, it } from "vitest";
import { BIG_FIVE, buildCareerQuery, normalizeWikidataBindings } from "@/lib/data/sources/wikidata";

describe("Wikidata source adapter", () => {
  it("builds a bounded Big Five career query", () => {
    expect(buildCareerQuery(BIG_FIVE.premierLeague, 50, 10)).toContain("wd:Q9448");
    expect(buildCareerQuery(BIG_FIVE.premierLeague, 50, 10)).toContain("LIMIT 50 OFFSET 10");
  });

  it("normalizes career statements and retains Wikidata provenance", () => {
    const data = normalizeWikidataBindings([{ player: { value: "http://www.wikidata.org/entity/Q1" }, playerLabel: { value: "Example Player" }, nationalityLabel: { value: "England" }, club: { value: "http://www.wikidata.org/entity/Q2" }, clubLabel: { value: "Example FC" }, clubCountryLabel: { value: "England" }, start: { value: "2010-01-01T00:00:00Z" }, end: { value: "2012-01-01T00:00:00Z" } }]);
    expect(data.players[0]).toMatchObject({ wikidataId: "Q1", slug: "example-player" });
    expect(data.relationships[0]).toMatchObject({ playerWikidataId: "Q1", clubWikidataId: "Q2", startYear: 2010, endYear: 2012, sourceReference: "https://www.wikidata.org/wiki/Q1" });
  });
});
