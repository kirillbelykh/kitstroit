# KIT Transitions.dev Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На production-главной kitstroit.ru добавить shimmer hero-заголовка, tilt на SVG-плане и magazine-фото, анимированный checkbox согласия и `BorderBeam` на логотипе шапки — буквально по Transitions.dev / `border-beam`.

**Architecture:** CSS из сниппетов Transitions.dev живёт в `styles.css`; один React-хук/компонент `TiltCard` пишет CSS-переменные с pointer; checkbox в `LeadForm` как `button role="checkbox"` с проверкой на submit; `border-beam` оборачивает только `.header-logo`. Шрифт Zilla Slab только на `.t-shimmer`.

**Tech Stack:** React + Vite frontend, `border-beam`, CSS `@keyframes` / custom properties, Google Fonts import для Zilla Slab.

## Global Constraints

- Рабочая папка только `/srv/kit-ai/worktrees/cursor-worker`.
- Ветка: продолжить `task/kit-transitions-motion-design` или переименовать логически в ту же task-ветку (не `main`).
- Подход **буквальный** (spec approach 2): сниппеты as-is + `npm install border-beam`.
- Tilt «Планировочное решение» = SVG `.project-plan`, не lightbox.
- BorderBeam только шапка; футер/`/privacy` не трогать.
- Mobile tilt **включён** (`touch-action: none` на `.t-tilt`).
- Не менять тексты/обещания/Метрику/backend/админку.
- Не deploy / не Docker socket; после кода — commit (+ push по заданию brain). Production rebuild — отдельно Кириллу.
- Spec: `docs/superpowers/specs/2026-07-28-kit-transitions-motion-design.md`.
- Обязательная проверка: `cd frontend && npm run build`.

## File map

| File | Responsibility |
|------|----------------|
| `frontend/package.json` + lock | зависимость `border-beam` |
| `frontend/src/styles.css` | shimmer / tilt / check CSS + Zilla import + KIT color tokens |
| `frontend/src/components/TiltCard.tsx` | обёртка tilt + pointer → CSS vars |
| `frontend/src/components/ConsentCheck.tsx` | `t-check` button + aria + path length |
| `frontend/src/components.tsx` | LeadForm: ConsentCheck + submit guard |
| `frontend/src/App.tsx` | shimmer span, TiltCard на plan/magazine, BorderBeam на Header logo |
| `frontend/src/components/tiltMath.ts` | чистая функция углов (для самопроверки) |
| `frontend/src/components/tiltMath.selfcheck.mjs` | assert-based self-check без test runner |

---

### Task 1: Зависимость `border-beam` + CSS-токены и сниппеты

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Modify: `frontend/package-lock.json` (via npm install)
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: none
- Produces: CSS classes `.t-shimmer`, `.t-tilt`, `.t-tilt-card`, `.t-tilt-glare`, `.t-check` и `:root` vars из промпта; `.t-shimmer` использует `font-family: "Zilla Slab", …`

- [ ] **Step 1: Установить пакет**

```bash
pwd  # must be /srv/kit-ai/worktrees/cursor-worker
cd frontend && npm install border-beam
```

Expected: `border-beam` в `dependencies`.

- [ ] **Step 2: Добавить шрифт и CSS сниппетов в `styles.css`**

В начало файла (после существующих `@tailwind` или рядом с `:root`) добавить:

```css
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:ital,wght@0,400;0,500;1,400&display=swap');
```

В `:root` (или отдельный блок сразу после) — переменные из промпта, с KIT-подгонкой:

