import { useMemo, useState } from "react";

/**
 * The number a water-department head actually asks for:
 * "what does one percentage point of non-revenue water cost me, and what do I get back?"
 * Everything here is arithmetic the buyer can re-do on paper — no model, no black box.
 */
const fmtInr = (n: number) =>
  n >= 1e7
    ? `₹${(n / 1e7).toFixed(2)} cr`
    : n >= 1e5
      ? `₹${(n / 1e5).toFixed(1)} lakh`
      : `₹${Math.round(n).toLocaleString("en-IN")}`;

export function RoiCalculator() {
  const [connections, setConnections] = useState(120_000);
  const [supplyMld, setSupplyMld] = useState(180);
  const [nrw, setNrw] = useState(32);
  const [cost, setCost] = useState(12); // ₹ per kilolitre, treatment + pumping

  const r = useMemo(() => {
    const litresPerYear = supplyMld * 1e6 * 365;
    const lostKl = (litresPerYear * (nrw / 100)) / 1000;
    const lostValue = lostKl * cost;
    // Conservative pilot claim: recover a fifth of current losses in year one.
    const recovered = lostValue * 0.2;
    const licence = connections * 18;
    return {
      lostValue,
      recovered,
      licence,
      net: recovered - licence,
      multiple: licence > 0 ? recovered / licence : 0,
      litresRecovered: (lostKl * 0.2 * 1000) / 1e9, // billion litres
    };
  }, [connections, supplyMld, nrw, cost]);

  const fields = [
    { label: "Metered connections", value: connections, set: setConnections, min: 5_000, max: 1_000_000, step: 5_000, fmt: (v: number) => v.toLocaleString("en-IN") },
    { label: "Water supplied (MLD)", value: supplyMld, set: setSupplyMld, min: 5, max: 1_500, step: 5, fmt: (v: number) => `${v} MLD` },
    { label: "Current non-revenue water", value: nrw, set: setNrw, min: 5, max: 60, step: 1, fmt: (v: number) => `${v}%` },
    { label: "Cost per kilolitre supplied", value: cost, set: setCost, min: 4, max: 40, step: 1, fmt: (v: number) => `₹${v}/kL` },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={f.label} className="text-sm font-medium">
                {f.label}
              </label>
              <span className="font-mono text-sm text-primary">{f.fmt(f.value)}</span>
            </div>
            <input
              id={f.label}
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Assumes WaterWise recovers a fifth of current losses in year one — below what published
          district-metered-area leak programmes report — and the ₹18 per connection per year
          municipal licence.
        </p>
      </div>

      <div className="grid gap-3 self-start sm:grid-cols-2">
        <Stat label="Water lost today" value={fmtInr(r.lostValue)} sub="per year, at your cost of supply" tone="loss" />
        <Stat label="Recovered in year one" value={fmtInr(r.recovered)} sub={`${r.litresRecovered.toFixed(2)} billion litres`} tone="gain" />
        <Stat label="WaterWise licence" value={fmtInr(r.licence)} sub="per year, all wards" />
        <Stat
          label="Net year-one return"
          value={fmtInr(r.net)}
          sub={`${r.multiple.toFixed(1)}× the licence cost`}
          tone="gain"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "loss" | "gain";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        tone === "loss"
          ? "border-destructive/30 bg-destructive/5"
          : tone === "gain"
            ? "border-primary/30 bg-primary/5"
            : "border-border bg-card"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-display text-2xl font-semibold ${
          tone === "loss" ? "text-destructive" : tone === "gain" ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
