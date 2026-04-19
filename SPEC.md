# SPEC.md

## Project

**Name**: DraftGap+ (Unofficial Mod)

**Description**: A modified League of Legends champion draft recommendation tool that calculates dynamic, context-aware tier lists and matchup suggestions based on real-time lobby composition. Features live LCU client integration, detailed matchup analysis, ally synergy scoring, and visual delta analysis showing exact winrate impact per champion pick.

**Stack**: TypeScript, Node.js, Solid.js, Tauri (Rust), Vite, Tailwind CSS, TanStack Table/Query

**Entry**: 
- Dev: `pnpm dev` (frontend with vite dev server)
- Desktop: `pnpm tauri` or `pnpm tauri-dev`
- Dataset service: `pnpm start` (in @draftgap/dataset)

**Tests**: `pnpm test` (vitest, frontend only)

## Structure

```
draftgap-plus/
├── apps/
│   ├── frontend/          # Solid.js + Tauri desktop UI
│   │   ├── src/           # React components, contexts, hooks
│   │   ├── src-tauri/     # Rust backend (Tauri)
│   │   ├── scripts/       # update-data.ts, publish-tauri-update.ts
│   │   └── vite.config.ts
│   └── dataset/           # TypeScript data aggregation service
│       └── src/           # Lolalytics scraping, storage layer
├── packages/
│   └── core/              # Shared business logic (@draftgap/core)
│       └── src/           # Draft analysis, rating, statistics
├── scripts/               # Root-level tooling (bump-version.ts)
├── package.json           # Root monorepo config (pnpm 9.2.0)
├── pnpm-workspace.yaml    # Workspace definition
└── turbo.json             # Build orchestration
```

## Key Decisions

1. **Monorepo (pnpm + Turbo)**: Enables shared @draftgap/core library across frontend and dataset service while maintaining independent versioning and build pipelines.
2. **Solid.js + Tauri**: Desktop-first architecture using Tauri for OS integration (LCU client access) with Solid.js for reactive UI; lighter than Electron.
3. **Dynamic Tier Calculation**: Tiers are recalculated per-lobby based on ally/enemy composition, not hard-coded per patch (vs. static tier lists).
4. **Relative Rating Model**: S+ tier reserved for statistically rare cases where a single champion is "miles ahead"; promotes selectivity.
5. **Delta Column**: Shows exact winrate delta vs. current team state to make pick impact transparent (green/red visual encoding).

## Requirements

- Real-time League of Legends LCU client integration
- Per-lobby dynamic tier list calculation based on matchups + ally synergy
- Champion recommendation suggestions ranked by delta (winrate impact)
- Hover tooltips showing matchup breakdowns and synergy scores
- Analysis tab with popularity/power indicators
- Training mode post-pick feedback step: keep ranked suggestions visible, highlight player pick, and require manual continue to next round
- Desktop app packaging via MSI installer
- Unopinionated, stats-driven recommendations (no subjective tiering)

## Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Package Manager | pnpm@9.2.0 | package.json |
| Node Version | ^20+ (inferred from @types/node 25.4) | package.json |
| Tauri App ID | com.draftgapplus | tauri.conf.json |
| Tauri Product Name | DraftGapPlus | tauri.conf.json |
| Vite Dev Port | 3000 (inferred) | tauri.conf.json devPath |
| Frontend Build Output | dist/ | tauri.conf.json distDir |
| Build Pipeline | Turbo | turbo.json |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @tauri-apps/api | ^1.5.1 | Tauri JS bindings (IPC, window control) |
| solid-js | ^1.8.6 | Reactive UI framework |
| @tanstack/solid-table | ^8.10.7 | Data table component (suggestions table) |
| @tanstack/solid-query | ^5.12.0 | Server state management |
| @aws-sdk/client-s3 | ^3.462.0 | S3 data storage / champion datasets |
| tailwind-css | ~3.x | Utility-first CSS (via tailwind.config.js) |
| vite | ~4.x | Frontend bundler |
| turbo | ^2.8.15 | Monorepo task orchestration |
| tsx | ^4.19.2 | TS execution (scripts) |
| typescript | ^5.3.2 | Language |

## Environments

- **Dev**: `pnpm dev` starts Vite dev server at localhost:3000; `pnpm tauri-dev` launches Tauri window in debug mode with hot-reload.
- **Test**: `pnpm test` runs vitest; currently frontend-only.
- **Prod**: MSI installer built on Windows via Tauri bundle; distributed via GitHub Releases; binary includes frontend dist + Tauri runtime.

## API / Interface Contract

**LCU Integration** (Tauri invokes):
- Real-time lobby detection (summoner name, team composition, bans)
- Champion selection lifecycle hooks

**Core Library Exports** (@draftgap/core):
- Draft analysis calculations (matchup ratings, synergy scoring, tier assignment)
- Rate/risk models
- Statistical utilities

**Frontend Routes** (Solid.js):
- Draft view: champion suggestions table, filters (role, favorites, bans)
- Analysis tab: champion popularity, power level, matchup matrix
- Settings: user preferences, owned champion list

**Dataset Service** (@draftgap/dataset):
- Lolalytics data aggregation (champion winrates, matchup data, role stats)
- S3 upload for client consumption

## Constraints

- Windows-only (Tauri desktop currently Windows-focused; Rust Cargo.toml implies MSVC toolchain)
- Must maintain LCU client compatibility (requires running LoL client for lobby auto-detection)
- Unopinionated recommendations (no subjective tier inflation; strict statistical basis needed)
- All responses from draft analysis must complete intra-turn (during champselect phase)
- Monorepo requires all packages to maintain version parity (currently 4.0.1 root, 2.13.0 frontend, 2.3.2 core)
