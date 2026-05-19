"use client";

import type { ChipValue } from "@/lib/gameState";

const CHIPS: ReadonlyArray<{ value: ChipValue; bg: string; fg: string }> = [
  { value: 1, bg: "var(--cream)", fg: "var(--bg)" },
  { value: 5, bg: "var(--red)", fg: "var(--cream)" },
  { value: 10, bg: "var(--blue)", fg: "var(--cream)" },
  { value: 25, bg: "var(--orange)", fg: "var(--cream)" },
];

type Props = {
  activeChip: ChipValue;
  onSelectChip: (chip: ChipValue) => void;
  onClear: () => void;
  canClear: boolean;
};

export default function ChipRack({ activeChip, onSelectChip, onClear, canClear }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "18px", padding: "6px 4px" }}>
        {CHIPS.map(({ value, bg, fg }) => {
          const active = activeChip === value;
          return (
            <button
              key={value}
              type="button"
              aria-label={`$${value} chip${active ? " (active)" : ""}`}
              aria-pressed={active}
              onClick={() => onSelectChip(value)}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                background: `radial-gradient(circle at 35% 30%, ${bg}, ${bg} 60%, rgba(0,0,0,0.25) 100%)`,
                color: fg,
                fontFamily: "var(--font-montserrat), sans-serif",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "0.02em",
                cursor: "pointer",
                boxShadow: active
                  ? "0 0 0 2px var(--bg), 0 0 0 4px var(--cyan), 0 0 18px rgba(42,234,255,0.55), inset 0 -4px 0 rgba(0,0,0,0.22)"
                  : "0 4px 10px rgba(0,0,0,0.5), inset 0 -4px 0 rgba(0,0,0,0.22)",
                transform: active ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${value}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        style={{
          background: "transparent",
          color: canClear ? "var(--cyan)" : "var(--muted)",
          border: "1px solid var(--rule-strong)",
          padding: "10px 22px",
          borderRadius: 999,
          fontFamily: "var(--font-montserrat), sans-serif",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          cursor: canClear ? "pointer" : "not-allowed",
          opacity: canClear ? 1 : 0.45,
          transition: "opacity 0.15s ease",
        }}
      >
        Clear
      </button>
    </div>
  );
}
