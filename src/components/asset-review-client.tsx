"use client";

import { useState } from "react";

export type ReviewAsset = { id: string; name: string; kind: string; assetUrl: string; sourceName: string; sourceUrl: string | null; license: string | null; attribution: string | null };

export function AssetReviewClient({ assets }: { assets: ReviewAsset[] }) {
  const [items, setItems] = useState(assets);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  async function review(asset: ReviewAsset, decision: "approved" | "rejected", form: HTMLFormElement) {
    const values = new FormData(form);
    setWorking(asset.id); setMessage(null);
    const response = await fetch("/api/admin/assets/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: asset.id, decision, license: values.get("license"), attribution: values.get("attribution") }) });
    const result = await response.json() as { error?: string };
    setWorking(null);
    if (!response.ok) { setMessage(result.error ?? "Unable to save the review."); return; }
    setItems((current) => current.filter((item) => item.id !== asset.id));
    setMessage(`${asset.name} was ${decision}.`);
  }
  return <>{message && <p className="intake-message" role="status">{message}</p>}<div className="asset-list">{items.map((asset) => <form className="asset-card" key={asset.id} onSubmit={(event) => { event.preventDefault(); void review(asset, "approved", event.currentTarget); }}><img src={asset.assetUrl} alt="" /><div><p className="eyebrow">{asset.kind}</p><h3>{asset.name}</h3><p>{asset.sourceName} · <a href={asset.sourceUrl ?? asset.assetUrl} target="_blank" rel="noreferrer">view source</a></p><div className="asset-fields"><input name="license" aria-label={`${asset.name} licence`} defaultValue={asset.license ?? ""} placeholder="Licence, e.g. CC BY-SA 4.0" /><input name="attribution" aria-label={`${asset.name} attribution`} defaultValue={asset.attribution ?? ""} placeholder="Required credit line" /></div></div><div className="asset-actions"><button className="start-button" disabled={working === asset.id}>Approve</button><button className="secondary-button" type="button" disabled={working === asset.id} onClick={(event) => void review(asset, "rejected", event.currentTarget.form!)}>Reject</button></div></form>)}</div></>;
}
