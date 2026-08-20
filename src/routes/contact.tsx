import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { submitPilotRequest } from "@/lib/waterwise.functions";

type Tier = "pilot" | "municipal" | "state";

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>): { tier?: Tier } => {
    const t = s['tier'];
    return t === "pilot" || t === "municipal" || t === "state" ? { tier: t } : {};
  },
  head: () => ({
    meta: [
      { title: "Start a 90-day WaterWise pilot" },
      {
        name: "description",
        content:
          "Request a free 90-day single-ward pilot of WaterWise, or talk to us about a municipal or state rollout. We reply with a scoping call and a baseline NRW audit plan.",
      },
      { property: "og:title", content: "Start a 90-day WaterWise pilot" },
      {
        property: "og:description",
        content: "Free 90-day single-ward pilot, ending in a baseline non-revenue-water audit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const tierCopy: Record<Tier, { label: string; blurb: string }> = {
  pilot: {
    label: "Free 90-day pilot",
    blurb: "One ward, up to 25 sensor points, ends with a baseline NRW audit report.",
  },
  municipal: {
    label: "Municipal licence",
    blurb: "₹18 per connection per year — unlimited wards, SMS/IVR channel, scheme exports.",
  },
  state: {
    label: "State / utility group",
    blurb: "Multi-city rollout, cross-city NRW benchmarking, on-premise deployment.",
  },
};

function ContactPage() {
  const search = useSearch({ from: "/contact" });
  const submit = useServerFn(submitPilotRequest);
  const [tier, setTier] = useState<Tier>(search.tier ?? "pilot");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await submit({
        data: {
          name: String(fd.get("name") ?? ""),
          organisation: String(fd.get("organisation") ?? ""),
          role: String(fd.get("role") ?? "") || undefined,
          email: String(fd.get("email") ?? ""),
          city: String(fd.get("city") ?? "") || undefined,
          connections: String(fd.get("connections") ?? "") || undefined,
          message: String(fd.get("message") ?? "") || undefined,
          tier,
        },
      });
      if (res.ok) setDone(true);
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Please check the form — an email address and a name are required.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Pilot request
        </div>
        <h1 className="mt-3 text-3xl font-semibold">Run WaterWise on one of your wards</h1>
        <p className="mt-3 text-muted-foreground">
          Ninety days, one ward, no licence fee. We connect to whatever you already log — even
          district-metered-area readings in a spreadsheet — and hand back a baseline non-revenue-water
          audit you can put straight into an AMRUT 2.0 report.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/5 p-6">
            <CheckCircle2 className="size-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold">Request recorded</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We have your details. Expect a scoping call within two working days — we will ask for
              one ward's supply data and nothing else to get started.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold">What are you interested in?</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {(Object.keys(tierCopy) as Tier[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    aria-pressed={tier === t}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      tier === t
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {tierCopy[t].label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{tierCopy[tier].blurb}</p>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Your name" required />
              <Field name="role" label="Role" placeholder="e.g. Executive Engineer" />
              <Field name="organisation" label="Utility / organisation" required />
              <Field name="email" label="Work email" type="email" required />
              <Field name="city" label="City or ULB" />
              <Field name="connections" label="Approx. connections" placeholder="e.g. 120,000" />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium">
                Anything we should know?
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                placeholder="Current NRW estimate, what data you already log, timelines…"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Request the pilot
            </button>
            <p className="text-xs text-muted-foreground">
              We store only what you type here, in the platform's own database. No marketing lists.
            </p>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
      />
    </div>
  );
}