```css
:root {
  /* existing tokens remain */
  --shimmer-dur: 2000ms;
  --shimmer-base: rgba(233, 229, 218, 0.55);
  --shimmer-highlight: #e9e5da;
  --shimmer-band: 400%;
  --shimmer-ease: linear;
  --tilt-perspective: 1000px;
  --tilt-return: 1000ms;
  --tilt-return-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --tilt-follow: 400ms;
  --tilt-follow-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --tilt-glare-opacity: 0.32;
  --tilt-glare-fade: 300ms;
  --tilt-glare-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --check-box: 150ms;
  --check-draw: 350ms;
  --check-delay: 0ms;
  --check-uncheck: 150ms;
  --check-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Далее вставить CSS `.t-shimmer`, `.t-shimmer::before`, `@keyframes t-shimmer`, `.t-tilt`, `.t-tilt-card`, `.t-tilt-card.is-tilting`, `.t-tilt-glare`, `.t-tilt.is-hover .t-tilt-glare`, `.t-check`, `.t-check svg path`, `.t-check[aria-checked="true"] svg path` **как в промпте**, плюс:

```css
.t-shimmer {
  font-family: "Zilla Slab", "Iowan Old Style", Palatino, Georgia, serif;
  font-style: italic;
  font-weight: 400;
}
.t-check {
  /* match site consent control size ≥44×44; fill/border use --ink / --brass on brass section */
  display: inline-grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: 1px solid currentColor;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.t-check[aria-checked="true"] {
  background: var(--ink);
  color: var(--bone);
}
.t-check svg {
  width: 0.65rem;
  height: 0.65rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.consent {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}
.header-logo-beam {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

И `prefers-reduced-motion` блоки из промпта для всех трёх эффектов.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/styles.css
git commit -m "feat: add border-beam and Transitions.dev motion CSS"
```

---

### Task 2: `tiltMath` + `TiltCard`

**Files:**
- Create: `frontend/src/components/tiltMath.ts`
- Create: `frontend/src/components/tiltMath.selfcheck.mjs`
- Create: `frontend/src/components/TiltCard.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1
- Produces:
  - `computeTilt(clientX, clientY, rect, maxDeg = 10): { rx: number; ry: number; gx: number; gy: number }`
  - `TiltCard({ children, className?: string }): JSX.Element` — outer `.t-tilt`, inner `.t-tilt-card` + `.t-tilt-glare`

- [ ] **Step 1: Чистая математика**

```ts
// frontend/src/components/tiltMath.ts
export function computeTilt(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  maxDeg = 10,
): { rx: number; ry: number; gx: number; gy: number } {
  const px = (clientX - rect.left) / rect.width
  const py = (clientY - rect.top) / rect.height
  const ry = (px - 0.5) * 2 * maxDeg
  const rx = (0.5 - py) * 2 * maxDeg
  return { rx, ry, gx: px * 100, gy: py * 100 }
}
```

- [ ] **Step 2: Self-check**

```js
// frontend/src/components/tiltMath.selfcheck.mjs
import { createRequire } from 'node:module'
// If TS not runnable directly, duplicate the formula inline for assert OR compile — prefer inline mirror of formula:

function computeTilt(clientX, clientY, rect, maxDeg = 10) {
  const px = (clientX - rect.left) / rect.width
  const py = (clientY - rect.top) / rect.height
  const ry = (px - 0.5) * 2 * maxDeg
  const rx = (0.5 - py) * 2 * maxDeg
  return { rx, ry, gx: px * 100, gy: py * 100 }
}

const center = computeTilt(50, 50, { left: 0, top: 0, width: 100, height: 100 })
if (Math.abs(center.rx) > 1e-9 || Math.abs(center.ry) > 1e-9) throw new Error('center must be flat')
const right = computeTilt(100, 50, { left: 0, top: 0, width: 100, height: 100 })
if (right.ry !== 10 || right.gx !== 100) throw new Error('right edge tilt failed')
console.log('tiltMath.selfcheck: ok')
```

Run: `node frontend/src/components/tiltMath.selfcheck.mjs`  
Expected: `tiltMath.selfcheck: ok`

- [ ] **Step 3: Компонент `TiltCard`**

```tsx
// frontend/src/components/TiltCard.tsx
import { useRef, type ReactNode, type PointerEvent } from 'react'
import { computeTilt } from './tiltMath'

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  function setVars(rx: number, ry: number, gx: number, gy: number) {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--tilt-rx', `${rx}deg`)
    el.style.setProperty('--tilt-ry', `${ry}deg`)
    el.style.setProperty('--tilt-gx', `${gx}%`)
    el.style.setProperty('--tilt-gy', `${gy}%`)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = rootRef.current
    const card = cardRef.current
    if (!el || !card) return
    const { rx, ry, gx, gy } = computeTilt(event.clientX, event.clientY, el.getBoundingClientRect())
    setVars(rx, ry, gx, gy)
    card.classList.add('is-tilting')
    el.classList.add('is-hover')
  }

  function onPointerLeave() {
    const el = rootRef.current
    const card = cardRef.current
    if (!el || !card) return
    card.classList.remove('is-tilting')
    el.classList.remove('is-hover')
    setVars(0, 0, 50, 50)
  }

  return (
    <div
      ref={rootRef}
      className={`t-tilt ${className}`.trim()}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div ref={cardRef} className="t-tilt-card">
        {children}
        <div className="t-tilt-glare" aria-hidden="true" />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/tiltMath.ts frontend/src/components/tiltMath.selfcheck.mjs frontend/src/components/TiltCard.tsx
git commit -m "feat: add TiltCard pointer-driven tilt primitive"
```

---

### Task 3: `ConsentCheck` + интеграция в `LeadForm`

**Files:**
- Create: `frontend/src/components/ConsentCheck.tsx`
- Modify: `frontend/src/components.tsx` (LeadForm consent + submit)

**Interfaces:**
- Consumes: `.t-check` CSS from Task 1
- Produces: `ConsentCheck({ checked, onChange, invalid?: boolean })`
- LeadForm: не вызывает `sendLead`, если `checked === false`; ошибка `"Нужно согласие на обработку персональных данных"`

- [ ] **Step 1: Компонент**

```tsx
// frontend/src/components/ConsentCheck.tsx
import { useEffect, useRef } from 'react'

const PATH_D = 'M1 5.52L3.92 9.17L9.17 1'

export function ConsentCheck({
  checked,
  onChange,
  invalid = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  invalid?: boolean
}) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = Math.ceil(path.getTotalLength())
    path.style.setProperty('--check-len', String(len))
  }, [])

  return (
    <button
      type="button"
      className="t-check"
      role="checkbox"
      aria-checked={checked}
      aria-invalid={invalid || undefined}
      aria-label="Согласен с обработкой персональных данных"
      onClick={() => onChange(!checked)}
    >
      <svg viewBox="0 0 10.1668 10.1668" aria-hidden="true">
        <path ref={pathRef} d={PATH_D} />
      </svg>
    </button>
  )
}
```

- [ ] **Step 2: LeadForm**

В `LeadForm`:

```tsx
const [consent, setConsent] = useState(false)
const [consentError, setConsentError] = useState(false)
// в submit, сразу после preventDefault / locks:
if (!consent) {
  setConsentError(true)
  setError('Нужно согласие на обработку персональных данных')
  setStatus('error')
  submitLock.current = false
  return
}
setConsentError(false)
// … existing sendLead with consent: true
// после успеха:
setConsent(false)
```

Заменить строку checkbox:

```tsx
<label className="consent">
  <ConsentCheck checked={consent} onChange={(next) => { setConsent(next); if (next) setConsentError(false) }} invalid={consentError} />
  <span>Согласен с <a href="/privacy" target="_blank" rel="noreferrer">обработкой персональных данных</a></span>
</label>
```

Import: `import { ConsentCheck } from './components/ConsentCheck'`

- [ ] **Step 3: Build sanity**

```bash
cd frontend && npm run build
```

Expected: success (или зафиксировать ошибки TS и исправить в этом же task).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ConsentCheck.tsx frontend/src/components.tsx
git commit -m "feat: animated consent checkbox for lead form"
```

---

### Task 4: Shimmer, Tilt в magazine/plan, BorderBeam в Header

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `TiltCard`, `BorderBeam` from `border-beam`, `.t-shimmer` CSS
- Produces: wired production homepage

- [ ] **Step 1: Imports**

```tsx
import { BorderBeam } from 'border-beam'
import { TiltCard } from './components/TiltCard'
```

- [ ] **Step 2: Header logo**

Заменить логотип-ссылку на:

```tsx
<BorderBeam className="header-logo-beam" colorVariant="mono" theme="dark" size="sm" strength={0.7}>
  <a className="logo header-logo" href="#top" aria-label="KIT — на главную"><span>K</span><span>I</span><span>T</span></a>
</BorderBeam>
```

(Если API `BorderBeam` не принимает какой-то prop — оставить минимальный `<BorderBeam>…</BorderBeam>` как в README пакета.)

- [ ] **Step 3: Hero title shimmer**

```tsx
<h1 className="hero-title">
  <span className="t-shimmer" data-text={heroTitle}>{heroTitle}</span>
</h1>
```

- [ ] **Step 4: Magazine photo tilt**

Обернуть содержимое кнопки `.magazine-open` (img + hint) или сам visual frame:

```tsx
<TiltCard className="magazine-tilt">
  <button className="magazine-open" type="button" onClick={() => setLightboxOpen(true)} aria-label={…}>
    <img className="magazine-image" … />
    <span className="magazine-open-hint">На весь экран</span>
  </button>
</TiltCard>
```

Не оборачивать lightbox.

- [ ] **Step 5: Plan SVG tilt**

```tsx
<div className="plan-spread">
  <div>…copy…</div>
  <TiltCard className="plan-tilt">
    <ProjectPlan variant={project.plan} />
  </TiltCard>
</div>
```

- [ ] **Step 6: Build**

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 7: Self-check tilt math still ok**

```bash
node frontend/src/components/tiltMath.selfcheck.mjs
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire shimmer, tilts, and header BorderBeam on homepage"
```

---

### Task 5: Финальная проверка и push

**Files:** none new (review only)

- [ ] **Step 1: Diff review**

```bash
pwd && git branch --show-current && git status -sb
git log main..HEAD --oneline
git diff main...HEAD --stat
```

Убедиться: нет `.env`, `.tmp`, секретов; только frontend + уже существующая spec.

- [ ] **Step 2: Full frontend build**

```bash
cd /srv/kit-ai/worktrees/cursor-worker/frontend && npm run build
```

- [ ] **Step 3: Push**

```bash
git push -u origin HEAD
```

- [ ] **Step 4: Отчёт kit-brain**

Формат: статус DONE/PARTIAL/BLOCKED; ветка; файлы; команды; критерии; риски (mobile scroll + checkbox без native required); rollback; **production rebuild не выполнен агентом** — нужно Кириллу.

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Shimmer + Zilla Slab | 1, 4 |
| Tilt SVG plan | 2, 4 |
| Tilt magazine photos | 2, 4 |
| No tilt lightbox | 4 |
| Checkbox Transitions.dev | 3 |
| BorderBeam header only | 4 |
| Mobile tilt on | 1 (`touch-action: none`), 2 |
| reduced-motion | 1 |
| build | 3, 4, 5 |
| push | 5 |
| production rebuild | **out of agent scope** — owner |

## Rollback

`git revert` коммитов ветки / restore предыдущий frontend image на VPS. БД/медиа не затрагиваются.
