# Strike Zone: Ducks at Bat — Implementation Plan

## Context

[product-doc.html](product-doc.html) specs a two-round casino original for Vegas Infinite: bet a 3×3 strike zone, watch a pitch cinematic, then (on contact) pick one of three swings for the payout. A progressive jackpot pool persists across browser sessions and can be won outright on a Grand‑Slam HR.

Repo state today: just the product doc, reference inputs (`blubo.jpg`, `rubber duck.jpg`, `vi.jpg`, `luckylogic.jpg`), the six generated visual assets ([IMG-01.jpg](IMG-01.jpg) … [IMG-06.png](IMG-06.png)), and the pitch cinematic ([VID-01.mp4](VID-01.mp4)). No code, no `package.json`. Audio (AUD-02…07) has not been generated.

Decisions locked with the user:
- **Stack:** Next.js 15 + React (App Router, TypeScript). Vercel‑native, familiar component model.
- **Audio:** skipped entirely until the final milestone — no stubs, no mute toggle, no event hooks until M8.
- **Jackpot persistence:** `localStorage` only. No backend, no shared pool.

Goal: ship a working game on Vercel in 9 milestones, with the deploy milestone last so production ships a complete artifact (audio included) — and audio generation never blocks gameplay work.

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

### M7 · Polish, in‑build assets, responsive, dev cleanup

Today the repo is mid‑M6 with several M7 targets already partially done — OutcomeStamp ~95%, ChipRack ~70%, JackpotTicker ~40%. Steps below reflect what's actually remaining.

**7.1 ChipRack — rope edge, VI infinity glyph, inner bevel** ([components/ChipRack.tsx](components/ChipRack.tsx))
- Existing: radial gradient body + active glow halo + tabular-nums.
1. Add a dashed `<circle>` overlay at `r=0.94 × chipRadius`, `fill="none"`, `stroke="rgba(255,255,255,0.4)"`, `stroke-width="2"`, `stroke-dasharray="2 3"`. Place inside the existing chip `<svg>` above the bevel layer.
2. Add a VI‑infinity lemniscate `<path>` centred at chip centre: `M -14 0 C -14 -10, -4 -10, 0 0 C 4 10, 14 10, 14 0 C 14 -10, 4 -10, 0 0 C -4 10, -14 10, -14 0 Z` scaled by `0.35 × chipDiameter / 28`. Stroke `rgba(255,255,255,0.65)` width 1.5, no fill.
3. Deepen the inner bevel: add a second smaller `<circle>` at `r=0.65 × chipRadius` filled with a `<radialGradient>` (white 0.18 at 25% offset, transparent at 70%). Keep the existing inset shadow.
4. Verify denomination fills use exact tokens — $1 `var(--cream)` #fff4db, $5 `var(--cyan)` #2aeaff, $25 `var(--magenta)` #fb009f, $100 `var(--yellow)` #ffe054. Replace any hardcoded hex.
5. Visual diff in the dev server against [IMG-08.jpg](IMG-08.jpg); iterate to parity.

**7.2 JackpotTicker — neon hex pattern bg + text-shadow pulse** ([components/JackpotTicker.tsx](components/JackpotTicker.tsx), [app/globals.css](app/globals.css))
- Existing: tabular-nums + colour-cycle `jackpot-pulse` used for Option‑3 selection.
1. Inline a data‑URI SVG hexagon pattern as `background-image` on `.jackpot-ticker` (single hex outline, repeat via SVG `<pattern>`). Stroke `rgba(42,234,255,0.08)`, hex side ~12px, no fill. Layer above the existing `rgba(12,10,31,0.72)` translucent fill via `background: url(...), rgba(...)`.
2. Add text-shadow pulse keyframe in globals.css:
   ```css
   @keyframes ticker-glow {
     0%, 100% { text-shadow: 0 0 8px rgba(42,234,255,0.4); }
     50%      { text-shadow: 0 0 16px rgba(42,234,255,0.85); }
   }
   .jackpot-value { animation: ticker-glow 2.4s ease-in-out infinite; }
   @media (prefers-reduced-motion: reduce) {
     .jackpot-value { animation: none; }
   }
   ```
3. Keep `jackpot-pulse` colour-cycle bound only to the Option‑3 selection pulse (M6). Verify the two animations compose — split into nested elements (text-shadow on value, colour cycle on wrapper) if they fight.
4. Visual diff against [IMG-10.jpg](IMG-10.jpg).

