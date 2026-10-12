import { describe, expect, it } from "vitest";
import { compareWithOptimal } from "@/lib/game/results";

const route = [
  { id: "player:a", type: "player" as const, name: "A" },
  { id: "club:x", type: "club" as const, name: "X" },
  { id: "player:b", type: "player" as const, name: "B" },
];

describe("optimal-route results", () => {
  it("recognises an optimal completion", () => {
    expect(compareWithOptimal(2, { distance: 2, path: route })).toMatchObject({ optimalClicks: 2, delta: 0, isOptimal: true });
  });

  it("calculates the correct delta for a longer user route", () => {
    expect(compareWithOptimal(8, { distance: 6, path: route })).toMatchObject({ optimalClicks: 6, delta: 2, isOptimal: false });
  });
});
