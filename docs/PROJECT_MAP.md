# KIT project map

Read this first. Do not re-explore the whole repo for routine site tasks.

## Workroot

- Only work in `/srv/kit-ai/worktrees/cursor-worker`
- Never production checkout, Docker socket, secrets, VPN, firewall, billing
- Branches: `cursor/<name>-7d09` (Cloud) or `task/<name>` (local kit process)
- Base: `main`
- Ship: `scripts/kit-merge.sh [--allow-no-checks] <PR>` then `scripts/kit-deploy.sh <40-char-main-sha>`
- Owner approve words for merge/deploy: «ок», «merge», «мержи», «деплой», «пересобери»

## Product

- Brand: KIT / kitstroit.ru
- Offer: строительство домов **и** отделка квартир под ключ (СПб + ЛО), с 2013
- Funnel: site → call / lead form → CRM

## Stack

- Frontend: React + Vite + TS — `frontend/src/App.tsx`, `frontend/src/styles.css`
- Public media: `frontend/public/media/projects/<slug>/`
- Backend: FastAPI — `backend/app/`
- Content API: `GET /api/content` (sections + projects + media)
- DB changes: Alembic under `backend/alembic/versions/` (current head evolves; check latest `001x_*.py`)

## Homepage structure (`App.tsx`)

1. Hero
2. Founder
3. Project magazine (`#projects`) — tabs + gallery + lightbox
4. Video
5. Process (`#process`) — steps const in `App.tsx`
6. Proof / advantages
7. Guarantees
8. FAQ
9. Lead form
10. Contacts + footer

## Projects (live slugs)

| Tab order | Slug | Notes |
|-----------|------|--------|
| 01 | `pavlov-sky` | |
| 02 | `dom-bezobrazova-repino` | |
| 03 | `olimpiyskaya` | cover `img-08`; no `img-01`/`img-02` |
| 04 | `suzdalskoe-12` | cover `img-19`; no `img-13`/`img-15` |

Gallery display order = `[cover_url, ...media urls]` with Set dedupe.
`MEDIA_CACHE_VERSION` in `App.tsx` busts media cache after gallery edits.

## Copy rules (owner)

- Hero: no eyebrow «Строим дома с 2013»; body = «Строительство домов и отделка квартир под ключ с 2013 года»
- No project summary paragraphs
- CTA: «Обсудить похожий проект»
- Process / FAQ / footer: houses + apartments
- No tilt on project photos (TiltCard removed)

## Agent operating style

1. Load this map + Mind facts before exploring
2. Touch only files the task needs
3. Prefer delete/reuse over new abstractions
4. After gallery/media/copy changes: migration if DB, commit, push, PR, merge+deploy when owner asks

## Memory

- Preferred durable memory: **Mind** MCP only
- Do not re-install Serena/shadcn/Context7/Higgsfield for routine work
- Basic Cursor skills only (`~/.cursor/skills-cursor`); no Superpowers / taste / ui-ux skill packs
