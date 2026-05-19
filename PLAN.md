# Strike Zone: Ducks at Bat — Implementation Plan

## Context

[product-doc.html](product-doc.html) specs a two-round casino original for Vegas Infinite: bet a 3×3 strike zone, watch a pitch cinematic, then (on contact) pick one of three swings for the payout. A progressive jackpot pool persists across browser sessions and can be won outright on a Grand‑Slam HR.

Repo state today: just the product doc, reference inputs (`blubo.jpg`, `rubber duck.jpg`, `vi.jpg`, `luckylogic.jpg`), the six generated visual assets ([IMG-01.jpg](IMG-01.jpg) … [IMG-06.png](IMG-06.png)), and the pitch cinematic ([VID-01.mp4](VID-01.mp4)). No code, no `package.json`. Audio (AUD-01…07) has not been generated.

Decisions locked with the user:
- **Stack:** Next.js 15 + React (App Router, TypeScript). Vercel‑native, familiar component model.
- **Audio:** skipped entirely until the final milestone — no stubs, no mute toggle, no event hooks until M8.
- **Jackpot persistence:** `localStorage` only. No backend, no shared pool.

Goal: ship a working game on Vercel in 8 milestones, with the audio milestone last so audio generation never blocks gameplay work.

## Recommended approach

A single‑page Next.js App Router app rendering one of six screens off a `useReducer` state machine. Plain CSS modules + CSS custom properties for theming — no Tailwind, no CSS‑in‑JS. All probabilities, payouts, and pool math live in pure `lib/` modules so they are unit‑testable independent of the UI.

The game state machine has six screens — `SPLASH → R1_BET → R1_PITCH → R1_RESOLVE → R2_SWING → R2_RESOLVE → R1_BET` (loop) — with an early exit from `R1_RESOLVE` straight back to `SPLASH` on strikeout. Per the §03 flow diagram, R2 has **no swing video** in MVP: `R2_SWING` resolves directly to `R2_RESOLVE`.

Money math is computed once, at commit time:
- **R1 pitch commit:** snapshot total staked, subtract from balance, divert 1% to the jackpot pool, roll the outcome.
- **R2 swing commit:** R2 stake = sum of R1 stakes from this hand (per §05). Roll outcome on the selected option.

All RNG goes through one seeded helper (`rollWeighted`) in `lib/probabilities.ts` so the probability tables in §04/§05 are the single source of truth.

## Milestones

