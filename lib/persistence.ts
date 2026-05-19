"use client";

import { useEffect, useRef, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  seed: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(seed);
  const hydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore parse / storage failures, keep seed
    }
    hydrated.current = true;
  }, [key]);

  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota / private mode — silently ignore
    }
  }, [key, value]);

  return [value, setValue];
}

export const useBalance = () => useLocalStorageState<number>("sz.balance", 1000);
export const useJackpot = () => useLocalStorageState<number>("sz.jackpot", 1000);
