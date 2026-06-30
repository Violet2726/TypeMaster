# TypeRift v7 Module

`TypeRift: Echo Siege` is the v7 game surface. This document is the maintenance source for the game module, storage contract, and integration boundaries.

## Product Positioning

TypeRift is a Roguelite typing survival mode:

- The player types enemy word tags to lock targets and release attacks.
- Correct input builds score, combo, energy, experience, and upgrade momentum.
- Mistakes add heat pressure and can weaken survival resources.
- Run results feed Focus Lab, Missions, Insights, Achievements, and Codex through v7 game sessions.

The legacy game model is intentionally not compatible. No old game history is migrated into v7.

## Modes

- `Expedition`: the standard survival run across five areas, with bosses and extraction decisions.
- `Daily Anomaly`: fixed daily seed and mutation profile for comparable runs.
- `First Descent`: shorter onboarding run that creates the first TypeRift sample.

## Areas

1. `neon-archive`
2. `glass-mire`
3. `signal-foundry`
4. `paper-moon`
5. `black-terminal`

Each area has its own background, palette, enemy pressure, boss, and scoring context.

## Build Pillars

- `Weapon`: direct clearing tools such as pulse, blade, orbit, and ray patterns.
- `Relic`: run modifiers for survivability, scoring, extraction, heat, and risk.
- `Glyph`: training-linked modifiers that increase pressure or rewards around weak characters, numbers, punctuation, and boss behavior.

Upgrade choice generation lives in `packages/domain/src/game-vnext/upgrades.js` and should remain deterministic under the run seed.

## Domain Boundary

The pure domain module lives in `packages/domain/src/game-vnext/`.

Public exports:

- `createGameState`
- `dispatchGameCommand`
- `updateGameState`
- `buildGameSnapshot`
- `buildGameResult`
- `GAME_MODES`

Internal files:

- `state.js`: initial state and mode setup.
- `commands.js`: start, pause, resume, retry, extract, type input, and upgrade commands.
- `tick.js`: frame update orchestration.
- `spawning.js`: enemy, elite, and boss generation.
- `combat.js`: targeting, input matching, damage, leak, and event logic.
- `upgrades.js`: upgrade pool, rarity, stack behavior, and build mutations.
- `content.js`: modes, areas, enemy definitions, bosses, upgrades, strings, and word pools.
- `scoring.js`: score, WPM, accuracy, weak characters, codex progress, extraction checks, and result calculation.
- `snapshot.js`: UI-safe domain snapshots.
- `rng.js`: deterministic random helpers.

Keep domain files small and focused. A file approaching 300-450 lines should be split before new behavior is added.

## Web Runtime Boundary

The Web game layer lives in `apps/web/src/features/game-vnext/`.

- `runtime/game-engine.ts`: browser-facing engine wrapper around the pure domain.
- `runtime/asset-loader.ts`: manifest loading and image decode.
- `runtime/canvas-renderer.ts`: bitmap background/enemy drawing, arena grid, particles, and fallback text.
- `runtime/particles.ts`: hit, defeat, error, shield, and upgrade particles.
- `runtime/camera.ts`: responsive arena mapping.
- `components/HudOverlay.tsx`: always-visible run status.
- `components/ModeSelectOverlay.tsx`: mode entry and codex/best-score summary.
- `components/UpgradeOverlay.tsx`: numeric and click upgrade choice.
- `components/PauseOverlay.tsx`: resume, retry, extract, exit.
- `components/RunResultOverlay.tsx`: score, depth, accuracy, build, and next actions.
- `components/CodexOverlay.tsx`: progress summary.

`apps/web/src/screens/GamePage.tsx` should stay an orchestration layer only: initialize runtime, wire input/lifecycle, save results, and render overlays.

## Assets

Runtime assets are declared in `apps/web/public/game/typerift/manifest.json`.

Required directories:

- `backgrounds/`: 5 WebP area backgrounds.
- `enemies/`: 12 WebP enemy sprites.
- `bosses/`: 5 WebP boss sprites.
- `relics/`: 24 WebP relic/glyph/weapon icons.

Visual direction:

- glowing glass
- paper-cut silhouettes
- terminal runes
- cold black, cyan-green, amber, magenta, and white highlights

Canvas may provide particles and HUD assistance, but core backgrounds, enemies, bosses, and relics should stay bitmap-driven.

## Session Contract

TypeRift writes unified sessions:

```ts
{
  kind: 'game',
  intent: 'expedition' | 'daily-anomaly' | 'first-descent',
  trainingMeta: {
    type: 'game',
    surface: 'game',
    intent: string
  },
  gameMeta: {
    version: 'typerift-v1'
  }
}
```

Do not write `raid` as a session kind, training type, storage source, or analytics surface.

## Storage Contract

- Active keys use `typemaster:v7:*`.
- v6 keys and `typing-raid-*` keys are obsolete cleanup targets.
- Startup cleanup removes obsolete keys without migration.
- Import/export uses `TrainingDataBundleSchema.version === 7`.

## Route Contract

`/raid` remains the browser entry path for compatibility with existing navigation and external bookmarks. The route id may remain `raid`, but user-facing names, aria labels, tests, sessions, analytics, and documentation should call the module `TypeRift` or `game`.

## Testing Expectations

Domain tests should cover:

- deterministic seeded generation
- spawning cadence and boss transitions
- target lock and typed-character progress
- error heat/penalty behavior
- defeat, leak, extraction, and victory results
- upgrade uniqueness, rarity, and stack effects
- snapshot and result structure

Web tests should cover:

- mode select starts `First Descent`, `Daily Anomaly`, and `Expedition`
- HUD shows lives, combo, target, area, score, WPM, and upgrade progress
- upgrade overlay supports number keys and click selection
- result overlay writes v7 game sessions only
- legacy game sessions are not read by Home, Insights, Achievements, or Codex

E2E and visual checks should cover:

- `/raid` first screen shows TypeRift mode select
- a run produces a non-empty Canvas
- backgrounds and enemies load from bitmap assets
- fallback text appears when assets fail
- desktop and mobile layouts avoid text overlap

## Cleanup Rules

- Keep TypeRift domain logic under `packages/domain/src/game-vnext/`.
- Do not reintroduce deleted engine files under `apps/web/src/engine/`.
- Do not add new logic to deleted overlay components under `apps/web/src/components/overlay`.
- Do not migrate legacy game history into v7.
- Do not add new `raid*` data fields except for the retained route id/path compatibility layer.
