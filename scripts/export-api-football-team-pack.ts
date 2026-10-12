import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fetchApiFootballTeamCandidates } from "@/lib/data/sources/api-football";

const args = new Map(process.argv.slice(2).filter((argument) => argument.startsWith("--")).map((argument) => {
  const [key, value] = argument.slice(2).split("=", 2);
  return [key, value];
}));
const teamId = Number(args.get("team"));
const seasons = (args.get("seasons") ?? "").split(",").map(Number).filter(Number.isInteger);
const minimumAppearances = Number(args.get("minimum") ?? 50);
const maximumPages = args.has("pages") ? Number(args.get("pages")) : undefined;
const output = args.get("output") ?? "tmp/api-football-candidates.json";

async function main() {
  if (!Number.isInteger(teamId) || teamId <= 0) throw new Error("Pass a valid provider team ID, e.g. --team=50.");
  if (!seasons.length) throw new Error("Pass one or more seasons, e.g. --seasons=2020,2021,2022.");
  if (!Number.isInteger(minimumAppearances) || minimumAppearances < 0) throw new Error("--minimum must be a whole number.");
  if (maximumPages !== undefined && (!Number.isInteger(maximumPages) || maximumPages < 1)) throw new Error("--pages must be a positive whole number.");
  const players = await fetchApiFootballTeamCandidates({ teamId, seasons, minimumAppearances, maximumPages });
  const target = resolve(output);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify({
    sourceName: maximumPages ? "api-football (page-limited candidate export)" : "api-football",
    sourceReference: "https://www.api-football.com/documentation-v3",
    players,
  }, null, 2)}\n`);
  console.log(`Exported ${players.length} API-Football candidates to ${target}${maximumPages ? ` using the first ${maximumPages} pages per season` : ""}. Review the pack before importing it.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
