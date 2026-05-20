"use client";

import { useLayoutEffect, useMemo, useState, type CSSProperties } from "react";

type ChipKind = "single" | "double" | "triple" | "hr";

type Props = {
  kind: ChipKind;
};

const CHIP_COUNT: Record<ChipKind, number> = {
  single: 50,
  double: 75,
  triple: 100,
  hr: 200,
};

const BURST_SCALE: Record<ChipKind, number> = {
  single: 2,
  double: 3,
  triple: 4,
  hr: 5,
};

const CHIP_PALETTE: ReadonlyArray<{ bg: string; fg: string; label: string }> = [
  { bg: "var(--cream)", fg: "var(--bg)", label: "$1" },
  { bg: "var(--red)", fg: "var(--cream)", label: "$5" },
  { bg: "var(--blue)", fg: "var(--cream)", label: "$10" },
  { bg: "var(--orange)", fg: "var(--cream)", label: "$25" },
];

type Chip = {
  id: number;
  color: (typeof CHIP_PALETTE)[number];
  burstDx: number;
  burstDy: number;
  jitterX: number;
  jitterY: number;
  rotateStart: number;
  rotateEnd: number;
  burstDelay: number;
  duration: number;
};

type Target = { dx: number; dy: number };

export default function ChipExplosion({ kind }: Props) {
  const [target, setTarget] = useState<Target | null>(null);

  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(
      ".bet-dock .dock-readout:not(.right) .dr-value",
    );
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setTarget({
      dx: rect.left + rect.width / 2 - cx,
      dy: rect.top + rect.height / 2 - cy,
    });
  }, []);

  const chips = useMemo<Chip[]>(() => {
    const n = CHIP_COUNT[kind];
    const scale = BURST_SCALE[kind];
    const out: Chip[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.45;
      const burstDist = (180 + Math.random() * 140) * scale;
      out.push({
        id: i,
        color: CHIP_PALETTE[i % CHIP_PALETTE.length],
        burstDx: Math.cos(angle) * burstDist,
        burstDy: Math.sin(angle) * burstDist,
        jitterX: (Math.random() - 0.5) * 36,
        jitterY: (Math.random() - 0.5) * 36,
        rotateStart: Math.random() * 360,
        rotateEnd: 720 + Math.random() * 720,
        burstDelay: Math.random() * 120,
        duration: 1600 + Math.random() * 600,
      });
    }
    return out;
  }, [kind]);

  if (!target) return null;

  return (
    <div className="chip-explosion-layer" aria-hidden>
      {chips.map((c) => {
        const style: CSSProperties = {
          animationDelay: `${c.burstDelay}ms`,
          animationDuration: `${c.duration}ms`,
        };
        // CSS custom properties (typed as any to satisfy CSSProperties)
        const vars = style as Record<string, string>;
        vars["--burst-dx"] = `${c.burstDx}px`;
        vars["--burst-dy"] = `${c.burstDy}px`;
        vars["--target-dx"] = `${target.dx + c.jitterX}px`;
        vars["--target-dy"] = `${target.dy + c.jitterY}px`;
        vars["--rotate-start"] = `${c.rotateStart}deg`;
        vars["--rotate-end"] = `${c.rotateEnd}deg`;
        return (
          <div key={c.id} className="chip-particle" style={style}>
            <ChipSvg bg={c.color.bg} fg={c.color.fg} label={c.color.label} id={c.id} />
          </div>
        );
      })}
    </div>
  );
}

function ChipSvg({
  bg,
  fg,
  label,
  id,
}: {
  bg: string;
  fg: string;
  label: string;
  id: number;
}) {
  const gradId = `chip-p-${id}-grad`;
  const bevelId = `chip-p-${id}-bevel`;
  return (
    <svg
      width={42}
      height={42}
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
        {label}
      </text>
    </svg>
  );
}
