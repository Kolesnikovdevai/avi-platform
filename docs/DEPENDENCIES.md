# Зависимости каркаса

Дата выбора: 03.11.2026. Прямые зависимости закреплены в package.json/pyproject.toml, транзитивные — в pnpm-lock.yaml/backend/uv.lock.

- Node 24.15.0, pnpm 11.25.0; Next.js 16.4.4, React 19.3.1.
- Inter Variable 5.3.0 из @fontsource-variable/inter: локальные woff2 с кириллицей и лицензией OFL-1.1 поставляются зависимостью; браузер не запрашивает Google Fonts. Версия и integrity закреплены в pnpm-lock.yaml.
- TypeScript 6.0.3: TypeScript 7 пока несовместим с typescript-eslint 8.72.1. Это проверено запуском и peer-ограничениями; TS 6 поддержан текущим стеком.
- ESLint 10.14.0 + официальный @next/eslint-plugin-next и typescript-eslint. Прямой flat config исключает зависимость от legacy-плагинов eslint-config-next, ещё ограниченных ESLint 9. Никакие включённые проверки не подавлены.
- Python 3.12.14, uv 0.13.7; FastAPI, SQLAlchemy, psycopg, Alembic и aiogram закреплены реальным резолвером в backend/pyproject.toml. Python 3.12 — совместимая поддерживаемая линия.
- PostgreSQL 18.6: версия подтверждена официальным docker-library/postgres Dockerfile. Для независимой проверки на Windows получены переносимые EDB-бинарники той же версии; они не входят в git.

## Исправления безопасности

`minimatch <11.0.1` затронут [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), обнаруженным pnpm audit в транзитивных lint-зависимостях. pnpm override устанавливает исправленную 11.0.1; совместимость проверяется lint/typecheck/build и e2e. Это обновление пакета, не исключение из audit. Пересмотреть override при каждом обновлении ESLint/typescript-eslint; удалить, когда их диапазоны начнут принимать исправленную версию самостоятельно.

GitHub Actions закреплены SHA, полученными из официальных репозиториев. Базовый CI main прошёл после подключения репозитория; каждый новый SHA проверяется отдельно. Dependabot настроен для регулярных предложений обновлений; несовместимое обновление TypeScript 7 не следует сливать до поддержки typescript-eslint. Внешние реестры и advisory-базы нужны для audit; сетевой сбой не означает отсутствие уязвимостей.

Официальные инструкции: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [uv](https://docs.astral.sh/uv/guides/projects/), [FastAPI](https://fastapi.tiangolo.com/deployment/docker/).
