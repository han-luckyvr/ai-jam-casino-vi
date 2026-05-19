"use client";

import { useJackpot } from "@/lib/persistence";

export default function JackpotTicker() {
  const [jackpot] = useJackpot();
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "8px 18px",
        background: "rgba(12, 10, 31, 0.72)",
        border: "1px solid var(--rule-strong)",
        borderRadius: "12px",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow: "0 0 24px rgba(42, 234, 255, 0.12)",
      }}
    >
      <span
        style={{
          color: "var(--cyan)",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontWeight: 800,
          fontSize: "11px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        Jackpot
      </span>
      <span
        style={{
          color: "var(--cream)",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
          textShadow: "0 0 12px rgba(42, 234, 255, 0.45)",
        }}
      >
        ${jackpot.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}
