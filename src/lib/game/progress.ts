export type DailyProgress = { dates: string[]; streak: number };

function previousDate(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export function recordDailyCompletion(dates: string[], date: string): DailyProgress {
  const completedDates = [...new Set([...dates, date])].sort();
  const knownDates = new Set(completedDates);
  let streak = 0;
  let cursor = date;
  while (knownDates.has(cursor)) {
    streak += 1;
    cursor = previousDate(cursor);
  }
  return { dates: completedDates, streak };
}

export function formatShareResult(input: { date: string; difficulty: string; clicks: number; seconds: number; optimalClicks?: number }) {
  const time = `${String(Math.floor(input.seconds / 60)).padStart(2, "0")}:${String(input.seconds % 60).padStart(2, "0")}`;
  const route = input.optimalClicks === undefined ? "" : ` · ${input.clicks - input.optimalClicks === 0 ? "optimal" : `+${input.clicks - input.optimalClicks}`}`;
  return `Football Links Daily · ${input.date}\n${input.difficulty} · ${input.clicks} clicks · ${time}${route}`;
}
