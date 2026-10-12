import { describe, expect, it } from "vitest";
import { MINIMUM_GAME_APPEARANCES, qualifiesForChallengePool, qualifiesForCuratedGame } from "@/lib/game/eligibility";

describe("curated game eligibility", () => {
  it("requires an approved club, verified record, and at least 50 appearances", () => {
    expect(qualifiesForCuratedGame({ appearances: MINIMUM_GAME_APPEARANCES, verificationStatus: "verified", clubGameEligible: true })).toBe(true);
    expect(qualifiesForCuratedGame({ appearances: MINIMUM_GAME_APPEARANCES - 1, verificationStatus: "verified", clubGameEligible: true })).toBe(false);
    expect(qualifiesForCuratedGame({ appearances: 200, verificationStatus: "unverified", clubGameEligible: true })).toBe(false);
    expect(qualifiesForCuratedGame({ appearances: 200, verificationStatus: "verified", clubGameEligible: false })).toBe(false);
    expect(qualifiesForCuratedGame({ appearances: 200, verificationStatus: "verified", clubGameEligible: true, reviewStatus: "candidate" })).toBe(false);
    expect(qualifiesForCuratedGame({ appearances: 200, verificationStatus: "verified", clubGameEligible: true, reviewStatus: "approved" })).toBe(true);
  });

  it("requires two meaningful links before a player can become a challenge endpoint", () => {
    expect(qualifiesForChallengePool(1)).toBe(false);
    expect(qualifiesForChallengePool(2)).toBe(true);
  });
});