### M1 · Scaffold + brand tokens
- `npx create-next-app@latest` — App Router, TypeScript, no Tailwind, no ESLint flag changes.
- Move existing assets into `public/assets/` (IMG-01…06, VID-01) so Next can serve them.
- Load **Capitana** via `next/font/local` if a license file is available, otherwise `next/font/google` Montserrat as the fallback specified in the product doc CSS (see [product-doc.html:29](product-doc.html#L29)).
- Author `app/globals.css` with the 10 brand swatches as CSS variables (`--magenta`, `--cyan`, `--cream`, etc. — values lifted directly from [product-doc.html:8-24](product-doc.html#L8)).
- Verify `npm run dev` renders an empty page in the brand palette. No game logic yet.

### M2 · State machine + screen router
- `lib/gameState.ts`: `useReducer` with `Screen`, `Bet[]`, `activeChip`, `pitchOutcome`, `swingChoice`, `r2Outcome`, `lastHandWinnings`. Actions: `PLACE_BET`, `CLEAR_BETS`, `SET_ACTIVE_CHIP`, `COMMIT_PITCH`, `RESOLVE_PITCH`, `CHOOSE_SWING`, `RESOLVE_SWING`, `PLAY_AGAIN`.
- `lib/probabilities.ts`: `rollPitch()` returns `{ inZone: bool, cell?: 0..8 }` with 5% out‑of‑zone, 95% uniform across 9 cells. `rollSwing(option)` returns the matching §05 outcome for options 1/2/3.
- `lib/bets.ts`: bet types (`zone` | `line`), the 8 line definitions (3 rows, 3 cols, 2 diagonals), payout resolver: zone pays 9× iff `cell` matches, line pays 3× iff any of its 3 cells matches.
- `app/page.tsx`: one `<GameShell>` that switch‑renders six stub screen components, each with a "go to next" button. End‑to‑end click‑through works with placeholder content.

### M3 · Splash + persistent balance/jackpot
- `lib/persistence.ts`: `useLocalStorageState<T>(key, seed)` hook with safe SSR fallback (skip hydration mismatch by guarding `typeof window`).
- `useBalance` (seed $1,000) and `useJackpot` (seed $1,000) built on it.
- `components/Splash.tsx` (W1): IMG-06 logo, "TAP TO PLAY" pill, balance bottom‑left, settings stub bottom‑right.
- `components/JackpotTicker.tsx` (IMG-10): rendered as a sticky top bar visible on every screen except the splash backdrop (per all six wireframes).

### M4 · Round 1 bet placement (W2)
- `components/R1BetPlacement.tsx` with IMG-03 as the `<img>` backdrop (object-fit: cover; centre kept clear).
- `components/StrikeZoneGrid.tsx` (IMG-07): CSS Grid 3×3, neon cyan tubular borders, inset box‑shadow glow, scanline `repeating-linear-gradient` at 3%, SVG corner endpoint marker. Cells track hover + placed states; selected = 8% magenta fill.
- 8 line markers as small dots positioned outside the grid edge (3 left/right for rows, 3 top/bottom for cols, 2 corners for diagonals).
- `components/ChipRack.tsx` (IMG-08): four SVG chips ($1 cream, $5 cyan, $25 magenta, $100 yellow), active state = cyan ring + `transform: scale(1.08)`.
- Placed chips render as a small stack overlaying the bet location with the $ amount.
- Chip‑switch reprice: walk current bets, compute new total, block the switch if new total > balance and surface tooltip. Same check on every `PLACE_BET`.
- "Throw Pitch" CTA disabled when `staked === 0` or `staked > balance`; shows live total.
- "Clear" button wipes all bets.

### M5 · Round 1 pitch + resolve (W3, W4)
- On `COMMIT_PITCH`: subtract staked from balance, add 1% to jackpot pool, call `rollPitch()`, advance screen to `R1_PITCH`.
- `components/R1PitchVideo.tsx` (W3): full‑bleed `<video autoplay playsInline muted>` of VID-01. HUD hidden (only the jackpot ticker stays). `onEnded` advances to `R1_RESOLVE` (~2.5s).
- `components/R1Resolve.tsx` (W4): branches on `pitchOutcome.inZone`.
  - **Contact (W4a):** IMG-05 backdrop, grid overlay, ball glow on winning cell, calculate R1 winnings (sum of matching zone + line payouts), "CONTACT! +$X" toast, "Continue ▸" → `R2_SWING`.
  - **Strikeout (W4b):** IMG-04 backdrop, ball lit outside grid at a deterministic out‑of‑zone position, "STRIKEOUT" stamp, "Play Again ▸" → `SPLASH`.
- Credit R1 winnings to balance on entry to `R1_RESOLVE` (contact only).

### M6 · Round 2 swing select + outcome (W5, W6)
- `components/R2SwingSelect.tsx` (W5): three neon hex polygons (cyan/magenta/purple borders) showing live odds + the literal $ payout computed from the player's R2 stake (sum of R1 stakes). Option 3 card shows the live jackpot pool value, not a multiplier.
- On Option‑3 selection: jackpot ticker pulses cyan/magenta via a CSS animation.
- "Swing ▸" CTA: disabled until a card is selected. On click → `rollSwing(option)` and advance to `R2_RESOLVE`.
- `components/R2Resolve.tsx` (W6): IMG-05 backdrop for all five outcomes; outcome conveyed by overlay stamp (IMG-09 — `components/OutcomeStamp.tsx`) + confetti burst on wins.
- On HR: credit full pool, reset pool to $1,000 seed, then credit. Pool snapshot happens before the reset so the displayed "+$1,247" matches what was credited.
- `components/Confetti.tsx`: `canvas-confetti` library (~3KB), magenta/cyan/yellow particles, fired on contact/single/double/triple/HR (intensity scales with outcome rank).
- "Play Again ▸" → `R1_BET` (bets cleared, balance + pool carry, no return to splash).

### M7 · Polish, in‑build assets, responsive, deploy
- Refine IMG-08 chip SVGs (rope edge, VI infinity glyph centred, inner bevel via radial gradient).
- Refine IMG-09 outcome stamps (Capitana ExtraBold, 5° forward lean via `transform: skew(-5deg)`, SVG baseball‑stitch underline, gradient text‑clip for `HOME RUN!`).
- IMG-10 ticker polish: tabular numerals (`font-variant-numeric: tabular-nums`), neon hex pattern SVG background at 8% opacity, gentle cyan text‑shadow pulse keyframe.
- Linear neon streak transition wipes between screens (CSS keyframe + linear‑gradient overlay).
- Responsive layouts: portrait‑first (mobile breakpoint ≤ 760px) and landscape (desktop). Verify each wireframe at both orientations.
- `vercel deploy` (or git‑connect to a Vercel project) — preview URL on every push.
- Final pre‑M8 prod deploy.

### M8 · Audio (FINAL)
- Generate AUD-01…07 per the §10 prompts via fal.ai. Tools: `fal-ai/stable-audio` for AUD-01 (60s ambient bed, generated as 47s and crossfade-looped), AUD-05 (jackpot stinger), AUD-06 (strikeout sting); `fal-ai/elevenlabs/sound-effects` for AUD-02 (whoosh), AUD-03 (3 bat cracks), AUD-04 (chip click), AUD-07 (3 crowd reactions).
- Drop files into `public/assets/audio/`.
- `lib/audio.ts`: `useSfx(name)` returns a `play()` callback; `useMusicLoop(name)` manages a single looping `HTMLAudioElement` with gain ramp on mount/unmount.
- Wire trigger points:
  - AUD-01 ambient: loop from splash onward.
  - AUD-02 whoosh: VID-01 onPlay at ~1.0s offset (matches the §10 timing of "ball flying past").
  - AUD-03 bat crack: R2 outcome — soft (single) / solid (double/triple) / booming (HR).
  - AUD-04 chip click: every `PLACE_BET` / chip switch.
  - AUD-05 jackpot stinger: HR resolution.
  - AUD-06 strikeout sting: R1 strikeout resolve.
  - AUD-07 crowd: anticipatory gasp at swing commit; eruption (HR/triple) or groan (out) at R2 resolve.
- Add mute toggle in the settings stub, persisted to localStorage.
- Final prod deploy.

## Critical files (to be created)

| Path | Purpose |
|---|---|
| `package.json`, `next.config.mjs`, `tsconfig.json` | Next.js scaffold (M1) |
| `app/layout.tsx`, `app/globals.css` | Root layout, fonts, brand tokens (M1) |
| `app/page.tsx` | Single‑page game shell, screen router (M2) |
| `lib/gameState.ts` | `useReducer`, types, actions (M2) |
| `lib/probabilities.ts` | `rollPitch`, `rollSwing` — single source of RNG (M2) |
| `lib/bets.ts` | Bet types, 8 line defs, payout resolver (M2) |
| `lib/persistence.ts` | `useLocalStorageState` + `useBalance`, `useJackpot` (M3) |
| `components/Splash.tsx` | W1 (M3) |
| `components/JackpotTicker.tsx` | IMG-10 ticker (M3, polished M7) |
| `components/R1BetPlacement.tsx` | W2 (M4) |
| `components/StrikeZoneGrid.tsx` | IMG-07 grid (M4) |
| `components/ChipRack.tsx` | IMG-08 chips (M4, polished M7) |
| `components/R1PitchVideo.tsx` | W3 (M5) |
| `components/R1Resolve.tsx` | W4a + W4b (M5) |
| `components/R2SwingSelect.tsx` | W5 (M6) |
| `components/R2Resolve.tsx` | W6 (M6) |
| `components/OutcomeStamp.tsx` | IMG-09 stamps (M6, polished M7) |
| `components/Confetti.tsx` | Win celebration (M6) |
| `public/assets/IMG-0[1-6].{jpg,png}` | Copied from repo root (M1) |
| `public/assets/VID-01.mp4` | Copied from repo root (M1) |
| `lib/audio.ts`, `public/assets/audio/AUD-0[1-7].*` | Audio layer (M8) |

## Verification

**Per‑milestone:**
- M1: `npm run dev` serves a coloured blank page; `next build` succeeds.
- M2: click‑through all six stub screens with the browser console clean.
- M3: refresh the page, balance + jackpot survive; both seed at $1,000 on first load.
- M4: place zone + line bets at multiple chips; switch chip up and down; verify reprice; verify CTA disabled states.
- M5: throw pitches in a loop and confirm both outcomes fire; verify R1 payout math for zone, line, and zone+line on the winning cell.
- M6: walk all three swing options through all outcomes; verify Option 3 HR credits + resets the pool; verify R2 stake = sum of R1 stakes.
- M7: test at iPhone SE (375px) and 1440p desktop; verify all six wireframes are recognisable.
- M8: every audio trigger fires once and only once per event; mute toggle persists.

**End‑to‑end:**
- Manual playthrough of the four canonical scenarios from §05 compound‑payout examples ([product-doc.html:557-563](product-doc.html#L557)):
  1. $5 zone on winning cell → Opt 3 HR → expect R1 $45 + full pool credit.
  2. $5 line on winning line → Opt 2 Double → expect R1 $45 + R2 $30 = $75.
  3. $5 zone, ball in zone but different cell → Opt 1 Single → expect R1 $0 + R2 $6.
  4. Strikeout → expect $0, no R2 screen.

**RTP sanity:** add a dev‑only debug button that runs 10,000 simulated R1 pitches (zone bet, line bet) and 10,000 simulated R2 rolls per option; print average return. Targets: zone 0.95 ± 0.01, line 0.95 ± 0.01, Opt 1 0.95 ± 0.01, Opt 2 0.95 ± 0.01, Opt 3 (excluding HR) 0.46 ± 0.02. Remove the button before the M7 prod deploy.

**Cross‑browser:** Chrome desktop, Safari iOS 17+, Chrome Android. Video autoplay requires `muted playsInline` — already accounted for in M5.

**Deploy:** Vercel preview on every M3+ push; production deploy at M7 (pre‑audio) and again at M8 (final).
