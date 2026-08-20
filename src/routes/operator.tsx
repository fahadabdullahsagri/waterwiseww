import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { OfficerBadge } from "@/components/officer-badge";
import { useEnsureDemo } from "@/hooks/use-ensure-demo";
import { getOfficer } from "@/lib/officer";
import { AgentTrace, type AgentEvent } from "@/components/agent-trace";
import { operatorQuery } from "@/lib/queries";
import { approveEvent } from "@/lib/waterwise.functions";
import type { MapPoint } from "@/components/network-map";

const NetworkMap = lazy(() => import("@/components/network-map"));

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Operator control room — WaterWise" },
      {
        name: "description",
        content:
          "Live leak alert queue, network map and pressure trend for the demo water network, with an Agentrix trace and human approval on every dispatch.",
      },
      { property: "og:title", content: "Operator control room — WaterWise" },
      {
        property: "og:description",
        content: "Alert queue, live map and agent trace with human-in-the-loop approvals.",
      },
    ],
  }),
  component: OperatorPage,
});

function OperatorPage() {
  const { data } = useQuery(operatorQuery);
  const approve = useServerFn(approveEvent);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [officer, setOfficerState] = useState<string | null>(null);
  const [needsOfficer, setNeedsOfficer] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOfficerState(getOfficer());
  }, []);

  const alerts = data?.alerts ?? [];
  const wards = new Map((data?.wards ?? []).map((w) => [w.id as string, w]));
  const orders = new Map((data?.orders ?? []).map((o) => [o.alert_id as string, o]));
  const events = (data?.events ?? []) as unknown as AgentEvent[];
  const shown = selected ? events.filter((e) => (e as { alert_id?: string }).alert_id === selected) : events;

  const points: MapPoint[] = [
    ...(data?.sensors ?? []).map((s) => ({
      id: `s-${s.id}`,
      lat: s.lat as number,
      lng: s.lng as number,
      label: `${s.code} — ${wards.get(s.ward_id as string)?.name ?? ""}`,
      severity: "ok" as const,
    })),
    ...alerts.map((a) => {
      const w = wards.get(a.ward_id as string);
      return {
        id: `a-${a.id}`,
        lat: (w?.lat as number) ?? 18.52,
        lng: (w?.lng as number) ?? 73.86,
        label: `${a.title} — priority ${a.priority_score}`,
        severity: (a.severity as MapPoint["severity"]) ?? "medium",
      };
    }),
  ];

  async function onApprove(eventId: string, ok: boolean) {
    const who = officer ?? getOfficer();
    if (!who) {
      setNeedsOfficer(true);
      return;
    }
    await approve({ data: { eventId, approve: ok, officer: who } });
    await queryClient.invalidateQueries();
  }

  const seeding = useEnsureDemo(data ? alerts.length : undefined);

  const pending = events.filter(
    (e) => e.requires_human_approval && e.approval_status === "pending",
  ).length;

  return (
    <div className="control-room flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav
        alertCount={alerts.length}
        loading={!data || seeding}
        intensity={Math.min(1, alerts.length / 8)}
        right={
          <OfficerBadge
            officer={officer}
            highlight={needsOfficer}
            onChange={(name) => {
              setOfficerState(name);
              setNeedsOfficer(false);
            }}
          />
        }
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Operator control room</h1>
            <p className="text-sm text-muted-foreground">
              Demo city · 6 wards · 18 simulated sensors · live schema-matched feed
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <Stat label="Open alerts" value={alerts.filter((a) => a.status === "open").length} />
            <Stat label="Pending approvals" value={pending} warn={pending > 0} />
            <Stat
              label="Est. loss L/h"
              value={Math.round(
                alerts.reduce((a, x) => a + Number(x.est_litres_per_hour ?? 0), 0),
              )}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <section className="rounded-2xl border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
              Repair queue — ranked by litres lost × people affected × pipe age
            </h2>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Incident</th>
                    <th className="px-4 py-2">Ward</th>
                    <th className="px-4 py-2">L/h</th>
                    <th className="px-4 py-2">Priority</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        {seeding
                          ? "Seeding the demo city — sensors, leaks and agent decisions are being written now…"
                          : "No incidents yet — press “Run the 4-minute demo” on the landing page."}
                      </td>
                    </tr>
                  )}
                  {alerts.map((a) => (
                    <tr
                      key={a.id as string}
                      onClick={() => setSelected(selected === a.id ? null : (a.id as string))}
                      className={`cursor-pointer border-t border-border transition-colors hover:bg-muted/60 ${
                        selected === a.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {orders.get(a.id as string)?.queue_position ?? "–"}
                      </td>
                      <td className="px-4 py-2">{a.title as string}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {wards.get(a.ward_id as string)?.name as string}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {Math.round(Number(a.est_litres_per_hour))}
                      </td>
                      <td className="px-4 py-2 font-semibold tabular-nums">{a.priority_score}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            a.status === "dispatched"
                              ? "bg-primary/10 text-primary"
                              : a.status === "on_hold"
                                ? "bg-muted text-muted-foreground"
                                : "bg-warning/15 text-warning-foreground"
                          }`}
                        >
                          {String(a.status).replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="h-[360px] overflow-hidden rounded-2xl border border-border bg-card">
            <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>}>
              {mounted ? (
                <NetworkMap points={points} />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Loading map…
                </div>
              )}
            </Suspense>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Network trend — 24h mean flow & pressure</h2>
          <div className="mt-3 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis
                  yAxisId="r"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <RTooltip />
                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="flow"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  name="Flow (L/min)"
                />
                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="pressure"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  name="Pressure (bar)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Agentrix trace {selected ? "— filtered to selected incident" : ""}
            </h2>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {shown.length === 0 && (
              <p className="rounded-xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                No agent decisions recorded yet.
              </p>
            )}
            {shown.map((e, i) => (
              <AgentTrace
                key={e.id}
                event={e}
                defaultOpen={i === 0 && e.approval_status === "pending"}
                onApprove={(ok) => onApprove(e.id, ok)}
              />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-2 ${
        warn ? "border-warning/50 bg-warning/10" : "border-border bg-card"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value.toLocaleString("en-IN")}</div>
    </div>
  );
}
