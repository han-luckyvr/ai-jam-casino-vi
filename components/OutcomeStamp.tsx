"use client";

import type { R2OutcomeKind } from "@/lib/gameState";

type Props = {
  kind: R2OutcomeKind;
};

const LABEL: Record<R2OutcomeKind, string> = {
  single: "SINGLE",
  double: "DOUBLE",
  triple: "TRIPLE",
  hr: "HOME RUN!",
  out: "OUT",
};

export default function OutcomeStamp({ kind }: Props) {
  if (kind === "hr") {
    return <HomeRunStamp />;
  }

  const palette = STAMP_STYLES[kind];

  return (
    <div className="outcome-stamp">
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "relative",
          transform: "skew(-5deg)",
          padding: "18px 44px",
          border: `3px solid ${palette.border}`,
          borderRadius: 6,
          color: palette.color,
          fontFamily: "var(--font-montserrat), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(40px, 9vw, 84px)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          background: "rgba(12, 10, 31, 0.55)",
          boxShadow: `0 0 28px ${palette.glow}`,
          textShadow: `0 0 18px ${palette.glow}`,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {LABEL[kind]}
        {kind === "out" && (
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              transform: "skew(5deg)",
              pointerEvents: "none",
              overflow: "visible",
              filter: `drop-shadow(0 0 8px ${palette.glow})`,
            }}
          >
            <line
              x1="-4"
              y1="104"
              x2="104"
              y2="-4"
              stroke="var(--magenta)"
              strokeWidth="6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

const STAMP_STYLES: Record<
  Exclude<R2OutcomeKind, "hr">,
  { color: string; border: string; glow: string }
> = {
  single: {
    color: "var(--cream)",
    border: "var(--cream)",
    glow: "rgba(255, 244, 219, 0.55)",
  },
  double: {
    color: "var(--cyan)",
    border: "var(--cyan)",
    glow: "rgba(42, 234, 255, 0.55)",
  },
  triple: {
    color: "var(--yellow)",
    border: "var(--yellow)",
    glow: "rgba(255, 224, 84, 0.55)",
  },
  out: {
    color: "var(--magenta)",
    border: "var(--magenta)",
    glow: "rgba(251, 0, 159, 0.55)",
  },
};

function HomeRunStamp() {
  return (
    <div className="outcome-stamp">
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "relative",
          transform: "skew(-5deg) scale(1.2)",
          padding: "22px 56px",
          border: "3px solid var(--yellow)",
          borderRadius: 8,
          background: "rgba(12, 10, 31, 0.55)",
          boxShadow:
            "0 0 36px rgba(255, 224, 84, 0.55), 0 0 70px rgba(251, 0, 159, 0.45)",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontWeight: 800,
            fontSize: "clamp(48px, 11vw, 104px)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            backgroundImage:
              "linear-gradient(90deg, #ffe054 0%, #ffe054 35%, #fb009f 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            filter:
              "drop-shadow(0 0 14px rgba(255, 224, 84, 0.7)) drop-shadow(0 0 24px rgba(251, 0, 159, 0.55))",
            whiteSpace: "nowrap",
          }}
        >
          HOME RUN!
        </span>
        <svg
          aria-hidden
          viewBox="0 0 200 12"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: -8,
            width: "calc(100% - 16px)",
            height: 12,
          }}
        >
          <path
            d="M0 6 Q 20 0, 40 6 T 80 6 T 120 6 T 160 6 T 200 6"
            stroke="var(--magenta)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M0 6 Q 20 0, 40 6 T 80 6 T 120 6 T 160 6 T 200 6"
            stroke="var(--yellow)"
            strokeWidth="1"
            strokeDasharray="3 6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
