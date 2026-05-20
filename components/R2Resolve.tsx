"use client";

import { useEffect, useMemo, useState } from "react";
import { sumStaked } from "@/lib/bets";
import { useBalance } from "@/lib/persistence";
import { useSfx } from "@/lib/audio";
import type {
  GameAction,
  GameState,
  R2OutcomeKind,
  SwingOption,
} from "@/lib/gameState";
import OutcomeStamp from "./OutcomeStamp";
import ChipExplosion from "./ChipExplosion";
import BetDock from "./BetDock";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

const HEADLINE_COLOR: Record<R2OutcomeKind, string> = {
  single: "var(--cream)",
  double: "var(--cyan)",
  triple: "var(--yellow)",
  hr: "var(--yellow)",
  out: "var(--magenta)",
};

const FIRE_CHIPS: ReadonlyArray<R2OutcomeKind> = [
  "single",
  "double",
  "triple",
  "hr",
];

const OUT_TEXT_BY_SWING: Record<SwingOption, readonly string[]> = {
  1: ["Ground out"],
  2: ["Ground out", "Fly out"],
  3: ["Fly out"],
};

export default function R2Resolve({ state, dispatch }: Props) {
  const [balance] = useBalance();
  const outcome = state.r2Outcome;
  const r2Winnings = state.lastHandWinnings;
  const stake = sumStaked(state.bets);

  const isWin = outcome !== null && outcome.kind !== "out";
  const playOut = useSfx("out");
  const playWin = useSfx("r2Win");
  useEffect(() => {
    if (outcome === null) return;
    if (outcome.kind === "out") playOut();
    else playWin();
  }, [outcome, playOut, playWin]);
  const swingChoice = state.swingChoice;
  const outText = useMemo(() => {
    if (isWin) return null;
    const options = swingChoice ? OUT_TEXT_BY_SWING[swingChoice] : null;
    if (!options || options.length === 0) return "Out";
    return options[Math.floor(Math.random() * options.length)];
  }, [isWin, swingChoice]);

  const [balanceDelta, setBalanceDelta] = useState<number>(
    isWin ? -r2Winnings : 0,
  );
  useEffect(() => {
    if (balanceDelta >= 0) return;
    const remaining = Math.abs(balanceDelta);
    // Adaptive cadence: total ~1.5s, floor 4ms per tick. Strict $1 per tick.
    const tickMs = Math.max(4, Math.min(20, 1500 / remaining));
    const t = window.setTimeout(
      () => setBalanceDelta((d) => Math.min(0, d + 1)),
      tickMs,
    );
    return () => window.clearTimeout(t);
  }, [balanceDelta]);

  if (outcome === null) {
    return null;
  }

  const showChips = FIRE_CHIPS.includes(outcome.kind);

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <img
        src="/assets/IMG-05.jpg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 60%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(10,8,27,0.25) 35%, rgba(10,8,27,0.78) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
          padding: "96px 24px 140px",
          boxSizing: "border-box",
        }}
      >
        <OutcomeStamp kind={outcome.kind} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "18px 28px",
            background: "rgba(12,10,31,0.78)",
            border: `1px solid ${isWin ? "var(--cyan)" : "rgba(255,244,219,0.18)"}`,
            borderRadius: 10,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontVariantNumeric: "tabular-nums",
            boxShadow: isWin ? "0 0 22px rgba(42,234,255,0.30)" : "none",
            maxWidth: "min(560px, 92vw)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: HEADLINE_COLOR[outcome.kind],
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow: isWin
                ? `0 0 12px ${HEADLINE_COLOR[outcome.kind]}`
                : undefined,
            }}
          >
            {isWin ? `+${fmt(r2Winnings)}` : outText}
          </p>
        </div>

      </div>

      <BetDock
        balance={balance}
        staked={stake}
        activeChip={state.activeChip}
        onSelectChip={() => {}}
        onClear={() => {}}
        canClear={false}
        locked
        balanceDisplayDelta={balanceDelta}
        primaryAction={{
          label: "Play Again ▸",
          onClick: () => dispatch({ type: "PLAY_AGAIN" }),
        }}
      />

      {showChips && (
        <ChipExplosion
          kind={outcome.kind as Exclude<R2OutcomeKind, "out">}
        />
      )}
    </main>
  );
}

