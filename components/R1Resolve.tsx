"use client";

import { resolveR1Payout, sumStaked } from "@/lib/bets";
import { useBalance } from "@/lib/persistence";
import type { GameAction, GameState } from "@/lib/gameState";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export default function R1Resolve({ state, dispatch }: Props) {
  const [balance] = useBalance();
  const staked = sumStaked(state.bets);
  const outcome = state.pitchOutcome;
  const contact = outcome !== null && outcome.inZone;
  const winnings = contact ? resolveR1Payout(state.bets, outcome.cell) : 0;

  const onContinue = () => dispatch({ type: "PLAY_AGAIN" });

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
        src={contact ? "/assets/IMG-05.jpg" : "/assets/IMG-04.jpg"}
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

      <HudReadout
        side="left"
        label="Balance"
        value={`$${balance.toLocaleString("en-US")}`}
      />
      <HudReadout side="right" label="Staked" value={`$${staked.toLocaleString("en-US")}`} />

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
          gap: "28px",
          padding: "96px 24px 48px",
          boxSizing: "border-box",
        }}
      >
        <ResolveGrid outcome={outcome} />

        {contact ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "14px 28px",
              background: "rgba(12,10,31,0.85)",
              border: "1px solid var(--cyan)",
              borderRadius: 8,
              color: "var(--cyan)",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              fontVariantNumeric: "tabular-nums",
              boxShadow: "0 0 22px rgba(42,234,255,0.45)",
              textAlign: "center",
            }}
          >
            Contact! +${winnings.toLocaleString("en-US")}
          </div>
        ) : (
          <div
            role="status"
            aria-live="polite"
            style={{
              transform: "skew(-5deg)",
              padding: "12px 28px",
              border: "3px solid var(--magenta)",
              borderRadius: 4,
              color: "var(--magenta)",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              background: "rgba(12,10,31,0.55)",
              boxShadow: "0 0 22px rgba(251,0,159,0.55)",
              textShadow: "0 0 14px rgba(251,0,159,0.6)",
            }}
          >
            Strikeout
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
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
          {contact ? "Continue ▸" : "Play Again ▸"}
        </button>
      </div>
    </main>
  );
}

function ResolveGrid({
  outcome,
}: {
  outcome: GameState["pitchOutcome"];
}) {
  const cell =
    outcome && outcome.inZone ? outcome.cell : null;
  // Ball position outside-grid (0..100 == grid extent; negative / >100 == off-grid)
  const offGridX = outcome && !outcome.inZone ? outcome.xPct : null;
  const offGridY = outcome && !outcome.inZone ? outcome.yPct : null;

  return (
    <div
      style={{
        position: "relative",
        width: "min(60vw, 380px)",
        aspectRatio: "1 / 1",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "3px",
          padding: "3px",
          background: "rgba(12,10,31,0.40)",
          boxShadow:
            "0 0 0 1.5px var(--cyan), inset 0 0 18px rgba(42,234,255,0.18), 0 0 32px rgba(42,234,255,0.30)",
          borderRadius: 4,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => {
          const isWinning = c === cell;
          return (
            <div
              key={c}
              className={`scanline${isWinning ? " winning-cell" : ""}`}
              style={{
                position: "relative",
                ...(isWinning
                  ? {}
                  : { border: "1px solid rgba(42,234,255,0.32)" }),
              }}
            >
              {isWinning && <Ball />}
            </div>
          );
        })}
      </div>

      {/* Decorative corner endpoints (match StrikeZoneGrid). */}
      {[
        { top: -5, left: -5 },
        { top: -5, right: -5 },
        { bottom: -5, left: -5 },
        { bottom: -5, right: -5 },
      ].map((pos, idx) => (
        <span
          key={idx}
          aria-hidden
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--cyan)",
            boxShadow: "0 0 10px var(--cyan)",
            pointerEvents: "none",
            ...pos,
          }}
        />
      ))}

      {offGridX !== null && offGridY !== null && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: `${offGridX}%`,
            top: `${offGridY}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 4,
          }}
        >
          <Ball />
        </span>
      )}
    </div>
  );
}

function Ball() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 30%, var(--cream) 0%, var(--cream) 55%, rgba(251,0,159,0.4) 100%)",
        border: "2px solid var(--magenta)",
        boxShadow:
          "0 0 18px rgba(255,244,219,0.9), 0 0 28px rgba(251,0,159,0.6)",
        zIndex: 3,
      }}
    />
  );
}

function HudReadout({
  side,
  label,
  value,
  valueColor = "var(--cream)",
}: {
  side: "left" | "right";
  label: string;
  value: string;
  valueColor?: string;
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
          color: valueColor,
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
