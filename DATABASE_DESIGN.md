# Модель данных PostgreSQL

Статус: логический проект tenant-модели. В каркасе есть только Alembic baseline для namespace app и прав runtime; таблицы ниже ещё не реализованы. Точные поля провайдера уточняются по AVITO_API_RESEARCH.md. Эта схема не подтверждает существование каких-либо метрик Авито.

## Общие правила

- Первичные ключи — внутренние UUID; внешние идентификаторы — text без предположений о числовом формате.
- Tenant-таблицы содержат `organization_id NOT NULL`, `created_at/updated_at timestamptz`, RLS и индексы с ведущим organization_id по основным запросам.
- В parent-таблицах есть UNIQUE(organization_id, id); ссылки из child используют FOREIGN KEY(organization_id, parent_id). Простого FK на UUID недостаточно для tenant-связей.
- Техническое время — UTC/timestamptz; отчётные интервалы — start_date, end_date_exclusive и source_timezone. Часовой пояс источника и интервал сохраняются, а не восстанавливаются из браузера.
- Денежные исходники — bigint minor units и currency; множитель единицы подтверждается контрактом. Аналитика делит через Decimal/numeric, не float. Разные валюты не суммируются.
- Неизвестное значение — NULL или отсутствующее наблюдение с причиной. 0 записывается только как подтверждённое значение. CHECK-ограничения зависят от семантики: корректировки расходов могут быть отрицательными.

## Глобальный контур

Он не содержит клиентскую статистику и недоступен через универсальный CRUD.

| Таблица | Основные поля и ограничения |
|---|---|
| users | id, email_normalized UNIQUE, email_verified_at, password_hash, status; нормализация email задана единой политикой |
| sessions | id, user_id FK, token_hash UNIQUE, expires_at, revoked_at; индекс user_id; raw session token не хранится |
| identity_tokens | user_id, purpose, token_hash UNIQUE, expires_at, consumed_at; подтверждение email/восстановление, атомарное погашение |
| organizations | id, name, status, display_timezone; статус закрытой/удаляемой организации блокирует операции |
| memberships | organization_id, user_id, role, status; UNIQUE(organization_id,user_id), FK к users/organizations |
| metric_definitions | code, version, unit, description, aggregation_semantics, source_contract_ref; UNIQUE(code,version), версия неизменяема после использования |

Identity и lookup членства требуют работы до установки tenant-контекста. Реализовать узкие методы получения собственной сессии и собственного списка членств; runtime не получает произвольную выдачу всех пользователей/членств. Membership write выполняется только сервисом tenancy с проверкой owner и аудитом. Возможное применение SECURITY DEFINER требует отдельного ревью: фиксированный search_path, узкие права EXECUTE, без динамического SQL и без обхода политик аналитики.

Tenant-политики всё равно применяются к операциям с организацией/членством после выбора контекста. Проверка последнего owner выполняется транзакционно с блокировкой строки организации: две конкурентные операции не должны удалить обоих владельцев.

## Tenant-таблицы

Во всех строках ниже подразумеваются organization_id и внутренний id.

| Таблица | Назначение и ключевые поля |
|---|---|
| invitations | email_normalized, role, token_hash UNIQUE, invited_by_user_id, expires_at, accepted_at, revoked_at; максимум одно действующее приглашение на email/организацию через явное состояние и частичный UNIQUE |
| avito_connections | external_account_id, display_name, status, authorization_version, connected_by_user_id, last_success_at; внешний id nullable только до проверки |
| integration_credentials | connection_id composite FK UNIQUE, encrypted_payload, encryption_key_version, credential_version, expires_at nullable; доступ только интеграционному сервису |
| connection_capabilities | connection_id composite FK, capability_code, status, checked_at, evidence_ref, reason; UNIQUE(org,connection,capability) |
| oauth_attempts | connection_id composite FK, user_id, session_id, state_hash UNIQUE, expires_at, consumed_at, redirect_uri_key; без токенов в открытом виде |
| listings | connection_id composite FK, external_listing_id, title, source_status, last_seen_at; UNIQUE(org,connection,external_listing_id) |
| metric_series | connection_id composite FK, listing_id nullable composite FK, scope=account/listing, metric_code/version FK, dimensions_key, currency nullable, source_timezone; проверка соответствия scope и listing_id |
| metric_observations | series_id composite FK, start_date, end_date_exclusive, value_count bigint nullable, value_minor bigint nullable, quality_status, source_updated_at, fetched_at, sync_run_id composite FK; одна актуальная версия на интервал |
| sync_runs | connection_id composite FK, dataset, requested_interval, authorization_version, status, checkpoint, started_at, finished_at, safe_error_code; checkpoint без секретов |
| ingestion_coverage | sync_run_id и connection_id composite FK, dataset, interval, completeness, reason; фиксирует подтверждённое покрытие, а не только HTTP-успех |
| jobs | connection_id nullable composite FK, type, payload_version, sanitized_payload, idempotency_key, status, available_at, lease_until, attempts, initiated_by_user_id nullable, authorization_version |
| telegram_link_tokens | user_id, token_hash UNIQUE, expires_at, consumed_at; одноразовая привязка |
| telegram_bindings | user_id, telegram_user_id bigint, private_chat_id bigint, status, linked_at; UNIQUE(org,user_id), подтверждённый личный чат |
| notification_rules | user_id, binding_id composite FK, connection_id composite FK, type, threshold, min_leads, cooldown, enabled, version; параметры валидируются по типу |
| notification_events | rule_id composite FK, evaluated_interval, rule_version, dedup_key, safe_summary; UNIQUE(org,dedup_key) |
| outbox | event_id composite FK, binding_id composite FK, status, attempts, available_at, lease_until, sent_at, provider_message_id nullable; UNIQUE(org,event_id,binding_id) |
| audit_events | actor_user_id nullable, action, object_type, object_id, request_id, safe_metadata, occurred_at; append-only для runtime |

