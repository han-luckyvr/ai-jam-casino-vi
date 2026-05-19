"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { R2OutcomeKind } from "@/lib/gameState";

type Props = {
  kind: R2OutcomeKind;
};

const COLORS = ["#fb009f", "#2aeaff", "#ffe054"];

export default function Confetti({ kind }: Props) {
  useEffect(() => {
    let cancelled = false;
    const timeouts: number[] = [];

    const fire = (
      opts: Parameters<typeof confetti>[0],
      delay = 0,
    ) => {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        confetti({
          colors: COLORS,
          disableForReducedMotion: true,
          ...opts,
        });
      }, delay);
      timeouts.push(id);
    };

    switch (kind) {
      case "single":
        fire({
          particleCount: 60,
          spread: 60,
          startVelocity: 35,
          origin: { x: 0.5, y: 0.8 },
        });
        break;
      case "double":
        fire({
          particleCount: 60,
          spread: 55,
          startVelocity: 38,
          angle: 60,
          origin: { x: 0.2, y: 0.85 },
        });
        fire({
          particleCount: 60,
          spread: 55,
          startVelocity: 38,
          angle: 120,
          origin: { x: 0.8, y: 0.85 },
        });
        break;
      case "triple":
        fire({
          particleCount: 70,
          spread: 65,
          startVelocity: 40,
          origin: { x: 0.5, y: 0.8 },
        });
        fire(
          {
            particleCount: 65,
            spread: 60,
            startVelocity: 42,
            angle: 60,
            origin: { x: 0.2, y: 0.85 },
          },
          250,
        );
        fire(
          {
            particleCount: 65,
            spread: 60,
            startVelocity: 42,
            angle: 120,
            origin: { x: 0.8, y: 0.85 },
          },
          500,
        );
        break;
      case "hr":
        fire({
          particleCount: 200,
          spread: 100,
          startVelocity: 55,
          origin: { x: 0.5, y: 0.6 },
        });
        for (let i = 1; i <= 3; i++) {
          fire(
            {
              particleCount: 80,
              spread: 70,
              startVelocity: 45,
              angle: 60,
              origin: { x: 0.1, y: 0.75 },
            },
            i * 600,
          );
          fire(
            {
              particleCount: 80,
              spread: 70,
              startVelocity: 45,
              angle: 120,
              origin: { x: 0.9, y: 0.75 },
            },
            i * 600,
          );
        }
        break;
      default:
        break;
    }

    return () => {
      cancelled = true;
      for (const id of timeouts) window.clearTimeout(id);
    };
  }, [kind]);

  return null;
}
