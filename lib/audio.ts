"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMuted } from "@/lib/persistence";

export type SfxName =
  | "whoosh"
  | "chipClick"
  | "contact"
  | "out"
  | "r2Hype"
  | "r2Win";

const SFX_SRC: Record<SfxName, string> = {
  whoosh: "/assets/audio/AUD-02.mp3",
  chipClick: "/assets/audio/AUD-04.mp3",
  contact: "/assets/audio/AUD-03.mp3",
  out: "/assets/audio/AUD-05.mp3",
  r2Hype: "/assets/audio/AUD-06.mp3",
  r2Win: "/assets/audio/AUD-07.mp3",
};

const SFX_VOLUME: Record<SfxName, number> = {
  whoosh: 0.6,
  chipClick: 0.7,
  contact: 0.7,
  out: 0.85,
  r2Hype: 0.7,
  r2Win: 0.8,
};

export function useSfx(name: SfxName): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted] = useMuted();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio(SFX_SRC[name]);
    a.preload = "auto";
    a.volume = SFX_VOLUME[name];
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [name]);

  return useCallback(() => {
    const a = audioRef.current;
    if (!a || muted) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, [muted]);
}
