import { Link } from "@tanstack/react-router";
import { Droplets } from "lucide-react";

const links = [
  { to: "/operator", label: "Operator" },
  { to: "/citizen", label: "Citizen" },
  { to: "/irrigate", label: "IrrigateAI" },
  { to: "/gov", label: "Government" },
  { to: "/metrics", label: "Metrics" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="size-4" />
          </span>
          WaterWise
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Agentrix
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
