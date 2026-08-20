import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { runDemoStep } from "@/lib/waterwise.functions";

let seeding = false;
let seededThisSession = false;

/**
 * A judge who opens /operator directly should not see an empty room.
 * If the network has no incidents yet, replay the scripted demo once.
 */
export function useEnsureDemo(alertCount: number | undefined) {
  const runStep = useServerFn(runDemoStep);
  const queryClient = useQueryClient();
  const [seedingNow, setSeedingNow] = useState(false);

  useEffect(() => {
    if (alertCount === undefined || alertCount > 0) return;
    if (seeding || seededThisSession) return;
    seeding = true;
    setSeedingNow(true);
    (async () => {
      try {
        for (let step = 0; step < 5; step++) await runStep({ data: { step } });
        seededThisSession = true;
        await queryClient.invalidateQueries();
      } finally {
        seeding = false;
        setSeedingNow(false);
      }
    })();
  }, [alertCount, runStep, queryClient]);

  return seedingNow;
}
