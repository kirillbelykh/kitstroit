# Яндекс Директ MCP — безопасная работа (KIT)

Пакет: [`dontsovcmc/mcp-server-yandex-direct`](https://github.com/dontsovcmc/mcp-server-yandex-direct)  
Хост: `neth-1` · запуск через `uvx` · Cursor MCP name: `yandex-direct`

## Цель

Подключить чтение API Яндекс Директа к Cursor для подготовки поисковой кампании **без** самовольного изменения бюджета, статусов и объявлений. Платный трафик не запускается до готовности пунктов 1–4 из `AGENTS.md`.

## Лимит бюджета

| Параметр | Значение |
|---|---|
| Общий потолок рекламного бюджета KIT | **45 000 ₽** |
| Режим до явного разрешения Кирилла | только чтение (Sandbox) |
| Production API / запись / запуск кампаний | запрещены без отдельного L2/L3 согласования |

Лимит 45 000 ₽ — **суммарный** потолок всех кампаний аккаунта KIT (не «на кампанию»). Любое повышение — только после явного решения владельца.

## Установка на neth-1 (без секретов в git)

| Артефакт | Путь | Права |
|---|---|---|
| OAuth / API token | `~/.config/kit-secrets/yandex-direct.env` | `600` |
| Shell launcher | `~/.local/bin/kit-yandex-direct-mcp` | `700` |
| Sandbox patch | `~/.local/share/kit/yd_mcp_launcher.py` | `644` |
| Cursor MCP | `~/.cursor/mcp.json` → command launcher | `600` |

В `mcp.json` **нет** `YD_TOKEN` и нет `env` с секретами — только путь к launcher.

Переменные в env-файле:

- `YD_TOKEN` — OAuth-токен (обязателен)
- `YD_CLIENT_LOGIN` — при работе через агентство (опционально)
- `YD_LANG=ru`
- `YD_USE_SANDBOX=1` — по умолчанию Sandbox (`api-sandbox.direct.yandex.com`)

Пакет сам по себе всегда бьёт в production URL; sandbox включается **патчем** в launcher при `YD_USE_SANDBOX=1`.

Зависимость: `uvx --from mcp-server-yandex-direct --with 'mcp>=1.0.0,<2'`  
(`mcp` 2.x удалил `mcp.server.fastmcp`, сервер 0.3.0 без пина не стартует).

## Подключение Sandbox

1. В кабинете Яндекс Директа / OAuth создать токен с доступом к API (для песочницы — sandbox-токен по документации Яндекса).
2. Записать **только** в `~/.config/kit-secrets/yandex-direct.env`:
   ```bash
   umask 077
   nano ~/.config/kit-secrets/yandex-direct.env   # YD_TOKEN=...
   chmod 600 ~/.config/kit-secrets/yandex-direct.env
   ```
3. Убедиться: `YD_USE_SANDBOX=1`.
4. В Cursor: Reload MCP / перезапуск агента, сервер `yandex-direct`.
5. Проверка без записи: `yd_search` → затем `yd_execute` с `campaigns-get` / `dictionaries-get`.

Токен не коммитить, не вставлять в чат, Mind, PR, логи и открытый `mcp.json`.

## Инструменты MCP

Сервер экспортирует **2** MCP-tool поверх **79** action ID:

| Tool | Назначение | readOnlyHint |
|---|---|---|
| `yd_search` | Поиск action ID и схемы params | true |
| `yd_execute` | Выполнение action по ID | false |

Рабочий цикл: сначала `yd_search`, потом `yd_execute` с `params_json`.

### Разрешено в режиме чтения (allowlist)

Только эти action ID, пока Кирилл не дал письменное разрешение на запись:

- `*-get` (все get-методы)
- `reports-get`
- `dictionaries-get`
- `changes-check`, `changes-check-campaigns`, `changes-check-dictionaries`
- `keywordsresearch-deduplicate`, `keywordsresearch-has-search-volume`
- `leads-get`, `turbopages-get`

### Запрещено до разрешения на запись (denylist)

Любые `*-add`, `*-update`, `*-delete`, `*-suspend`, `*-resume`, `*-archive`, `*-unarchive`, `*-moderate`, `*-set`, `*-set-auto`, `*-set-bids`, `agencyclients-add/update`, `clients-update`, `creatives-add`, и аналоги.

В том числе: создание/правка кампаний, ставки, статусы ON/OFF, модерация, архив.

## Регламент агента

1. Перед любой сессией проверить: `YD_USE_SANDBOX=1` и allowlist.
2. Не вызывать denylist-action даже «для теста» на Sandbox без явного запроса владельца на запись.
3. Не переключать `YD_USE_SANDBOX=0` без L2/L3 согласования Кирилла.
4. Перед предложениями по бюджету сверять сумму дневных/общих лимитов с потолком **45 000 ₽**.
5. Изменение рекламного бюджета и запуск кампаний = согласование Кирилла (`AGENTS.md`, уровень L2/L3).
6. При сомнении — `NO_CHANGE` и список недостающих данных.
7. После установки/смены режима — короткий отчёт: среда (sandbox/prod), режим (read/write), что вызывалось.

## Откат

1. Удалить/отключить сервер `yandex-direct` в `~/.cursor/mcp.json`.
2. При компрометации токена — отозвать OAuth в Яндексе, заменить `YD_TOKEN` в env-файле, проверить `chmod 600`.
3. Launcher и env лежат вне git — откат кода сайта не затрагивает MCP.

## Статус на момент установки

- MCP стартует через uvx + sandbox patch.
- Режим: **только чтение**, ожидание `YD_TOKEN` от владельца и разрешения на операции записи.
- Production-кампании не создавались, не запускались, не останавливались и не изменялись.