**7.3 OutcomeStamp — verify variants, fill gaps** ([components/OutcomeStamp.tsx](components/OutcomeStamp.tsx))
- Existing: skew(-5deg), baseball‑stitch SVG curve, HR gradient‑clip + dual drop‑shadow.
1. Verify all six variants:
   - `CONTACT!` → `var(--cyan)`
   - `STRIKEOUT` → `var(--magenta)` **+ diagonal slash overlay** (add SVG `<line>` if missing)
   - `SINGLE` → `var(--cream)`
   - `DOUBLE` → `var(--cyan)`
   - `TRIPLE` → `var(--yellow)`
   - `HOME RUN!` → gradient gold→magenta via `background-clip: text` (present) + dual drop-shadow (present)
2. Confirm `font-family: 'Capitana', 'Montserrat', sans-serif; font-weight: 800;`. If Capitana isn't loaded, configure Montserrat ExtraBold (800) fallback in `app/layout.tsx`.
3. Confirm each stamp mounts with the `win-burst-in` keyframe (already in globals.css).

**7.4 Screen transition wipe** (NEW `components/ScreenTransition.tsx`, [app/page.tsx](app/page.tsx), [app/globals.css](app/globals.css))
- Existing: direct `switch(state.screen)` swap — no transition.
1. Add overlay keyframe in globals.css:
   ```css
   @keyframes neon-wipe {
     0%   { transform: translateX(-110%) skewX(-12deg); opacity: 0; }
     30%  { opacity: 1; }
     100% { transform: translateX(150%) skewX(-12deg); opacity: 0; }
   }
   .screen-wipe-overlay {
     position: fixed; inset: 0; pointer-events: none; z-index: 50;
     background: linear-gradient(90deg,
       transparent 0%,
       rgba(42,234,255,0.25) 35%,
       rgba(251,0,159,0.25) 65%,
       transparent 100%);
     animation: neon-wipe 320ms ease-out forwards;
   }
   @media (prefers-reduced-motion: reduce) {
     .screen-wipe-overlay { display: none; }
   }
   ```
2. Create `components/ScreenTransition.tsx`: renders `children` plus a single overlay div mounted when the `screen` prop changes (`key={screen}`). `useEffect` mounts the overlay for exactly 320ms then unmounts.
3. Wrap the router in [app/page.tsx](app/page.tsx): `<ScreenTransition screen={state.screen}>{renderScreen()}</ScreenTransition>` — the inner `switch` stays.
4. Pass a `skipWipe` boolean to suppress the wipe on the SPLASH→R1_BET transition (the very first user-initiated transition feels heavier without it).

**7.5 Responsive layouts** ([app/globals.css](app/globals.css) primary, each screen as needed)
- Existing: intrinsic sizing via `min()` / `vw`, no layout media queries.
1. Portrait mobile `@media (max-width: 760px)`:
   - **W1 Splash:** logo `width: 60vw; max-width: 320px`. Balance bottom‑left repositions to `top: 60px; left: 16px` (above ticker).
   - **W2 R1Bet:** strike zone grid `width: min(85vw, 380px)`. Chip rack switches from horizontal row to `display: grid; grid-template-columns: repeat(2, 1fr)` (2×2 below the zone).
   - **W3 R1Pitch:** video `object-fit: cover; width: 100vw; height: 100dvh`. Ticker stays top‑centre.
   - **W4 R1Resolve:** stamp scales to `min(40vw, 180px)`. CTA full‑width with 24px margin.
   - **W5 R2Swing:** three hex cards stack `flex-direction: column; gap: 16px`. Each card `width: min(85vw, 320px)`.
   - **W6 R2Resolve:** same scaling as W4.
2. Landscape short‑viewport `@media (orientation: landscape) and (max-height: 500px)`:
   - Splash logo `max-height: 35vh`.
   - R1Bet `padding: 56px 24px 24px` (tighter vertical).
   - R2Swing hex cards return to horizontal row.
3. Verify at: iPhone SE (375×667 portrait, 667×375 landscape), iPhone 14 Pro (390×844), iPad (768×1024 portrait, 1024×768 landscape), 1440×900 desktop.
4. Use the preview MCP (`preview_resize` + `preview_screenshot`) to capture each viewport per wireframe and verify legibility.

**7.6 Dev RNG button removal** ([app/page.tsx](app/page.tsx))
1. Delete the dev RNG simulation button JSX block (currently lines ~75–99).
2. Delete the associated handler / import.
3. If the 10,000‑iteration RTP harness is still useful, move it to `lib/__dev__/rtpHarness.ts` (not imported by any production code).
4. Confirm no console output remains from M3–M6 debug paths.

