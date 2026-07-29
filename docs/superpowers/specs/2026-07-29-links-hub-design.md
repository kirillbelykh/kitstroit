# Design: KIT links hub (`/links`)

Date: 2026-07-29  
Status: approved by owner  
Owner: Кирилл  
Risk: L1 (new static marketing route) → L3 only if deploy requested

## Goal

A single shareable “tap link” page for offline and chat: QR or URL → one mobile-first screen with KIT brand and four actions (site, Telegram, Max, phone). Used when people ask where to find projects / contacts.

## Non-goals

- No Linktree or third-party host.
- No new domain or subdomain in v1.
- No lead form, CMS, or editable link admin.
- No generated QR asset in v1 (owner can print any QR pointing at the URL).
- No new product claims beyond existing site copy.

## URL

`https://kitstroit.ru/links`

SPA routing mirrors `/privacy`: dedicated page component selected in `main.tsx` by pathname. Nginx `try_files` already serves SPA routes.

## Content (fixed)

| Label | Action |
|---|---|
| Сайт | `https://kitstroit.ru` |
| Telegram | `https://t.me/kitstroit` |
| Max | `https://6max.ru/kit_stroit` |
| Позвонить | `tel:+79650130333` (display `8 (965) 013-03-33`) |

Eyebrow / support line: building houses turnkey in SPb & LO (match existing site voice; no new guarantees).

## Visual design

- Reuse site tokens: `--ink`, `--bone`, `--brass`, `--serif` (Source Serif 4), existing logo mark.
- One composition, full-bleed atmosphere (subtle ink/bone gradient or soft photo wash from existing hero media if cheap; no purple/cream AI-slop, no card grid clutter).
- Brand KIT as hero-level signal; then short line; then vertical stack of full-width link rows (not cards-in-hero).
- Primary row treatment: bone text on ink, brass accent on hover/focus; min tap height 52px.
- Phone row uses `tel:` so mobile dials immediately.
- Footer: small link back to home optional; keep quiet.

## Analytics

Keep Metrika init for non-admin/non-lab routes (same as `/privacy`). Optional: `cta_click` / `phone_click` / `telegram_click` if hooks already exist and wiring is one-liner; do not invent new event names.

## Acceptance

1. `/links` renders without React router library changes beyond `main.tsx` branch.
2. Four actions work on mobile.
3. Visual language matches production homepage (fonts, colors, logo).
4. `npm run build` passes.
5. No secrets; no deploy until owner phrase if not already authorized in-thread.

## Rollback

Revert the PR / redeploy previous main SHA.
