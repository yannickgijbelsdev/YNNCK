# PRD — Saffron / Koodh Banner

## Problem statement
Full-screen banner section for a design agency. Pivoted from a static Saffron
clone to a dynamic, gradient-backed, horizontally auto-scrolling carousel of
projects fetched from the Koodh `homepagina` API. User language: **Dutch**.

## Architecture
- Frontend: React + Tailwind. Single component `src/components/Banner.jsx`,
  animations in `src/index.css`.
- Backend: FastAPI (`server.py`) proxies two external HTTP APIs so the HTTPS
  frontend avoids mixed-content:
  - `GET /api/news` → Koodh `homepagina` (projects for the carousel)
  - `GET /api/popup-logo` → Koodh `popup-logo` (logo hover popup content)
- MongoDB present but unused for core features.

## Implemented (2026-06)
- Backend HTTP→HTTPS proxies (`/api/news`, `/api/popup-logo`).
- Wobbling logo (top-left) with hover popup pulling `/api/popup-logo`.
- **Banner redesign (this session):**
  - Neutral dark radial gradient background (visible while images load / as base).
  - Horizontal auto-scrolling carousel of projects from `/api/news`.
  - Each panel: sharp `object-contain` central image + blurred version of the
    SAME image as full-bleed background + subtle dark gradient overlay.
  - Seamless loop via duplicated panels + `translateX(-50%)` on a `w-max` track;
    pauses on hover. No added titles or icons.
  - Fallback slides only when the API returns 0 projects.

## Notes / gotchas
- The Emergent screenshot_tool's headless browser cannot reach the `/api/*`
  proxy in this environment (fetch hangs), so the app appears stuck "loading"
  there. Verified working via local Python Playwright instead
  (`/pw-browsers`, run `python3 /tmp/shot.py`). API is fast server-side (~0.7s).

## Backlog / future
- P2: Soften the vertical seam between adjacent blurred backgrounds during scroll.
- P2: Optional manual controls (prev/next) if user wants interactivity.
