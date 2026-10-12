"use client";

import { useState } from "react";

type Candidate = {
  playerId: string;
  clubId: string;
  playerName: string;
  clubName: string;
  appearances: number | null;
  sourceName: string | null;
  sourceReference: string | null;
  clubApproved: boolean;
};

export function IntakeReviewClient({ candidates }: { candidates: Candidate[] }) {
  const [items, setItems] = useState(candidates);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  async function review(candidate: Candidate, decision: "approved" | "rejected") {
    const key = `${candidate.playerId}:${candidate.clubId}`;
    setWorking(key);
    setMessage(null);
    const response = await fetch("/api/admin/intake/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: candidate.playerId, clubId: candidate.clubId, decision }),
    });
    const result = await response.json() as { error?: string };
    setWorking(null);
    if (!response.ok) {
      setMessage(result.error ?? "The review could not be saved.");
      return;
    }
    setItems((current) => current.filter((item) => item.playerId !== candidate.playerId || item.clubId !== candidate.clubId));
    setMessage(`${candidate.playerName} → ${candidate.clubName} was ${decision}. Run the curated graph rebuild after approving a batch.`);
  }

  if (!items.length) return <p className="empty-state">No candidates are waiting for review. Import a vetted club-era pack to begin.</p>;

  return (
    <>
      {message && <p className="intake-message" role="status">{message}</p>}
      <div className="intake-list">
        {items.map((candidate) => {
          const key = `${candidate.playerId}:${candidate.clubId}`;
          const canApprove = candidate.clubApproved && (candidate.appearances ?? 0) >= 50 && Boolean(candidate.sourceReference);
          return (
            <article className="candidate-card" key={key}>
              <div>
                <p className="eyebrow">Candidate link</p>
                <h2>{candidate.playerName} <span>→</span> {candidate.clubName}</h2>
                <p className="candidate-evidence"><strong>{candidate.appearances ?? "—"}</strong> recorded appearances · {candidate.clubApproved ? "Approved club" : "Club needs approval"}</p>
                <p className="candidate-source">Source: {candidate.sourceName ?? "Not supplied"}{candidate.sourceReference ? ` · ${candidate.sourceReference}` : " · Reference required"}</p>
              </div>
              <div className="candidate-actions">
                <button className="start-button" disabled={!canApprove || working === key} onClick={() => review(candidate, "approved")}>Approve</button>
                <button className="secondary-button" disabled={working === key} onClick={() => review(candidate, "rejected")}>Reject</button>
                {!canApprove && <small>Approval needs an approved club, source reference, and 50+ appearances.</small>}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