**7.7 Final asset audit**
- Side‑by‑side comparison in the dev server: ChipRack ↔ [IMG-08.jpg](IMG-08.jpg), OutcomeStamp variants ↔ [IMG-09.jpg](IMG-09.jpg), JackpotTicker ↔ [IMG-10.jpg](IMG-10.jpg). Iterate tokens (opacity, glow radius, border-radius) to close visible gaps. Commit each polish pass as a discrete commit so regressions are bisectable.

### M8 · Audio (FINAL)
- Generate AUD-02…07 per the §10 prompts via fal.ai. Tools: `fal-ai/stable-audio` for AUD-05 (jackpot stinger), AUD-06 (strikeout sting); `fal-ai/elevenlabs/sound-effects` for AUD-02 (whoosh), AUD-03 (3 bat cracks), AUD-04 (chip click), AUD-07 (3 crowd reactions).
- Drop files into `public/assets/audio/`.
- `lib/audio.ts`: `useSfx(name)` returns a `play()` callback.
- Wire trigger points:
  - AUD-02 whoosh: VID-01 onPlay at ~1.0s offset (matches the §10 timing of "ball flying past").
  - AUD-03 bat crack: R2 outcome — soft (single) / solid (double/triple) / booming (HR).
  - AUD-04 chip click: every `PLACE_BET` / chip switch.
  - AUD-05 jackpot stinger: HR resolution.
  - AUD-06 strikeout sting: R1 strikeout resolve.
  - AUD-07 crowd: anticipatory gasp at swing commit; eruption (HR/triple) or groan (out) at R2 resolve.
- Add mute toggle in the settings stub, persisted to localStorage.

### M9 · Deploy (Git integration to Vercel)

Confirmed deploy method: GitHub → Vercel git integration. Auto preview URLs per branch, auto prod on `main`.

**9.1 Pre‑deploy local verification**
1. `npm run build` succeeds — no type errors, no missing assets.
2. `npm run start` serves the production build; click through the full game loop (splash → bet → pitch → resolve → R2 swing → R2 resolve → loop).
3. Confirm M8 audio files exist under `public/assets/audio/AUD-02..07` and play on the relevant triggers.
4. Confirm `public/assets/IMG-0[1-6].{jpg,png}` and `public/assets/VID-01.mp4` are committed under `public/` (not just in repo root).
5. `git status` is clean — all M7/M8 work committed.

