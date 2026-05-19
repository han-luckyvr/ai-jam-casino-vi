"use client";

import { useEffect, useState } from "react";
import { rollPitch } from "@/lib/probabilities";
import { sumStaked } from "@/lib/bets";
import { useBalance, useJackpot } from "@/lib/persistence";
import { useSfx } from "@/lib/audio";
import type { Bet, ChipValue, GameAction, GameState } from "@/lib/gameState";
import StrikeZoneGrid from "./StrikeZoneGrid";
import ChipRack from "./ChipRack";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

// Per product-doc.html:457-462 — a line bet stakes 3× chip (one per covered cell).
function stakeForBet(kind: Bet["kind"], chip: number): number {
  return kind === "line" ? 3 * chip : chip;
}

export default function R1BetPlacement({ state, dispatch }: Props) {
  const [balance, setBalance] = useBalance();
  const [, setJackpot] = useJackpot();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const playChipClick = useSfx("chipClick");

  const staked = sumStaked(state.bets);
  const canThrowPitch = staked > 0 && staked <= balance;

  useEffect(() => {
    if (tooltip === null) return;
    const id = window.setTimeout(() => setTooltip(null), 2000);
    return () => window.clearTimeout(id);
  }, [tooltip]);

  const flash = (msg: string) => {
    setTooltip(null);
    window.setTimeout(() => setTooltip(msg), 0);
  };

  const placeBet = (next: { kind: "zone"; cell: number } | { kind: "line"; line: number }) => {
    const chip = state.activeChip;
    const stake = stakeForBet(next.kind, chip);
    if (staked + stake > balance) {
      flash(`Not enough balance — $${(staked + stake).toLocaleString("en-US")} would exceed $${balance.toLocaleString("en-US")}`);
      return;
    }
    playChipClick();
    if (next.kind === "zone") {
      dispatch({ type: "PLACE_BET", bet: { kind: "zone", cell: next.cell, amount: stake } });
    } else {
      dispatch({ type: "PLACE_BET", bet: { kind: "line", line: next.line, amount: stake } });
    }
  };

  const selectChip = (chip: ChipValue) => {
    if (chip === state.activeChip) return;
    if (state.bets.length === 0) {
      playChipClick();
      dispatch({ type: "SET_ACTIVE_CHIP", chip });
      return;
    }
    const repriced = state.bets.reduce(
      (sum, bet) => sum + stakeForBet(bet.kind, chip),
      0,
    );
    if (repriced > balance) {
      flash(`Switch blocked — repricing ${state.bets.length} bets to $${chip} = $${repriced.toLocaleString("en-US")} exceeds balance $${balance.toLocaleString("en-US")}`);
      return;
    }
    playChipClick();
    const original = state.bets;
    dispatch({ type: "CLEAR_BETS" });
    for (const bet of original) {
      const stake = stakeForBet(bet.kind, chip);
      if (bet.kind === "zone") {
        dispatch({ type: "PLACE_BET", bet: { kind: "zone", cell: bet.cell, amount: stake } });
      } else {
        dispatch({ type: "PLACE_BET", bet: { kind: "line", line: bet.line, amount: stake } });
      }
    }
    dispatch({ type: "SET_ACTIVE_CHIP", chip });
  };

  const onClear = () => dispatch({ type: "CLEAR_BETS" });

  const onThrowPitch = () => {
    if (!canThrowPitch) return;
    setBalance((b) => b - staked);
    setJackpot((j) => j + staked * 0.01);
    dispatch({ type: "COMMIT_PITCH", pitchOutcome: rollPitch() });
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
        src="/assets/IMG-03.jpg"
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
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "180px 24px 140px",
          boxSizing: "border-box",
        }}
      >
        <StrikeZoneGrid
          bets={state.bets}
          activeChip={state.activeChip}
          onPlaceZone={(cell) => placeBet({ kind: "zone", cell })}
          onPlaceLine={(line) => placeBet({ kind: "line", line })}
        />
      </div>

      <div className="bet-dock" aria-label="Player dock">
        <div className="dock-readout">
          <span className="dr-label">Balance</span>
          <span className="dr-value">${balance.toLocaleString("en-US")}</span>
        </div>
        <div className="dock-center">
          <ChipRack
            activeChip={state.activeChip}
            onSelectChip={selectChip}
            onClear={onClear}
            canClear={state.bets.length > 0}
          />
          <button
            type="button"
            onClick={onThrowPitch}
            disabled={!canThrowPitch}
            style={{
              background: canThrowPitch ? "var(--magenta)" : "rgba(251,0,159,0.35)",
              color: "var(--cream)",
              border: "1px solid var(--cream)",
              padding: "14px 30px",
              borderRadius: 999,
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: canThrowPitch ? "pointer" : "not-allowed",
              opacity: canThrowPitch ? 1 : 0.55,
              boxShadow: canThrowPitch ? "0 0 24px rgba(251,0,159,0.45)" : "none",
              transition: "opacity 0.15s ease, box-shadow 0.15s ease",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            ▸ Throw Pitch
          </button>
        </div>
        <div className="dock-readout right">
          <span className="dr-label">Staked</span>
          <span
            className="dr-value"
            style={{ color: staked > balance ? "var(--magenta)" : undefined }}
          >
            ${staked.toLocaleString("en-US")}
          </span>
        </div>
      </div>

      {tooltip !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 116,
            transform: "translateX(-50%)",
            zIndex: 20,
            maxWidth: "min(520px, 92vw)",
            padding: "12px 20px",
            background: "rgba(12,10,31,0.92)",
            border: "1px solid var(--magenta)",
            borderRadius: 8,
            color: "var(--cream)",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textAlign: "center",
            boxShadow: "0 0 18px rgba(251,0,159,0.45)",
          }}
        >
          {tooltip}
        </div>
      )}
    </main>
  );
}
