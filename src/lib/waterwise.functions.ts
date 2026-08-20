import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ---------------------------------- reads --------------------------------- */

export const getOperator = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./waterwise.server");
  const sb = publicClient();
  const [wards, sensors, alerts, events, orders, readings] = await Promise.all([
    sb.from("wards").select("*").order("code"),
    sb.from("sensors").select("*").order("code"),
    sb.from("alerts").select("*").order("priority_score", { ascending: false }),
    sb.from("agent_events").select("*").order("created_at", { ascending: false }).limit(60),
    sb.from("work_orders").select("*").order("queue_position"),
    sb
      .from("readings")
      .select("recorded_at,flow_lpm,pressure_bar,acoustic_score")
      .order("recorded_at", { ascending: false })
      .limit(600),
  ]);

  const buckets = new Map<string, { flow: number; pressure: number; acoustic: number; n: number }>();
  for (const r of readings.data ?? []) {
    const key = new Date(r.recorded_at as string).toISOString().slice(0, 13);
    const b = buckets.get(key) ?? { flow: 0, pressure: 0, acoustic: 0, n: 0 };
    b.flow += r.flow_lpm as number;
    b.pressure += r.pressure_bar as number;
    b.acoustic += r.acoustic_score as number;
    b.n += 1;
    buckets.set(key, b);
  }
  const trend = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([k, b]) => ({
      hour: k.slice(11) + ":00",
      flow: Math.round(b.flow / b.n),
      pressure: Math.round((b.pressure / b.n) * 100) / 100,
      acoustic: Math.round((b.acoustic / b.n) * 1000) / 1000,
    }));

  return {
    wards: wards.data ?? [],
    sensors: sensors.data ?? [],
    alerts: alerts.data ?? [],
    events: events.data ?? [],
    orders: orders.data ?? [],
    trend,
  };
});

export const getCitizen = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./waterwise.server");
  const sb = publicClient();
  const [wards, notifications, reports, alerts, nrw] = await Promise.all([
    sb.from("wards").select("*").order("code"),
    sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("citizen_reports").select("*").order("created_at", { ascending: true }).limit(50),
    sb.from("alerts").select("*").order("priority_score", { ascending: false }),
    sb.from("nrw_history").select("*").order("month"),
  ]);
  const litresSaved = (nrw.data ?? []).reduce((a, r) => a + Number(r.litres_saved ?? 0), 0);
  return {
    wards: wards.data ?? [],
    notifications: notifications.data ?? [],
    reports: reports.data ?? [],
    alerts: alerts.data ?? [],
    litresSaved,
  };
});

export const getGov = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./waterwise.server");
  const sb = publicClient();
  const [nrw, alerts, events] = await Promise.all([
    sb.from("nrw_history").select("*").order("month"),
    sb.from("alerts").select("*"),
    sb.from("agent_events").select("*"),
  ]);
  return {
    nrw: nrw.data ?? [],
    alerts: alerts.data ?? [],
    events: events.data ?? [],
  };
});

export const getMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./waterwise.server");
  const sb = publicClient();
  const [alerts, events, reports] = await Promise.all([
    sb.from("alerts").select("*"),
    sb.from("agent_events").select("*"),
    sb.from("citizen_reports").select("*"),
  ]);
  const a = alerts.data ?? [];
  const e = events.data ?? [];
  const truePos = a.filter((x) => x.is_true_leak === true).length;
  const falsePos = a.filter((x) => x.is_true_leak === false).length;
  const total = a.length || 1;
  const approvals = e.filter((x) => x.approved_at);
  const avgMinutes =
    approvals.length === 0
      ? null
      : Math.round(
          (approvals.reduce(
            (acc, x) =>
              acc +
              (new Date(x.approved_at as string).getTime() -
                new Date(x.created_at as string).getTime()),
            0,
          ) /
            approvals.length /
            60000) *
            10,
        ) / 10;
  return {
    alertsTotal: a.length,
    precision: Math.round((truePos / (truePos + falsePos || 1)) * 1000) / 10,
    falseAlarmRate: Math.round((falsePos / total) * 1000) / 10,
    reportsClassified: (reports.data ?? []).filter((r) => r.intent !== "other").length,
    reportsTotal: (reports.data ?? []).length,
    agentEvents: e.length,
    approvals: approvals.length,
    alertToActionMinutes: avgMinutes,
  };
});

