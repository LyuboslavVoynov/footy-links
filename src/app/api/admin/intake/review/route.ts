import { NextResponse } from "next/server";
import { MINIMUM_GAME_APPEARANCES } from "@/lib/game/eligibility";
import { prisma } from "@/lib/db/prisma";
import { hasIntakeAccess } from "@/lib/admin/intake-auth";

type ReviewPayload = { playerId?: string; clubId?: string; decision?: string; note?: string };

export async function POST(request: Request) {
  if (!await hasIntakeAccess()) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const body = await request.json() as ReviewPayload;
  if (!body.playerId || !body.clubId || !["approved", "rejected"].includes(body.decision ?? "")) {
    return NextResponse.json({ error: "A player, club, and valid decision are required." }, { status: 400 });
  }

  const tenure = await prisma.playerClub.findUnique({
    where: { playerId_clubId: { playerId: body.playerId, clubId: body.clubId } },
    include: { club: true },
  });
  if (!tenure || tenure.reviewStatus !== "candidate") {
    return NextResponse.json({ error: "This candidate is no longer awaiting review." }, { status: 409 });
  }

  if (body.decision === "approved") {
    const missing: string[] = [];
    if (!tenure.club.gameEligible) missing.push("the club is not in the approved club catalogue");
    if ((tenure.appearances ?? 0) < MINIMUM_GAME_APPEARANCES) missing.push(`fewer than ${MINIMUM_GAME_APPEARANCES} recorded appearances`);
    if (!tenure.sourceName || !tenure.sourceReference) missing.push("a source reference");
    if (missing.length) {
      return NextResponse.json({ error: `Cannot approve: ${missing.join(", ")}.` }, { status: 422 });
    }
  }

  await prisma.playerClub.update({
    where: { playerId_clubId: { playerId: body.playerId, clubId: body.clubId } },
    data: {
      reviewStatus: body.decision,
      reviewerNote: body.note?.trim() || null,
      reviewedAt: new Date(),
      verificationStatus: body.decision === "approved" ? "verified" : tenure.verificationStatus,
      validatedAt: body.decision === "approved" ? new Date() : tenure.validatedAt,
    },
  });

  return NextResponse.json({ ok: true, decision: body.decision });
}
