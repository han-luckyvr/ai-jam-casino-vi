import type { Bet } from "./gameState";

export const LINES: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const ZONE_PAYOUT = 9;
export const LINE_PAYOUT = 3;

export function sumStaked(bets: ReadonlyArray<Bet>): number {
  return bets.reduce((sum, b) => sum + b.amount, 0);
}

export function resolveR1Payout(
  bets: ReadonlyArray<Bet>,
  winningCell: number | null,
): number {
  if (winningCell === null) return 0;
  let payout = 0;
  for (const bet of bets) {
    if (bet.kind === "zone" && bet.cell === winningCell) {
      payout += bet.amount * ZONE_PAYOUT;
    } else if (bet.kind === "line" && LINES[bet.line]?.includes(winningCell)) {
      payout += bet.amount * LINE_PAYOUT;
    }
  }
  return payout;
}
