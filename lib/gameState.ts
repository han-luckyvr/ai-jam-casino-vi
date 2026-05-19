"use client";

import { useReducer } from "react";

export type Screen =
  | "SPLASH"
  | "R1_BET"
  | "R1_PITCH"
  | "R1_RESOLVE"
  | "R2_SWING"
  | "R2_RESOLVE";

export type ChipValue = 1 | 5 | 25 | 100;

export type Bet =
  | { kind: "zone"; cell: number; amount: number }
  | { kind: "line"; line: number; amount: number };

export type PitchOutcome =
  | { inZone: true; cell: number }
  | { inZone: false; xPct: number; yPct: number };

export type SwingOption = 1 | 2 | 3;

export type R2OutcomeKind = "out" | "single" | "double" | "triple" | "hr";

export type R2Outcome = {
  kind: R2OutcomeKind;
  multiplier: number;
};

export type GameState = {
  screen: Screen;
  bets: Bet[];
  activeChip: ChipValue;
  pitchOutcome: PitchOutcome | null;
  swingChoice: SwingOption | null;
  r2Outcome: R2Outcome | null;
  lastHandWinnings: number;
};

export const initialState: GameState = {
  screen: "SPLASH",
  bets: [],
  activeChip: 5,
  pitchOutcome: null,
  swingChoice: null,
  r2Outcome: null,
  lastHandWinnings: 0,
};

export type GameAction =
  | { type: "PLACE_BET"; bet: Bet }
  | { type: "CLEAR_BETS" }
  | { type: "SET_ACTIVE_CHIP"; chip: ChipValue }
  | { type: "COMMIT_PITCH"; pitchOutcome: PitchOutcome }
  | { type: "RESOLVE_PITCH" }
  | { type: "CHOOSE_SWING"; option: SwingOption }
  | { type: "RESOLVE_SWING"; r2Outcome: R2Outcome; winnings: number }
  | { type: "PLAY_AGAIN" };

function resetForNewHand(state: GameState): GameState {
  return {
    ...state,
    bets: [],
    pitchOutcome: null,
    swingChoice: null,
    r2Outcome: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_BET":
      return { ...state, bets: [...state.bets, action.bet] };

    case "CLEAR_BETS":
      return { ...state, bets: [] };

    case "SET_ACTIVE_CHIP":
      return { ...state, activeChip: action.chip };

    case "COMMIT_PITCH":
      return {
        ...state,
        screen: "R1_PITCH",
        pitchOutcome: action.pitchOutcome,
      };

    case "RESOLVE_PITCH":
      if (state.screen !== "R1_PITCH") return state;
      return { ...state, screen: "R1_RESOLVE" };

    case "CHOOSE_SWING":
      return { ...state, swingChoice: action.option };

    case "RESOLVE_SWING":
      return {
        ...state,
        screen: "R2_RESOLVE",
        r2Outcome: action.r2Outcome,
        lastHandWinnings: action.winnings,
      };

    case "PLAY_AGAIN": {
      switch (state.screen) {
        case "SPLASH":
          return { ...resetForNewHand(state), screen: "R1_BET" };
        case "R1_RESOLVE":
          if (state.pitchOutcome?.inZone) {
            return { ...state, screen: "R2_SWING" };
          }
          return { ...resetForNewHand(state), screen: "SPLASH" };
        case "R2_RESOLVE":
          return { ...resetForNewHand(state), screen: "R1_BET" };
        default:
          return state;
      }
    }

    default:
      return state;
  }
}

export function useGameState() {
  return useReducer(gameReducer, initialState);
}
