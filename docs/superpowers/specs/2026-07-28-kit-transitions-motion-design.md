# Design: Transitions.dev motion на production-главной kitstroit.ru

Date: 2026-07-28  
Status: draft for owner review  
Owner: Кирилл  
Risk: L1 для кода в task-ветке; **L2** для push и пересборки production (явное ОКL2**-ОК получено в brainstorming)

## Goal

Добавить на production-главную пять motion-эффектов из Transitions.dev / `border-beam` без смены контента, воронки и обещаний продукта. После реализации: commit → push → пересборка production.

## Decisions (brainstorming)

| Тема | Решение |
|------|---------|
| Подход | **Буквальный** (подход 2): CSS/разметка/API как в промпте; `npm install border-beam` |
| Tilt «Планировочное решение» | SVG-схема `.project-plan`, не magazine-фото |
| BorderBeam | Только логотип в **шапке** |
| Шрифт shimmer | **Zilla Slab** (кириллица), только на shimmer-span |
| Mobile tilt | Включён, как в сниппете (`touch-action: none`) |
| Доставка | Сразу production после merge/push + rebuild |

## Non-goals

- Смена текстов, фото, CTA, Метрики, CRM.
- BorderBeam в футере и на `/privacy`.
- Tilt в lightbox полноэкранного просмотра.
- Отдельная правка `docs/DESIGN.md` (осознанный trade-off с «буквальным» motion).
- Lab-роуты `/test`, `/design-lab/*` как место первой выкладки.

## Current anchors (code)

| Эффект | Где сейчас |
|--------|------------|
| Hero-заголовок | `App.tsx`: `heroTitle` → `.hero-title` |
| План | `ProjectPlan` SVG внутри `.plan-spread` |
| Фото проектов | `.magazine-media` / `.magazine-open` + img |
| Согласие ПДн | `components.tsx` `LeadForm`: `<input type="checkbox" required />` |
| Логотип шапки | `Header`: `<a class="logo header-logo">` |
| Стили | `frontend/src/styles.css` (`--serif` / `--sans`, без Zilla Slab) |

## Chosen approach

Буквальная интеграция сниппетов Transitions.dev и пакета `border-beam` на production homepage.

Осознанные trade-offs относительно `docs/DESIGN.md` и a11y:

1. Mobile tilt с `touch-action: none` может перехватывать скролл на зоне карточки.
2. Checkbox как `button role="checkbox"` без нативного `required` — валидация согласия делается в submit-логике формы.
3. Новая npm-зависимость `border-beam` и возможный визуальный «beam» у логотипа.

## Experience design

### 1. Shimmer (hero)

- Обернуть видимую строку заголовка в  
  `<span class="t-shimmer" data-text="{тот же текст}">…</span>`.
- `data-text` всегда синхронизирован с видимым текстом (включая динамический `heroTitle` из CMS, если он не fallback).
- CSS и keyframes — как в промпте Transitions.dev Shimmer text.
- Токены: `--shimmer-base` / `--shimmer-highlight` подогнать под KIT (`--bone` / светлее на тёмном hero), не оставлять демо-серый на чёрном без проверки контраста.
- Шрифт span: **Zilla Slab** (кириллица), отличный от текущего `--serif` стека hero; подключение локально или через тот же механизм шрифтов проекта, без третьего «случайного» семейства сверх пары сайт + этот акцент.
- `@media (prefers-reduced-motion: reduce)`: анимация выкл.

### 2. Tilt — схема планировки

- Обернуть `ProjectPlan` / `.project-plan`:
  ```
  .t-tilt > .t-tilt-card > [svg] + .t-tilt-glare
  ```
- Pointer на внешнем `.t-tilt`; запись `--tilt-rx`, `--tilt-ry`, `--tilt-gx`, `--tilt-gy`; классы `is-tilting` / `is-hover` по сниппету.
- Работает на desktop и touch (решение B).
- Reduced-motion: `transform: none`.

### 3. Tilt — фото проектов

- Та же конструкция вокруг видимого кадра magazine (кнопка открытия / изображение в `.magazine-media`).
- Lightbox без tilt.
- Те же mobile / reduced-motion правила, что у плана.

### 4. Checkbox согласия

- Заменить визуал на:
  ```
  <button type="button" class="t-check" role="checkbox" aria-checked="false|true">
    <svg>…path…</svg>
  </button>
  ```
  + существующий текст ссылки на `/privacy`.
- Toggle `aria-checked`; `--check-len` ≈ `path.getTotalLength()` (округление вверх).
- CSS transitions — как в Transitions.dev Checkbox check.
- Submit `LeadForm`: если `aria-checked !== true` — не отправлять запрос, показать ошибку/фокус на контроле согласия (замена нативного `required`).
- Клавиатура: Space/Enter как у checkbox-кнопки.
- Reduced-motion: без анимации заливки/штриха.

### 5. BorderBeam — логотип шапки

- `npm install border-beam` в `frontend`.
- Обернуть только `.header-logo` (ссылка K|I|T).
- Hit-area ≥ 44×44, `aria-label` сохраняется.
- Футер и `/privacy` без BorderBeam.

## Technical shape

- Файлы: преимущественно `frontend/src/App.tsx`, `frontend/src/components.tsx`, `frontend/src/styles.css`, при необходимости маленький модуль tilt-handler (один хук/утилита на оба tilt-места), `frontend/package.json`.
- Общая логика pointer→CSS vars для tilt — одна реализация, два места использования.
- Не трогать backend, админку, Метрику.

## Delivery

1. Ветка `task/kit-transitions-motion` (или эквивалент).
2. Реализация + проверка build/typecheck.
3. Commit (без секретов).
4. Push.
5. Пересборка production (явное L2; выполнять только после approve спеки/плана и готовности кода).

Rollback: revert коммита(ов) ветки + пересборка предыдущего frontend-образа. БД и медиа не затрагиваются.

## Acceptance

- [ ] Shimmer на hero-заголовке; шрифт отличается от прежнего hero serif.
- [ ] Tilt + glare на SVG плана и на magazine-фото (desktop и touch).
- [ ] Lightbox без tilt.
- [ ] Согласие: анимация check; без согласия submit не уходит; с согласием — прежний lead flow.
- [ ] BorderBeam только на логотипе шапки.
- [ ] `prefers-reduced-motion` отключает motion-эффекты, контент на месте.
- [ ] `frontend` build / typecheck зелёный; diff без секретов.
- [ ] После approve: push + production rebuild.

## Testing notes

- Ручная проверка главной на ширинах desktop и ~390px.
- Форма: отказ без согласия; успех с согласием (staging/local API, без спама production CRM без нужды).
- Проверка, что `touch-action: none` на tilt-зонах не ломает меню и остальной скролл страницы вне карточек (зафиксировать в отчёте, если UX неприемлем — follow-up).
