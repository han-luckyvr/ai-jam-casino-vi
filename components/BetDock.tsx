"use client";

import type { ChipValue } from "@/lib/gameState";
import ChipRack, { type ActionPill } from "./ChipRack";

type Props = {
  balance: number;
  staked: number;
  activeChip: ChipValue;
  onSelectChip: (chip: ChipValue) => void;
  onClear: () => void;
  canClear: boolean;
  locked?: boolean;
  balanceDisplayDelta?: number;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  rebet?: ActionPill;
  rebet2x?: ActionPill;
};

export default function BetDock({
  balance,
  staked,
  activeChip,
  onSelectChip,
  onClear,
  canClear,
  locked = false,
  balanceDisplayDelta = 0,
  primaryAction,
  rebet,
  rebet2x,
}: Props) {
  const displayedBalance = balance + balanceDisplayDelta;
  const counting = balanceDisplayDelta < 0;

  return (
    <div className="bet-dock" aria-label="Player dock">
      <div className="dock-readout">
        <span className="dr-label">Balance</span>
        <span className={`dr-value${counting ? " dr-counting" : ""}`}>
          ${displayedBalance.toLocaleString("en-US")}
        </span>
      </div>
      <div className="dock-center">
        <ChipRack
          activeChip={activeChip}
          onSelectChip={onSelectChip}
          onClear={onClear}
          canClear={canClear}
          locked={locked}
          rebet={rebet}
          rebet2x={rebet2x}
        />
        {primaryAction && (() => {
          const actionDisabled = primaryAction.disabled ?? false;
          return (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={actionDisabled}
              style={{
                background: !actionDisabled ? "var(--magenta)" : "rgba(251,0,159,0.35)",
                color: "var(--cream)",
                border: "1px solid var(--cream)",
                padding: "14px 30px",
                borderRadius: 999,
                fontFamily: "var(--font-montserrat), sans-serif",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: !actionDisabled ? "pointer" : "not-allowed",
                opacity: !actionDisabled ? 1 : 0.55,
                boxShadow: !actionDisabled ? "0 0 24px rgba(251,0,159,0.45)" : "none",
                transition: "opacity 0.15s ease, box-shadow 0.15s ease",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {primaryAction.label}
            </button>
          );
        })()}
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
  );
}
