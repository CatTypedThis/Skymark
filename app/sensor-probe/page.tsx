"use client";

import { useEffect, useRef, useState } from "react";
import { useDebugMode } from "@/lib/debug/use-debug-mode";

/**
 * Diagnostic page (NOT part of the app UX). Logs raw deviceorientation /
 * deviceorientationabsolute events so we can see exactly what the browser is
 * delivering before any smoothing or tilt-compensation math touches it. Used
 * for BUG-13 device QA.
 *
 * Gated behind `?debug=1` (same convention as DebugPanel) so it is invisible
 * in normal use. Visit /sensor-probe?debug=1 on the phone, grant motion
 * permission, and watch the numbers while holding the phone still.
 */
type Reading = {
  t: number;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
  webkitCompassHeading: number | null;
  webkitCompassAccuracy: number | null;
};

export default function SensorProbePage() {
  const debugMode = useDebugMode();
  if (!debugMode) {
    return (
      <main style={{ background: "#0a0f12", color: "#cfe", minHeight: "100vh", padding: 16, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
        <p>Sensor probe is a diagnostic tool. Add <code>?debug=1</code> to the URL to enable it.</p>
      </main>
    );
  }
  return <SensorProbeActive />;
}

function SensorProbeActive() {
  const [granted, setGranted] = useState(false);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [burst, setBurst] = useState<Reading[]>([]);
  const burstRef = useRef<Reading[]>([]);

  useEffect(() => {
    function pushReading(ev: DeviceOrientationEvent) {
      const r: Reading = {
        t: Date.now(),
        alpha: typeof ev.alpha === "number" ? ev.alpha : null,
        beta: typeof ev.beta === "number" ? ev.beta : null,
        gamma: typeof ev.gamma === "number" ? ev.gamma : null,
        absolute: ev.absolute,
        webkitCompassHeading:
          typeof (ev as unknown as { webkitCompassHeading?: number }).webkitCompassHeading === "number"
            ? ((ev as unknown as { webkitCompassHeading: number }).webkitCompassHeading)
            : null,
        webkitCompassAccuracy:
          typeof (ev as unknown as { webkitCompassAccuracy?: number }).webkitCompassAccuracy === "number"
            ? ((ev as unknown as { webkitCompassAccuracy: number }).webkitCompassAccuracy)
            : null,
      };
      setLatest(r);
      const next = [...burstRef.current, r].slice(-40);
      burstRef.current = next;
      setBurst(next);
    }

    if (!granted) return;

    window.addEventListener("deviceorientation", pushReading, true);
    window.addEventListener("deviceorientationabsolute", pushReading as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientation", pushReading, true);
      window.removeEventListener("deviceorientationabsolute", pushReading as EventListener, true);
    };
  }, [granted]);

  async function requestPermission() {
    const E = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    if (typeof E.requestPermission === "function") {
      try {
        const res = await E.requestPermission();
        if (res !== "granted") {
          alert("Motion permission not granted: " + res);
          return;
        }
      } catch (e) {
        alert("Permission error: " + (e instanceof Error ? e.message : String(e)));
        return;
      }
    }
    setGranted(true);
  }

  return (
    <main style={{ background: "#0a0f12", color: "#cfe", minHeight: "100vh", padding: 16, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 16, margin: "0 0 12px" }}>Sensor probe (raw)</h1>
      {!granted ? (
        <button onClick={requestPermission} style={btn}>Grant motion permission</button>
      ) : (
        <>
          <section style={{ marginBottom: 16 }}>
            <strong>LATEST</strong>
            {latest ? (
              <pre style={pre}>
{`alpha:   ${fmt(latest.alpha)}
beta:    ${fmt(latest.beta)}
gamma:   ${fmt(latest.gamma)}
absolute: ${String(latest.absolute)}
webkitCompassHeading: ${fmt(latest.webkitCompassHeading)}
webkitCompassAccuracy: ${fmt(latest.webkitCompassAccuracy)}`}
              </pre>
            ) : <p>waiting for events…</p>}
          </section>
          <section>
            <strong>LAST 40 EVENTS (newest at bottom)</strong>
            <pre style={{ ...pre, maxHeight: 400, overflow: "auto" }}>
{burst.map((r) =>
  `${r.t.toString().slice(-4)} a=${fmt(r.alpha)} b=${fmt(r.beta)} g=${fmt(r.gamma)} abs=${r.absolute ? "Y" : "n"} wch=${fmt(r.webkitCompassHeading)}`,
).join("\n")}
            </pre>
          </section>
        </>
      )}
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 14px", background: "#1b3a44", color: "#cfe", border: "1px solid #4be", borderRadius: 8, fontSize: 14,
};
const pre: React.CSSProperties = {
  background: "#060a0c", padding: 10, borderRadius: 6, margin: "8px 0", whiteSpace: "pre-wrap",
};

function fmt(n: number | null): string {
  return n === null ? "  —" : n.toFixed(1).padStart(6, " ");
}
