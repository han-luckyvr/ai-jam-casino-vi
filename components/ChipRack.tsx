"use client";

import type { ChipValue } from "@/lib/gameState";

const CHIPS: ReadonlyArray<{ value: ChipValue; bg: string; fg: string }> = [
  { value: 1, bg: "var(--cream)", fg: "var(--bg)" },
  { value: 5, bg: "var(--red)", fg: "var(--cream)" },
  { value: 10, bg: "var(--blue)", fg: "var(--cream)" },
  { value: 25, bg: "var(--orange)", fg: "var(--cream)" },
];

export type ActionPill = { label: string; onClick: () => void; disabled: boolean };

type Props = {
  activeChip: ChipValue;
  onSelectChip: (chip: ChipValue) => void;
  onClear: () => void;
  canClear: boolean;
  locked?: boolean;
  rebet?: ActionPill;
  rebet2x?: ActionPill;
};

export default function ChipRack({ activeChip, onSelectChip, onClear, canClear, locked = false, rebet, rebet2x }: Props) {
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
      <div className="chip-rack-row" style={{ display: "flex", gap: "18px", padding: "6px 4px" }}>
        {CHIPS.map(({ value, bg, fg }) => {
          const active = activeChip === value;
          return (
            <button
              key={value}
              type="button"
              aria-label={`$${value} chip${active ? " (active)" : ""}`}
              aria-pressed={active}
              aria-disabled={locked || undefined}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                onSelectChip(value);
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: locked ? "not-allowed" : "pointer",
                boxShadow: locked
                  ? "0 4px 10px rgba(0,0,0,0.5)"
                  : active
                    ? "0 0 0 2px var(--bg), 0 0 0 4px var(--cyan), 0 0 18px rgba(42,234,255,0.55)"
                    : "0 4px 10px rgba(0,0,0,0.5)",
                transform: !locked && active ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                opacity: locked ? 0.4 : 1,
                filter: locked ? "grayscale(1)" : undefined,
              }}
            >
              <ChipFace value={value} bg={bg} fg={fg} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          if (locked) return;
          onClear();
        }}
        disabled={locked || !canClear}
        style={pillStyle(!locked && canClear)}
      >
        Clear
      </button>
      {rebet && (
        <button
          type="button"
          onClick={() => {
            if (locked || rebet.disabled) return;
            rebet.onClick();
          }}
          disabled={locked || rebet.disabled}
          style={pillStyle(!locked && !rebet.disabled)}
        >
          {rebet.label}
        </button>
      )}
      {rebet2x && (
        <button
          type="button"
          onClick={() => {
            if (locked || rebet2x.disabled) return;
            rebet2x.onClick();
          }}
          disabled={locked || rebet2x.disabled}
          style={pillStyle(!locked && !rebet2x.disabled)}
        >
          {rebet2x.label}
        </button>
      )}
    </div>
  );
}

function pillStyle(enabled: boolean): React.CSSProperties {
  return {
    background: "transparent",
    color: enabled ? "var(--cyan)" : "var(--muted)",
    border: "1px solid var(--rule-strong)",
    padding: "10px 22px",
    borderRadius: 999,
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.45,
    transition: "opacity 0.15s ease",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  };
}

function ChipFace({ value, bg, fg }: { value: ChipValue; bg: string; fg: string }) {
  const gradId = `chip-${value}-grad`;
  const bevelId = `chip-${value}-bevel`;
  return (
    <svg
      width={56}
      height={56}
      viewBox="0 0 56 56"
      aria-hidden
      style={{ display: "block", borderRadius: "50%" }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={bg} />
          <stop offset="60%" stopColor={bg} />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </radialGradient>
        <radialGradient id={bevelId} cx="50%" cy="50%" r="50%">
          <stop offset="25%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="28" r="26" fill={`url(#${gradId})`} />
      <circle
        cx="28"
        cy="28"
        r="24.5"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        strokeDasharray="2 3"
      />
      <circle cx="28" cy="28" r="17" fill={`url(#${bevelId})`} />
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-montserrat), sans-serif"
        fontWeight={800}
        fontSize="15"
        letterSpacing="0.02em"
        fill={fg}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        ${value}
      </text>
    </svg>
  );
}
