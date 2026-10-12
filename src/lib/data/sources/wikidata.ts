import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { slugify } from "@/lib/data/normalize";

const execFileAsync = promisify(execFile);

export const BIG_FIVE = {
  premierLeague: "Q9448",
  laLiga: "Q324867",
  serieA: "Q15804",
  bundesliga: "Q82595",
  ligue1: "Q13394",
} as const;

export type WikidataImport = {
  players: Array<{ wikidataId: string; name: string; slug: string; nationality?: string }>;
  clubs: Array<{ wikidataId: string; name: string; slug: string; country?: string }>;
  relationships: Array<{ playerWikidataId: string; clubWikidataId: string; startYear?: number; endYear?: number; sourceReference: string }>;
};

type Binding = Record<string, { value: string } | undefined>;

type EntityResponse = {
  entities?: Record<string, { labels?: { en?: { value: string } } }>;
};

const idFromUrl = (value: string) => value.split("/").at(-1) ?? value;
const yearFromDate = (value?: string) => value ? Number(value.slice(0, 4)) : undefined;

export function buildCareerQuery(competitionId: string, limit: number, offset: number) {
  return `SELECT ?player ?playerLabel ?nationalityLabel ?club ?clubLabel ?clubCountryLabel ?start ?end WHERE {
  ?club wdt:P118 wd:${competitionId}.
  ?player wdt:P54 ?club.
} ORDER BY ?player ?club LIMIT ${limit} OFFSET ${offset}`;
}

async function fetchEnglishLabels(ids: string[]) {
  const labels = new Map<string, string>();
  // The Wikidata API accepts a maximum of 50 entity IDs per wbgetentities request.
  for (let index = 0; index < ids.length; index += 50) {
    const chunk = ids.slice(index, index + 50);
    const { stdout } = await execFileAsync("curl.exe", [
      "--silent", "--show-error", "--fail", "--retry", "2", "--retry-all-errors", "--retry-delay", "5", "--max-time", "25", "--get",
      "--data-urlencode", "action=wbgetentities",
      "--data-urlencode", `ids=${chunk.join("|")}`,
      "--data-urlencode", "props=labels",
      "--data-urlencode", "languages=en",
      "--data-urlencode", "format=json",
      "https://www.wikidata.org/w/api.php",
    ], { maxBuffer: 2 * 1024 * 1024 });
    const payload = JSON.parse(stdout) as EntityResponse;
    for (const [id, entity] of Object.entries(payload.entities ?? {})) {
      const label = entity.labels?.en?.value;
      if (label) labels.set(id, label);
    }
  }
  return labels;
}

export function normalizeWikidataBindings(bindings: Binding[]): WikidataImport {
  const players = new Map<string, WikidataImport["players"][number]>();
  const clubs = new Map<string, WikidataImport["clubs"][number]>();
  const relationships = new Map<string, WikidataImport["relationships"][number]>();
  for (const row of bindings) {
    if (!row.player?.value || !row.club?.value || !row.playerLabel?.value || !row.clubLabel?.value) continue;
    const playerWikidataId = idFromUrl(row.player.value);
    const clubWikidataId = idFromUrl(row.club.value);
    players.set(playerWikidataId, { wikidataId: playerWikidataId, name: row.playerLabel.value, slug: slugify(row.playerLabel.value), nationality: row.nationalityLabel?.value });
    clubs.set(clubWikidataId, { wikidataId: clubWikidataId, name: row.clubLabel.value, slug: slugify(row.clubLabel.value), country: row.clubCountryLabel?.value });
    const key = `${playerWikidataId}:${clubWikidataId}`;
    relationships.set(key, { playerWikidataId, clubWikidataId, startYear: yearFromDate(row.start?.value), endYear: yearFromDate(row.end?.value), sourceReference: `https://www.wikidata.org/wiki/${playerWikidataId}` });
  }
  return { players: [...players.values()], clubs: [...clubs.values()], relationships: [...relationships.values()] };
}

export async function fetchWikidataCareers(options: { competitionId: string; limit: number; offset?: number }) {
  const query = buildCareerQuery(options.competitionId, options.limit, options.offset ?? 0);
  const { stdout } = await execFileAsync("curl.exe", [
    "--silent", "--show-error", "--fail", "--retry", "2", "--retry-all-errors", "--retry-delay", "5", "--max-time", "45", "--get",
    "--data-urlencode", `query=${query}`,
    "--header", "Accept: application/sparql-results+json",
    "https://query.wikidata.org/sparql",
  ], { maxBuffer: 5 * 1024 * 1024 });
  const payload = JSON.parse(stdout) as { results?: { bindings: Binding[] }; error?: string };
  if (!payload.results) throw new Error(`Wikidata query failed${payload.error ? `: ${payload.error}` : ""}`);
  const ids = [...new Set(payload.results.bindings.flatMap((row) => [row.player?.value, row.club?.value]
    .filter((value): value is string => Boolean(value))
    .map(idFromUrl)))];
  const labels = await fetchEnglishLabels(ids);
  const labelledBindings = payload.results.bindings.map((row) => ({
    ...row,
    playerLabel: row.player ? { value: labels.get(idFromUrl(row.player.value)) ?? row.playerLabel?.value ?? "" } : undefined,
    clubLabel: row.club ? { value: labels.get(idFromUrl(row.club.value)) ?? row.clubLabel?.value ?? "" } : undefined,
  }));
  return normalizeWikidataBindings(labelledBindings);
}
