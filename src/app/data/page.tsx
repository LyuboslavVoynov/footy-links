import Link from "next/link";
import { getDataSummary } from "@/lib/db/queries";

export default async function DataPage() {
  const summary = await getDataSummary();
  return (
    <main className="info-page">
      <Link className="back-link" href="/">← Football Links</Link>
      <p className="eyebrow">Data &amp; sources</p>
      <h1>Built for football fans, with provenance.</h1>
      <p className="tagline">Football Links models player-to-club relationships so every puzzle can be explained and checked.</p>
      <section className="data-stats" aria-label="Current data coverage">
        <p><strong>{summary.players}</strong> players</p>
        <p><strong>{summary.clubs}</strong> clubs</p>
        <p><strong>{summary.connections}</strong> links</p>
      </section>
      <section className="info-card">
        <h2>How game data is selected</h2>
        <p>{summary.challengePlayers} curated players are currently eligible for generated challenges. Imported records are retained separately until they are reviewed, so puzzle quality never depends on an unverified link.</p>
      </section>
      <section className="info-card">
        <h2>Coverage and sources</h2>
        <p>The current pool includes historic and modern club links across the Premier League, La Liga, Serie A, Bundesliga, and Ligue 1. {summary.wikidataConnections} links are sourced from Wikidata; {summary.verifiedConnections} links have been formally verified in this product.</p>
        <p>Wikidata is openly licensed structured data. Relationship records retain their source reference and verification status, and we run automated checks for orphaned entities, duplicate links, and reachable challenge routes.</p>
      </section>
      <section className="info-card">
        <h2>What we are improving</h2>
        <p>We are expanding coverage in controlled batches and building a review workflow before promoting imported relationships into live game challenges.</p>
      </section>
    </main>
  );
}
