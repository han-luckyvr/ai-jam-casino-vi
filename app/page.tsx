"use client";

import { useState } from "react";
import { useGameState } from "@/lib/gameState";
import { rollPitch, rollSwing } from "@/lib/probabilities";
import JackpotTicker from "@/components/JackpotTicker";
import OrganMusic from "@/components/OrganMusic";
import Splash from "@/components/Splash";
import R1BetPlacement from "@/components/R1BetPlacement";
import R1PitchVideo from "@/components/R1PitchVideo";
import R1Resolve from "@/components/R1Resolve";
import R2SwingSelect from "@/components/R2SwingSelect";
import R2Resolve from "@/components/R2Resolve";

function rngSanityCheck() {
  const N = 10_000;
  const cells = new Array<number>(9).fill(0);
  let outOfZone = 0;
  for (let i = 0; i < N; i++) {
    const p = rollPitch();
    if (!p.inZone) outOfZone++;
    else cells[p.cell]++;
  }
  console.log("rollPitch sanity:", {
    samples: N,
    outOfZonePct: ((outOfZone / N) * 100).toFixed(2),
    cellCounts: cells,
    cellAvg: (cells.reduce((s, n) => s + n, 0) / 9).toFixed(0),
  });
  for (const option of [1, 2, 3] as const) {
    const kinds: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      const r = rollSwing(option);
      kinds[r.kind] = (kinds[r.kind] ?? 0) + 1;
    }
    console.log(`rollSwing opt ${option}:`, kinds);
  }
}

export default function Home() {
  const [state, dispatch] = useGameState();
  const [jackpotPulse, setJackpotPulse] = useState(false);

  let screen: React.ReactNode = null;
  switch (state.screen) {
    case "SPLASH":
      screen = <Splash onTap={() => dispatch({ type: "PLAY_AGAIN" })} />;
      break;
    case "R1_BET":
      screen = <R1BetPlacement state={state} dispatch={dispatch} />;
      break;
    case "R1_PITCH":
      screen = <R1PitchVideo state={state} dispatch={dispatch} />;
      break;
    case "R1_RESOLVE":
      screen = <R1Resolve state={state} dispatch={dispatch} />;
      break;
    case "R2_SWING":
      screen = (
        <R2SwingSelect
          state={state}
          dispatch={dispatch}
          onJackpotPulse={setJackpotPulse}
        />
      );
      break;
    case "R2_RESOLVE":
      screen = <R2Resolve state={state} dispatch={dispatch} />;
      break;
  }

  return (
    <>
      {state.screen !== "SPLASH" && (
        <JackpotTicker pulse={jackpotPulse && state.screen === "R2_SWING"} />
      )}
      <OrganMusic screen={state.screen} />
      {screen}
      <button
        type="button"
        onClick={rngSanityCheck}
        title="Dev: log RNG distribution to console (M7 will remove)"
        style={{
          position: "fixed",
          right: 10,
          bottom: 10,
          zIndex: 30,
          padding: "4px 8px",
          background: "rgba(12,10,31,0.7)",
          color: "var(--muted)",
          border: "1px solid var(--rule)",
          borderRadius: 6,
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: "pointer",
          opacity: 0.5,
        }}
      >
        DEV · RNG
      </button>
    </>
  );
}