export const getIrrigation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ districtId: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const { publicClient, fetchWeather, fetchNasaPower, reason } = await import(
      "./waterwise.server"
    );
    const sb = publicClient();
    const { data: districts } = await sb.from("irrigation_districts").select("*").order("name");
    const list = districts ?? [];
    const district = list.find((d) => d.id === data.districtId) ?? list[0];
    if (!district) return { districts: [], district: null, weather: null, power: null, plan: [], summary: null, agent: null };

    const [weather, power] = await Promise.all([
      fetchWeather(district.lat as number, district.lng as number),
      fetchNasaPower(district.lat as number, district.lng as number),
    ]);

    const baseline = district.fixed_baseline_mm as number;
    const plan = weather.days.map((d) => {
      const cropCoefficient = 0.95;
      const need = Math.max(0, d.et0_mm * cropCoefficient - d.rain_mm * 0.8);
      const target = Math.round(Math.min(baseline, need) * 10) / 10;
      return {
        date: d.date,
        rain_mm: Math.round(d.rain_mm * 10) / 10,
        et0_mm: Math.round(d.et0_mm * 10) / 10,
        target_mm: target,
        baseline_mm: baseline,
      };
    });
    const totalTarget = plan.reduce((a, p) => a + p.target_mm, 0);
    const totalBaseline = baseline * plan.length;
    const savedPercent = Math.round(((totalBaseline - totalTarget) / totalBaseline) * 1000) / 10;
    const weekRain = plan.reduce((a, p) => a + p.rain_mm, 0);
    const drought = weekRain < 5;

    const agent = await reason(
      "IrrigateAI",
      {
        district: district.name,
        crop: district.crop,
        seven_day_rain_mm: Math.round(weekRain * 10) / 10,
        mean_et0_mm: Math.round((plan.reduce((a, p) => a + p.et0_mm, 0) / plan.length) * 10) / 10,
        fixed_baseline_mm: baseline,
        computed_weekly_target_mm: Math.round(totalTarget * 10) / 10,
        nasa_power_mean_solar: Math.round(power.avgSolar * 10) / 10,
      },
      {
        decision: drought ? "drought_signal" : "normal",
        confidence: 0.86,
        reasoning_summary: drought
          ? `Only ${weekRain.toFixed(1)} mm rain forecast over 7 days against a mean ET0 near ${(totalTarget / plan.length).toFixed(1)} mm/day. Soil moisture deficit will build, so every litre lost in the network matters more this week.`
          : `Forecast rain of ${weekRain.toFixed(1)} mm covers part of crop demand, so the irrigation target sits below the fixed ${baseline} mm schedule.`,
        action: drought
          ? "Raise LeakSense drought weight to 1.4 and cut irrigation target to demand-matched mm"
          : "Publish demand-matched irrigation target for the week",
        requires_human_approval: true,
      },
    );

    return {
      districts: list,
      district,
      weather,
      power: { live: power.live, avgSolar: power.avgSolar, avgTemp: power.avgTemp },
      plan,
      summary: {
        totalTarget: Math.round(totalTarget * 10) / 10,
        totalBaseline,
        savedPercent,
        drought,
        weekRain: Math.round(weekRain * 10) / 10,
      },
      agent,
    };
  });

/* --------------------------------- actions -------------------------------- */

