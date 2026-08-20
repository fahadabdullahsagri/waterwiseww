import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { toneClasses, type Analysis } from "@/lib/water";

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(initial + (value - initial) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
}: {
  label: string;
  value: number;
  unit?: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">
        <CountUp value={value} />
        {unit ? <span className="ml-1 text-base text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ScoreRing({ score, label, tone }: { score: number; label: string; tone: Analysis["tone"] }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid place-items-center">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label={`${score} out of 100`}>
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="12"
            stroke="var(--line-hair)"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            stroke={toneClasses[tone].stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="font-display text-4xl font-semibold text-foreground">
            <CountUp value={score} />
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            out of 100
          </p>
        </div>
      </div>
      <p className={cn("mt-3 text-sm font-medium", toneClasses[tone].text)}>{label}</p>
    </div>
  );
}

export function UsageChart({
  data,
  average,
}: {
  data: { date: string; litres: number }[];
  average: number;
}) {
  const shaped = data.map((d) => ({
    ...d,
    day: new Date(d.date + "T00:00:00Z").toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: "UTC",
    }),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={shaped} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--flow)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--flow)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line-hair)" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={54}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ stroke: "var(--flow)", strokeOpacity: 0.3 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--line-hair)",
              background: "var(--card)",
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v.toLocaleString()} L`, "Used"]}
          />
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="var(--signal-amber)"
              strokeDasharray="4 4"
              label={{
                value: "your baseline",
                position: "insideTopRight",
                fontSize: 11,
                fill: "var(--muted-foreground)",
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="litres"
            stroke="var(--flow)"
            strokeWidth={2.5}
            fill="url(#flowFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusAlert({ analysis }: { analysis: Analysis }) {
  const t = toneClasses[analysis.tone];
  return (
    <div className={cn("rounded-2xl border p-5", t.bg, t.border)}>
      <p className={cn("font-mono text-[11px] font-semibold uppercase tracking-widest", t.text)}>
        {analysis.label}
      </p>
      <p className="mt-2 text-sm text-foreground">{analysis.recommendation}</p>
    </div>
  );
}
