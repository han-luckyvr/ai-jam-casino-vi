"use client";

import { useEffect, useRef } from "react";
import { useMuted } from "@/lib/persistence";
import type { Screen } from "@/lib/gameState";

const PLAY_SCREENS: ReadonlySet<Screen> = new Set(["SPLASH", "R1_BET"]);

type Props = {
  screen: Screen;
};

export default function OrganMusic({ screen }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const consumedRef = useRef(false);
  const [muted] = useMuted();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || muted || consumedRef.current) return;
    let kick: ((e?: Event) => void) | null = null;
    const cleanup = () => {
      if (!kick) return;
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
      kick = null;
    };
    audio.play().catch(() => {
      kick = () => {
        audio.play().catch(() => {});
        cleanup();
      };
      window.addEventListener("pointerdown", kick, { once: true });
      window.addEventListener("keydown", kick, { once: true });
      window.addEventListener("touchstart", kick, { once: true });
    });
    return cleanup;
  }, [muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const inPlayZone = PLAY_SCREENS.has(screen);
    if (!inPlayZone && audio.currentTime > 0) {
      consumedRef.current = true;
    }
    const shouldPlay = inPlayZone && !muted && !consumedRef.current;
    if (shouldPlay) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [screen, muted]);

  return (
    <audio
      ref={audioRef}
      src="/assets/audio/AUD-01.mp3"
      preload="auto"
      aria-hidden
      style={{ display: "none" }}
      onLoadedMetadata={(e) => {
        e.currentTarget.volume = 0.45;
      }}
      onEnded={() => {
        consumedRef.current = true;
      }}
    />
  );
}
