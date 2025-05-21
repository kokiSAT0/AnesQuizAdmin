# AGENTS.md – AnesQuiz Repo Guide

## Setup

- Run `npm ci` to install packages.

## Code Style

- Use ESLint with the config in `.eslintrc`.
- Format code via Prettier (`npm run format`).  
  The CI will fail if `git diff --name-only -- '*.tsx'` shows unformatted code.

## Testing

- Every task **must pass** `npm run lint && npm test`.
- For UI changes, run `npx expo export --platform web` to ensure the bundle builds.

## PR Instructions

- Commit message style: **Conventional Commits** (`feat:`, `fix:`, `chore:` …)
- PR title: `[<type>] <one-line summary>`
- Description includes:
  1. **What & Why** (１行)
  2. **Testing Done** (実行したコマンド)
  3. **Screenshots** (UI 変更のみ)

## Expo Specific

- Do **not** commit `ios/` or `android/` folders; Codex should work in managed workflow.
- Use `npx expo prebuild` only when adding native modules.

## SQLite Migration

- If `db/schema.sql` is modified, run `npm run migrate:sqlite` and commit the new `db/migrations/*.sql`.

## UI 禁止事項

1. ハードコードの HEX 値を使わない。必ず `theme\tokens.ts` を import。
