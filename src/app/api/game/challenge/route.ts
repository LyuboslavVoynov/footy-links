import { NextResponse } from "next/server";
import { getFootballGraph } from "@/lib/game/graph-data";
import { generateRandomChallenge, generateSeededChallenge, type ChallengeDifficulty } from "@/lib/game/graph";

const difficulties = new Set<ChallengeDifficulty>(["easy", "standard", "hard"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "practice" ? "practice" : "daily";
    const requestedDifficulty = searchParams.get("difficulty") as ChallengeDifficulty | null;
    const difficulty = requestedDifficulty && difficulties.has(requestedDifficulty) ? requestedDifficulty : "standard";
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    const challenge = mode === "daily" ? generateSeededChallenge(await getFootballGraph(), date, difficulty) : generateRandomChallenge(await getFootballGraph());
    return NextResponse.json({ startPlayer: challenge.start, targetPlayer: challenge.target, mode, difficulty, date: mode === "daily" ? date : undefined });
  } catch {
    return NextResponse.json({ error: "Unable to generate a challenge." }, { status: 503 });
  }
}
