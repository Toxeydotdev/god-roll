# GitHub Copilot Instructions for God Roll

## Project Overview

God Roll is a 3D dice rolling game built with Three.js and React. Players roll dice with realistic physics and try to avoid rolling a total divisible by 7. The project uses an Nx monorepo structure with TypeScript, React 19, Three.js, Vite, and Tailwind CSS.

## Key Technologies

- **Framework**: React 19 with TypeScript (strict mode)
- **Build Tool**: Vite with Nx monorepo
- **3D Graphics**: Three.js for realistic dice physics
- **Styling**: Tailwind CSS v4 with custom theme system
- **Testing**: Vitest with @testing-library/react
- **Linting**: oxlint for fast, reliable linting

## Essential Commands

```bash
# Development
npm run dev:web          # Start frontend dev server (localhost:4200)

# Building
npm run build:web        # Build frontend
npm run build            # Build all projects

# Testing
npm run test             # Run all tests
npm run test -- --coverage  # Run tests with coverage

# Linting
npm run lint             # Check code style
npm run lint:fix         # Auto-fix lint issues
```

## Architecture & Structure

```
god-roll/
├── apps/
│   ├── web/              # React frontend application
│   │   └── src/
│   │       └── components/
│   │           └── DiceRoller/   # Main game component
│   ├── web-e2e/          # Playwright E2E tests
│   └── api/              # Express backend
└── packages/             # Shared libraries (currently empty)
```

## Coding Standards & Conventions

**📖 Full documentation**: See [AGENTS.md](/AGENTS.md) for comprehensive coding standards, testing practices, and conventions.

### Key Conventions

1. **Testing Methodology**: Follow SIFERS (Setup, Invoke, Find, Expect, Reset, Snapshot)

   - Every test file should have a centralized `setup()` function with configurable options
   - Write user-centric, behavior-driven test names (e.g., "when user clicks button, should show feedback")
   - Use `@vitest-environment jsdom` for component tests

2. **Component Standards**:

   - Use React Context for global state (theme, sound, modals) to avoid prop drilling
   - All UI components accept a `theme` prop for consistent styling
   - Export prop interfaces for testability
   - Modal management uses Context + Portal pattern

3. **Code Organization**:

   - Co-locate components with their test files
   - Use barrel exports (`index.ts`) for clean imports
   - Test files use shared utilities from `test-utils/`

4. **TypeScript**:

   - Use strict mode
   - Export interfaces for component props
   - Avoid `any` type without justification

5. **localStorage**:
   - Use versioned keys: `{appname}_{feature}_v{version}` (e.g., `godroll_theme_v1`)
   - Always wrap in try-catch for private browsing mode compatibility

### Testing Best Practices

- Mock Three.js components at the component level to avoid WebGL issues in jsdom
- Use `hexToRgb()` helper for color comparisons (browsers normalize to rgb format)
- Clean up after each test with `afterEach(() => cleanup())`
- Test edge cases (0 values, empty arrays, error states)

### Styling Guidelines

- Use theme colors via style prop: `style={{ color: theme.textPrimary }}`
- Avoid hardcoding colors or using Tailwind classes for themed elements
- Support custom color themes defined in `colorThemes.ts`

### CSS Layout Guidelines

- **Prefer flexbox/grid** over absolute/fixed positioning for layouts
- Use `flex-col` with `flex-1` spacers to distribute space naturally
- For full-screen canvas apps: canvas is `absolute inset-0`, UI overlays with flexbox
- Use `pointer-events-none` on overlay containers, `pointer-events-auto` on interactive children
- Avoid magic pixel values (e.g., `bottom: "80px"`) - let flexbox handle positioning
- Use `gap` for spacing between flex children instead of margins

### React Effects Guidelines

**Follow React's guidance: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)**

- **Effects are for syncing with external systems** (APIs, subscriptions, DOM)
- **Validation**: Do in event handlers, not effects - provides instant feedback
- **Derived state**: Calculate during render, don't use effects
- **Async operations**: Use effects only for the fetch, handle validation separately
- **Complex async logic**: Extract to custom hooks (e.g., `useDisplayNameEditor`)

```typescript
// ❌ Bad - effect for validation
useEffect(() => {
  setIsValid(name.length >= 2);
}, [name]);

// ✅ Good - validation in event handler
const handleNameChange = (name: string) => {
  setName(name);
  setError(name.length < 2 ? "Too short" : null);
};
```

## Development Workflow

1. **Before making changes**: Run existing tests to understand baseline (`npm run test`)
2. **During development**: Use `npm run dev:web` for hot reload
3. **Before committing**: Run `npm run lint && npm run test`
4. **Component changes**: Update related tests following SIFERS methodology
5. **New features**: Add tests before or alongside implementation

## Game Logic

- Each round adds 1 die to the roll
- Score accumulates with each successful roll
- Game Over condition: roll total divisible by 7
- Uses Web Crypto API for cryptographic randomness

## Notes

- WebGL/Three.js tests require special mocking (see AGENTS.md)
- Color assertions in DOM tests must account for rgb() normalization
- Context providers wrap the app root for global state management
