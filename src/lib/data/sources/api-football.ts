export type ApiFootballCandidate = {
  name: string;
  nationality?: string;
  playerExternalId: string;
  clubName: string;
  clubCountry?: string;
  clubExternalId: string;
  appearances: number;
  startYear?: number;
  endYear?: number;
  sourceReference: string;
  imageUrl?: string;
  clubImageUrl?: string;
};

type ApiFootballResponse = {
  response?: Array<{
    player?: { id?: number; name?: string; firstname?: string; lastname?: string; nationality?: string; photo?: string };
    statistics?: Array<{
      team?: { id?: number; name?: string; country?: string; logo?: string };
      games?: { appearences?: number | null };
    }>;
  }>;
  errors?: unknown;
  paging?: { current?: number; total?: number };
};

const baseUrl = "https://v3.football.api-sports.io";
const freePlanRequestGapMs = 7_000;

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Loads a team's player-season statistics and aggregates appearances across the
 * supplied seasons. This remains a candidate source: editorial approval is
 * required before a relationship can ever reach the game graph.
 */
export async function fetchApiFootballTeamCandidates(input: { teamId: number; seasons: number[]; minimumAppearances: number; maximumPages?: number }) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY is not configured. Add it to .env locally or your deployment secret store.");
  const candidates = new Map<string, ApiFootballCandidate>();
  let lastRequestAt = 0;
  for (const season of input.seasons) {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages && (!input.maximumPages || page <= input.maximumPages)) {
      const url = new URL("/players", baseUrl);
      url.searchParams.set("team", String(input.teamId));
      url.searchParams.set("season", String(season));
      url.searchParams.set("page", String(page));
      const waitFor = Math.max(0, freePlanRequestGapMs - (Date.now() - lastRequestAt));
      if (waitFor) await sleep(waitFor);
      const response = await fetch(url, { headers: { "x-apisports-key": key } });
      lastRequestAt = Date.now();
      if (!response.ok) throw new Error(`API-Football request for ${season}, page ${page} failed (${response.status}).`);
      const payload = await response.json() as ApiFootballResponse;
      if (payload.errors && Object.keys(payload.errors).length) throw new Error(`API-Football returned an error for ${season}: ${JSON.stringify(payload.errors)}`);
      totalPages = payload.paging?.total ?? 1;
      for (const row of payload.response ?? []) {
        const player = row.player;
        if (!player?.id || !player.name) continue;
        const canonicalName = [player.firstname, player.lastname].filter(Boolean).join(" ") || player.name;
        for (const statistic of row.statistics ?? []) {
          const team = statistic.team;
          if (!team?.id || !team.name) continue;
          const appearances = statistic.games?.appearences ?? 0;
          const identifier = `${player.id}:${team.id}`;
          const existing = candidates.get(identifier);
          candidates.set(identifier, {
            name: canonicalName,
            nationality: player.nationality,
            playerExternalId: `api-football-${player.id}`,
            clubName: team.name,
            clubCountry: team.country,
            clubExternalId: `api-football-${team.id}`,
            appearances: (existing?.appearances ?? 0) + appearances,
            startYear: existing?.startYear ?? season,
            endYear: season,
            sourceReference: url.toString(),
            imageUrl: player.photo ?? existing?.imageUrl,
            clubImageUrl: team.logo ?? existing?.clubImageUrl,
          });
        }
      }
      page += 1;
    }
  }
  return [...candidates.values()].filter((candidate) => candidate.appearances >= input.minimumAppearances);
}
