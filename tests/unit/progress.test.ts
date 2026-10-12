import { describe, expect, it } from "vitest";
import { formatShareResult, recordDailyCompletion } from "@/lib/game/progress";

describe("daily progress", () => {
  it("builds a streak from consecutive completion dates", () => {
    expect(recordDailyCompletion(["2026-10-07", "2026-10-08"], "2026-10-09")).toEqual({ dates: ["2026-10-07", "2026-10-08", "2026-10-09"], streak: 3 });
  });

  it("does not inflate a streak when the same day is completed again", () => {
    expect(recordDailyCompletion(["2026-10-08", "2026-10-09"], "2026-10-09")).toEqual({ dates: ["2026-10-08", "2026-10-09"], streak: 2 });
  });

  it("formats a compact, personal-data-free share result", () => {
    expect(formatShareResult({ date: "2026-10-09", difficulty: "Standard", clicks: 6, seconds: 83, optimalClicks: 6 })).toContain("optimal");
  });
});