**9.2 next.config production settings** ([next.config.ts](next.config.ts))
1. Heed [AGENTS.md](AGENTS.md) — read `node_modules/next/dist/docs/` for Next 16.2.6 deploy specifics before editing (config shape may differ from training data).
2. Static assets: no changes needed if using plain `<img>` / `<video>`. If `next/image` is in use, configure `images.remotePatterns` or set `images: { unoptimized: true }`.
3. Do **not** set `output: 'standalone'` — Vercel does not need it (that's for Docker / self‑host).
4. Leave `productionBrowserSourceMaps` at the default `false`.

**9.3 GitHub remote setup**
1. If no GitHub remote exists, create the repo at `github.com/<owner>/ai-jam`.
2. `git remote add origin git@github.com:<owner>/ai-jam.git`
3. `git push -u origin main`
4. Verify all M1–M8 commits are on `main`.

**9.4 Vercel project creation (one‑time)**
1. Sign in at vercel.com with the GitHub account that owns the repo.
2. **Add New… → Project**.
3. **Import Git Repository** → select `ai-jam`.
4. **Framework Preset:** Next.js (auto‑detected).
5. **Root Directory:** `./` (default).
6. **Build & Output Settings** (all defaults):
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`
7. **Environment Variables:** none required (no backend, all client‑side).
8. Click **Deploy**. First production deploy runs from `main`. Note the production URL (e.g., `ai-jam.vercel.app`).

**9.5 Preview URL workflow**
After 9.4, Vercel watches the repo automatically:
1. Every push to a non‑`main` branch creates a preview deployment.
2. Every pull request gets a preview URL posted as a PR comment.
3. Every push to `main` re‑deploys production.

Smoke‑test: create a throwaway branch, push a trivial change, confirm a preview URL appears in the Vercel dashboard within ~2 minutes, open it, verify the game loop works, delete the branch.

**9.6 Custom domain (optional)**
1. Vercel project → **Settings → Domains**.
2. Add domain; follow DNS instructions (CNAME or A record).
3. SSL provisions automatically within minutes.

**9.7 Production deploy + release tag**
1. Final QA pass on the latest preview URL.
2. Merge final feature branch to `main` via PR (or push directly if solo on `main`).
3. Vercel auto‑deploys `main` to the production URL within ~2 minutes.
4. Smoke‑test the production URL: splash → one full hand → confirm jackpot persists across reload.
5. Tag the release:
   ```
   git tag -a v1.0.0 -m "Strike Zone: Ducks at Bat — initial release"
   git push --tags
   ```

**9.8 Rollback plan**
1. If production breaks: Vercel dashboard → **Deployments** → find last green deployment → **Promote to Production**. Instant rollback, no git revert needed.
2. Fix forward on a branch and re‑merge.

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
| `components/ScreenTransition.tsx` | Neon wipe wrapper (M7, NEW) |
| `lib/__dev__/rtpHarness.ts` | Relocated RTP simulator (optional M7, NEW) |
| `public/assets/IMG-0[1-6].{jpg,png}` | Copied from repo root (M1) |
| `public/assets/VID-01.mp4` | Copied from repo root (M1) |
| `lib/audio.ts`, `public/assets/audio/AUD-0[2-7].*` | Audio layer (M8) |

## Verification

**Per‑milestone:**
- M1: `npm run dev` serves a coloured blank page; `next build` succeeds.
- M2: click‑through all six stub screens with the browser console clean.
- M3: refresh the page, balance + jackpot survive; both seed at $1,000 on first load.
- M4: place zone + line bets at multiple chips; switch chip up and down; verify reprice; verify CTA disabled states.
- M5: throw pitches in a loop and confirm both outcomes fire; verify R1 payout math for zone, line, and zone+line on the winning cell.
- M6: walk all three swing options through all outcomes; verify Option 3 HR credits + resets the pool; verify R2 stake = sum of R1 stakes.
- M7: visual diff each polish target against reference imagery (ChipRack vs [IMG-08.jpg](IMG-08.jpg), OutcomeStamp vs [IMG-09.jpg](IMG-09.jpg), JackpotTicker vs [IMG-10.jpg](IMG-10.jpg)); enable `prefers-reduced-motion: reduce` and verify ticker glow + neon wipe pause; capture screenshots at 375×667, 390×844, 768×1024, 1440×900 plus 667×375 and 1024×768 landscape; verify each wireframe (W1–W6) is recognisable and tap targets ≥44px; dev RNG button gone from UI; no stray `console.log` from M3–M6 paths; `npm run build` succeeds clean.
- M8: every audio trigger fires once and only once per event; mute toggle persists.
- M9: preview URL on a throwaway branch renders splash → full game loop → jackpot persists across reload; production URL on `main` does the same; Mobile Safari video autoplay works with `muted playsInline`; Lighthouse mobile Performance ≥80 / Accessibility ≥90; rollback path tested once (promote a prior deployment from the Vercel dashboard, confirm production URL serves it, promote latest back).

**End‑to‑end:**
- Manual playthrough of the four canonical scenarios from §05 compound‑payout examples ([product-doc.html:557-563](product-doc.html#L557)):
  1. $5 zone on winning cell → Opt 3 HR → expect R1 $45 + full pool credit.
  2. $5 line on winning line → Opt 2 Double → expect R1 $45 + R2 $30 = $75.
  3. $5 zone, ball in zone but different cell → Opt 1 Single → expect R1 $0 + R2 $6.
  4. Strikeout → expect $0, no R2 screen.

**RTP sanity:** add a dev‑only debug button that runs 10,000 simulated R1 pitches (zone bet, line bet) and 10,000 simulated R2 rolls per option; print average return. Targets: zone 0.95 ± 0.01, line 0.95 ± 0.01, Opt 1 0.95 ± 0.01, Opt 2 0.95 ± 0.01, Opt 3 (excluding HR) 0.46 ± 0.02. Remove the button as part of M7 (§7.6) — well before the M9 deploy.

**Cross‑browser:** Chrome desktop, Safari iOS 17+, Chrome Android. Video autoplay requires `muted playsInline` — already accounted for in M5.

**Deploy:** M9 only. Vercel git integration created once; preview URLs auto‑generate per branch/PR; `main` auto‑deploys to production. No earlier deploys — the build stays local until M8 audio lands so we ship a single complete artifact.
