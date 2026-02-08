import { Trade } from "@/hooks/useUserData";

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Safely parse a P&L value that may be string, number, null, or undefined */
export const parsePnL = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
};

/** Parse "YYYY-MM-DD" (or "YYYY-MM-DDT…") as a *local* Date — avoids the UTC-shift bug */
export const parseLocalDate = (dateString: string): Date => {
  const clean = (dateString || "").split("T")[0];
  const [year, month, day] = clean.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** Format a local Date object back to "YYYY-MM-DD" without UTC shift */
export const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ─── Streak Tracker ─────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  streakType: "win" | "loss" | "none";
  bestWinStreak: number;
}

/**
 * Compute consecutive-day win/loss streak.
 * A "win day" = the sum of all trades on that date is > 0.
 * A "loss day" = sum < 0. Break-even days break the streak.
 */
export function computeStreakData(trades: Trade[]): StreakData {
  if (trades.length === 0) return { currentStreak: 0, streakType: "none", bestWinStreak: 0 };

  // Group trades by date and sum P&L per day
  const dayMap = new Map<string, number>();
  for (const t of trades) {
    const key = (t.trade_date || "").split("T")[0];
    dayMap.set(key, (dayMap.get(key) || 0) + parsePnL(t.pnl));
  }

  // Sort dates ascending
  const sortedDays = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, pnl]) => (pnl > 0 ? "win" : pnl < 0 ? "loss" : "even"));

  // Walk through days to find current streak and best win streak
  let bestWin = 0;
  let currentLen = 0;
  let currentType: "win" | "loss" | "none" = "none";

  for (const result of sortedDays) {
    if (result === "even") {
      currentLen = 0;
      currentType = "none";
    } else if (result === currentType) {
      currentLen++;
    } else {
      currentLen = 1;
      currentType = result;
    }
    if (currentType === "win" && currentLen > bestWin) bestWin = currentLen;
  }

  return { currentStreak: currentLen, streakType: currentType, bestWinStreak: bestWin };
}

// ─── Risk Scorecard ─────────────────────────────────────────────────────────

export interface RiskBreakdown {
  winRate: number;        // 0-25
  riskReward: number;     // 0-25
  positionSizing: number; // 0-25
  maxDrawdown: number;    // 0-25
}

export interface RiskScorecardData {
  grade: string;
  totalScore: number;
  breakdown: RiskBreakdown;
  maxDrawdownValue: number; // actual dollar amount of max drawdown
}

export function computeRiskScorecard(
  trades: Trade[],
  period: "week" | "month"
): RiskScorecardData | null {
  const now = new Date();
  const cutoff =
    period === "week"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const filtered = trades.filter((t) => parseLocalDate(t.trade_date) >= cutoff);
  if (filtered.length < 3) return null;

  const pnls = filtered.map((t) => parsePnL(t.pnl));
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  // 1. Win Rate score (0-25): linear scale from 0% -> 0, 100% -> 25
  const winRate = filtered.length > 0 ? wins.length / filtered.length : 0;
  const winRateScore = Math.min(25, Math.round(winRate * 25));

  // 2. Risk/Reward score (0-25): avg win / avg loss ratio
  const avgWin = wins.length > 0 ? wins.reduce((s, v) => s + v, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length) : 0;
  const rr = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 3 : 0;
  const rrScore = Math.min(25, Math.round((rr / 3) * 25));

  // 3. Position Sizing score (0-25): penalise if any single trade's |PnL| > 30% of total |PnL|
  const totalAbsPnl = pnls.reduce((s, v) => s + Math.abs(v), 0);
  const maxSinglePct = totalAbsPnl > 0 ? Math.max(...pnls.map((p) => Math.abs(p))) / totalAbsPnl : 0;
  // If maxSinglePct <= 10% -> 25, if >= 50% -> 0
  const sizingScore = Math.max(0, Math.min(25, Math.round((1 - (maxSinglePct - 0.1) / 0.4) * 25)));

  // 4. Max Drawdown score (0-25): smaller drawdown = better
  // Sort trades chronologically before calculating drawdown
  const sortedTrades = [...filtered].sort((a, b) => {
    const dateA = parseLocalDate(a.trade_date);
    const dateB = parseLocalDate(b.trade_date);
    return dateA.getTime() - dateB.getTime();
  });

  let runningPnL = 0;
  let peak = 0;
  let maxDD = 0;
  for (const t of sortedTrades) {
    runningPnL += parsePnL(t.pnl);
    if (runningPnL > peak) peak = runningPnL;
    const dd = peak - runningPnL;
    if (dd > maxDD) maxDD = dd;
  }

  // Use total absolute P&L as denominator for meaningful ratio
  let ddScore: number;
  if (totalAbsPnl === 0) {
    ddScore = 0;
  } else {
    const ddPercent = maxDD / totalAbsPnl;
    // 0% drawdown = 25 points, 50%+ drawdown = 0 points
    ddScore = Math.max(0, Math.min(25, Math.round((1 - ddPercent * 2) * 25)));
  }

  const total = winRateScore + rrScore + sizingScore + ddScore;
  const grade =
    total >= 97 ? "A+" : total >= 93 ? "A" : total >= 90 ? "A-" :
    total >= 87 ? "B+" : total >= 83 ? "B" : total >= 80 ? "B-" :
    total >= 77 ? "C+" : total >= 73 ? "C" : total >= 70 ? "C-" :
    total >= 67 ? "D+" : total >= 63 ? "D" : total >= 60 ? "D-" : "F";

  return {
    grade,
    totalScore: total,
    breakdown: {
      winRate: winRateScore,
      riskReward: rrScore,
      positionSizing: sizingScore,
      maxDrawdown: ddScore,
    },
    maxDrawdownValue: maxDD,
  };
}

