"use client";

import { useGameState } from "@/lib/gameState";
import { rollPitch, rollSwing } from "@/lib/probabilities";
import type { SwingOption } from "@/lib/gameState";
import JackpotTicker from "@/components/JackpotTicker";
import Splash from "@/components/Splash";

const screenSummary: Record<string, string> = {
  SPLASH: "Tap to play.",
  R1_BET: "Place chips on zones and lines, then throw the pitch.",
  R1_PITCH: "Pitch cinematic playing (VID-01).",
  R1_RESOLVE: "Pitch landed. Continue (contact) or play again (strikeout).",
  R2_SWING: "Pick one of three swings.",
  R2_RESOLVE: "Swing resolved. Play another hand.",
};

const sectionStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
  padding: "40px",
  textAlign: "center",
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--cyan)",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  fontSize: "11px",
  margin: 0,
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-montserrat), sans-serif",
  fontWeight: 800,
  fontSize: "36px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--cream)",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  color: "var(--muted)",
  margin: 0,
  maxWidth: "480px",
};

const buttonStyle: React.CSSProperties = {
  background: "var(--cream)",
  color: "var(--bg)",
  border: "none",
  padding: "14px 28px",
  borderRadius: "999px",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontSize: "11px",
  cursor: "pointer",
};

const ghostButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "var(--cyan)",
  border: "1px solid var(--rule-strong)",
};

function rngSanityCheck() {
  const N = 10_000;
  const cells = new Array<number>(9).fill(0);
  let outOfZone = 0;
  for (let i = 0; i < N; i++) {
    const p = rollPitch();
    if (!p.inZone) outOfZone++;
    else cells[p.cell]++;
  }
  console.log("rollPitch sanity:", {
    samples: N,
    outOfZonePct: ((outOfZone / N) * 100).toFixed(2),
    cellCounts: cells,
    cellAvg: (cells.reduce((s, n) => s + n, 0) / 9).toFixed(0),
  });
  for (const option of [1, 2, 3] as const) {
    const kinds: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      const r = rollSwing(option);
      kinds[r.kind] = (kinds[r.kind] ?? 0) + 1;
    }
    console.log(`rollSwing opt ${option}:`, kinds);
  }
}

function renderScreen(
  state: ReturnType<typeof useGameState>[0],
  dispatch: ReturnType<typeof useGameState>[1],
) {
  switch (state.screen) {
    case "SPLASH":
      return <Splash onTap={() => dispatch({ type: "PLAY_AGAIN" })} />;

    case "R1_BET":
      return (
        <main style={sectionStyle}>
          <p style={eyebrowStyle}>Round 1 · Bet placement · W2</p>
          <h1 style={titleStyle}>Place your bets</h1>
          <p style={subtitleStyle}>{screenSummary.R1_BET}</p>
          <button
            style={buttonStyle}
            onClick={() => dispatch({ type: "COMMIT_PITCH", pitchOutcome: rollPitch() })}
          >
            Throw pitch ▸
          </button>
          <button style={ghostButtonStyle} onClick={rngSanityCheck}>
            RNG sanity check (console)
          </button>
        </main>
      );

    case "R1_PITCH":
      return (
        <main style={sectionStyle}>
          <p style={eyebrowStyle}>Round 1 · Pitch · W3</p>
          <h1 style={titleStyle}>Pitch cinematic</h1>
          <p style={subtitleStyle}>{screenSummary.R1_PITCH}</p>
          <button style={buttonStyle} onClick={() => dispatch({ type: "RESOLVE_PITCH" })}>
            Pitch lands ▸
          </button>
        </main>
      );

    case "R1_RESOLVE": {
      const contact = state.pitchOutcome?.inZone === true;
      const cellLabel =
        state.pitchOutcome && state.pitchOutcome.inZone ? state.pitchOutcome.cell : "?";
      return (
        <main style={sectionStyle}>
          <p style={eyebrowStyle}>Round 1 · Resolve · {contact ? "W4a" : "W4b"}</p>
          <h1 style={{ ...titleStyle, color: contact ? "var(--yellow)" : "var(--magenta)" }}>
            {contact ? `Contact! cell ${cellLabel}` : "Strikeout"}
          </h1>
          <p style={subtitleStyle}>{screenSummary.R1_RESOLVE}</p>
          <button style={buttonStyle} onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
            {contact ? "Continue ▸" : "Play again ▸"}
          </button>
        </main>
      );
    }

    case "R2_SWING": {
      const choose = (option: SwingOption) => dispatch({ type: "CHOOSE_SWING", option });
      const swing = () => {
        if (state.swingChoice === null) return;
        const r2Outcome = rollSwing(state.swingChoice);
        dispatch({ type: "RESOLVE_SWING", r2Outcome, winnings: 0 });
      };
      return (
        <main style={sectionStyle}>
          <p style={eyebrowStyle}>Round 2 · Swing select · W5</p>
          <h1 style={titleStyle}>Pick your swing</h1>
          <p style={subtitleStyle}>{screenSummary.R2_SWING}</p>
          <div style={{ display: "flex", gap: "12px" }}>
            {([1, 2, 3] as const).map((opt) => {
              const selected = state.swingChoice === opt;
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  style={{
                    ...ghostButtonStyle,
                    borderColor: selected ? "var(--cyan)" : "var(--rule-strong)",
                    color: selected ? "var(--cyan)" : "var(--muted)",
                    background: selected ? "rgba(42,234,255,0.08)" : "transparent",
                  }}
                >
                  Option {opt}
                </button>
              );
            })}
          </div>
          <button style={buttonStyle} onClick={swing} disabled={state.swingChoice === null}>
            Swing ▸
          </button>
        </main>
      );
    }

    case "R2_RESOLVE":
      return (
        <main style={sectionStyle}>
          <p style={eyebrowStyle}>Round 2 · Resolve · W6</p>
          <h1
            style={{
              ...titleStyle,
              color: state.r2Outcome?.kind === "out" ? "var(--magenta)" : "var(--yellow)",
            }}
          >
            {state.r2Outcome?.kind?.toUpperCase() ?? "—"}
          </h1>
          <p style={subtitleStyle}>{screenSummary.R2_RESOLVE}</p>
          <button style={buttonStyle} onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
            Play again ▸
          </button>
        </main>
      );

    default:
      return null;
  }
}

export default function Home() {
  const [state, dispatch] = useGameState();
  return (
    <>
      <JackpotTicker />
      {renderScreen(state, dispatch)}
    </>
  );
}
