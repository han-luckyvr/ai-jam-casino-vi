"use client";

import { useEffect } from "react";
import { rollSwing } from "@/lib/probabilities";
import { sumStaked } from "@/lib/bets";
import { useBalance, useJackpot } from "@/lib/persistence";
import type {
  GameAction,
  GameState,
  R2Outcome,
  SwingOption,
} from "@/lib/gameState";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onJackpotPulse: (active: boolean) => void;
};

type CardSpec = {
  option: SwingOption;
  title: string;
  risk: string;
  color: string;
  glow: string;
  rows: ReadonlyArray<{
    label: string;
    probPct: string;
    payout: (stake: number, jackpot: number) => string;
    emphasis?: "primary" | "secondary" | "muted";
  }>;
};

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

// Floor matches §05 examples ($5 × 1.25 = $6).
const payoutFor = (mult: number) => (stake: number) =>
  fmt(Math.floor(stake * mult));

const CARDS: ReadonlyArray<CardSpec> = [
  {
    option: 1,
    title: "Contact",
    risk: "Low risk",
    color: "var(--cyan)",
    glow: "rgba(42, 234, 255, 0.55)",
    rows: [
      { label: "Single", probPct: "95%", payout: payoutFor(1), emphasis: "primary" },
      { label: "Out",    probPct: "5%",  payout: () => "—",   emphasis: "muted" },
    ],
  },
  {
    option: 2,
    title: "Power",
    risk: "Mid risk",
    color: "var(--magenta)",
    glow: "rgba(251, 0, 159, 0.55)",
    rows: [
      { label: "Double", probPct: "40%", payout: payoutFor(2),  emphasis: "primary"   },
      { label: "Single", probPct: "15%", payout: payoutFor(1),  emphasis: "secondary" },
      { label: "Out",    probPct: "45%", payout: () => "—",     emphasis: "muted"     },
    ],
  },
  {
    option: 3,
    title: "Grand Slam",
    risk: "High risk · jackpot bonus",
    color: "var(--purple)",
    glow: "rgba(149, 0, 198, 0.55)",
    rows: [
      {
        label: "Home Run",
        probPct: "0.1%",
        payout: (_stake, jackpot) => fmt(jackpot),
        emphasis: "primary",
      },
      { label: "Triple", probPct: "12%",   payout: payoutFor(3), emphasis: "primary"   },
      { label: "Double", probPct: "10%",   payout: payoutFor(2), emphasis: "secondary" },
      { label: "Out",    probPct: "77.9%", payout: () => "—",    emphasis: "muted"     },
    ],
  },
];