export const approveEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ eventId: z.string().uuid(), approve: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./waterwise.server");
    const sb = admin();
    const { data: event } = await sb
      .from("agent_events")
      .select("*")
      .eq("id", data.eventId)
      .maybeSingle();
    if (!event) return { ok: false };

    await sb
      .from("agent_events")
      .update({
        approval_status: data.approve ? "approved" : "rejected",
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.eventId);

    if (data.approve && event.alert_id) {
      const { data: alert } = await sb
        .from("alerts")
        .select("*, wards(name)")
        .eq("id", event.alert_id)
        .maybeSingle();
      await sb
        .from("alerts")
        .update({ status: "dispatched", eta: "Crew en route — repair by 18:00 today" })
        .eq("id", event.alert_id);
      await sb.from("work_orders").update({ status: "dispatched" }).eq("alert_id", event.alert_id);
      if (alert) {
        await sb.from("notifications").insert({
          ward_id: alert.ward_id,
          alert_id: alert.id,
          body: `Water supply notice: a leak was detected near your ward. A repair crew has been dispatched and supply should be normal by 6pm today. No action needed from you.`,
        });
      }
    }
    if (!data.approve && event.alert_id) {
      await sb.from("alerts").update({ status: "on_hold" }).eq("id", event.alert_id);
    }
    return { ok: true };
  });

export const submitCitizenReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ message: z.string().min(2).max(500), wardId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin, reason } = await import("./waterwise.server");
    const sb = admin();
    const { data: wards } = await sb.from("wards").select("*").order("code");
    const ward = (wards ?? []).find((w) => w.id === data.wardId) ?? (wards ?? [])[0];
    const { data: openAlerts } = await sb
      .from("alerts")
      .select("*")
      .eq("status", "dispatched")
      .order("priority_score", { ascending: false });
    const wardAlert = (openAlerts ?? []).find((a) => a.ward_id === ward?.id);

    const text = data.message.toLowerCase();
    const ruleIntent = /muddy|dirty|colour|color|smell/.test(text)
      ? "muddy_water"
      : /no water|supply|dry|nothing/.test(text)
        ? "no_water"
        : /leak|burst|pipe|flood|spray/.test(text)
          ? "visible_leak"
          : /bill|payment|charge/.test(text)
            ? "billing"
            : "other";

    const agent = await reason(
      "JalConnect",
      {
        message: data.message,
        ward: ward?.name,
        open_incident_in_ward: wardAlert
          ? { title: wardAlert.title, eta: wardAlert.eta, status: wardAlert.status }
          : null,
        rule_based_intent: ruleIntent,
      },
      {
        decision: ruleIntent,
        confidence: 0.9,
        reasoning_summary: wardAlert
          ? `Report matches an open incident already logged in ${ward?.name}. Merging avoids dispatching a second crew to the same pipe.`
          : `Classified as ${ruleIntent.replace("_", " ")} in ${ward?.name}. No open incident matches, so this opens a new one.`,
        action: wardAlert ? "Merged into existing incident and replied with ETA" : "Opened new incident",
        requires_human_approval: false,
      },
    );

    const intent = ["no_water", "muddy_water", "visible_leak", "billing", "other"].includes(
      agent.decision,
    )
      ? agent.decision
      : ruleIntent;

    let alertId = wardAlert?.id ?? null;
    let deduped = Boolean(wardAlert);
    let reply: string;

    if (wardAlert) {
      reply = `Thanks — we already have this one. ${wardAlert.title} in ${ward?.name} is being repaired. ${wardAlert.eta ?? "Crew assigned."} We merged your report so no duplicate crew is sent.`;
    } else {
      const { data: created } = await sb
        .from("alerts")
        .insert({
          ward_id: ward?.id,
          title:
            intent === "visible_leak"
              ? "Citizen-reported surface leak"
              : intent === "muddy_water"
                ? "Water quality complaint"
                : "Supply interruption reported",
          severity: intent === "visible_leak" ? "high" : "medium",
          status: "open",
          est_litres_per_hour: intent === "visible_leak" ? 480 : 0,
          priority_score: intent === "visible_leak" ? 42 : 18,
          source: "jalconnect",
          eta: "Inspection within 24 hours",
        })
        .select()
        .single();
      alertId = created?.id ?? null;
      deduped = false;
      reply = `Logged. We've opened incident for ${ward?.name} and an inspector is assigned. Expected update within 24 hours — you'll get a message here.`;
    }

    const { data: report } = await sb
      .from("citizen_reports")
      .insert({
        ward_id: ward?.id,
        alert_id: alertId,
        message: data.message,
        intent,
        reply,
        deduped,
      })
      .select()
      .single();

    await sb.from("agent_events").insert({
      agent: "JalConnect",
      alert_id: alertId,
      trigger: "Citizen report received via chat",
      perception: {
        message: data.message,
        ward: ward?.name,
        open_incidents_checked: (openAlerts ?? []).length,
      },
      reasoning_summary: agent.reasoning_summary,
      action: agent.action,
      memory: `Complaint history for ${ward?.name} updated (${intent})`,
      decision: intent,
      confidence: agent.confidence,
      requires_human_approval: false,
      approval_status: "auto",
    });

    return { report, reply, deduped };
  });

