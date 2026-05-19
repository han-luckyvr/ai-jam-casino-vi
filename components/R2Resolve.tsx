"use client";

import { sumStaked } from "@/lib/bets";
import { useBalance } from "@/lib/persistence";
import type { GameAction, GameState, R2OutcomeKind } from "@/lib/gameState";
import OutcomeStamp from "./OutcomeStamp";
import Confetti from "./Confetti";

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

const FIRE_CONFETTI: ReadonlyArray<R2OutcomeKind> = [
  "single",
  "double",
  "triple",
  "hr",
];

export default function R2Resolve({ state, dispatch }: Props) {
  const [balance] = useBalance();
  const outcome = state.r2Outcome;
  const r1Winnings = state.r1Winnings;
  const r2Winnings = state.lastHandWinnings;
  const totalHand = r1Winnings + r2Winnings;
  const stake = sumStaked(state.bets);

  if (outcome === null) {
    return null;
  }

  const isWin = outcome.kind !== "out";
  const showConfetti = FIRE_CONFETTI.includes(outcome.kind);

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

      <HudReadout side="left" label="Balance" value={fmt(balance)} />
      <HudReadout side="right" label="Stake" value={fmt(stake)} />

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
          padding: "96px 24px 48px",
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
            {isWin ? `+${fmt(r2Winnings)}` : "No hit"}
          </p>
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            This hand · R1 +{fmt(r1Winnings)} · R2 +{fmt(r2Winnings)} · Total +{fmt(totalHand)}
          </p>
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Balance · {fmt(balance)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: "PLAY_AGAIN" })}
          style={{
            background: "var(--magenta)",
            color: "var(--cream)",
            border: "1px solid var(--cream)",
            padding: "16px 36px",
            borderRadius: 999,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 0 24px rgba(251,0,159,0.45)",
          }}
        >
          Play Again ▸
        </button>
      </div>

      {showConfetti && <Confetti kind={outcome.kind} />}
    </main>
  );
}

function HudReadout({
  side,
  label,
  value,
}: {
  side: "left" | "right";
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        [side]: 20,
        zIndex: 9,
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        fontFamily: "var(--font-montserrat), sans-serif",
        textShadow: "0 2px 6px rgba(0,0,0,0.7)",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          color: "var(--muted)",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--cream)",
          fontWeight: 800,
          fontSize: 15,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.04em",
        }}
      >
        {value}
      </span>
    </div>
  );
}
