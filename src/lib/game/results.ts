import type { GraphEntity, ShortestPath } from "@/lib/game/graph";

export type GameResult = {
  optimalClicks: number;
  optimalPath: GraphEntity[];
  delta: number;
  isOptimal: boolean;
};

export function compareWithOptimal(userClicks: number, optimal: ShortestPath): GameResult {
  const delta = userClicks - optimal.distance;
  return { optimalClicks: optimal.distance, optimalPath: optimal.path, delta, isOptimal: delta === 0 };
}