// ─── Day-of-Week Heatmap ────────────────────────────────────────────────────

export interface DayOfWeekStat {
  day: string;
  dayIndex: number;
  pnl: number;
  tradeCount: number;
  winRate: number;
  isBest: boolean;
  isWorst: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function computeDayOfWeekStats(trades: Trade[]): DayOfWeekStat[] {
  const buckets: { pnl: number; count: number; wins: number }[] = Array.from({ length: 7 }, () => ({
    pnl: 0,
    count: 0,
    wins: 0,
  }));

  for (const t of trades) {
    const d = parseLocalDate(t.trade_date);
    const dow = d.getDay();
    const pnl = parsePnL(t.pnl);
    buckets[dow].pnl += pnl;
    buckets[dow].count++;
    if (pnl > 0) buckets[dow].wins++;
  }

  let bestIdx = -1;
  let worstIdx = -1;
  let bestPnl = -Infinity;
  let worstPnl = Infinity;

  buckets.forEach((b, i) => {
    if (b.count > 0) {
      if (b.pnl > bestPnl) { bestPnl = b.pnl; bestIdx = i; }
      if (b.pnl < worstPnl) { worstPnl = b.pnl; worstIdx = i; }
    }
  });

  return buckets.map((b, i) => ({
    day: DAY_NAMES[i],
    dayIndex: i,
    pnl: Math.round(b.pnl * 100) / 100,
    tradeCount: b.count,
    winRate: b.count > 0 ? Math.round((b.wins / b.count) * 100) : 0,
    isBest: i === bestIdx,
    isWorst: i === worstIdx,
  }));
}

// ─── Ticker Leaderboard ─────────────────────────────────────────────────────

export interface TickerStat {
  symbol: string;
  pnl: number;
  tradeCount: number;
  winRate: number;
}

export function computeTickerLeaderboard(trades: Trade[]): TickerStat[] {
  const map = new Map<string, { pnl: number; count: number; wins: number }>();

  for (const t of trades) {
    const sym = t.symbol.toUpperCase();
    const entry = map.get(sym) || { pnl: 0, count: 0, wins: 0 };
    const pnl = parsePnL(t.pnl);
    entry.pnl += pnl;
    entry.count++;
    if (pnl > 0) entry.wins++;
    map.set(sym, entry);
  }

  return Array.from(map.entries())
    .map(([symbol, s]) => ({
      symbol,
      pnl: Math.round(s.pnl * 100) / 100,
      tradeCount: s.count,
      winRate: s.count > 0 ? Math.round((s.wins / s.count) * 100) : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

