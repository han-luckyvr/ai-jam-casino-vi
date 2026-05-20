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
          particleCount: 70,
          spread: 70,
          startVelocity: 38,
          origin: { x: 0.5, y: 0.78 },
        });
        break;
      case "double":
        fire({
          particleCount: 80,
          spread: 75,
          startVelocity: 42,
          origin: { x: 0.5, y: 0.78 },
        });
        fire(
          {
            particleCount: 50,
            spread: 60,
            startVelocity: 40,
            angle: 60,
            origin: { x: 0.2, y: 0.85 },
          },
          150,
        );
        fire(
          {
            particleCount: 50,
            spread: 60,
            startVelocity: 40,
            angle: 120,
            origin: { x: 0.8, y: 0.85 },
          },
          150,
        );
        break;
      case "triple":
        fire({
          particleCount: 110,
          spread: 90,
          startVelocity: 48,
          scalar: 1.1,
          origin: { x: 0.5, y: 0.75 },
        });
        fire(
          {
            particleCount: 60,
            spread: 65,
            startVelocity: 45,
            scalar: 1.1,
            angle: 65,
            origin: { x: 0.18, y: 0.85 },
          },
          200,
        );
        fire(
          {
            particleCount: 60,
            spread: 65,
            startVelocity: 45,
            scalar: 1.1,
            angle: 115,
            origin: { x: 0.82, y: 0.85 },
          },
          200,
        );
        fire(
          {
            particleCount: 55,
            spread: 70,
            startVelocity: 50,
            scalar: 1.1,
            angle: 70,
            origin: { x: 0.12, y: 0.78 },
          },
          500,
        );
        fire(
          {
            particleCount: 55,
            spread: 70,
            startVelocity: 50,
            scalar: 1.1,
            angle: 110,
            origin: { x: 0.88, y: 0.78 },
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
