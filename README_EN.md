[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster

TypeMaster is an English typing trainer built around an `AI Training Studio` flow. The current codebase already includes the refreshed `Home / Practice / Result / Insights` experience, with a focus on a clearer training loop, more reliable coaching feedback, and smoother desktop and mobile interactions.

It supports two main practice paths:

- `Built-in word practice`: available without AI
- `AI workshop`: choose a template and difficulty, generate English text, then start the drill

## What The Current App Includes

### Product features

- `Dual-entry home page`: jump into AI practice or a quick built-in drill, while surfacing the latest advice, recent 7-session summary, and recent sessions
- `Practice workspace`: the practice page is split into config controls, an AI workshop, and the typing area, with a clear 3-step AI flow
- `AI practice state management`: supports `idle / loading / ready / stale / error`, and requires regeneration after config changes
- `Result feedback`: shows WPM, raw WPM, accuracy, consistency, character breakdown, trend charts, and coaching advice
- `Coaching fallback`: if AI advice fails, the result page falls back to deterministic local guidance with an explicit status
- `Insights page`: aggregates the latest advice, 7/30-session trends, best WPM, average accuracy, AI usage share, top error chars/words, and recent history
- `Bilingual UI`: supports `简体中文 / English`, and persists language settings locally
- `Local persistence`: settings, the latest 50 sessions, and the latest 50 coach records are stored in `localStorage`
- `Desktop / mobile split UX`: desktop keeps an embedded typing feel, while mobile uses an explicit input field for soft-keyboard scenarios

### Technical features

- `React 18 + Vite` frontend
- `React Router data router + hash URLs`, so routes look like `#/practice`
- `Local Node proxy` via [`server.js`](./server.js) for `/api/chat`
- `Vercel Serverless proxy` via [`api/chat.js`](./api/chat.js)
- `Local engine layer` in `src/engine/` for draft generation, metrics, insights, and deterministic coaching

## Pages And Core Flow

### Pages

- `Home /`: dual-entry landing page and recent overview
- `Practice /practice`: config panel, AI workshop, typing area
- `Result /result`: summary, issues, strengths, next drill, trend chart
- `Insights /insights`: long-term performance and error hotspots
- `Legacy /coach`: compatibility redirect to `/insights`

### AI practice loop

1. Open the practice page and switch to `AI`
2. Choose a template and difficulty
3. Generate a practice draft
4. Complete a session
5. Let the result page request AI coaching
6. Fall back to local coaching if AI is unavailable
7. Launch the `next drill` directly from the result page

## Project Structure

```text
typemaster/
├─ api/
│  └─ chat.js                    # Vercel Serverless AI proxy
├─ docs/
│  └─ v2-major-update-plan.md    # Historical planning document
├─ src/
│  ├─ components/                # Header, settings drawer, charts, dialogs, typing UI
│  ├─ data/                      # Static datasets such as the built-in word bank
│  ├─ engine/                    # Config, draft generation, metrics, insights, local coach rules
│  ├─ hooks/                     # Typing session timing and input control
│  ├─ i18n/                      # Chinese / English copy and format helpers
│  ├─ pages/                     # Home / Practice / Result / Insights
│  ├─ services/                  # AI calls, storage, cloud contract stubs
│  ├─ store/                     # Global business orchestration
│  ├─ App.jsx                    # App shell and routing
│  └─ main.jsx                   # Frontend entry
├─ index.css                     # Global styles and theme system
├─ server.js                     # Local static server + /api/chat proxy
├─ package.json
└─ README.md / README_EN.md
```

## Requirements

- Node.js `18+`
- npm `9+` or a compatible version

## AI Configuration

If you only want built-in word practice, you can skip this section.  
If you want to enable the `AI workshop` or `AI coaching`, provide:

- `AI_API_KEY`
- `AI_API_URL`

You can configure them in either of these ways:

### Option 1: local `config.js`

Create `config.js` in the project root:

```js
module.exports = {
  AI_API_KEY: "your_key_here",
  AI_API_URL: "your_url_here"
};
```

Notes:

- `config.js` is ignored by `.gitignore`
- both [`server.js`](./server.js) and [`api/chat.js`](./api/chat.js) try to read it first

### Option 2: environment variables

```bash
AI_API_KEY=your_key_here
AI_API_URL=your_url_here
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start the local API proxy

Terminal A:

```bash
npm run api
```

Default address:

```text
http://localhost:8080
```

### 3. Start the frontend dev server

Terminal B:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/#/
```

Notes:

- during development, Vite proxies `/api` to `http://localhost:8080`
- the app uses hash-based routing, so URLs appear as `#/...`

## Build And Run

### Build the frontend

```bash
npm run build
```

### Serve the built app

```bash
npm run serve
```

Open:

```text
http://localhost:8080/#/
```

### One-command mode

```bash
npm start
```

Notes:

- `npm start` runs `npm run build` first
- then starts [`server.js`](./server.js)

## Available Scripts

```bash
npm run dev      # Start the Vite frontend dev server
npm run api      # Start the local Node proxy
npm run build    # Build the frontend into dist/
npm run preview  # Preview the build with Vite
npm run serve    # Serve dist/ and expose /api/chat via server.js
npm start        # Build first, then serve
npm test         # Run unit tests
npm run test:coverage  # Run unit tests with coverage report
```

## Data And State Contracts

### Local storage

- `settings`: theme, font scale, focus mode, language, and last practice config
- `sessions`: latest 50 session records
- `coachAdvices`: latest 50 coach advice records

### Key status contracts

- `aiPracticeStatus = idle | loading | ready | stale | error`
- `coach status = idle | loading | success | fallback | error`

The UI consumes these explicit states instead of inferring state from side effects.

## Architecture Notes

### Frontend layers

- `pages`: route-level screens
- `components`: reusable UI parts
- `hooks`: typing, focus, timing, and completion orchestration
- `store`: config, draft, history, AI status, and coaching status orchestration
- `services`: AI requests, storage, and cloud contract placeholders
- `engine`: typing rules, draft generation, metrics, trends, and insights

### Proxy layer

- [`server.js`](./server.js): local Node proxy for development and local serving
- [`api/chat.js`](./api/chat.js): Vercel Serverless version

Both follow the same payload whitelist so the frontend only forwards safe fields to the upstream model API.

## Current Limitations

- No account system yet
- No cross-device sync yet
- `challenge / sync` are still frontend contract stubs
- Automated test suite is in early stages, currently covering only the engine core modules
- `package.json` still reports version `2.0.0`, even though the app flow has already moved to the refreshed experience

## Suggested Reading Order

If you are onboarding to this project, read the code in this order:

1. [`src/App.jsx`](./src/App.jsx)
2. [`src/store/practice-store.jsx`](./src/store/practice-store.jsx)
3. [`src/pages/PracticePage.jsx`](./src/pages/PracticePage.jsx)
4. [`src/hooks/useTypingSession.jsx`](./src/hooks/useTypingSession.jsx)
5. [`src/engine/`](./src/engine)
6. [`src/services/ai-service.js`](./src/services/ai-service.js)
7. [`server.js`](./server.js) / [`api/chat.js`](./api/chat.js)

## Related Docs

- Historical planning doc: [docs/v2-major-update-plan.md](./docs/v2-major-update-plan.md)

---

TypeMaster is currently a solid frontend baseline for iterating on `AI coaching + local training data`. The next logical expansion areas are account systems, sync, challenge mechanics, and more specialized drill modes.
