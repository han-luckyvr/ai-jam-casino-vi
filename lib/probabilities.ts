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

export function rollPitch(): PitchOutcome {
  const cell = Math.floor(Math.random() * 9);
  return { cell };
}

type SwingTable = ReadonlyArray<readonly [R2OutcomeKind, number, number]>;

const OPT_1: SwingTable = [
  ["single", 0.95, 1.0],
  ["out", 0.05, 0],
];

const OPT_2: SwingTable = [
  ["double", 0.28, 2.0],
  ["single", 0.39, 1.0],
  ["out", 0.33, 0],
];

// Option 3: HR probability is dynamic (scales with stake/jackpot so HR's average
// RTP contribution is fixed at HR_RTP_TARGET). Other outcomes are static.
const OPT_3_TRIPLE_PROB = 0.13;
const OPT_3_DOUBLE_PROB = 0.11;
const OPT_3_SINGLE_PROB = 0.24;
const OPT_3_NON_HR_FIXED =
  OPT_3_TRIPLE_PROB + OPT_3_DOUBLE_PROB + OPT_3_SINGLE_PROB;

const HR_RTP_TARGET = 0.10;
const HR_PROB_MAX = 0.01;

export type Option3Probs = {
  hr: number;
  triple: number;
  double: number;
  single: number;
  out: number;
};

export function computeR2Option3Probs(
  stake: number,
  jackpot: number,
): Option3Probs {
  const ideal = jackpot > 0 ? (HR_RTP_TARGET * stake) / jackpot : 0;
  const hr = Math.max(0, Math.min(HR_PROB_MAX, ideal));
  const out = Math.max(0, 1 - OPT_3_NON_HR_FIXED - hr);
  return {
    hr,
    triple: OPT_3_TRIPLE_PROB,
    double: OPT_3_DOUBLE_PROB,
    single: OPT_3_SINGLE_PROB,
    out,
  };
}

function option3Table(stake: number, jackpot: number): SwingTable {
  const p = computeR2Option3Probs(stake, jackpot);
  return [
    ["hr", p.hr, 0],
    ["triple", p.triple, 3.0],
    ["double", p.double, 2.0],
    ["single", p.single, 1.0],
    ["out", p.out, 0],
  ];
}

const STATIC_SWING_TABLES: Record<1 | 2, SwingTable> = {
  1: OPT_1,
  2: OPT_2,
};

export type SwingContext = { stake: number; jackpot: number };

export function rollSwing(option: SwingOption, ctx?: SwingContext): R2Outcome {
  const table =
    option === 3
      ? option3Table(ctx?.stake ?? 0, ctx?.jackpot ?? 1)
      : STATIC_SWING_TABLES[option];
  const entry = rollWeighted(table.map((row) => [row, row[1]] as const));
  const [kind, , multiplier] = entry;
  return { kind, multiplier };
}
