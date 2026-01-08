# 🎲 God Roll

A 3D dice rolling game built with Three.js and React. Roll dice with realistic physics, and try to avoid rolling a total divisible by 7!

**🎮 Play now: [https://god-roll.com/](https://god-roll.com/)**

![God Roll](https://img.shields.io/badge/Game-Dice%20Roller-green)

## 🎮 How to Play

1. Click **Roll** to throw the dice
2. Each round, you gain 1 additional die
3. Your score accumulates with each roll
4. **Game Over** if your roll total is divisible by 7!
5. Try to get the highest score possible

## ✨ Features

- **3D Physics** - Realistic dice rolling with bounce and spin
- **Craps-style Throws** - Dice shoot across the table left to right
- **Cryptographic Randomness** - Uses Web Crypto API for truly unpredictable rolls
- **Progressive Difficulty** - More dice each round = higher risk
- **Clean UI** - Minimalist green theme
- **Secure Leaderboard** - HMAC signature verification and rate limiting prevent cheating

## 🛠️ Tech Stack

- **React 19** + TypeScript
- **Three.js** for 3D rendering
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Nx** monorepo

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
npm install
```

### Environment Setup

For online leaderboard features, copy the example environment file and configure:

```bash
cd apps/web
cp .env.example .env
# Edit .env with your Supabase credentials
```

Required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_SCORE_SIGNING_SECRET` - Secret key for HMAC signature (generate with `openssl rand -hex 32`)

**Note**: The `SCORE_SIGNING_SECRET` must also be set in your Supabase Edge Function environment.

### Development

```bash
npm run dev:web
```

Open [http://localhost:4200](http://localhost:4200)

### Build

```bash
npm run build:web
```

### Test

```bash
npm run test
```

## 📁 Project Structure

```
god-roll/
├── apps/
│   ├── web/              # React frontend
│   │   └── src/
│   │       └── components/
│   │           └── DiceRoller/   # Main game component
│   ├── web-e2e/          # Playwright E2E tests
│   └── api/              # Express backend (optional)
├── packages/             # Shared libraries
├── supabase/             # Supabase Edge Functions
│   └── functions/
│       └── submit-score/ # Secure score submission endpoint
└── netlify.toml          # Netlify deployment config
```

## 🔒 Security Features

The leaderboard system includes multiple security measures to prevent cheating:

1. **HMAC Signature Verification** - All score submissions must include a valid HMAC-SHA256 signature
2. **Rate Limiting** - IP-based rate limiting (5 requests per minute)
3. **Timestamp Validation** - Prevents replay attacks (5-minute window)
4. **Server-side Validation** - Score sanity checks, duplicate session detection
5. **Session Tracking** - Prevents multiple submissions from the same game session

See [TESTING_SECURITY.md](TESTING_SECURITY.md) for detailed testing guide.

## 🎯 Game Rules

| Condition          | Result                  |
| ------------------ | ----------------------- |
| Roll total % 7 ≠ 0 | Score added, gain 1 die |
| Roll total % 7 = 0 | **Game Over!**          |

## 📜 License

MIT
