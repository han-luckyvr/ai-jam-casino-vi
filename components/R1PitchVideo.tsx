"use client";

import { useCallback, useEffect, useRef } from "react";
import { resolveR1Payout } from "@/lib/bets";
import { useSfx } from "@/lib/audio";
import type { GameAction, GameState } from "@/lib/gameState";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

const FALLBACK_MS = 5000;
const WHOOSH_DELAY_MS = 1000;

export default function R1PitchVideo({ state, dispatch }: Props) {
  const resolvedRef = useRef(false);
  const playWhoosh = useSfx("whoosh");
  const whooshTimerRef = useRef<number | null>(null);

  const resolve = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const winnings = state.pitchOutcome
      ? resolveR1Payout(state.bets, state.pitchOutcome.cell)
      : 0;
    dispatch({ type: "RESOLVE_PITCH", r1Winnings: winnings });
  }, [state.bets, state.pitchOutcome, dispatch]);

  useEffect(() => {
    const id = window.setTimeout(resolve, FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [resolve]);

  useEffect(() => {
    return () => {
      if (whooshTimerRef.current !== null) {
        window.clearTimeout(whooshTimerRef.current);
        whooshTimerRef.current = null;
      }
    };
  }, []);

  const onVideoPlay = () => {
    if (whooshTimerRef.current !== null) return;
    whooshTimerRef.current = window.setTimeout(() => {
      playWhoosh();
      whooshTimerRef.current = null;
    }, WHOOSH_DELAY_MS);
  };

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      <video
        className="r1-pitch-video"
        src="/assets/VID-01.mp4"
        autoPlay
        playsInline
        muted
        onPlay={onVideoPlay}
        onEnded={resolve}
        onError={resolve}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <button
        type="button"
        onClick={resolve}
        aria-label="Skip pitch video"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 48,
          transform: "translateX(-50%)",
          zIndex: 2,
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
        Skip ▸
      </button>
    </main>
  );
}
