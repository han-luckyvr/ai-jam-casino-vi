import type { PitchOutcome, R2Outcome, R2OutcomeKind, SwingOption } from "./gameState";

export function rollWeighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) {
    throw new Error("rollWeighted: total weight must be > 0");
  }
  let r = Math.random() * total;
  for (const [value, weight] of entries) {
    r -= weight;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

const OUT_OF_ZONE_PROB = 0.05;

export function rollPitch(): PitchOutcome {
  if (Math.random() < OUT_OF_ZONE_PROB) {
    const edge = Math.random() < 0.5;
    const along = Math.random();
    const xPct = edge ? (Math.random() < 0.5 ? -10 + Math.random() * 10 : 100 + Math.random() * 10) : 10 + along * 80;
    const yPct = edge ? 10 + along * 80 : Math.random() < 0.5 ? -10 + Math.random() * 10 : 100 + Math.random() * 10;
    return { inZone: false, xPct, yPct };
  }
  const cell = Math.floor(Math.random() * 9);
  return { inZone: true, cell };
}

type SwingTable = ReadonlyArray<readonly [R2OutcomeKind, number, number]>;

const OPT_1: SwingTable = [
  ["single", 0.76, 1.25],
  ["out", 0.24, 0],
];

const OPT_2: SwingTable = [
  ["double", 0.4, 2.0],
  ["single", 0.15, 1.0],
  ["out", 0.45, 0],
];

const OPT_3: SwingTable = [
  ["hr", 0.005, 0],
  ["triple", 0.1, 3.0],
  ["double", 0.08, 2.0],
  ["out", 0.815, 0],
];

const SWING_TABLES: Record<SwingOption, SwingTable> = {
  1: OPT_1,
  2: OPT_2,
  3: OPT_3,
};

export function rollSwing(option: SwingOption): R2Outcome {
  const table = SWING_TABLES[option];
  const entry = rollWeighted(table.map((row) => [row, row[1]] as const));
  const [kind, , multiplier] = entry;
  return { kind, multiplier };
}
