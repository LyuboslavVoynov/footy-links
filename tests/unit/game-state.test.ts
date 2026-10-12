import { describe, expect, it } from "vitest";
import { elapsedSeconds, moveToEntity, startGame } from "@/lib/game/state";

const ronaldo = { id: "player:cristiano-ronaldo", type: "player" as const, name: "Cristiano Ronaldo" };
const united = { id: "club:manchester-united", type: "club" as const, name: "Manchester United" };
const saka = { id: "player:bukayo-saka", type: "player" as const, name: "Bukayo Saka" };

describe("game state", () => {
  it("counts every valid navigation and completes only at the target player", () => {
    const started = startGame(ronaldo, saka, 1_000);
    const atClub = moveToEntity(started, united, 2_000);
    const completed = moveToEntity(atClub, saka, 5_000);
    expect(atClub).toMatchObject({ clicks: 1, status: "playing" });
    expect(completed).toMatchObject({ clicks: 2, status: "completed", completedAt: 5_000 });
    expect(completed.path).toEqual([ronaldo, united, saka]);
    expect(elapsedSeconds(completed, 99_000)).toBe(4);
  });
});
