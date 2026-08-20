# WaterWise — Agentrix multi-agent water platform (hackathon MVP)

One app, three audiences, four modules, one scripted 4-minute demo that runs end to end from a single button.

## Priority order

The scripted demo path is built first and everything else hangs off it. If time runs short, the demo still works.

## Backend (Lovable Cloud)

Enable Cloud, then create tables with RLS and public-read demo policies:

`wards`, `sensors`, `readings`, `alerts`, `agent_events`, `citizen_reports`, `irrigation_districts`, `work_orders`, `notifications`.

Seeded in the migration itself (not on page load): a demo city with 6 wards, 18 sensors, 1 irrigation district, historical readings and an NRW trend series — so no screen is ever empty.

Server-side logic uses server functions (this stack's equivalent of edge functions; no separate function deploys needed):

- Simulated sensor generator — seeded random walk with injected leak events, writing the exact schema real hardware would use. UI labels it "Live simulation — plug-and-play with real sensors."
- Agent reasoning — one call per agent (LeakSense / JalConnect / IrrigateAI / GovDash) through the Lovable AI Gateway with a strict per-agent system prompt returning `{decision, confidence, reasoning_summary, action, requires_human_approval}`. Every result is a row in `agent_events`, so the Agent Trace panel is a query, never hand-faked.
- Live data fetches: Open-Meteo (weather/forecast) and NASA POWER (evapotranspiration) — both keyless, wired live today. India-WRIS sits behind a labeled "Connect real feed" toggle falling back to seeded data, with the 5-minute data.gov.in signup noted in the UI.

## Modules

- **LeakSense** — scores each reading, ranks a repair queue by (est. litres/hour lost x population affected x pipe age), drafts a work order.
- **JalConnect** — citizen chat (rule-based + LLM) with photo upload; classifies intent, geotags the ward, dedupes against open alerts (merge or open new), pushes plain-language status back ("Under repair, queue position 3").
- **IrrigateAI** — district picker, daily irrigation target (mm) vs fixed-schedule baseline, % saved. A low-rainfall signal raises the drought weight LeakSense uses — the cross-module beat.
- **GovDash** — NRW trend vs the 15% CPHEEO ceiling (India urban average ~38%; global benchmark 15-20%, cited in-app), scheme-alignment checklist for Jal Jeevan Mission / AMRUT 2.0 / Atal Bhujal with a one-line "how WaterWise reports this" each, and an on-screen report view with a stubbed Download button.

## Agentrix trace panel

Every alert and recommendation gets a collapsible six-stage trace filled from `agent_events`: Trigger, Perception, Reasoning, Tool/Action, Memory, Human-in-loop gate. Anything affecting real people (crew dispatch, mass notification, irrigation schedule change) sits in Pending Approval until an operator clicks Approve/Reject.

## Routes

| Route | Content |
| --- | --- |
| `/` | Pitch, role switcher (Operator / Citizen / Government), Run Demo button |
| `/operator` | Alert queue + Leaflet/OSM map + trend strip + Agent Trace side panel |
| `/citizen` | Messaging-style chat, my-ward status card, water-saved counter |
| `/irrigate` | District picker, weather/ET chart, target vs baseline, % saved badge |
| `/gov` | NRW trend, scheme checklist, report summary |
| `/pricing` | Citizen free / Utility SaaS per-connection / Government pilot + roadmap teaser + competitive framing |
| `/metrics` | Success-criteria table, live values where measurable |

Each route gets its own SEO metadata.

## Run Demo

One idempotent button: resets and reseeds the scenario, then fires timed inserts — low-rainfall signal → repair queue reprioritizes with trace open → operator approves → ward notification appears on the Citizen view → second citizen report deduped with ETA → NRW ticks down on GovDash → close on pricing and metrics. Replayable for the next judge.

## Success metrics screen

Leak precision/recall (≥85%/≥80% against injected labels), false-alarm rate (<10%), chatbot intent accuracy (≥90% on a 20-message test set), dashboard p95 latency (<2s, from browser perf timing), irrigation water saved (15-25% vs fixed baseline), alert-to-action time (<5 min). NRW reduction is labeled an industry benchmark (ORF/CPHEEO, JUSCO Jamshedpur 36%→10%), not a WaterWise-measured result.

## Design

Deep teal primary (~#0B6E7A), amber for alerts, near-white background — all as semantic tokens, no generic SaaS blue. Operator view capped at three primary panels above the fold. Citizen view is touch-first, plain language, no jargon. Recharts for trend and comparison charts.

## Explicitly out of scope today (shown on the roadmap screen)

Real hardware integration, payments, multi-tenant auth/billing, the data-licensing revenue line, and real PDF export — listed as 6-month pilot scope, not as gaps.

## Technical notes

TanStack Start + React + Tailwind. Data reads go through route loaders with TanStack Query; agent calls and external APIs run in server functions so no key ever reaches the browser. Leaflet loads client-only after hydration. The simulation writes through the same tables real sensors would, so swapping in hardware is a data-source change, not a rewrite.
