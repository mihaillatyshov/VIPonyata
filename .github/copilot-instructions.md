# VIPonyata Copilot Instructions

Use these rules when generating or editing code in this repository.
Treat them as default preferences unless the user explicitly asks to do otherwise.

## General

- Preserve existing architecture and naming. Prefer minimal, targeted changes.
- Do not introduce new frameworks or major patterns unless explicitly requested.
- Keep formatting compatible with repository settings:
  - JavaScript/TypeScript: Prettier style from `.prettierrc` (4 spaces, semicolons, trailing commas, max width 120).
  - Python: keep style compatible with `.style.yapf` and current codebase conventions.
- Keep imports sorted and grouped as configured in Prettier import order.

## Client (React + TypeScript)

- Client code lives in `client/src` and uses TypeScript in strict mode.
- Use functional React components with hooks.
- Prefer existing shared utilities and patterns over ad-hoc implementations.
- For API calls, prefer wrappers from `client/src/libs/ServerAPI.ts` (`AjaxGet`, `AjaxPost`, `AjaxPatch`, `AjaxDelete`) instead of direct `fetch` in components.
- Keep API paths consistent with proxy setup (`/api` and `/uploads`).
- Prefer existing path aliases based on `baseUrl: ./src` (for example `components/...`, `models/...`, `redux/...`) over deep relative paths when already used nearby.
- For Redux access, prefer typed hooks/selectors from the existing redux layer (for example hooks from `redux/hooks`).
- Reuse existing UI stack (Bootstrap, bootstrap-icons, CSS modules, SCSS). Avoid adding parallel styling systems.
- When editing CSS modules, keep local-scoped class usage and existing naming style.

## Server (Flask + SQLAlchemy + Pydantic)

- Server code lives in `server/server`.
- Keep Flask app creation through the existing app factory flow (`create_app`) and current blueprint/route registration approach.
- Load runtime configuration via existing config helpers (for example `load_config`) and existing JSON config files.
- Keep data validation and request/response schemas aligned with current Pydantic v2 style (`field_validator`, `model_validator`, typed models).
- Prefer extending existing modules (`routes`, `queries`, `models`, `handlers`) rather than adding duplicate layers.
- Keep logging behavior compatible with the current logging setup in `server/main.py`.
- For DB-related changes, keep compatibility with Alembic migration workflow and current SQLAlchemy setup.

## Tests and Validation

- When changing client behavior, run relevant client tests if available.
- When changing server behavior, run relevant tests under `server/tests`.
- Follow the existing style in the touched test area:
  - `server/tests/assessment`: unittest-style tests are present.
  - Other server tests may use pytest fixtures.
- Prefer adding or updating focused tests near the modified feature.

## Change Safety

- Avoid broad refactors unless requested.
- Do not silently change API contracts, DB schema semantics, or auth/session behavior.
- For risky or cross-cutting changes, include a short note about assumptions and impact.
