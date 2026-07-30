# Two Projects (Олимпийская / Суздальское) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish two finished KIT houses — Олимпийская улица and Суздальское шоссе 12 — with all Drive webp photos on the homepage magazine.

**Architecture:** Download shared Google Drive folders into `frontend/public/media/projects/<slug>/` as sequential `img-NN.webp`, insert projects via Alembic `0013`, mark both slugs as «Готовый объект» in `App.tsx`. Same pattern as Павлов SKY / Dom Bezobrazova.

**Tech Stack:** Google Drive shared folders (already webp), Alembic/SQLAlchemy migrations, React homepage content API, Vite frontend build, `scripts/kit-merge.sh` + `scripts/kit-deploy.sh`.

## Global Constraints

- Both projects are **готовые объекты**.
- Use **all** photos from each Drive folder; files are **already webp** — do not re-encode unless corrupt.
- Summaries: neutral 1–2 sentences; **no invented area/year/metrics**.
- Tab order: Павлов → Репино → Олимпийская → Суздальское.
- Work only in `/srv/kit-ai/worktrees/cursor-worker` on branch `cursor/add-two-projects-drive-7d09`.
- No secrets, no Docker socket, deploy only via `scripts/kit-deploy.sh` after merge.
- Spec: `docs/superpowers/specs/2026-07-30-two-projects-olimpiyskaya-suzdalskoe-design.md`

---

### Task 1: Download and stage media

**Files:**
- Create: `frontend/public/media/projects/olimpiyskaya/img-NN.webp`
- Create: `frontend/public/media/projects/suzdalskoe-12/img-NN.webp`
- Temp only (do not commit): `.tmp/drive-olimpiyskaya/`, `.tmp/drive-suzdalskoe/`

**Interfaces:**
- Consumes: Drive folder IDs `1d8NYAdeAVG_sA7q0jeKYzMweSgjwuUSo`, `16pWk1Nou-zOjsADQG2F3k_8uSJ9yY8-S`
- Produces: numbered webp lists for migration media counts

- [ ] **Step 1: Verify cwd and branch**

```bash
pwd  # must be /srv/kit-ai/worktrees/cursor-worker
git branch --show-current  # cursor/add-two-projects-drive-7d09
```

- [ ] **Step 2: Download both shared folders**

Prefer `gdown --folder` if available; else Python/`curl` export. Save under `.tmp/`.

```bash
mkdir -p .tmp/drive-olimpiyskaya .tmp/drive-suzdalskoe
# example if gdown works:
gdown --folder 'https://drive.google.com/drive/folders/1d8NYAdeAVG_sA7q0jeKYzMweSgjwuUSo' -O .tmp/drive-olimpiyskaya
gdown --folder 'https://drive.google.com/drive/folders/16pWk1Nou-zOjsADQG2F3k_8uSJ9yY8-S' -O .tmp/drive-suzdalskoe
```

If download fails (auth/403): stop with `NO_CHANGE` and report blocker.

- [ ] **Step 3: Copy/rename to public media paths**

```bash
mkdir -p frontend/public/media/projects/olimpiyskaya frontend/public/media/projects/suzdalskoe-12
# Sort by original filename; copy only *.webp (and *.WEBP); name img-01.webp …
```

Prefer façade/exterior as `img-01.webp` when obvious; otherwise keep sorted filename order.

- [ ] **Step 4: Sanity-check counts and formats**

```bash
ls frontend/public/media/projects/olimpiyskaya | wc -l
ls frontend/public/media/projects/suzdalskoe-12 | wc -l
file frontend/public/media/projects/olimpiyskaya/img-01.webp
```

- [ ] **Step 5: Commit media only**

```bash
git add frontend/public/media/projects/olimpiyskaya frontend/public/media/projects/suzdalskoe-12
git commit -m "feat(media): add Олимпийская and Суздальское project webp galleries"
```

---

### Task 2: Alembic migration 0013

**Files:**
- Create: `backend/alembic/versions/0013_add_olimpiyskaya_suzdalskoe.py`
- Test: `backend/tests/test_migrations.py` (extend counts if file already asserts project media)

**Interfaces:**
- Consumes: media file counts from Task 1
- Produces: DB rows for slugs `olimpiyskaya` (`sort_order=8`) and `suzdalskoe-12` (`sort_order=9`)

- [ ] **Step 1: Write migration mirroring 0007**

```python
revision = "0013"
down_revision = "0012"
# INSERT projects + DELETE/INSERT project_media for both slugs
# cover_url = '/media/projects/<slug>/img-01.webp'
# published = true
```

Draft summaries (replace only if owner later edits):

- Олимпийская: short neutral line about a finished house on Олимпийская улица.
- Суздальское: short neutral line about a finished house on Суздальское шоссе, 12.

- [ ] **Step 2: Update migration test counts if present**

If `backend/tests/test_migrations.py` asserts project media totals, add assertions for the two new slugs matching file counts.

- [ ] **Step 3: Run backend tests when feasible**

```bash
cd backend && uv run pytest tests/test_migrations.py -q
```

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/0013_add_olimpiyskaya_suzdalskoe.py backend/tests/test_migrations.py
git commit -m "feat(db): publish Олимпийская and Суздальское project galleries"
```

---

### Task 3: Frontend ready-object badge

**Files:**
- Modify: `frontend/src/App.tsx` (status slug list near project mapping)

**Interfaces:**
- Consumes: API projects with new slugs after migration
- Produces: status `Готовый объект` for both new slugs

- [ ] **Step 1: Extend slug list**

```ts
status: ['pavlov-sky', 'dom-bezobrazova-repino', 'olimpiyskaya', 'suzdalskoe-12'].includes(project.slug || '')
  ? 'Готовый объект'
  : 'Концепция',
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(site): mark Олимпийская and Суздальское as finished objects"
```

---

### Task 4: Ship

**Files:** none new

- [ ] **Step 1: Push branch**

```bash
git push -u origin cursor/add-two-projects-drive-7d09
```

- [ ] **Step 2: Open/update PR into `main`**

Title: `feat(projects): add Олимпийская and Суздальское galleries`

- [ ] **Step 3: Merge via kit wrapper**

```bash
scripts/kit-merge.sh --allow-no-checks <PR>
```

- [ ] **Step 4: Deploy**

```bash
git fetch origin main
scripts/kit-deploy.sh "$(git rev-parse origin/main)"
```

- [ ] **Step 5: Smoke**

Confirm `/api/content` includes both slugs with media; homepage tabs show finished status.

---

## Done when

- Both galleries live on production homepage after Павлов and Репино.
- Build green; deploy SHA recorded.
- No Drive credentials committed; `.tmp/` not committed.
