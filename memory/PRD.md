# PRD — Jungle Carousel Banner

## Problem statement
Auto-scrolling carousel of project images fetched from `/api/news` (no titles/icons). A dynamic animated gradient background shifts to match the dominant color of the currently centered image. Gradient sits as a semi-transparent overlay over a barely-visible jungle base background. Jungle plant assets decorate the logo, screen edges, and images with realistic shaking animations.

## Language
User communicates in Dutch. All user-facing messages must be in Dutch.

## Architecture
- Frontend: React + Tailwind. Main UI in `src/components/Banner.jsx`; custom animations in `src/index.css`.
- Backend: FastAPI `server.py`, proxies external Koodh news API via `GET /api/news`, injects `dominant_color` per image using Pillow.
- Core sync: single `requestAnimationFrame` loop in `Banner.jsx` drives BOTH horizontal scroll and background color interpolation. DO NOT alter this logic.
- Assets: `src/assets/` and `src/assets/plants/` (9 plant PNGs).

## Implemented (2026-07-21)
- Auto-scrolling horizontal carousel with rAF-synced background color gradient (existing).
- Jungle base background opacity lowered to 0.13 (barely visible).
- Plant decorations added to `Banner.jsx`: hanging vines (top), palm (bottom-left), fern (bottom-right), bush (bottom-left), monstera leaf accent near logo.
- Shaking/sway CSS animations (`plant-shake-a`, `plant-shake-b`, `vine-sway`) with staggered timings for organic feel.
- Verified via screenshot; layout renders correctly.

## Backlog
- P2: Subtle parallax on plants tied to scroll position.
- P2: Mobile-specific plant sizing/positioning refinement.

## Integrations
- Koodh News API (external, no keys) proxied via `/api/news`.
