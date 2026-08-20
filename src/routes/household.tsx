import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Droplet, Gauge, Waves, MapPin, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StatCard, ScoreRing, UsageChart, StatusAlert } from "@/components/dashboard-parts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddEntry, useHouseholdId, useWaterEntries } from "@/lib/water-queries";
import { estimateAbsorption } from "@/lib/household.functions";
import { analyse, byDay } from "@/lib/water";

export const Route = createFileRoute("/household")({
  head: () => ({
    meta: [
      { title: "My water — household usage & conservation score | WaterWise" },
      {
        name: "description",
        content:
          "Log a daily meter reading and see today's usage, your own baseline, estimated excess litres, a conservation score and a soil-absorption watering plan.",
      },
      { property: "og:title", content: "My water — household usage & conservation score" },
      {
        property: "og:description",
        content:
          "Household water tracking that compares every reading against your own history and flags wastage the same day.",
      },
    ],
  }),
  component: HouseholdPage,
});

const categories = ["household", "garden", "livestock", "other"] as const;

function HouseholdPage() {
  const householdId = useHouseholdId();
  const { data, isLoading } = useWaterEntries(householdId);
  const addEntry = useAddEntry(householdId);

  const entries = data ?? [];
  const analysis = analyse(entries);
  const days = byDay(entries).slice(-7);

  const [litres, setLitres] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("household");

  const today = new Date().toISOString().slice(0, 10);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(litres);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter the litres shown on your meter today");
      return;
    }
    addEntry.mutate(
      { entryDate: today, litres: Math.round(value), category },
      {
        onSuccess: () => {
          setLitres("");
          toast.success("Reading saved — the analysis just updated");
        },
        onError: () => toast.error("Could not save that reading"),
      },
    );
  }

  function simulateLeak() {
    const spike = Math.max(1500, Math.round((analysis.average || 900) * 1.55));
    addEntry.mutate(
      { entryDate: today, litres: spike, category: "household", isDemo: true },
      {
        onSuccess: () => toast.success(`Demo reading of ${spike} L inserted — watch the analysis`),
        onError: () => toast.error("Could not insert the demo reading"),
      },
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav intensity={Math.min(1, analysis.score / 100)} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        <section className="max-w-3xl">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
            Water &amp; climate resilience · SDG 6
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Water wastage goes unnoticed.
            <span className="block text-primary">WaterWise notices it the same day.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Every reading is compared against your own history — not a national average. Abnormal
            usage becomes a clear action you can take today, and anything the network should know
            about goes straight to the utility side of the platform.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Today&apos;s reading
              </span>
              <input
                value={litres}
                onChange={(e) => setLitres(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 820"
                aria-label="Litres used today"
                className="w-40 rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Use
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof categories)[number])}
                aria-label="Category of use"
                className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={addEntry.isPending || !householdId}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {addEntry.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Add reading
            </button>
            <button
              type="button"
              onClick={simulateLeak}
              disabled={addEntry.isPending || !householdId}
              className="inline-flex items-center gap-2 rounded-lg border border-warning/50 bg-warning/10 px-4 py-2.5 text-sm font-semibold text-warning-foreground hover:bg-warning/20 disabled:opacity-70"
            >
              <Zap className="size-4" />
              Demo · simulate a leak
            </button>
            <Link
              to="/citizen"
              className="px-2 py-2.5 text-sm font-semibold text-primary hover:underline"
            >
              Report a water problem →
            </Link>
          </form>
        </section>

        {isLoading || !householdId ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Today's usage"
                value={analysis.today}
                unit="L"
                hint="Latest recorded day"
                icon={<Droplet className="size-4" />}
              />
              <StatCard
                label="Average daily"
                value={analysis.average}
                unit="L"
                hint="Your historical baseline"
                icon={<Gauge className="size-4" />}
              />
              <StatCard
                label="Estimated excess"
                value={analysis.excess}
                unit="L"
                hint="Above your normal average"
                icon={<Waves className="size-4" />}
              />
              <StatCard
                label="Conservation score"
                value={analysis.score}
                unit="/100"
                hint={analysis.label}
                icon={<Activity className="size-4" />}
              />
            </section>

            <section className="mt-6">
              <StatusAlert analysis={analysis} />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold">Consumption trend</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last {days.length} recorded {days.length === 1 ? "day" : "days"} · litres per day
                </p>
                <div className="mt-4">
                  {days.length > 0 ? (
                    <UsageChart data={days} average={analysis.average} />
                  ) : (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No readings yet — add your first entry to see the trend.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold">Conservation score</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  How your recent usage compares with your own baseline
                </p>
                <div className="mt-6">
                  <ScoreRing score={analysis.score} label={analysis.label} tone={analysis.tone} />
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  The score drops when consumption stays above your historical average and recovers
                  as you use less water than before.
                </p>
              </div>
            </section>

            <AbsorptionPanel />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function AbsorptionPanel() {
  const estimate = useServerFn(estimateAbsorption);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) => estimate({ data: coords }),
  });

  function locate() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This browser can't share a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        mutation.mutate({
          // Rounded before it leaves the browser — roughly a 1 km grid cell.
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lng: Math.round(pos.coords.longitude * 100) / 100,
        }),
      () => setError("Location permission was declined — nothing was sent."),
    );
  }

  const r = mutation.data;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
        Location intelligence
      </span>
      <h2 className="mt-3 font-display text-2xl font-semibold">
        Understand the ground beneath your water.
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Use your live location to estimate how much water the local soil can still hold, then turn
        that signal into a smarter watering plan. Same live weather feed IrrigateAI uses on the
        farm side.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={locate}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MapPin className="size-4" />
          )}
          Estimate absorption here
        </button>
        <span className="text-xs text-muted-foreground">
          A 250 m soil-storage proxy, not a field infiltration test. Your precise coordinates are
          never stored.
        </span>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {r ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Soil moisture
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {(r.soilMoisture * 100).toFixed(0)}%
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Rain, last 24 h
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">{r.rain24h.toFixed(1)} mm</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Remaining storage
            </p>
            <p className="mt-1 font-display text-2xl font-semibold capitalize">
              {r.storageMm} mm · {r.capacity}
            </p>
          </div>
          <p className="sm:col-span-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            {r.advice}
          </p>
        </div>
      ) : null}
    </section>
  );
}
