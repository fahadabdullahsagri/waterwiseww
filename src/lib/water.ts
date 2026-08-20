/**
 * Household-scale water analysis — pure, browser-safe helpers.
 * Every reading is judged against the household's own history, not a national average.
 */

export type Entry = {
  id: string;
  entry_date: string;
  litres: number;
  category: string;
  note: string | null;
  is_demo: boolean;
};

export type Tone = "good" | "watch" | "bad";

export type Analysis = {
  today: number;
  average: number;
  excess: number;
  score: number;
  tone: Tone;
  label: string;
  recommendation: string;
};

export const toneClasses: Record<Tone, { text: string; bg: string; border: string; stroke: string }> = {
  good: {
    text: "text-saved",
    bg: "bg-saved/10",
    border: "border-saved/40",
    stroke: "var(--saved-green)",
  },
  watch: {
    text: "text-warning-foreground",
    bg: "bg-warning/12",
    border: "border-warning/45",
    stroke: "var(--signal-amber)",
  },
  bad: {
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    stroke: "var(--leak-red)",
  },
};

/** Collapse many readings into one total per calendar day, oldest first. */
export function byDay(entries: Entry[]): { date: string; litres: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.entry_date, (map.get(e.entry_date) ?? 0) + e.litres);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, litres]) => ({ date, litres }));
}

export function analyse(entries: Entry[]): Analysis {
  const days = byDay(entries);
  if (days.length === 0) {
    return {
      today: 0,
      average: 0,
      excess: 0,
      score: 100,
      tone: "good",
      label: "No readings yet",
      recommendation:
        "Add your first meter reading. After three days WaterWise can tell normal use apart from waste.",
    };
  }

  const latest = days[days.length - 1]!;
  const history = days.slice(0, -1);
  const baseline =
    history.length > 0
      ? history.reduce((s, d) => s + d.litres, 0) / history.length
      : latest.litres;

  const excess = Math.max(0, latest.litres - baseline);
  const ratio = baseline > 0 ? latest.litres / baseline : 1;

  // 100 at half the baseline, 0 at 1.5x the baseline.
  const score = Math.round(Math.min(100, Math.max(0, ((1.5 - ratio) / 1) * 100)));

  let tone: Tone = "good";
  let label = "Usage within your normal range";
  let recommendation =
    "Your latest reading sits at or below your own baseline. Keep logging daily so the pattern stays reliable.";

  if (ratio >= 1.35) {
    tone = "bad";
    label = "Possible water wastage";
    recommendation =
      "This reading is far above your baseline. Check taps, toilet cisterns, storage tanks and garden lines — a running toilet alone can waste 200 L a day.";
  } else if (ratio >= 1.12) {
    tone = "watch";
    label = "Usage creeping above baseline";
    recommendation =
      "Slightly higher than usual. If it repeats tomorrow, treat it as a leak signal rather than a busy day.";
  } else if (ratio <= 0.85 && history.length > 0) {
    tone = "good";
    label = "Below your baseline — well done";
    recommendation = `You used about ${Math.round(baseline - latest.litres)} L less than your usual day.`;
  }

  return {
    today: latest.litres,
    average: Math.round(baseline),
    excess: Math.round(excess),
    score,
    tone,
    label,
    recommendation,
  };
}
