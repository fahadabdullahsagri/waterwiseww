# WaterWise / Agentrix 2026 — Rebuilt Proposal Blueprint

Goal: hand back one clean, judge-ready `.docx` that fixes the broken demo-flow section, unifies formatting, satisfies the submission checklist, sharpens the agentic (Agentrix) framing, and adds measurable success criteria — backed by real research across business, community, and government angles.

## What you get

A single document, `AGENTRIX_2026_TeamProposal_TechTitans_v2.docx`, with:

1. **Cover + one-line pitch** — team, track, problem in 25 words.
2. **Problem & evidence** — cited water-loss, groundwater-depletion and irrigation-waste figures (India + global), each with a source line.
3. **Solution overview** — WaterWise as one platform, four modules on a shared data layer, with a simple ASCII architecture diagram.
4. **Agentic core (strengthened)** — this is the section judges score hardest. Each agent gets: trigger → perception → reasoning → tool/action → memory → human-in-loop gate. Includes a cross-module scenario (drought signal raises irrigation target, LeakSense reprioritises repair queue, JalConnect notifies affected wards) written as an actual agent trace, not prose.
5. **Rebuilt demo flow** — a numbered 4-minute walkthrough with timestamps, screen-by-screen, what the judge sees, and the "wow" beat. Replaces the currently broken/fragmented section.
6. **Measurable success criteria** — replaces vague claims with a metrics table: target, how measured, data source, baseline. Examples: leak-detection precision/recall on simulated sensor data, false-alarm rate, chatbot intent accuracy, dashboard p95 latency, irrigation water saved (% vs fixed-schedule baseline), alert-to-action time.
7. **Impact, three lenses**
   - Business: TAM/SAM/SOM, buyer personas, pricing model (per-connection SaaS + per-sensor), unit economics, competitor scan.
   - Community/environment: litres saved per 1,000 connections, hours of water-collection labour avoided, equity of supply.
   - Government: alignment to Jal Jeevan Mission / AMRUT / Atal Bhujal, NRW (non-revenue water) reduction mandates, procurement path, data-sovereignty and open-data posture.
8. **Roadmap & risks** — hackathon MVP scope vs 6-month pilot, top 5 risks with mitigations.
9. **Checklist compliance appendix** — every submission requirement mapped to the page/section that answers it.

## Formatting unification

US Letter, 1" margins, Arial throughout, one heading scale (H1/H2/H3), consistent bullet and numbered list styles via proper Word numbering (no manual bullet characters), tables with fixed widths and light borders, page numbers in the footer, table of contents at the front. No mixed fonts, no orphan headings, no stray placeholder text.

## Research approach

Parallel research passes on: Indian and global water-utility loss statistics, NRW benchmarks, smart-water-management market sizing and named competitors, Jal Jeevan Mission / Atal Bhujal / AMRUT scheme details and funding routes, and public sensor/weather/groundwater data sources. Every number in the document carries an inline source. Anything I cannot verify gets marked as an assumption rather than stated as fact.

## Free APIs / data (no paid keys)

I will confirm availability during research and give you exact signup steps for any that need a key. Candidates, all free tiers:

- **Open-Meteo** — weather + forecast, no key at all.
- **India-WRIS / data.gov.in** — groundwater level, reservoir storage, rainfall. data.gov.in needs a free key; I'll give you the click-by-click.
- **NASA POWER** — evapotranspiration and solar data for irrigation math, no key.
- **OpenStreetMap / Overpass** — ward and pipeline geography, no key.
- **Lovable AI Gateway** — the agent reasoning and chatbot, already included here, no external key.

Nothing paid gets designed into the architecture.

## UI/UX note

The document will include a described dashboard layout (operator-first: one alert queue, one map, one trend strip) so the demo and any build stay user-friendly. If you also want me to build the WaterWise dashboard as a working web app afterwards, say so and I'll plan that separately.

## Verification

After generating the `.docx` I convert every page to an image and inspect all of them for clipped text, broken tables, bad spacing or ordering, and fix and regenerate until clean.
