import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send, Loader2, Bell, Droplets } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { citizenQuery } from "@/lib/queries";
import { submitCitizenReport } from "@/lib/waterwise.functions";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Report a water problem — WaterWise" },
      {
        name: "description",
        content:
          "Report a leak, low pressure or muddy water in plain language and get a clear answer: is a crew already on it, and when will supply return?",
      },
      { property: "og:title", content: "Report a water problem — WaterWise" },
      {
        property: "og:description",
        content: "Plain-language leak reporting with instant deduplication against open repairs.",
      },
    ],
  }),
  component: CitizenPage,
});

type Msg = { role: "user" | "agent"; text: string; deduped?: boolean };

const quick = [
  "Water is spraying out of the road near my house",
  "No water since morning in our building",
  "The water is muddy and smells bad",
];

function CitizenPage() {
  const { data } = useQuery(citizenQuery);
  const send = useServerFn(submitCitizenReport);
  const queryClient = useQueryClient();
  const [wardId, setWardId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: "Namaste! Tell me what's wrong with your water supply — a leak, no water, or bad quality. You can type it however you like.",
    },
  ]);

  const wards = data?.wards ?? [];
  const activeWard = wardId ?? (wards[0]?.id as string | undefined);

  async function submit(text: string) {
    if (!text.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await send({ data: { message: text, wardId: activeWard } });
      setMessages((m) => [...m, { role: "agent", text: res.reply, deduped: res.deduped }]);
      await queryClient.invalidateQueries();
    } catch {
      setMessages((m) => [
        ...m,
        { role: "agent", text: "Sorry — I couldn't record that just now. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const litres = data?.litresSaved ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="flex h-[600px] flex-col rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h1 className="text-sm font-semibold">JalConnect — report a water problem</h1>
            <select
              value={activeWard ?? ""}
              onChange={(e) => setWardId(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              {wards.map((w) => (
                <option key={w.id as string} value={w.id as string}>
                  {w.name as string}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 space-y-3 overflow-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
                {m.deduped && (
                  <div className="mt-2 rounded-lg bg-card px-2 py-1 text-[11px] font-medium text-primary">
                    Merged with an existing report — no duplicate crew sent.
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> JalConnect is checking open repairs…
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the problem…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={busy}
                className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
                aria-label="Send report"
              >
                <Send className="size-4" />
              </button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">
              No smartphone? The same flow runs over SMS and IVR in the pilot design.
            </p>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <Droplets className="size-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">Water saved across your city</h2>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {Math.round(litres / 1000).toLocaleString("en-IN")} kL
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Recovered from leaks caught early over the last 12 months.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
              <Bell className="size-4 text-primary" /> Ward notices
            </h2>
            <ul className="max-h-[300px] divide-y divide-border overflow-auto">
              {(data?.notifications ?? []).length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notices yet.
                </li>
              )}
              {(data?.notifications ?? []).map((n) => (
                <li key={n.id as string} className="px-4 py-3 text-sm">
                  <div className="font-medium">{n.title as string}</div>
                  <p className="mt-0.5 text-muted-foreground">{n.body as string}</p>
                  <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                    {n.channel as string}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
