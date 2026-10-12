import { NextResponse } from "next/server";
import { getFootballGraph } from "@/lib/game/graph-data";
import { shortestPath } from "@/lib/game/graph";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { startPlayerId?: string; targetPlayerId?: string };
    if (!body.startPlayerId?.startsWith("player:") || !body.targetPlayerId?.startsWith("player:")) return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
    const solution = shortestPath(await getFootballGraph(), body.startPlayerId, body.targetPlayerId);
    if (!solution) return NextResponse.json({ error: "No route found." }, { status: 404 });
    return NextResponse.json({ optimalClicks: solution.distance, optimalPath: solution.path });
  } catch {
    return NextResponse.json({ error: "Unable to calculate the optimal route." }, { status: 503 });
  }
}
