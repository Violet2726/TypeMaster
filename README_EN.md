[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster 2.0

TypeMaster 2.0 is an `AI coach` driven typing trainer.  
The project has already moved from the old single-file frontend into a `React + Vite + Node API Proxy` architecture and now includes the first major 2.0 delivery slice:

- AI workshop
- React-based practice / result / coach pages
- Automatic AI coaching after each session
- Local history and settings persistence
- “Next drill” handoff from coaching to the next practice

## What This Version Includes

### Product capabilities

- `Built-in word practice`: works even without AI
- `AI workshop`: choose topic template, difficulty, punctuation, and numbers
- `Result diagnostics`: automatically generates a summary, issues, strengths, and a next drill suggestion
- `Coach page`: shows the latest full coaching advice and recent session summaries
- `Local persistence`: the latest 50 sessions, settings, and coach records are stored in browser localStorage

### Technical capabilities

- `React + Vite`: component-based frontend with HashRouter
- `Node API Proxy`: local `/api/chat` proxy through `server.js`
- `Vercel Serverless`: deployment-ready proxy through `api/chat.js`
- `Local fallback coach`: if AI coaching fails, the result page falls back to deterministic local advice

## Project Structure

```text
typemaster/
├─ api/
│  └─ chat.js                    # Vercel Serverless proxy
├─ docs/
│  └─ v2-major-update-plan.md    # 2.0 planning document
├─ src/
│  ├─ components/                # Shared UI components
│  ├─ data/                      # Static data, such as the built-in word list
│  ├─ engine/                    # Practice engine: config, draft, rendering, metrics, coach rules
│  ├─ hooks/                     # React business hooks
│  ├─ pages/                     # Route-level pages
│  ├─ services/                  # AI service, local storage, cloud contract stubs
│  ├─ store/                     # Global business state
│  ├─ App.jsx                    # Root application component
│  └─ main.jsx                   # Frontend entry
├─ index.css                     # Global styles and theme system
├─ index.html                    # Vite HTML entry
├─ server.js                     # Local Node proxy + static asset server
├─ vite.config.js                # Vite configuration
├─ package.json
└─ README.md / README_EN.md
```

## Requirements

- Node.js `18+`
- npm `9+` or a compatible version

## AI Configuration

If you only want to use built-in word practice, you can skip this.  
If you want to use the `AI workshop` and `AI coach`, provide:

- `AI_API_KEY`
- `AI_API_URL`

You can configure them in one of two ways:

### Option 1: local `config.js`

```js
module.exports = {
  AI_API_KEY: "your_key_here",
  AI_API_URL: "your_url_here"
};
```

Notes:
- `config.js` is ignored by `.gitignore`
- both `server.js` and `api/chat.js` will try to read it first

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

### 2. Start the API proxy

Run in terminal A:

```bash
npm run api
```

Default address:

```text
http://localhost:8080
```

### 3. Start the frontend dev server

Run in terminal B:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/#/
```

Notes:
- During development, Vite proxies `/api` to `http://localhost:8080`
- HashRouter is enabled, so routes appear as `#/...`

## Run the Built App

### Build the frontend

```bash
npm run build
```

### Start the local static server + API proxy

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
- then starts `server.js`

## Available Scripts

```bash
npm run dev      # Start the Vite frontend dev server
npm run api      # Start the local Node proxy server
npm run build    # Build the frontend into dist/
npm run preview  # Preview the built frontend with Vite
npm run serve    # Serve dist/ and expose /api/chat through server.js
npm start        # Build first, then serve
```

## Core Product Flow

### Practice flow

1. The user chooses `Built-in` or `AI` practice on the practice page
2. In AI mode, the user selects a template and difficulty
3. When a session completes, it is written to local history
4. The result page automatically triggers AI coaching
5. If AI fails, the app falls back to local deterministic coaching
6. The user can click “Next drill” to jump directly into the next AI practice

### Data flow

- `settings`: stored in localStorage
- `sessions`: latest 50 sessions stored in localStorage
- `coachAdvices`: latest 50 coach records stored in localStorage
- `challenge / sync`: currently frontend contracts only, no real backend yet

## Architecture Notes

### Frontend layers

- `pages`: route-level entry points
- `components`: reusable presentation components
- `hooks`: timing and interaction orchestration
- `store`: global business coordination
- `services`: AI, storage, and cloud contract stubs
- `engine`: practice rules, metrics, draft generation, and local coach heuristics

### Backend proxy

- `server.js`: local Node server for static assets and `/api/chat`
- `api/chat.js`: Vercel Serverless proxy

Both use the same whitelist strategy and allow these frontend fields:

- `messages`
- `stream`
- `temperature`
- `max_tokens`
- `response_format`
- `model`

## Docs

- 2.0 planning document: [docs/v2-major-update-plan.md](./docs/v2-major-update-plan.md)

## Current Limitations

- No real account system yet
- No cross-device sync yet
- No real challenge backend yet
- No automated test suite yet

## Suggested Reading Order

If you are onboarding to this project as a developer, read in this order:

1. `src/App.jsx`
2. `src/store/practice-store.jsx`
3. `src/hooks/useTypingSession.jsx`
4. `src/engine/`
5. `src/services/ai-service.js`
6. `server.js` / `api/chat.js`

---

TypeMaster 2.0 is currently at the stage where the first 2.0 slice is implemented and ready for further expansion along the AI coach direction.