export default function R2SwingSelect({ state, dispatch, onJackpotPulse }: Props) {
  const [balance, setBalance] = useBalance();
  const [jackpot, setJackpot] = useJackpot();
  const r2Stake = sumStaked(state.bets);

  const selected = state.swingChoice;

  useEffect(() => {
    onJackpotPulse(selected === 3);
  }, [selected, onJackpotPulse]);

  const choose = (option: SwingOption) =>
    dispatch({ type: "CHOOSE_SWING", option });

  const onSwing = () => {
    if (selected === null) return;
    const r2Outcome: R2Outcome = rollSwing(selected);
    let winnings = 0;
    if (r2Outcome.kind === "hr") {
      winnings = jackpot;
      setBalance((b) => b + winnings);
      setJackpot(() => 1000);
    } else if (r2Outcome.multiplier > 0) {
      winnings = Math.floor(r2Stake * r2Outcome.multiplier);
      setBalance((b) => b + winnings);
    }
    onJackpotPulse(false);
    dispatch({ type: "RESOLVE_SWING", r2Outcome, winnings });
  };

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
          opacity: 0.55,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(10,8,27,0.35) 40%, rgba(10,8,27,0.78) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <HudReadout side="left" label="Balance" value={fmt(balance)} />
      <HudReadout side="right" label="Stake" value={fmt(r2Stake)} />

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
        <header style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              color: "var(--cyan)",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontSize: 11,
            }}
          >
            Round 2 · Pick your swing
          </p>
          <h1
            style={{
              margin: "6px 0 0",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(24px, 4vw, 34px)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--cream)",
            }}
          >
            Ducky&rsquo;s at bat
          </h1>
        </header>

        <div
          className="swing-card-row"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "22px",
            width: "100%",
            maxWidth: 980,
          }}
        >
          {CARDS.map((card) => (
            <SwingCard
              key={card.option}
              spec={card}
              stake={r2Stake}
              jackpot={jackpot}
              selected={selected === card.option}
              onSelect={() => choose(card.option)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onSwing}
          disabled={selected === null}
          style={{
            background: selected !== null ? "var(--magenta)" : "rgba(251,0,159,0.35)",
            color: "var(--cream)",
            border: "1px solid var(--cream)",
            padding: "16px 36px",
            borderRadius: 999,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: selected !== null ? "pointer" : "not-allowed",
            opacity: selected !== null ? 1 : 0.55,
            boxShadow: selected !== null ? "0 0 24px rgba(251,0,159,0.45)" : "none",
            transition: "opacity 0.15s ease, box-shadow 0.15s ease",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ▸ Swing
        </button>
      </div>
    </main>
  );
}

function SwingCard({
  spec,
  stake,
  jackpot,
  selected,
  onSelect,
}: {
  spec: CardSpec;
  stake: number;
  jackpot: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="swing-card"
      style={{
        position: "relative",
        flex: "1 1 240px",
        maxWidth: 300,
        minHeight: 260,
        padding: "26px 22px 22px",
        background: selected
          ? `linear-gradient(180deg, rgba(12,10,31,0.92), rgba(12,10,31,0.78))`
          : "rgba(12, 10, 31, 0.78)",
        border: `2px solid ${spec.color}`,
        borderRadius: 14,
        color: "var(--cream)",
        fontFamily: "var(--font-montserrat), sans-serif",
        cursor: "pointer",
        textAlign: "left",
        transform: selected ? "translateY(-6px) scale(1.03)" : "translateY(0) scale(1)",
        boxShadow: selected
          ? `0 0 32px ${spec.glow}, inset 0 0 22px ${spec.glow}`
          : `0 0 14px rgba(0,0,0,0.45), inset 0 0 12px rgba(255,255,255,0.02)`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 10,
          right: 14,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: spec.color,
          boxShadow: `0 0 10px ${spec.color}`,
        }}
      />

      <div>
        <p
          style={{
            margin: 0,
            color: spec.color,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontSize: 10,
          }}
        >
          Option {spec.option}
        </p>
        <h2
          style={{
            margin: "4px 0 6px",
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--cream)",
          }}
        >
          {spec.title}
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--muted)",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {spec.risk}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderTop: "1px solid rgba(255,244,219,0.08)",
          paddingTop: 12,
        }}
      >
        {spec.rows.map((row) => (
          <SwingRow
            key={row.label}
            label={row.label}
            probPct={row.probPct}
            payout={row.payout(stake, jackpot)}
            emphasis={row.emphasis ?? "secondary"}
            accent={spec.color}
          />
        ))}
      </div>
    </button>
  );
}

function SwingRow({
  label,
  probPct,
  payout,
  emphasis,
  accent,
}: {
  label: string;
  probPct: string;
  payout: string;
  emphasis: "primary" | "secondary" | "muted";
  accent: string;
}) {
  const labelColor =
    emphasis === "primary"
      ? accent
      : emphasis === "secondary"
        ? "var(--cream)"
        : "var(--muted)";
  const payoutColor =
    emphasis === "primary"
      ? accent
      : emphasis === "secondary"
        ? "var(--cream)"
        : "var(--muted)";
  const fontSize = emphasis === "primary" ? 14 : 12;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span
        style={{
          color: labelColor,
          fontWeight: emphasis === "primary" ? 800 : 600,
          fontSize,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
        <span
          style={{
            marginLeft: 8,
            color: "var(--muted)",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.12em",
          }}
        >
          {probPct}
        </span>
      </span>
      <span
        style={{
          color: payoutColor,
          fontWeight: emphasis === "primary" ? 800 : 700,
          fontSize,
          letterSpacing: "0.04em",
        }}
      >
        {payout}
      </span>
    </div>
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
