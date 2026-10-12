export const MINIMUM_GAME_APPEARANCES = 50;
export const MINIMUM_CHALLENGE_LINKS = 2;

export type CareerTenureForCuration = {
  appearances: number | null;
  verificationStatus: string;
  clubGameEligible: boolean;
  reviewStatus?: string;
};

/**
 * A gameplay relationship is deliberately stricter than a career record.
 * Raw career data can be useful context, but cannot create a game route.
 */
export function qualifiesForCuratedGame(tenure: CareerTenureForCuration) {
  return tenure.clubGameEligible
    && tenure.verificationStatus === "verified"
    && (tenure.reviewStatus === undefined || tenure.reviewStatus === "approved")
    && (tenure.appearances ?? 0) >= MINIMUM_GAME_APPEARANCES;
}

/** A challenge endpoint needs choices; a one-club career creates a dead end. */
export function qualifiesForChallengePool(qualifyingTenureCount: number) {
  return qualifyingTenureCount >= MINIMUM_CHALLENGE_LINKS;
}
