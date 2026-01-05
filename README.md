# 🎲 God Roll

A 3D dice rolling game built with Three.js and React. Roll dice with realistic physics, and try to avoid rolling a total divisible by 7!

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
└── netlify.toml          # Netlify deployment config
```

## 🎯 Game Rules

| Condition          | Result                  |
| ------------------ | ----------------------- |
| Roll total % 7 ≠ 0 | Score added, gain 1 die |
| Roll total % 7 = 0 | **Game Over!**          |

## 📜 License

MIT
