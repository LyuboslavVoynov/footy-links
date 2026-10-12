"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GraphEntity } from "@/lib/game/graph";
import { formatShareResult, recordDailyCompletion } from "@/lib/game/progress";
import { compareWithOptimal, type GameResult } from "@/lib/game/results";
import { elapsedSeconds, formatElapsed, moveToEntity, startGame, type GameState } from "@/lib/game/state";

type GameEntity = GraphEntity & { slug: string; nationality?: string | null; country?: string | null };
type EntityResponse = { entity: GameEntity; connections: GameEntity[]; error?: string };
type ChallengeMode = "daily" | "practice";
type ChallengeDifficulty = "easy" | "standard" | "hard";
type ChallengeResponse = { startPlayer: GraphEntity; targetPlayer: GraphEntity; mode?: ChallengeMode; difficulty?: ChallengeDifficulty; date?: string; error?: string };
type ResultResponse = { optimalClicks: number; optimalPath: GraphEntity[]; error?: string };
type PersonalBest = { clicks: number; seconds: number };

const withSlug = (entity: GraphEntity): GameEntity => ({ ...entity, slug: entity.id.split(":")[1] });
const initialsFor = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function EntityAvatar({ entity, compact = false }: { entity: Pick<GameEntity, "name" | "imageUrl" | "type">; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (entity.type === "player" && (!entity.imageUrl || failed)) return null;
  return <span className={`entity-avatar ${entity.type} ${compact ? "compact" : ""}`}>{entity.imageUrl && !failed ? <img src={entity.imageUrl} alt="" onError={() => setFailed(true)} /> : <span aria-hidden="true">{initialsFor(entity.name)}</span>}</span>;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<{ response: Response; payload: T }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return { response, payload: await response.json() as T };
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") throw new Error("That request took too long. Please try again.");
    throw reason;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function GameClient() {
  const [game, setGame] = useState<GameState>();
  const [connections, setConnections] = useState<GameEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(Date.now());
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<GameResult>();
  const [resultError, setResultError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState("Loading a new challenge.");
  const [guideOpen, setGuideOpen] = useState(false);
  const [showOptimalRoute, setShowOptimalRoute] = useState(false);
  const [mode, setMode] = useState<ChallengeMode>("daily");
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>("standard");
  const [challengeDate, setChallengeDate] = useState<string>();
  const [personalBest, setPersonalBest] = useState<PersonalBest>();
  const [streak, setStreak] = useState(0);
  const [shareMessage, setShareMessage] = useState<string>();

  const recordKey = (challengeMode: ChallengeMode, challengeDifficulty: ChallengeDifficulty, date?: string) => `football-links:best:${challengeMode}:${challengeDifficulty}:${date ?? "practice"}`;
  const readPersonalBest = (challengeMode: ChallengeMode, challengeDifficulty: ChallengeDifficulty, date?: string) => {
    const stored = window.localStorage.getItem(recordKey(challengeMode, challengeDifficulty, date));
    return stored ? JSON.parse(stored) as PersonalBest : undefined;
  };
  const readDailyProgress = () => {
    const stored = window.localStorage.getItem("football-links:daily-progress");
    return stored ? JSON.parse(stored) as { dates: string[]; streak: number } : { dates: [], streak: 0 };
  };

  const loadEntity = useCallback(async (entity: GameEntity) => {
    const { response, payload } = await requestJson<EntityResponse>(`/api/game/entity/${entity.type}/${entity.slug}`);
    if (!response.ok) throw new Error(payload.error ?? "Unable to load connections.");
    return payload;
  }, []);

  const loadChallenge = useCallback(async () => {
    setLoading(true); setError(undefined); setSearch(""); setResult(undefined); setResultError(undefined); setShowOptimalRoute(false);
    setStatusMessage("Loading a new challenge.");
    try {
      const parameters = new URLSearchParams({ mode, difficulty });
      const { response, payload } = await requestJson<ChallengeResponse>(`/api/game/challenge?${parameters}`, { cache: "no-store" });
      if (!response.ok) throw new Error(payload.error ?? "Unable to generate a challenge.");
      const state = startGame(withSlug(payload.startPlayer), withSlug(payload.targetPlayer));
      const initial = await loadEntity(state.currentEntity as GameEntity);
      setGame({ ...state, currentEntity: initial.entity });
      setConnections(initial.connections);
      setGuideOpen(window.localStorage.getItem("football-links-guide-seen") !== "true");
      setChallengeDate(payload.date);
      setPersonalBest(readPersonalBest(payload.mode ?? mode, payload.difficulty ?? difficulty, payload.date));
      setStreak(readDailyProgress().streak);
      setStatusMessage(`Challenge ready. Reach ${state.targetPlayer.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start a game.");
      setStatusMessage("A challenge could not be loaded.");
    } finally { setLoading(false); }
  }, [difficulty, loadEntity, mode]);

  useEffect(() => { void loadChallenge(); }, [loadChallenge]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const loadResult = async (completedGame: GameState) => {
    try {
      const { response, payload } = await requestJson<ResultResponse>("/api/game/result", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ startPlayerId: completedGame.startPlayer.id, targetPlayerId: completedGame.targetPlayer.id }) });
      if (!response.ok) throw new Error(payload.error ?? "Unable to calculate the optimal route.");
      const comparison = compareWithOptimal(completedGame.clicks, { distance: payload.optimalClicks, path: payload.optimalPath });
      setResult(comparison);
      const seconds = elapsedSeconds(completedGame);
      const key = recordKey(mode, difficulty, challengeDate);
      const previous = readPersonalBest(mode, difficulty, challengeDate);
      const isBest = !previous || completedGame.clicks < previous.clicks || (completedGame.clicks === previous.clicks && seconds < previous.seconds);
      if (isBest) {
        const nextBest = { clicks: completedGame.clicks, seconds };
        window.localStorage.setItem(key, JSON.stringify(nextBest));
        setPersonalBest(nextBest);
      }
      if (mode === "daily" && challengeDate) {
        const progress = recordDailyCompletion(readDailyProgress().dates, challengeDate);
        window.localStorage.setItem("football-links:daily-progress", JSON.stringify(progress));
        setStreak(progress.streak);
      }
    } catch (reason) { setResultError(reason instanceof Error ? reason.message : "Unable to calculate the optimal route."); }
  };

  const move = async (entity: GameEntity) => {
    if (!game || moving || game.status !== "playing") return;
    setMoving(true); setError(undefined);
    const previous = game;
    const next = moveToEntity(game, entity);
    setGame(next);
    setSearch("");
    try {
      if (next.status === "completed") { setConnections([]); setStatusMessage(`Completed in ${next.clicks} clicks.`); void loadResult(next); return; }
      const detail = await loadEntity(entity);
      setGame((current) => current ? { ...current, currentEntity: detail.entity } : current);
      setConnections(detail.connections);
      setStatusMessage(`Moved to ${detail.entity.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the next entity.");
      setGame(previous);
      setStatusMessage("Move unavailable. Your previous position has been restored.");
    } finally { setMoving(false); }
  };

  const visibleConnections = useMemo(() => game?.currentEntity.type === "club" ? connections.filter((entity) => entity.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) : connections, [connections, game?.currentEntity.type, search]);
  const dismissGuide = () => {
    window.localStorage.setItem("football-links-guide-seen", "true");
    setGuideOpen(false);
    setGame((current) => current ? { ...current, startedAt: Date.now() } : current);
    setStatusMessage("Guide dismissed. The clock has started.");
  };
  const shareResult = async (clicks: number, seconds: number, optimalClicks?: number) => {
    if (!challengeDate) return;
    const text = formatShareResult({ date: challengeDate, difficulty, clicks, seconds, optimalClicks });
    try {
      const navigatorWithShare = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      const canShare = typeof navigatorWithShare.share === "function";
      if (canShare) await navigatorWithShare.share({ title: "Football Links", text });
      else await navigator.clipboard.writeText(text);
      setShareMessage(canShare ? "Share sheet opened." : "Result copied to clipboard.");
    } catch {
      setShareMessage("Sharing was cancelled or unavailable.");
    }
  };

  if (loading) return <main className="game-page game-loading" aria-busy="true"><p className="eyebrow">Preparing your route</p><div className="game-skeleton" aria-hidden="true"><span /><span /><span /><span /></div><p>Finding two players to connect…</p></main>;
  if (error && !game) return <main className="game-page game-error"><p className="eyebrow">Challenge unavailable</p><h1>Couldn’t start a game</h1><p role="alert">{error}</p><div className="action-row"><button className="start-button" onClick={() => void loadChallenge()}>Try again</button><Link href="/" className="secondary-button">Back to home</Link></div></main>;
  if (!game) return null;
  const seconds = elapsedSeconds(game, now);
  const roundRecap = result ? result.isOptimal
    ? { grade: "Perfect link", insight: "You found the shortest possible route." }
    : result.delta <= 2
      ? { grade: "Strong run", insight: `Just ${result.delta} ${result.delta === 1 ? "link" : "links"} from the shortest route.` }
      : { grade: "Keep exploring", insight: `You were ${result.delta} links away from the shortest route.` }
    : undefined;
  const challengeTitle = mode === "daily" ? `Daily challenge · ${difficulty}` : `Practice · ${difficulty}`;
  if (game.status === "completed") return <main className="game-page completion"><p className="eyebrow">{challengeTitle}</p><h1>{game.targetPlayer.name}</h1><section className="result-summary"><p className="result-grade">{roundRecap?.grade ?? "Route found"}</p><h2>Your route</h2><p>{game.clicks} clicks · {formatElapsed(seconds)}</p>{personalBest?.clicks === game.clicks && personalBest.seconds === seconds ? <p className="personal-best">New personal best</p> : null}{mode === "daily" && streak > 0 ? <p className="streak-status">{streak} day {streak === 1 ? "streak" : "streak"} · saved on this device</p> : null}<ol>{game.path.map((entity, index) => <li key={`${entity.id}-${index}`}>{entity.name}</li>)}</ol>{result ? <><p className="result-verdict">{roundRecap?.insight}</p><button className="text-button" onClick={() => setShowOptimalRoute((visible) => !visible)}>{showOptimalRoute ? "Hide shortest route" : "Review shortest route"}</button>{showOptimalRoute ? <section className="optimal-route"><h2>Shortest possible · {result.optimalClicks} clicks</h2><ol>{result.optimalPath.map((entity, index) => <li key={`${entity.id}-${index}`}>{entity.name}</li>)}</ol></section> : null}</> : <p>Calculating the shortest route…</p>}{resultError ? <p className="error-message" role="alert">{resultError}</p> : null}</section><div className="action-row"><button className="start-button" onClick={() => void loadChallenge()}>Play Again</button>{mode === "daily" ? <button className="secondary-button" onClick={() => void shareResult(game.clicks, seconds, result?.optimalClicks)}>Share result</button> : null}<button className="secondary-button" onClick={() => setMode("practice")}>New practice round</button><Link className="secondary-button" href="/data">Data &amp; sources</Link></div>{shareMessage ? <p className="share-status" role="status">{shareMessage}</p> : null}</main>;

  const currentMeta = (game.currentEntity as GameEntity).nationality ?? (game.currentEntity as GameEntity).country ?? "";
  return <main className="game-page split-game">
    <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>
    <header className="game-header"><Link href="/">← Quit</Link><p className="challenge-name">{challengeTitle}</p><div className="scoreboard"><span>Clicks <strong>{game.clicks}</strong></span><span>{guideOpen ? "Ready" : formatElapsed(seconds)}</span></div></header>
    <section className="player-pair" aria-label="Current player and target player">
      <article className="player-anchor current-anchor player-arrival" key={game.currentEntity.id}><span>Current {game.currentEntity.type}</span><EntityAvatar entity={game.currentEntity as GameEntity} /><strong>{game.currentEntity.name}</strong><small>{currentMeta}</small></article>
      <div className="route-bridge" aria-label="Visible route progression"><span>Your route</span><div>{game.path.map((entity, index) => <span className="route-step" key={`${entity.id}-${index}`}>{entity.name}{index < game.path.length - 1 ? <i className="route-link" aria-hidden="true" /> : null}</span>)}<span className="route-step target-step">{game.targetPlayer.name}</span></div><small>{game.clicks === 0 ? "Choose a connection to begin" : `${game.clicks} ${game.clicks === 1 ? "link" : "links"} mapped`}</small></div>
      <article className="player-anchor target-anchor"><span>Target player</span><EntityAvatar entity={game.targetPlayer as GameEntity} /><strong>{game.targetPlayer.name}</strong><small>Reach this player</small></article>
    </section>
    <section className="challenge-controls" aria-label="Challenge options"><div className="mode-toggle"><button aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>Daily</button><button aria-pressed={mode === "practice"} onClick={() => setMode("practice")}>Practice</button></div><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as ChallengeDifficulty)}><option value="easy">Easy</option><option value="standard">Standard</option><option value="hard">Hard</option></select></label>{personalBest ? <p>Best: {personalBest.clicks} clicks · {formatElapsed(personalBest.seconds)}</p> : <p>{mode === "daily" ? "Same puzzle for everyone today." : "A fresh route every round."}</p>}</section>
    <section className="entity-card" aria-busy={moving}><div className="current-node"><p className="eyebrow">{moving ? "Mapping connection" : "Your move"}</p><h1>Choose your next {game.currentEntity.type === "player" ? "club" : "player"}</h1><p>From {game.currentEntity.name}</p></div>{game.currentEntity.type === "club" ? <label className="club-search">Search players<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players" /></label> : null}{error ? <p className="error-message" role="alert">{error}</p> : null}<div className="connection-list">{visibleConnections.map((entity) => <button key={entity.id} data-entity-type={entity.type} disabled={moving || guideOpen} onClick={() => void move(entity)}><EntityAvatar entity={entity} compact /><span><span className="connection-type">{entity.type}</span>{entity.name}</span></button>)}{game.currentEntity.type === "club" && visibleConnections.length === 0 ? <p>No players match that search.</p> : null}</div></section>
    {guideOpen ? <section className="guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title"><div className="guide-card"><p className="eyebrow">How to play</p><h2 id="guide-title">Make the shortest football link.</h2><ol><li><strong>Start with the current player.</strong> Choose a club they played for.</li><li><strong>Follow the connections.</strong> Choose a player from that club, then another club.</li></ol><p className="guide-tip">Your timer starts when you begin. Take a moment to scan the target.</p><button className="start-button" autoFocus onClick={dismissGuide}>I’m ready</button></div></section> : null}
  </main>;
}
