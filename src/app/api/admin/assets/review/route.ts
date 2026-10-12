import { NextResponse } from "next/server";
import { hasIntakeAccess } from "@/lib/admin/intake-auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (!await hasIntakeAccess()) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const body = await request.json() as { id?: string; decision?: "approved" | "rejected"; license?: string; attribution?: string };
  if (!body.id || !["approved", "rejected"].includes(body.decision ?? "")) return NextResponse.json({ error: "A valid asset and decision are required." }, { status: 400 });
  if (body.decision === "approved" && (!body.license?.trim() || !body.attribution?.trim())) {
    return NextResponse.json({ error: "Approval requires both a licence and an attribution record." }, { status: 422 });
  }
  const asset = await prisma.mediaAsset.findUnique({ where: { id: body.id } });
  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  const reviewedAsset = await prisma.mediaAsset.update({ where: { id: asset.id }, data: { rightsStatus: body.decision, license: body.license?.trim() || null, attribution: body.attribution?.trim() || null, verifiedAt: new Date() } });
  // Only an explicitly approved asset may become visible in the game.
  if (body.decision === "approved") {
    if (reviewedAsset.playerId) await prisma.player.update({ where: { id: reviewedAsset.playerId }, data: { imageUrl: reviewedAsset.assetUrl } });
    if (reviewedAsset.clubId) await prisma.club.update({ where: { id: reviewedAsset.clubId }, data: { imageUrl: reviewedAsset.assetUrl } });
  }
  return NextResponse.json({ ok: true });
}
