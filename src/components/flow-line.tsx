import { useEffect, useRef, useState } from "react";

/**
 * The one piece of motion-as-information in WaterWise.
 * Thickness + speed follow how much water is being saved right now;
 * it flashes amber when a new alert enters the queue.
 */
export function FlowLine({
  intensity = 0.3,
  alertCount = 0,
  loading = false,
}: {
  /** 0–1: how much is flowing/being saved today */
  intensity?: number;
  /** number of alerts in the queue — a rise pulses the line amber */
  alertCount?: number;
  loading?: boolean;
}) {
  const [amber, setAmber] = useState(false);
  const prev = useRef(alertCount);

  useEffect(() => {
    if (alertCount > prev.current) {
      setAmber(true);
      const t = setTimeout(() => setAmber(false), 1600);
      prev.current = alertCount;
      return () => clearTimeout(t);
    }
    prev.current = alertCount;
  }, [alertCount]);

  const i = Math.min(1, Math.max(0, intensity));
  const thickness = loading ? 3 : 2 + Math.round(i * 3);
  const speed = loading ? 1 : 3.6 - i * 2.2;

  return (
    <div
      aria-hidden="true"
      className="flow-line w-full"
      style={
        {
          "--flow-thickness": `${thickness}px`,
          "--flow-speed": `${speed}s`,
          "--flow-color": amber ? "var(--signal-amber)" : "var(--flow)",
        } as React.CSSProperties
      }
    />
  );
}
