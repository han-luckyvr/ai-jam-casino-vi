"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Screen } from "@/lib/gameState";

type Props = {
  screen: Screen;
  skipFirst?: boolean;
  children: ReactNode;
};

export default function ScreenTransition({ screen, skipFirst, children }: Props) {
  const prevScreen = useRef<Screen | null>(null);
  const [wipeKey, setWipeKey] = useState(0);
  const [showWipe, setShowWipe] = useState(false);

  useEffect(() => {
    if (prevScreen.current === screen) return;
    const isFirst = prevScreen.current === null;
    prevScreen.current = screen;
    if (isFirst && skipFirst) return;

    setWipeKey((k) => k + 1);
    setShowWipe(true);
    const t = setTimeout(() => setShowWipe(false), 320);
    return () => clearTimeout(t);
  }, [screen, skipFirst]);

  return (
    <>
      {children}
      {showWipe && <div key={wipeKey} className="screen-wipe-overlay" aria-hidden />}
    </>
  );
}
