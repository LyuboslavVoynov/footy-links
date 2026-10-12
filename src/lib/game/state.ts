import type { GraphEntity } from "@/lib/game/graph";

export type GameStatus = "loading" | "playing" | "completed" | "error";
export type GameState = {
  startPlayer: GraphEntity;
  targetPlayer: GraphEntity;
  currentEntity: GraphEntity;
  path: GraphEntity[];
  clicks: number;
  startedAt: number;
  completedAt?: number;
  status: GameStatus;
};

export function startGame(startPlayer: GraphEntity, targetPlayer: GraphEntity, startedAt = Date.now()): GameState {
  return { startPlayer, targetPlayer, currentEntity: startPlayer, path: [startPlayer], clicks: 0, startedAt, status: "playing" };
}

export function moveToEntity(state: GameState, entity: GraphEntity, movedAt = Date.now()): GameState {
  const next = { ...state, currentEntity: entity, path: [...state.path, entity], clicks: state.clicks + 1 };
  return entity.type === "player" && entity.id === state.targetPlayer.id ? { ...next, completedAt: movedAt, status: "completed" } : next;
}

export function elapsedSeconds(state: GameState, now = Date.now()) {
  return Math.max(0, Math.floor(((state.completedAt ?? now) - state.startedAt) / 1000));
}

export function formatElapsed(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
