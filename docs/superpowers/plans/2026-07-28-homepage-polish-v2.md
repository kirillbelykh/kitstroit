# Homepage Polish v2 Implementation Plan

> **For agentic workers:** Execute task-by-task. Checkboxes for tracking.

**Goal:** Ship the 9 homepage polish items from `docs/superpowers/specs/2026-07-28-homepage-polish-v2-design.md`.

**Architecture:** Transitions.dev CSS in `styles.css`; small components under `frontend/src/components/`; wire in `App.tsx` / Header / ProjectMagazine / FAQ / ProcessSection.

**Tech Stack:** React, Vite, CSS, Source Serif 4 (Google Fonts), existing TiltCard optional on plan image.

## Global Constraints

- Work only in `/srv/kit-ai/worktrees/cursor-worker` on `task/homepage-polish-v2`.
- No deploy/docker/secrets. No lab/backend/metrika changes.
- `cd frontend && npm run build` must PASS.
- Prefer CSS in `styles.css` over document style injection.
- Asset already at `frontend/public/media/plans/plan-example.png`.

---

### Task 1: Font Source Serif 4

- Replace Zilla import with Source Serif 4.
- Set `--serif: "Source Serif 4", Georgia, serif;`
- Remove `.t-shimmer` Zilla override (inherit `--serif`).
- Commit.

### Task 2: IconSwap burger

- Add CSS `.t-icon-swap` from snippet to `styles.css`.
- Create `IconSwap.tsx` controlled by parent `state` (`a`/`b`) OR wrap menu button: iconA = hamburger bars, iconB = X.
- Wire `Header` `menu-button` to use IconSwap tied to `open`.
- Keep a11y labels.
- Commit.

### Task 3: Mobile hero

- CSS: hide `.hero-actions .button` (or whole discuss CTA) on mobile breakpoints used by site; keep phone link rules as today.
- Adjust `.hero-title` / `.hero-content` mobile: more top padding / center vertical bias.
- Do not remove `mobile-cta`.
- Commit.

### Task 4: Magazine chrome + expand icon

- Restyle `.magazine-controls` arrows: transparent bg, position on left/right edges of `.magazine-media`.
- Replace hint text with an SVG/expand icon (aria-label «На весь экран»).
- Commit.

### Task 5: Lightbox pinch-zoom

- Extend `ProjectLightbox`: track scale/translate; pinch via touch; double-tap toggle; pan when zoomed; horizontal swipe changes slide only when scale ≈ 1.
- Reset zoom on slide change / close.
- Commit.

### Task 6: NumberPopIn area

- Component `NumberPopIn.tsx` + CSS from snippet (no Animate demo button).
- Observe `dd` for area with IntersectionObserver; set `is-animating` once when visible.
- Commit.

### Task 7: Plan image

- Replace `ProjectPlan` SVG usage with `<img src="/media/plans/plan-example.png" alt="Пример планировочной схемы" />` inside existing TiltCard.
- CSS adapt to section (e.g. light/dark): `mix-blend-mode` / filter so it doesn’t look like a white card pasted on; keep readable.
- Keep disclaimer copy.
- Commit.

### Task 8: Process Nikita crop

- Soften first process card image: prefer `object-fit: contain` or higher `object-position` + less aggressive crop / smaller visual scale so head isn’t cut.
- Commit.

### Task 9: FAQ StaggerReveal

- Component wrapping answer paragraphs/lines; on `details` toggle open → `is-shown`; close → `is-hiding` then clear.
- Split answer into ~2 lines if single `<p>` (first sentence / rest) OR wrap whole `<p>` as line 1 and empty secondary only if needed — prefer split by sentences for stagger.
- Commit.

### Task 10: Build + push

- `npm run build`
- Push branch; report DONE with file list.

## Rollback

Revert branch commits / previous frontend image.
