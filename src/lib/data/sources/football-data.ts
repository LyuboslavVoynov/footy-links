const baseUrl = "https://api.football-data.org/v4";

export type FootballDataTeam = { providerTeamId: number; name: string; crestUrl: string | null };
type ProviderTeam = { id?: number; name?: string; crest?: string | null };
type TeamsResponse = { teams?: ProviderTeam[] };

export function validHttpsAssetUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) ? url.toString() : null;
  } catch { return null; }
}

export function normalizeFootballDataTeam(team: ProviderTeam): FootballDataTeam | null {
  if (typeof team.id !== "number" || !Number.isInteger(team.id) || !team.name?.trim()) return null;
  return { providerTeamId: team.id, name: team.name.trim(), crestUrl: validHttpsAssetUrl(team.crest) };
}

export async function fetchCompetitionTeams(competitionCode: string): Promise<FootballDataTeam[]> {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY is not configured.");
  const response = await fetch(`${baseUrl}/competitions/${encodeURIComponent(competitionCode)}/teams`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`football-data.org team sync failed for ${competitionCode} (${response.status}).`);
  const payload = await response.json() as TeamsResponse;
  return (payload.teams ?? []).map(normalizeFootballDataTeam).filter((team): team is FootballDataTeam => Boolean(team));
}
