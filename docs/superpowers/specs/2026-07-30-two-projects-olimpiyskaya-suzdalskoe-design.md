# Design: add two finished projects (Олимпийская / Суздальское)

Date: 2026-07-30  
Status: draft for owner review  
Risk: L1 (content + media in task branch) → L3 deploy after merge when owner says пересборка

## Goal

Publish two real finished KIT houses on the homepage project magazine:

1. **Олимпийская улица** — Drive folder `1d8NYAdeAVG_sA7q0jeKYzMweSgjwuUSo`
2. **Суздальское шоссе 12** — Drive folder `16pWk1Nou-zOjsADQG2F3k_8uSJ9yY8-S`

## Owner decisions (brainstorming)

| Topic | Decision |
|---|---|
| Status | Both are **готовые объекты** (same badge as Павлов SKY / Репино) |
| Copy | Agent drafts neutral 1–2 sentence summaries (no invented area/year/metrics) |
| Photos | **All** files from each Drive folder |
| Format | Photos are **already webp** — do not re-encode unless a file is corrupt |
| Tab order | After current finished projects: Павлов → Репино → Олимпийская → Суздальское → … |

## Approach

Follow the established Pavlov / Dom Bezobrazova pattern (not Drive hotlinks, not admin-only DB writes):

1. Download shared Drive folders into the worker.
2. Place files under `frontend/public/media/projects/<slug>/` with stable names `img-01.webp`, `img-02.webp`, …
3. Add Alembic migration `0013_add_olimpiyskaya_suzdalskoe.py` inserting `projects` + `project_media`.
4. Extend frontend «Готовый объект» slug list in `frontend/src/App.tsx`.
5. Build, commit, push, merge, deploy via kit wrappers when owner requests пересборка.

## Data model (public content)

| Field | Олимпийская улица | Суздальское шоссе 12 |
|---|---|---|
| `slug` | `olimpiyskaya` | `suzdalskoe-12` |
| `title` | Олимпийская улица | Суздальское шоссе 12 |
| `location` | Prefer concrete district if visible from media/folder; else `Санкт-Петербург и ЛО` | same rule |
| `area` | `''` until owner provides | `''` |
| `year` | `''` until owner provides | `''` |
| `cover_url` | First suitable façade/exterior frame (`img-01.webp` after ordering) | same |
| `sort_order` | `8` | `9` |
| `published` | `true` | `true` |
| `summary` | Neutral editorial draft from address + visible architecture; no area/timeline/warranty claims | same |

Media rows: one `project_media` row per webp, `kind=image`, `sort_order = index * 10`, alt like `Олимпийская улица — кадр N`.

## Frontend

- Homepage already loads `/api/content` projects; no new UI component.
- Update ready-object badge:

```ts
['pavlov-sky', 'dom-bezobrazova-repino', 'olimpiyskaya', 'suzdalskoe-12']
```

- Keep existing magazine swipe / cover crop / lightbox behavior unchanged.

## Media pipeline

- Source: owner shared Drive folders (already webp).
- Naming: sequential `img-NN.webp` (zero-padded). Preserve readable order if Drive names imply sequence; otherwise stable sort by original filename.
- Cover: prefer an exterior/façade still; if unclear, use the first file after sort.
- Track binaries in git like existing project galleries.
- Do **not** commit Drive credentials, `.env`, or temporary download caches outside `frontend/public/media/projects/`.

## Content rules

- Do not invent area, year, client names, budgets, or guarantees.
- Summaries are **editorial drafts** until Kirill reviews them before paid traffic.
- Only publish photos from the provided folders; no stock/AI stand-ins labeled as these objects.

## Tests / verification

- `cd frontend && npm run build`
- Backend: migration upgrade on deploy path; optional `uv run pytest` if media-count assertions are added (mirror Pavlov media count checks only if cheap).
- Smoke: `/api/content` returns both projects with media arrays; homepage tabs show four ready objects in agreed order.

## Rollback

- Revert migration / redeploy previous `main` SHA.
- Or set `published=false` for the two slugs if a soft hide is enough.

## Out of scope

- Google Drive MCP / live Drive sync
- Admin UI uploader changes
- New homepage section layouts
- Filling area/year without owner facts

## Open execution notes

- If a Drive folder is not publicly downloadable from the worker, stop with `NO_CHANGE` and ask Kirill for zip/upload access.
- Exact photo counts unknown until download; migration lists whatever files land in each slug directory.
