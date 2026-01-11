# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the TypeScript source; entry point is `src/index.ts`.
- Cubism implementations live in `src/cubism2/`, `src/cubism4/`, with shared logic in `src/cubism-common/`.
- Loading and model creation code sits in `src/factory/`, utilities in `src/utils/`.
- `cubism/` is the Cubism Web Framework source (treated as a vendor/submodule area).
- Tests are under `test/` with `test/units/`, `test/features/`, and `test/rpc/`.
- `playground/` is a local demo; assets live in `test/assets/` and `playground/models/`.
- Build and tooling scripts live in `scripts/`.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies for the workspace.
- `pnpm run setup` downloads Live2D core files into `core/` (required once).
- `pnpm playground` starts the Vite playground for local debugging.
- `pnpm build` builds distributable bundles into `dist/`.
- `pnpm type` generates declaration files under `types/`.
- `pnpm test` runs Vitest; run `pnpm build` once before the first test session.
- `pnpm test:u` updates visual snapshots.
- `pnpm lint` / `pnpm lint:fix` runs ESLint and fixes auto-fixable issues.
- `pnpm typecheck` runs the strict TypeScript project check.
- `pnpm doc` and `pnpm serve-docs` build and serve docs from `docs/`.

## Coding Style & Naming Conventions
- TypeScript only; ESM modules.
- Use Prettier formatting (tab width 4, print width 100) and ESLint rules.
- Prefer `PascalCase` for classes, `camelCase` for functions/variables, and `kebab-case` for file assets.
- Use path aliases: `@/` maps to `src/`, `@cubism/` maps to `cubism/src/`.

## Testing Guidelines
- Tests use Vitest and are named `*.test.ts`.
- Feature tests include image snapshots under `test/features/__image_snapshots__/`.
- If you change rendering behavior, update snapshots with `pnpm test:u` and mention it in the PR.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat:`, `fix:`, `chore(deps):`, plus release tags like `version: vX.Y.Z`.
- PRs should include: a short summary, test results (or why not run), and screenshots/diffs for visual changes.
- Do not commit local playground tweaks in `playground/index.ts`.

## Security & Configuration Notes
- Live2D core files are downloaded locally via `pnpm run setup` and should not be committed.
- If updating `cubism/`, keep changes isolated and document the reason in the PR.
