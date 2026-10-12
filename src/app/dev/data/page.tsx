import Link from "next/link";
import { getClubBySlug, getDataSummary, getPlayerBySlug, searchPlayers } from "@/lib/db/queries";

type Props = { searchParams: Promise<{ q?: string; player?: string; club?: string }> };

export default async function DataInspector({ searchParams }: Props) {
  const params = await searchParams;
  try {
    const [summary, results, player, club] = await Promise.all([
      getDataSummary(),
      searchPlayers(params.q ?? ""),
      params.player ? getPlayerBySlug(params.player) : null,
      params.club ? getClubBySlug(params.club) : null,
    ]);
    return <main className="dev-page"><Link href="/">← Home</Link><h1>Data inspector</h1><div className="stats"><p><strong>{summary.players}</strong> Players</p><p><strong>{summary.clubs}</strong> Clubs</p><p><strong>{summary.connections}</strong> Connections</p></div><form><label htmlFor="q">Search players</label><div className="search-row"><input id="q" name="q" defaultValue={params.q} /><button>Search</button></div></form>{results.map((result) => <p key={result.slug}><Link href={`/dev/data?player=${result.slug}`}>{result.name}</Link>{result.nationality ? ` · ${result.nationality}` : ""}</p>)}{params.q && results.length === 0 ? <p>No players found.</p> : null}{player ? <section><h2>{player.name}</h2><h3>Clubs</h3><ul>{player.playerClubs.map(({ club }) => <li key={club.id}><Link href={`/dev/data?club=${club.slug}`}>{club.name}</Link></li>)}</ul></section> : null}{club ? <section><h2>{club.name}</h2><h3>Connected players</h3><ul>{club.playerClubs.map(({ player: connectedPlayer }) => <li key={connectedPlayer.id}><Link href={`/dev/data?player=${connectedPlayer.slug}`}>{connectedPlayer.name}</Link></li>)}</ul></section> : null}</main>;
  } catch {
    return <main className="dev-page"><Link href="/">← Home</Link><h1>Data inspector</h1><p>Database unavailable. Set <code>DATABASE_URL</code>, then run <code>npm run db:migrate</code> and <code>npm run db:seed</code>.</p></main>;
  }
}
