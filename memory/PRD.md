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
- **Banner (current design):**
  - Horizontal auto-scrolling carousel of projects from `/api/news`, driven by a
    single `requestAnimationFrame` clock (transform + colour share one timeline).
  - Sharp `object-contain` central image per panel; no per-panel blur.
  - **Animated background colour that matches the on-screen photo**: backend
    computes each image's dominant colour (Pillow, quantize) and returns it as
    `color` in `/api/news`; frontend interpolates RGB between the current and
    next panel's colour based on scroll fraction → always matches + smooth blend,
    no hard transitions.
  - Subtle static radial/linear overlay for depth (reads as a gradient).
  - Wobbling logo top-left. **Logo hover popup removed.** Pause on hover.
  - Fallback slides only when the API returns 0 projects.

## Backend colour extraction
- `dominant_color(url)` in `server.py`: downloads image, thumbnails to 90px,
  `quantize(6, FASTOCTREE)`, picks most frequent non-near-black colour. Cached
  per URL in `_color_cache` (module-level).

## Notes / gotchas
- The Emergent screenshot_tool's headless browser cannot reach the `/api/*`
  proxy in this environment (fetch hangs), so the app appears stuck "loading"
  there. Verified working via local Python Playwright instead
  (`/pw-browsers`, run `python3 /tmp/shot.py`). API is fast server-side (~0.7s).

## Backlog / future
- P2: Soften the vertical seam between adjacent blurred backgrounds during scroll.
- P2: Optional manual controls (prev/next) if user wants interactivity.
