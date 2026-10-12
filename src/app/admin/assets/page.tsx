import Link from "next/link";
import { redirect } from "next/navigation";
import { hasIntakeAccess } from "@/lib/admin/intake-auth";
import { getMediaAssetDashboard } from "@/lib/db/queries";
import { AssetReviewClient } from "@/components/asset-review-client";

export default async function AssetRegistryPage() {
  if (!await hasIntakeAccess()) redirect("/admin/login");
  const dashboard = await getMediaAssetDashboard();
  return <main className="intake-page">
    <Link className="back-link" href="/admin/intake">← Player intake</Link>
    <p className="eyebrow">Editorial workspace</p>
    <h1>Visual asset registry</h1>
    <p className="tagline">Every live portrait and badge needs a traceable source and a recorded rights decision.</p>
    <section className="intake-stats" aria-label="Playable asset coverage">
      <p><strong>{dashboard.playablePlayers - dashboard.portraitMissing}/{dashboard.playablePlayers}</strong> player portraits recorded</p>
      <p><strong>{dashboard.playableClubs - dashboard.badgeMissing}/{dashboard.playableClubs}</strong> club badges recorded</p>
      <p><strong>{dashboard.approved}</strong> approved assets</p>
    </section>
    <section className="intake-guide"><h2>Release rule</h2><p>Do not mark an asset approved until its source page, licence, creator attribution and any club trademark restrictions have been reviewed. Missing assets and assets awaiting review keep the launch checklist open.</p></section>
    <section aria-labelledby="asset-queue"><div className="section-heading"><div><p className="eyebrow">Rights review queue</p><h2 id="asset-queue">{dashboard.awaitingReview} assets need verification</h2></div></div>
      <AssetReviewClient assets={dashboard.assets.map((asset) => ({ id: asset.id, name: asset.player?.name ?? asset.club?.name ?? "Unnamed asset", kind: asset.kind, assetUrl: asset.assetUrl, sourceName: asset.sourceName, sourceUrl: asset.sourceUrl, license: asset.license, attribution: asset.attribution }))} />
    </section>
  </main>;
}
