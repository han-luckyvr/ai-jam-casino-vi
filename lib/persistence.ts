"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Bet } from "./gameState";

// Cross-component sync: every useLocalStorageState hook for a given key
// subscribes to a module-level pub/sub. Any setter call fans the new value
// out to every other live hook with the same key, so a write in one screen
// is reflected in another screen's HUD without restructuring state.
const subscribers = new Map<string, Set<(v: unknown) => void>>();

function subscribe(key: string, cb: (v: unknown) => void): () => void {
  let set = subscribers.get(key);
  if (!set) {
    set = new Set();
    subscribers.set(key, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
  };
}

function notify(key: string, value: unknown): void {
  const set = subscribers.get(key);
  if (!set) return;
  for (const cb of set) cb(value);
}

// Writes happen synchronously in the setter (via a ref, not via a setValue
// updater). A setValue updater can be discarded if the component unmounts
// before commit — which would also discard the localStorage write.
export function useLocalStorageState<T>(
  key: string,
  seed: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(seed);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        valueRef.current = parsed;
        setValue(parsed);
      }
    } catch {
      // ignore parse / storage failures, keep seed
    }
    return subscribe(key, (v) => {
      valueRef.current = v as T;
      setValue(v as T);
    });
  }, [key]);

  const setPersisted = useCallback(
    (next: T | ((prev: T) => T)) => {
      const newValue =
        typeof next === "function"
          ? (next as (p: T) => T)(valueRef.current)
          : next;
      valueRef.current = newValue;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch {
          // quota / private mode — silently ignore
        }
      }
      setValue(newValue);
      notify(key, newValue);
    },
    [key],
  );

  return [value, setPersisted];
}

export const useBalance = () => useLocalStorageState<number>("sz.balance", 1000);
export const useJackpot = () => useLocalStorageState<number>("sz.jackpot", 2000);
export const useMuted = () => useLocalStorageState<boolean>("sz.muted", false);
export const useLastBets = () => useLocalStorageState<Bet[]>("sz.lastBets", []);
