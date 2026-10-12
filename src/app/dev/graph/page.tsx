import Link from "next/link";
import { generateRandomChallenge } from "@/lib/game/graph";
import { getFootballGraph } from "@/lib/game/graph-data";

export const dynamic = "force-dynamic";

export default async function GraphInspector() {
  try {
    const challenge = generateRandomChallenge(await getFootballGraph());
    return <main className="dev-page"><Link href="/">← Home</Link><h1>Graph inspector</h1><form><button className="start-button">Generate Challenge</button></form><section className="graph-result"><p className="eyebrow">Start</p><h2>{challenge.start.name}</h2><p className="eyebrow">Target</p><h2>{challenge.target.name}</h2><p><strong>Shortest path: {challenge.solution.distance} clicks</strong></p><ol>{challenge.solution.path.map((entity) => <li key={entity.id}>{entity.type === "player" ? "Player" : "Club"}: {entity.name}</li>)}</ol></section></main>;
  } catch {
    return <main className="dev-page"><Link href="/">← Home</Link><h1>Graph inspector</h1><p>Database unavailable. Set <code>DATABASE_URL</code>, then run <code>npm run db:migrate</code> and <code>npm run db:seed</code>.</p></main>;
  }
}
