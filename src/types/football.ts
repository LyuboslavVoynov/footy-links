export type NormalizedPlayer = { name: string; slug: string; nationality?: string; imageUrl?: string; eligibleForChallenge: boolean };
export type NormalizedClub = { name: string; slug: string; country?: string; imageUrl?: string };
export type NormalizedPlayerClub = { playerSlug: string; clubSlug: string; startYear?: number; endYear?: number; loan: boolean; appearances?: number; sourceName?: string; sourceReference?: string; validatedAt?: Date };
export type NormalizedDataset = { players: NormalizedPlayer[]; clubs: NormalizedClub[]; playerClubs: NormalizedPlayerClub[] };