Роль/членство по user_id проверяется сервисом независимо от глобального FK к users. Для полей, которые обязаны ссылаться на участника данной организации, добавить составной FK к memberships(organization_id,user_id). Членство отзывается статусом, чтобы сохранить исторические ссылки; физическое удаление следует отдельной политике удаления данных.

## Уникальность и аналитика

`avito_connections`: частичный глобальный UNIQUE(external_account_id) для подтверждённых и не удалённых подключений обеспечивает правило «аккаунт в одной организации». После отключения бронь сохраняется до контролируемого переноса/удаления. Сообщение конфликта не раскрывает название или владельца чужой организации. Блокировка уникальности — в БД, а не только предварительный SELECT.

`metric_series`: уникальная комбинация org, connection, scope, listing_id, metric_code/version, dimensions_key, currency, source_timezone. NULL в UNIQUE обрабатывать явно (например, NULLS NOT DISTINCT в выбранной совместимой версии PostgreSQL). Не использовать случайные JSON как единственный ключ измерения; dimensions_key строится детерминированно из разрешённого набора измерений.

Проверять, что listing принадлежит connection: дополнительный UNIQUE(org,connection_id,id) в listings и соответствующий составной FK series. Аналогично rule/binding/event не могут связывать разных получателей внутри одной организации: сервисная проверка плюс составные ключи там, где это возможно.

`metric_observations`: UNIQUE(org,series_id,start_date,end_date_exclusive); CHECK(end > start). Ровно одно значение соответствующего unit: count либо money. Единица/валюта проверяется типизированным сервисом и тестами; межтабличный CHECK не использовать. Начальная реализация допускает только один вид гранулярности на поток данных; API не получает права суммировать пересекающиеся интервалы.

При повторном сборе заменяется текущее наблюдение с сохранением fetched_at и provenance. Не складывать повторно накопительные значения. Если нужна история ревизий, она добавляется отдельной таблицей после определения политики хранения; текущая схема не обещает полный журнал каждой версии метрики.

Агрегация account и listing — альтернативные уровни, их нельзя складывать. Расход на уровне аккаунта не копируется в series объявлений. CPL вычисляется из совместимых series и coverage с версией формулы; в таблице не хранится как независимо редактируемое первичное число.

## RLS: шаблон для миграций

Пример принципа, не готовая миграция:

```sql
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_scope ON listings
  FOR ALL TO avitopulse_runtime
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
  );
```

После проверки членства внутри транзакции: `SELECT set_config('app.organization_id', :verified_org_id, true)`. При отсутствии контекста выборка не возвращает tenant-строк; запись запрещена. Приложение не строит tenant-id SQL-конкатенацией. Такая политика сама по себе не доказывает членство: проверка сервиса обязательна.

Применить политику ко всем tenant-таблицам, включая jobs, outbox, audit и secrets; runtime-роли не владеют таблицами и не имеют BYPASSRLS. Роли worker/bot получают аналогичные политики с нужными минимальными правами. Служебный диспетчер получает только узкий механизм аренды заданий, без произвольного SELECT по всем tenant-таблицам.

## Индексы, конкурентность и жизненный цикл

- Индексы по всем составным FK, по observations(org,series_id,start_date), listings(org,connection_id), sync_runs(org,connection_id,started_at).
- Частичные индексы очереди по status/available_at и lease_until для восстановления зависших задач. UNIQUE(org,idempotency_key) у jobs.
- Приглашения и link tokens погашаются через атомарный UPDATE с проверкой статуса/срока или блокировку строки. Одновременное принятие безопасно.
- Удаление участника/отключение интеграции меняет версии разрешений и статусы связанных задач в транзакции. Повторная проверка перед сохранением/доставкой закрывает окно конкурентного отзыва.
- Каскадное удаление финансовой/аналитической истории по случайному удалению пользователя запрещено. Удаление организации — отдельная проверяемая процедура, включая секреты, очереди, кеши, файлы и срок исчезновения из backup.
- Сырые ответы по умолчанию не сохранять постоянно. Сроки хранения нормализованных данных, аудита, outbox и backup принять до беты. Soft delete не заменяет удаление персональных данных.

## Обязательные проверки миграций

Реальный PostgreSQL: отсутствие tenant-контекста, попытки чтения/UPDATE/DELETE/INSERT чужой организации, составные FK, подмена tenant-id, возврат соединения в пул, worker без BYPASSRLS, одновременное принятие приглашения, последний owner, дубли сборов и отключение во время сбора. Проверить миграции на пустой БД и обновление с предыдущей версии; восстановление backup проверять отдельно.
