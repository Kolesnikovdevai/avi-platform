# Этап 1: реализация и проверка

Дата: 03.11.2026. Каркас реализован; удалённый CI базового main прошёл после подключения GitHub. Общий gate этапа пока не закрыт: полный локальный scripts/dev.ps1 с Docker не подтверждён. Интеграционный gate этапа 0 по-прежнему открыт.

Обновление дизайна: версия 2.0 по уточнению владельца — белая главная область, локальный Inter, больше Polar Drift / Miami Coral / Sea Buckthorn / Neverthing. Логотип 44×44 и значок организации 40×40 остаются круглыми при длинных названиях. Светлая версия разрабатывается в design/light-dashboard и проходит PR в main.

## Что добавлено

- Next.js/React/strict TypeScript кабинет на русском: обзор, аккаунты, уведомления, настройки. Навигация, демонстрационные периоды и легенда работают локально. Нет клиентских данных, входа или реальных отправок.
- [Дизайн-система](DESIGN_SYSTEM.md) по двум референсам владельца; исходные изображения сохранены, правило соблюдения добавлено в AGENTS.md. CSS-токены соответствуют палитре.
- FastAPI liveness/readiness и технический OpenAPI; серверный request id, no-store, логи с allowlist полей без URL/query, произвольных сообщений и traceback. Неподдерживаемая конфигурация отклоняется.
- Отдельные безопасные --check входы worker и aiogram, структура модулей монолита. Tenant-логика ещё не реализована.
- Alembic baseline namespace app, раздельные migrator/runtime роли без superuser/BYPASSRLS у приложения. Tenant-таблиц пока нет; RLS-тесты относятся к следующему этапу.
- PostgreSQL 18.6 Compose, генерация случайных локальных паролей в игнорируемый .env, сценарий dev.ps1, uv.lock и pnpm-lock.yaml.
- GitHub Actions для frontend/backend/PostgreSQL, Gitleaks и audit, закреплённые SHA actions; Dependabot. Публикация и подключение внешних аккаунтов не выполнялись.

## Выполненные проверки

| Проверка | Фактический результат |
|---|---|
| Frontend ESLint 10 и typecheck TS 6 | Прошли, peer-конфликтов нет |
| Prettier | Прошёл |
| Next.js production build | Прошёл; статическая страница кабинета |
| Playwright Chromium desktop/mobile | 10 тестов прошли: маркировка демо, смена периода, навигация, отсутствие внешних запросов, отсутствие overflow страницы, skip link, axe WCAG AA, белый фон, локальный Inter и круглые знаки при длинном названии организации |
| Визуальный просмотр | Проверены светлые desktop 1440 px и mobile 390 px; снимки artifacts/light-desktop.png и artifacts/light-mobile.png |
| Backend Ruff и mypy strict | Прошли |
| Backend pytest с PostgreSQL | 6 тестов прошли, без пропусков |
| PostgreSQL 18.6, новый кластер | Создание БД и ролей тем же bootstrap.sql, Alembic upgrade head на пустой БД и повтор команды прошли |
| Права runtime/readiness | Readiness 200 после baseline; нет superuser/BYPASSRLS/владения таблицами/членства в migrator, нет CREATE в app/public; попытка CREATE TABLE отклонена |
| Без БД / недоступная БД | Readiness 503 без секретов, liveness 200; проверено тестами |
| Worker / aiogram --check | Завершились успешно, без polling/отправок |
| pnpm frozen offline install | Повторная установка из lock прошла |
| pnpm audit и pip-audit | Известных уязвимостей не найдено; собственный editable backend исключён из проверки опубликованных пакетов |
| Gitleaks 8.30.1 | Утечек в исходниках не найдено; локальные игнорируемые окружения/установленные инструменты не сканировались. В CI проверяется git-история без этого локального исключения |
| Конфигурация окружения | Генерация .env и повторный запуск без перезаписи проверены; значения не печатались |
| Синтаксис PowerShell и Compose | PowerShell parser и docker compose config --quiet прошли |

Переносимый PostgreSQL использован, потому что Docker Engine не отвечал после запуска Docker Desktop. Windows initdb не поддержал кириллический путь к бинарникам при post-bootstrap: проверочный сценарий использует ASCII junction и новый кластер в пользовательском Temp, выполняет тесты и останавливает сервер. Это настоящий PostgreSQL, не SQLite/имитация RLS. Самих tenant-политик ещё нет.

## Что не проверено и что дальше

- Сквозной scripts/dev.ps1 с Docker и публикация портов контейнера не подтверждены работающим Engine. Compose-конфигурация проверена синтаксически; SQL и backend проверены на переносимом PostgreSQL той же версии.
- GitHub подключён: [первый CI main](https://github.com/Kolesnikovdevai/avi-platform/actions/runs/41611675171) завершился успешно для fe73981920ad29aa8fc6d060f328610edc21f3ac. Это проверка базового каркаса; статус нового PR нужно оценивать отдельно по его SHA.
- Проверки GitHub выполнялись на Linux, включая Compose/PostgreSQL. Production-запуск, резервные копии, RLS, сессии, приглашения, боевой адаптер, расчёт реальных метрик и доставка Telegram ещё не проверены.
- До identity требуется решение по почтовому провайдеру и нормализации email; ADR узких lookup до tenant-контекста и модель прав миграций/очереди. Затем этап 2 с настоящими негативными PostgreSQL/RLS-тестами.

UI-проверка выполнена локальным Playwright; сгенерированные снимки не входят в git. Запуск интерфейса: pnpm dev из корня.
