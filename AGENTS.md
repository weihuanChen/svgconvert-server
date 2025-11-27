# Repository Guidelines

## Project Structure & Module Organization
- Core TypeScript sources live in `src/` (`index.ts` entrypoint, `routes/` for HTTP handlers, `services/` with converters and storage clients, `middleware/` for request handling, `config/` for env wiring, `utils/` for helpers, `locales/` for i18n strings, `types/` for shared interfaces).
- Build artifacts are emitted to `dist/`; temporary uploads and outputs are in `temp/` (respect retention/cleanup logic).
- Developer-facing docs sit in `docs/` plus API/reference files in the repo root (e.g., `API-*.md`, `TESTING_GUIDE.md`, `HYBRID_ARCHITECTURE.md`); keep new docs alongside peers.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 18+).
- `npm run dev` — start the Hono server with `tsx` watch for local development.
- `npm run build` — type-check and emit compiled JS to `dist/`.
- `npm start` — run the compiled server from `dist/`.
- `npm run lint` — ESLint over `src/**/*.ts`; fix offenses before commits.
- `npm run format` — Prettier on `src/**/*.ts`.
- `./test-api.sh` — smoke-check key endpoints against a running local server.

## Coding Style & Naming Conventions
- TypeScript with ES modules; prefer async/await and typed params/returns.
- Indent with 2 spaces; keep lines concise and avoid implicit any.
- File names are kebab-case; exported types/interfaces use PascalCase; functions/variables use camelCase; constants in SCREAMING_SNAKE_CASE when needed.
- Run `npm run lint && npm run format` before opening a PR; do not check in generated `dist/` output.

## Testing Guidelines
- No formal test suite yet; use `./test-api.sh` or Postman collection `SVGConvert-API.postman_collection.json` to verify endpoints.
- When adding tests, colocate near the feature or under a new `__tests__/` folder, and mirror route/service naming.
- Include edge cases for file size limits, conversion options, and cleanup behavior.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`), matching existing history (`feat: 添加 WebP 和 GIF 格式支持`).
- Commits should be focused and lint-clean.
- PRs should describe the change, list key commands run, and mention any config/env additions (`.env.example` should reflect new vars).
- Provide screenshots or logs for API/behavior changes when useful; link related issues or tasks.

## Security & Configuration Tips
- Never commit `.env`; use `.env.example` for new settings. Key vars: `PORT`, `TEMP_DIR`, `MAX_FILE_SIZE`, `CLEANUP_INTERVAL_MINUTES`, `FILE_RETENTION_MINUTES`, optional storage/queue credentials in `src/config/index.ts`.
- Validate inputs at route boundaries; preserve cleanup safeguards for `temp/`.
- Keep Docker paths (`Dockerfile`, `docker-compose.yml`) in sync with runtime expectations if you change ports or volumes.
