# Design: Homepage polish v2 (motion, hero mobile, gallery, plan)

Date: 2026-07-28  
Status: approved for implementation  
Owner: Кирилл  
Risk: L1 in task branch; L2 for merge/production rebuild (separate OK)

## Goal

Доработать production-главную: бургер IconSwap, единый Source Serif 4 вместо антиквы/Zilla, mobile hero, pinch-zoom lightbox, UI magazine, NumberPopIn площади, фото-план вместо SVG, масштаб фото Никиты в процессе, StaggerReveal в FAQ.

## Decisions

| Тема | Решение |
|------|---------|
| Подход | CSS в `styles.css` + тонкие React-компоненты (не auto-inject style tags) |
| Шрифт | **Source Serif 4** на весь `--serif` (+ убрать Zilla) |
| Планировка | один скрин `frontend/public/media/plans/plan-example.png` для всех проектов |
| Подпись плана | текущая оговорка про временную схему |
| Доставка | ветка → build → commit → push; merge/rebuild по отдельному ОК |

## Scope (9)

1. Mobile menu button: Transitions.dev IconSwap (меню ↔ close).
2. Replace `--serif` / Zilla with Source Serif 4 site-wide for former serif uses.
3. Mobile hero: hide primary CTA on first screen; lower/center title; keep bottom `mobile-cta`.
4. Lightbox: pinch-to-zoom + pan; swipe change slide when not zoomed.
5. Magazine: no white arrow chrome; arrows on photo edges; expand icon instead of «На весь экран».
6. Project area `dd`: NumberPopIn on scroll into view.
7. Replace `ProjectPlan` SVG with adapted plan image (+ optional keep TiltCard).
8. Process card 01 Nikita: don’t crop harshly — smaller scale / contain-friendly framing.
9. FAQ answer: StaggerReveal on open; quiet fade on close.

## Non-goals

Metrika/CRM/copy claims changes; lab routes; BorderBeam redesign; production deploy by agent.

## Acceptance

- [ ] Burger swaps icons with motion; reduced-motion OK
- [ ] No Zilla; Source Serif 4 on previous serif surfaces
- [ ] Mobile hero: no discuss CTA in hero; title lower/centered; mobile-cta works
- [ ] Lightbox pinch/pan; swipe at 1×
- [ ] Magazine arrows/icon UX as specified
- [ ] Area digits pop when visible
- [ ] Plan image shown for all projects with existing disclaimer
- [ ] Nikita process photo not aggressively cropped
- [ ] FAQ stagger reveal on open
- [ ] `npm run build` PASS
