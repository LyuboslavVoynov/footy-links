import { NextResponse } from "next/server";
import { getGameplayClubBySlug, getGameplayPlayerBySlug } from "@/lib/db/queries";

type Context = { params: Promise<{ type: string; slug: string }> };

export async function GET(_: Request, { params }: Context) {
  const { type, slug } = await params;
  try {
    if (type === "player") {
      const player = await getGameplayPlayerBySlug(slug);
      if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });
      return NextResponse.json({ entity: { id: `player:${player.slug}`, type: "player", slug: player.slug, name: player.name, nationality: player.nationality, imageUrl: player.imageUrl }, connections: player.playerClubs.map(({ club }) => ({ id: `club:${club.slug}`, type: "club", slug: club.slug, name: club.name, country: club.country, imageUrl: club.crestUrl })) });
    }
    if (type === "club") {
      const club = await getGameplayClubBySlug(slug);
      if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });
      return NextResponse.json({ entity: { id: `club:${club.slug}`, type: "club", slug: club.slug, name: club.name, country: club.country, imageUrl: club.crestUrl }, connections: club.playerClubs.map(({ player }) => ({ id: `player:${player.slug}`, type: "player", slug: player.slug, name: player.name, nationality: player.nationality, imageUrl: player.imageUrl })) });
    }
    return NextResponse.json({ error: "Unknown entity type." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to load connections." }, { status: 503 });
  }
}
