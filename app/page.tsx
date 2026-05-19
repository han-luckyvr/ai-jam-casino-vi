"use client";

import { useState } from "react";
import { useGameState } from "@/lib/gameState";
import JackpotTicker from "@/components/JackpotTicker";
import CountOverlay from "@/components/CountOverlay";
import OrganMusic from "@/components/OrganMusic";
import ScreenTransition from "@/components/ScreenTransition";
import Splash from "@/components/Splash";
import R1BetPlacement from "@/components/R1BetPlacement";
import R1PitchVideo from "@/components/R1PitchVideo";
import R1Resolve from "@/components/R1Resolve";
import R2SwingSelect from "@/components/R2SwingSelect";
import R2Resolve from "@/components/R2Resolve";

export default function Home() {
  const [state, dispatch] = useGameState();
  const [jackpotPulse, setJackpotPulse] = useState(false);

  let screen: React.ReactNode = null;
  switch (state.screen) {
    case "SPLASH":
      screen = <Splash onTap={() => dispatch({ type: "PLAY_AGAIN" })} />;
      break;
    case "R1_BET":
      screen = <R1BetPlacement state={state} dispatch={dispatch} />;
      break;
    case "R1_PITCH":
      screen = <R1PitchVideo state={state} dispatch={dispatch} />;
      break;
    case "R1_RESOLVE":
      screen = <R1Resolve state={state} dispatch={dispatch} />;
      break;
    case "R2_SWING":
      screen = (
        <R2SwingSelect
          state={state}
          dispatch={dispatch}
          onJackpotPulse={setJackpotPulse}
        />
      );
      break;
    case "R2_RESOLVE":
      screen = <R2Resolve state={state} dispatch={dispatch} />;
      break;
  }

  return (
    <>
      {state.screen !== "SPLASH" && (
        <>
          <JackpotTicker pulse={jackpotPulse && state.screen === "R2_SWING"} />
          <CountOverlay />
        </>
      )}
      <OrganMusic screen={state.screen} />
      <ScreenTransition screen={state.screen} skipFirst>
        {screen}
      </ScreenTransition>
    </>
  );
}
