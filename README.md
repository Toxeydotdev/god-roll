# God Roll

A full-stack monorepo built with Nx, featuring a React frontend and Express backend.

## Tech Stack

### Frontend (`apps/web`)

- **React 19** with TypeScript
- **Vite** for fast development and builds
- **TanStack Query** for server state management
- **React Router DOM** for routing
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Vitest** for unit testing
- **Playwright** for E2E testing

### Backend (`apps/api`)

- **Express.js** with TypeScript
- **Node.js** runtime

### Tooling

- **Nx** for monorepo management
- **oxlint** for fast linting
- **TypeScript** for type safety

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
npm install
```

### Development

Run the frontend:

```bash
npm run dev:web
# or
nx serve @god-roll/web
```

Run the backend:

```bash
npm run dev:api
# or
nx serve @god-roll/api
```

### Build

Build all projects:

```bash
npm run build
```

Build individual projects:

```bash
npm run build:web
npm run build:api
```

### Testing

Run all tests:

```bash
npm run test
```

### Linting

Lint the codebase:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

### Nx Commands

View the project graph:

```bash
npm run graph
```

## Project Structure

```
god-roll/
├── apps/
│   ├── web/           # React frontend
│   ├── web-e2e/       # Playwright E2E tests
│   └── api/           # Express backend
├── packages/          # Shared libraries
├── nx.json            # Nx configuration
├── oxlint.json        # Oxlint configuration
└── package.json       # Root package.json
```

## Adding shadcn/ui Components

Add new components using the shadcn CLI:

```bash
cd apps/web
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
```

## Useful Nx Commands

Generate a shared library:

```bash
npx nx g @nx/js:lib packages/shared --publishable --importPath=@god-roll/shared
```

View project graph:

```bash
npx nx graph
```

## License

MIT
