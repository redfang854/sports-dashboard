# Scoreboard — MMA + F1 Sports Dashboard

A live sports dashboard built with React + Vite, tracking UFC fight results and Formula 1 championship standings.

**Live demo:** [your-url.vercel.app](https://your-url.vercel.app)

## Features

- **Live countdown timers** to next UFC event and next Grand Prix
- **UFC results** — recent fight cards with method, round, and time
- **Fighter profile cards** — tap any fighter for record, stats, and bio
- **F1 championship standings** — drivers and constructors with visual bar charts
- **Driver profile cards** — tap any driver for season stats and context
- **Responsive** — works on mobile and desktop

## Tech Stack

- React 18
- Vite
- CSS Modules
- Deployed on Vercel

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy

```bash
npx vercel
```

## Project Structure

```
src/
├── data/index.js          # All sports data
├── hooks/useCountdown.js  # Countdown timer hook
├── components/
│   ├── Countdown.jsx      # Countdown card component
│   └── Modal.jsx          # Fighter + driver profile modals
├── views/
│   ├── MmaView.jsx        # UFC tab
│   └── F1View.jsx         # Formula 1 tab
└── App.jsx                # Root with sticky header and tab nav
```

## Data Sources

- UFC event results: TheSportsDB API
- F1 standings: Official Formula 1 sources
- Fight stats: UFC.com
