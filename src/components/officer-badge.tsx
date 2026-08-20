import { useState } from "react";
import { UserRound } from "lucide-react";

import { clearOfficer, setOfficer } from "@/lib/officer";

/**
 * Approvals are only meaningful if they carry a name.
 * The officer signs in once per browser; every approval is stamped with it.
 */
export function OfficerBadge({
  officer,
  highlight,
  onChange,
}: {
  officer: string | null;
  highlight?: boolean;
  onChange: (name: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing || !officer) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("officer") ?? "").trim();
          if (value.length < 2) return;
          setOfficer(value);
          onChange(value);
          setEditing(false);
        }}
        className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${
          highlight ? "border-warning bg-warning/10" : "border-border bg-card"
        }`}
      >
        <label htmlFor="officer" className="sr-only">
          Approving officer name
        </label>
        <input
          id="officer"
          name="officer"
          autoFocus={highlight}
          defaultValue={officer ?? ""}
          placeholder="Sign in to approve — your name"
          className="h-8 w-56 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
        >
          Sign in
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
      <UserRound className="size-3.5 text-primary" aria-hidden="true" />
      <span className="font-medium">{officer}</span>
      <span className="text-muted-foreground">on duty</span>
      <button
        onClick={() => setEditing(true)}
        className="text-primary hover:underline"
        aria-label="Change approving officer"
      >
        change
      </button>
      <button
        onClick={() => {
          clearOfficer();
          onChange(null);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        sign out
      </button>
    </div>
  );
}