/* ------------------------------ scripted demo ----------------------------- */

export const runDemoStep = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ step: z.number().int().min(0).max(4) }).parse(d))
  .handler(async ({ data }) => {
    const { admin, seeded, priorityScore, reason } = await import("./waterwise.server");
    const sb = admin();

    if (data.step === 0) {
      // Reset — idempotent replay for the next judge.
      await sb.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("citizen_reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("agent_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("work_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const { data: sensors } = await sb.from("sensors").select("*, wards(*)").order("code");
      const rand = seeded(4242);
      const picks = (sensors ?? []).slice(0, 5);
      for (const [i, s] of picks.entries()) {
        const ward = s.wards as { id: string; name: string; population: number };
        const lph = Math.round(220 + rand() * 900);
        const isLeak = i < 4;
        const score = priorityScore({
          litresPerHour: lph,
          population: ward.population,
          pipeAge: s.pipe_age_years as number,
          droughtWeight: 1,
        });
        const { data: alert } = await sb
          .from("alerts")
          .insert({
            ward_id: ward.id,
            sensor_id: s.id,
            title: `${isLeak ? "Pressure drop + acoustic anomaly" : "Flow variance"} on ${s.code}`,
            severity: score > 60 ? "high" : score > 25 ? "medium" : "low",
            status: "open",
            est_litres_per_hour: lph,
            priority_score: score,
            confidence: 0.72 + rand() * 0.24,
            is_true_leak: isLeak,
          })
          .select()
          .single();
        if (alert) {
          await sb.from("work_orders").insert({ alert_id: alert.id, queue_position: i + 1 });
          await sb.from("agent_events").insert({
            agent: "LeakSense",
            alert_id: alert.id,
            trigger: `Acoustic score crossed 0.42 on sensor ${s.code} (simulated feed)`,
            perception: {
              sensor: s.code,
              ward: ward.name,
              pipe_age_years: s.pipe_age_years,
              est_litres_per_hour: lph,
              population_affected: ward.population,
            },
            reasoning_summary: `Sustained pressure drop with a rising acoustic signature on ${s.code}. Estimated ${lph} L/h against ${ward.population.toLocaleString("en-IN")} residents on a ${s.pipe_age_years}-year-old main puts this at priority ${score}.`,
            action: "Drafted work order and placed in repair queue",
            memory: `Leak history for ${ward.name} updated with this event`,
            decision: "open_incident",
            confidence: 0.84,
            requires_human_approval: true,
            approval_status: "pending",
          });
        }
      }
      return { ok: true, stage: "reset" };
    }

    if (data.step === 1) {
      // Drought signal from IrrigateAI raises the LeakSense priority weight.
      const { data: district } = await sb
        .from("irrigation_districts")
        .select("*")
        .order("name")
        .limit(1)
        .maybeSingle();
      const { data: alerts } = await sb.from("alerts").select("*, wards(population)");
      for (const a of alerts ?? []) {
        const w = a.wards as { population: number } | null;
        const score = priorityScore({
          litresPerHour: a.est_litres_per_hour as number,
          population: w?.population ?? 100000,
          pipeAge: 20,
          droughtWeight: 1.4,
        });
        await sb.from("alerts").update({ drought_weight: 1.4, priority_score: score }).eq("id", a.id);
      }
      const ranked = (alerts ?? [])
        .map((a) => ({
          id: a.id,
          score: priorityScore({
            litresPerHour: a.est_litres_per_hour as number,
            population: (a.wards as { population: number } | null)?.population ?? 100000,
            pipeAge: 20,
            droughtWeight: 1.4,
          }),
        }))
        .sort((x, y) => y.score - x.score);
      for (const [i, r] of ranked.entries()) {
        await sb.from("work_orders").update({ queue_position: i + 1 }).eq("alert_id", r.id);
      }
      const top = ranked[0];
      const agent = await reason(
        "IrrigateAI",
        { district: district?.name, signal: "low rainfall", weekly_rain_mm: 1.8 },
        {
          decision: "drought_signal",
          confidence: 0.88,
          reasoning_summary: `Open-Meteo shows 1.8 mm of rain over the next 7 days for ${district?.name ?? "the demo district"} against high evapotranspiration. Under drought conditions, network losses cost more than the repair, so the leak queue weight rises to 1.4x.`,
          action: "Raised LeakSense drought weight to 1.4 and reprioritised the repair queue",
          requires_human_approval: false,
        },
      );
      await sb.from("agent_events").insert({
        agent: "IrrigateAI",
        alert_id: top?.id ?? null,
        trigger: "Scheduled weather check — Open-Meteo 7-day forecast",
        perception: {
          district: district?.name,
          forecast_rain_mm_7d: 1.8,
          source: "Open-Meteo (live, keyless)",
        },
        reasoning_summary: agent.reasoning_summary,
        action: agent.action,
        memory: `Drought state stored for ${district?.name}; irrigation baseline recalculated`,
        decision: "drought_signal",
        confidence: agent.confidence,
        requires_human_approval: false,
        approval_status: "auto",
      });
      return { ok: true, stage: "drought" };
    }

    if (data.step === 2) {
      // LeakSense re-reasons the new top of queue and asks for human approval.
      const { data: order } = await sb
        .from("work_orders")
        .select("*")
        .eq("queue_position", 1)
        .maybeSingle();
      if (!order) return { ok: false };
      const { data: alert } = await sb
        .from("alerts")
        .select("*, wards(name, population)")
        .eq("id", order.alert_id)
        .maybeSingle();
      const ward = alert?.wards as { name: string; population: number } | null;
      const agent = await reason(
        "LeakSense",
        {
          alert: alert?.title,
          ward: ward?.name,
          est_litres_per_hour: alert?.est_litres_per_hour,
          population: ward?.population,
          drought_weight: 1.4,
        },
        {
          decision: "dispatch_crew",
          confidence: 0.91,
          reasoning_summary: `With the drought weight applied, ${alert?.title} in ${ward?.name} now tops the queue at ${alert?.priority_score}. Losing ${alert?.est_litres_per_hour} L/h during a rain deficit outweighs the two lower-volume jobs ahead of it.`,
          action: "Recommend dispatching Crew A and notifying the ward",
          requires_human_approval: true,
        },
      );
      await sb.from("agent_events").insert({
        agent: "LeakSense",
        alert_id: alert?.id,
        trigger: "Repair queue reprioritised by IrrigateAI drought signal",
        perception: {
          queue_position: 1,
          previous_position: 3,
          drought_weight: 1.4,
          est_litres_per_hour: alert?.est_litres_per_hour,
          population_affected: ward?.population,
        },
        reasoning_summary: agent.reasoning_summary,
        action: agent.action,
        memory: `${ward?.name} marked as high-loss ward under drought conditions`,
        decision: "dispatch_crew",
        confidence: agent.confidence,
        requires_human_approval: true,
        approval_status: "pending",
      });
      return { ok: true, stage: "reprioritised", alertId: alert?.id };
    }

    if (data.step === 3) {
      // Second citizen report that gets deduped into the dispatched incident.
      const { data: alert } = await sb
        .from("alerts")
        .select("*, wards(name)")
        .eq("status", "dispatched")
        .order("priority_score", { ascending: false })
        .limit(1)
        .maybeSingle();
      const ward = alert?.wards as { name: string } | null;
      const message = "Water is spraying from the road near the bus stop, it's been like this since morning";
      const reply = alert
        ? `Thanks — we already know about this one. ${ward?.name}: crew is on site, supply back to normal by 6pm. Your report was merged so no duplicate crew is sent.`
        : `Logged — an inspector will visit within 24 hours.`;
      await sb.from("citizen_reports").insert({
        ward_id: alert?.ward_id ?? null,
        alert_id: alert?.id ?? null,
        message,
        intent: "visible_leak",
        reply,
        deduped: Boolean(alert),
      });
      await sb.from("agent_events").insert({
        agent: "JalConnect",
        alert_id: alert?.id ?? null,
        trigger: "Second citizen report received for the same street",
        perception: { message, ward: ward?.name, matched_incident: alert?.title },
        reasoning_summary: `Location and description match the incident already dispatched in ${ward?.name}. Opening a second ticket would send a duplicate crew, so this merges and the resident gets the live ETA instead.`,
        action: "Merged report into the open incident and replied with ETA",
        memory: `${ward?.name} now has 2 citizen confirmations on this pipe`,
        decision: "visible_leak",
        confidence: 0.93,
        requires_human_approval: false,
        approval_status: "auto",
      });
      return { ok: true, stage: "deduped" };
    }

    // step 4 — GovDash recomputes the NRW trend after the repair.
    const { data: last } = await sb
      .from("nrw_history")
      .select("*")
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last) {
      await sb
        .from("nrw_history")
        .update({
          nrw_percent: Math.round((Number(last.nrw_percent) - 0.7) * 10) / 10,
          litres_saved: Number(last.litres_saved) + 2_400_000,
        })
        .eq("id", last.id);
    }
    await sb.from("agent_events").insert({
      agent: "GovDash",
      trigger: "Repair confirmed — monthly NRW recomputed",
      perception: {
        nrw_before: last?.nrw_percent,
        cpheeo_ceiling_percent: 15,
        india_urban_average_percent: 38,
      },
      reasoning_summary: `Closing this leak removes roughly 2.4 million litres a month from non-revenue water, moving the network 0.7 points closer to the CPHEEO 15% ceiling. That delta is reportable under AMRUT 2.0 City Water Balance Plan targets.`,
      action: "Updated NRW trend and scheme-alignment evidence pack",
      memory: "Monthly NRW baseline and scheme evidence updated",
      decision: "report_updated",
      confidence: 0.95,
      requires_human_approval: false,
      approval_status: "auto",
    });
    return { ok: true, stage: "gov" };
  });

/* ------------------------------ pilot requests ---------------------------- */

export const submitPilotRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(2).max(120),
        organisation: z.string().min(2).max(160),
        role: z.string().max(120).optional(),
        email: z.string().email().max(160),
        city: z.string().max(120).optional(),
        connections: z.string().max(60).optional(),
        message: z.string().max(1000).optional(),
        tier: z.enum(["pilot", "municipal", "state"]).default("pilot"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./waterwise.server");
    const { error } = await admin().from("pilot_requests").insert({
      name: data.name,
      organisation: data.organisation,
      role: data.role ?? null,
      email: data.email,
      city: data.city ?? null,
      connections: data.connections ?? null,
      message: data.message ?? null,
      tier: data.tier,
    });
    if (error) return { ok: false as const, error: "Could not record the request." };
    return { ok: true as const };
  });
