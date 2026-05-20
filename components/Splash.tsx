"use client";

import { useBalance, useMuted } from "@/lib/persistence";

type Props = { onTap: () => void };

export default function Splash({ onTap }: Props) {
  const [balance] = useBalance();
  const [muted, setMuted] = useMuted();

  return (
    <main
      onClick={onTap}
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        cursor: "pointer",
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
          objectPosition: "center 70%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 80%), linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          width: "100%",
        }}
      >
        <img
          src="/assets/IMG-06.png"
          alt="Strike Zone: Ducks at Bat"
          className="splash-logo"
          style={{
            position: "absolute",
            top: "max(14vh, 96px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "block",
            width: "auto",
            height: "auto",
            maxWidth: "min(620px, 70vw)",
            maxHeight: "38vh",
            filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.55))",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "62%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            textAlign: "center",
            maxWidth: "min(560px, 86vw)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            A Vegas Infinite Original
          </p>
          <p
            style={{
              margin: 0,
              color: "var(--cyan)",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 800,
              fontSize: "12px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              textShadow: "0 0 10px rgba(42, 234, 255, 0.35)",
            }}
          >
            9th Inning · Bases Loaded · Two Outs · Full Count
          </p>
          <p
            style={{
              margin: 0,
              color: "var(--cream)",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 600,
              fontSize: "15px",
              lineHeight: 1.45,
              letterSpacing: "0.02em",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.65)",
            }}
          >
            You&rsquo;re the team&rsquo;s last hitter. Can you save the game and bring home the win?
          </p>
          <p
            className="splash-blink"
            style={{
              margin: 0,
              color: "var(--cream)",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textShadow: "0 0 12px rgba(42, 234, 255, 0.45)",
            }}
          >
            ▸ Press Start ◂
          </p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 20,
          zIndex: 3,
          color: "var(--cream)",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }}
      >
        Balance ${balance.toLocaleString("en-US")}
      </div>

    </main>
  );
}
