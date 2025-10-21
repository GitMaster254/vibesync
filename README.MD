VibeSync
=================

A modern, offline-friendly music player PWA built with React, TypeScript, Vite, Tailwind, shadcn/ui, Zustand, and Framer Motion.

Quick start
-----------

Prerequisites:
- Node.js 18+ and npm 9+

Install and run:

1. Install dependencies
	 - npm install
2. Start the dev server
	 - npm run dev
3. Build for production
	 - npm run build
4. Preview the production build
	 - npm run preview

Deploy to Vercel:
- See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide
- Serverless functions in `/api` folder handle metadata extraction
- Auto-deploys from GitHub with zero configuration

Tech stack
----------
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui (Radix primitives)
- Zustand for player state
- idb for IndexedDB storage
- Framer Motion for animations
- Vite PWA plugin for installable app behavior

Project structure
-----------------
- src/
	- components/           Reusable UI (shadcn-based) and app widgets
	- pages/                Route pages (Player, Library, Settings, etc.)
	- store/                Zustand player store
	- lib/                  Core helpers (audio, db, utils, karaoke effects)
	- hooks/                Custom hooks
	- index.css, App.tsx    App shell

Key features
------------
- Local music library (IndexedDB) with metadata
- Global audio singleton to prevent multiple audio instances
- Full-screen player with karaoke mode
- Selectable karaoke transition effects (Settings)
- Mini player (now playing) with smooth transitions
- Theme and UI built on Tailwind + shadcn/ui

Development workflow
--------------------
Branching:
- main is protected. Create feature branches from main (e.g., feature/karaoke-countdown).

Commits:
- Keep messages clear and scoped. Conventional commits are welcome (feat:, fix:, chore:), but not enforced.

Pull requests:
- Open PRs against main. Include a short description, screenshots/GIFs for UI changes, and testing notes.
- Keep PRs focused; avoid large unrelated diffs.

Coding standards
----------------
- TypeScript: prefer explicit types for public APIs.
- State: use Zustand store in src/store/usePlayerStore.ts for player state.
- Audio: use the global singleton in src/lib/audio.ts; do not instantiate new Audio elements in components.
- Styling: Tailwind first; create/compose shadcn components under src/components/ui when needed.
- Animations: Framer Motion. Prefer shared element transitions where appropriate.
- Linting: run npm run lint and address warnings.

Environment & configuration
---------------------------
- No secrets required. PWA configuration lives in public/manifest.json and vite.config.ts (vite-plugin-pwa).
- The app stores user media in IndexedDB (via idb). Files aren’t uploaded.

Testing
-------
- Vitest is not yet set up. Planned tasks:
	- Add Vitest config in vite.config.ts
	- Unit tests for player actions (playTrack, nextTrack, repeat/shuffle)

PWA & offline notes
-------------------
- Installable on desktop and mobile via the browser’s install prompt.
- Media files are persisted in the browser via IndexedDB. Clearing site data removes them.

Karaoke mode tips
-----------------
- Enter karaoke by swiping left on album art in the Player page.
- On entry, playback pauses and seeks to 0. Press play to trigger a 3-2-1 countdown with fade effects, then playback starts.
- At track end, playback pauses (no auto-advance) and a performance score is shown.
- Choose visual transition effects in Settings.

Scripts
-------
- npm run dev       Start dev server
- npm run build     Build for production
- npm run preview   Preview the production build
- npm run lint      Run ESLint

Troubleshooting
---------------
- Audio doesn’t play after selecting a file:
	- Ensure the file loads correctly; check the browser console for errors from the global audio hook.
- Two tracks playing at once:
	- Ensure no component creates a new Audio element; the app uses a singleton (src/lib/audio.ts).
- Animations feel janky:
	- We use Framer Motion shared element transitions for the mini/full player. If you see regressions, capture a screen recording and include details in your PR.

Collaborators
-------------
- Forks or direct branches are both fine depending on your access. If you’re invited as a collaborator, push branches to this repo and open PRs to main.
- Before merging, ensure dev server runs without TypeScript errors (npm run dev) and lint passes (npm run lint).

License
-------
- TBD