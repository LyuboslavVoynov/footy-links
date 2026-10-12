import Link from "next/link";
import { IntakeReviewClient } from "@/components/intake-review-client";
import { getIntakeDashboard } from "@/lib/db/queries";
import { hasIntakeAccess } from "@/lib/admin/intake-auth";
import { redirect } from "next/navigation";

export default async function IntakePage() {
  if (!await hasIntakeAccess()) redirect("/admin/login");
  const dashboard = await getIntakeDashboard();
  const candidates = dashboard.rows.map((row) => ({
    playerId: row.playerId,
    clubId: row.clubId,
    playerName: row.player.name,
    clubName: row.club.name,
    appearances: row.appearances,
    sourceName: row.sourceName,
    sourceReference: row.sourceReference,
    clubApproved: row.club.gameEligible,
  }));
  return (
    <main className="intake-page">
      <Link className="back-link" href="/">← Football Links</Link>
      <p className="eyebrow">Editorial workspace</p>
      <h1>Player intake</h1>
      <p className="tagline">Only verified, meaningful player-to-club tenures can enter the puzzle graph.</p>
      <section className="intake-stats" aria-label="Intake status">
        <p><strong>{dashboard.candidates}</strong> awaiting review</p>
        <p><strong>{dashboard.approved}</strong> approved links</p>
        <p><strong>{dashboard.archived}</strong> quarantined archive links</p>
      </section>
      <section className="intake-guide">
        <h2>Approval rule</h2>
        <p>Approve only when the club is on the editorial catalogue, the player recorded at least 50 senior competitive appearances for that club, and the source is retained on the relationship. Approved links become playable only after the curated graph is rebuilt.</p>
      </section>
      <section aria-labelledby="queue-title">
        <div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="queue-title">Candidates with the strongest evidence first</h2></div></div>
        <IntakeReviewClient candidates={candidates} />
      </section>
      <section className="intake-guide">
        <h2>Recent imports</h2>
        {dashboard.batches.length ? <ul className="batch-list">{dashboard.batches.map((batch) => <li key={batch.id}><strong>{batch.sourceName}</strong> · {batch.candidateCount} candidates · {batch.status}</li>)}</ul> : <p>No controlled intake packs have been imported yet.</p>}
      </section>
    </main>
  );
}
