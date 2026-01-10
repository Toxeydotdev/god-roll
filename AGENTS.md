# AGENTS.md - Standards and Practices

This document outlines the coding standards, testing practices, and conventions used in the God Roll project. Follow these guidelines to maintain consistency across the codebase.

---

## Testing Standards

### SIFERS Methodology

All tests should follow the **SIFERS** methodology:

- **S**etup: Prepare test environment and dependencies
- **I**nvoke: Trigger user actions or function calls
- **F**ind: Locate affected elements or results
- **E**xpect: Assert expected outcomes
- **R**eset: Clean up after test
- **S**napshot: (optional) Visual validation

### Reusable Setup Functions

Every test file should have a centralized `setup()` function that:

1. Accepts an options object with sensible defaults
2. Returns helpers and callbacks for assertions
3. Encapsulates common rendering and query logic

#### ✅ DO: Use a setup function with configurable options

```typescript
interface SetupOptions {
  totalScore?: number;
  round?: number;
  onReset?: Mock;
  theme?: ColorTheme;
}

interface SetupResult {
  container: HTMLElement;
  onReset: Mock;
  getButton: () => HTMLElement;
  clickButton: () => void;
}

function setup(options: SetupOptions = {}): SetupResult {
  const {
    totalScore = 0,
    round = 1,
    onReset = vi.fn(),
    theme = mockTheme,
  } = options;

  const { container } = render(
    <Component
      totalScore={totalScore}
      round={round}
      onReset={onReset}
      theme={theme}
    />
  );

  const getButton = () => screen.getByRole("button", { name: /submit/i });
  const clickButton = () => fireEvent.click(getButton());

  return { container, onReset, getButton, clickButton };
}
```

#### ❌ DON'T: Repeat render logic in every test

```typescript
// Bad - repetitive and error-prone
it("test 1", () => {
  render(
    <Component totalScore={0} round={1} onReset={vi.fn()} theme={mockTheme} />
  );
  // ...
});

it("test 2", () => {
  render(
    <Component totalScore={0} round={1} onReset={vi.fn()} theme={mockTheme} />
  );
  // ...
});
```

### Test File Structure

```typescript
/**
 * @vitest-environment jsdom
 *
 * ComponentName User Interaction Tests following SIFERS methodology
 */

// ============================================================================
// IMPORTS
// ============================================================================

// ============================================================================
// SETUP FUNCTION
// ============================================================================

// ============================================================================
// TEST DATA FACTORIES (if needed)
// ============================================================================

// ============================================================================
// TESTS
// ============================================================================

describe("ComponentName - User Interactions", () => {
  beforeEach(() => {
    /* ... */
  });
  afterEach(() => {
    cleanup();
  });

  describe("when user does X", () => {
    it("should result in Y", () => {
      /* ... */
    });
  });
});
```

### Test Naming Conventions

#### ✅ DO: Use user-centric, behavior-driven test names

```typescript
describe("when user holds reset button with mouse", () => {
  it("should show HOLD... feedback while holding", () => {});
  it("should trigger reset after holding for 1 second", () => {});
  it("should NOT reset if released before 1 second", () => {});
});
```

#### ❌ DON'T: Use implementation-focused names

```typescript
// Bad - focuses on implementation, not behavior
it("calls onReset callback", () => {});
it("sets resetProgress state", () => {});
```

### Color Assertions in DOM Tests

Browsers normalize CSS colors to `rgb()` format. Use a helper function for comparisons.

#### ✅ DO: Use hexToRgb helper for color comparisons

```typescript
import { hexToRgb } from "../test-utils";

expect(element.style.color).toBe(hexToRgb("#1a5a1a")); // "rgb(26, 90, 26)"
```

#### ❌ DON'T: Compare hex directly with style values

```typescript
// Bad - will fail because browser normalizes to rgb()
expect(element.style.color).toBe("#1a5a1a");
```

### Mocking WebGL/Three.js

For components using Three.js, mock at the component level to avoid WebGL issues in jsdom.

#### ✅ DO: Mock the entire component when testing parent components

```typescript
vi.mock("../components/DiceRoller", () => ({
  DiceRoller: () => <div data-testid="mock-dice-roller">Mocked</div>,
}));
```

#### ❌ DON'T: Try to mock individual Three.js classes for full renders

```typescript
// Bad - incomplete and fragile
vi.mock("three", () => ({
  WebGLRenderer: vi.fn(),
  // Missing dozens of other classes...
}));
```

---

## Component Standards

### Context-Based State Management

Use React Context to avoid prop drilling and centralize shared state.

#### ✅ DO: Use context hooks for global state (theme, sound, modals)

```typescript
import { useTheme, useSound, useModal } from "@/components/DiceRoller/context";

function MyComponent() {
  const { theme } = useTheme();
  const { soundEnabled, toggleSound } = useSound();
  const { openModal } = useModal();

  return (
    <button
      onClick={() => openModal("leaderboard")}
      style={{ backgroundColor: theme.textPrimary }}
    >
      {soundEnabled ? "🔊" : "🔇"}
    </button>
  );
}
```

#### ✅ DO: Wrap app root with all context providers

```typescript
import {
  ThemeProvider,
  SoundProvider,
  ModalProvider,
} from "@/components/DiceRoller/context";

export function DiceRoller() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <ModalProvider>
          <DiceRollerContent />
        </ModalProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}
```

#### ❌ DON'T: Pass global state through props

```typescript
// Bad - prop drilling
interface ComponentProps {
  theme: ColorTheme;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// Instead, use context hooks directly
```

**When to use Context:**

- Global UI state (theme, modals, notifications)
- Cross-cutting concerns (authentication, sound settings)
- State accessed by many components at different levels
- Avoiding props passed through 3+ component layers

**When NOT to use Context:**

- Local component state
- State only used by parent-child pairs
- Frequently changing values that cause unnecessary re-renders

### Modal Management with Context + Portal

Use the centralized `ModalContext` for all modal interactions to avoid prop drilling and z-index issues.

#### ✅ DO: Use useModal hook directly in components

```typescript
import { useModal } from "@/components/DiceRoller/context";

function MyComponent() {
  const { openModal } = useModal();

  return (
    <button onClick={() => openModal("leaderboard")}>Show Leaderboard</button>
  );
}
```

#### ✅ DO: Wrap app with ModalProvider at the root

```typescript
import { ModalProvider } from "@/components/DiceRoller/context";

function App() {
  const [theme, setTheme] = useState(defaultTheme);

  return (
    <ModalProvider theme={theme} onThemeChange={setTheme}>
      <MyComponent />
    </ModalProvider>
  );
}
```

#### ❌ DON'T: Pass modal callbacks through props

```typescript
// Bad - prop drilling
interface MyComponentProps {
  onShowLeaderboard: () => void;
  onShowRules: () => void;
  onShowColorPicker: () => void;
}

// Instead, use useModal() hook directly in the component
```

**Benefits:**

- No prop drilling through multiple component layers
- All modals render at `document.body` via `createPortal` (fixes z-index issues)
- Type-safe modal types: `"leaderboard" | "rules" | "colorPicker"`
- Easy to add new modals - just update `ModalContext`

### Props Interface Export

Always export prop interfaces for testability.

#### ✅ DO: Export the props interface

```typescript
export interface GameStatsProps {
  totalScore: number;
  round: number;
  onReset: () => void;
  theme: ColorTheme;
}

export function GameStats({
  totalScore,
  round,
  onReset,
  theme,
}: GameStatsProps) {
  // ...
}
```

### Theme Support

All UI components should accept a `theme` prop for consistent styling.

#### ✅ DO: Use theme colors via style prop

```typescript
<h2 style={{ color: theme.textPrimary }}>Title</h2>
<button style={{ backgroundColor: theme.textPrimary, color: theme.backgroundCss }}>
  Click
</button>
```

#### ❌ DON'T: Hardcode colors or use Tailwind color classes for themed elements

```typescript
// Bad - not themeable
<h2 className="text-green-800">Title</h2>
```

### CSS Layout

Use proper CSS layout techniques (flexbox, grid) instead of absolute/fixed positioning. This creates more maintainable, responsive layouts.

#### ✅ DO: Use flexbox for page layouts

```typescript
// Good - proper flexbox layout with UI overlaying canvas
<div className="relative w-full h-dvh">
  {/* Canvas fills entire screen */}
  <div ref={containerRef} className="absolute inset-0" />

  {/* UI Layer - overlays on top with flexbox */}
  <div className="absolute inset-0 pointer-events-none flex flex-col">
    <header className="flex-none flex justify-between p-4 pointer-events-auto">
      {/* Header content */}
    </header>

    <div className="flex-1">
      {/* Middle content - spacer pushes footer down */}
    </div>

    <footer className="flex-none flex flex-col items-center pointer-events-auto">
      {/* Footer content */}
    </footer>
  </div>
</div>
```

#### ❌ DON'T: Use absolute positioning with magic pixel values

```typescript
// Bad - brittle, doesn't respond to content changes
<div className="absolute top-4 left-4">Title</div>
<div className="absolute bottom-20 left-1/2">Button</div>
<div style={{ bottom: "80px", position: "fixed" }}>Controls</div>
```

**When to use each approach:**

| Layout Technique | Use For                                                      |
| ---------------- | ------------------------------------------------------------ |
| Flexbox          | Page layouts, navigation bars, centering, distributing space |
| Grid             | Complex 2D layouts, card grids, dashboard layouts            |
| Absolute/Fixed   | Overlays on canvas, tooltips, dropdowns, modals              |

**Key principles:**

- Use `flex-col` with `flex-1` spacers to push elements to edges
- Use `pointer-events-none` on overlay containers, `pointer-events-auto` on interactive elements
- For full-screen canvas apps: canvas is `absolute inset-0`, UI overlays with flexbox
- Avoid magic pixel values like `bottom: "80px"` - use flexbox to naturally position elements
- Use `gap` instead of margins for spacing between flex children

---

## Code Organization

### File Structure

```
src/
├── app/
│   ├── app.tsx
│   └── app.spec.tsx
├── components/
│   └── DiceRoller/
│       ├── context/                # Global state management
│       │   ├── ModalContext.tsx    # Modal provider with createPortal
│       │   ├── ModalContext.spec.tsx
│       │   └── index.ts
│       ├── index.tsx           # Main component
│       ├── colorThemes.ts      # Theme definitions
│       ├── colorThemes.spec.ts # Theme tests
│       ├── leaderboard.ts      # Leaderboard logic
│       ├── leaderboard.spec.ts # Leaderboard tests
│       ├── components/         # Sub-components (organized by feature)
│       │   ├── GameStats/
│       │   │   ├── GameStats.tsx
│       │   │   └── GameStats.spec.tsx
│       │   ├── GameOverScreen/
│       │   │   ├── GameOverScreen.tsx
│       │   │   └── GameOverScreen.spec.tsx
│       │   ├── StartScreen/
│       │   │   ├── StartScreen.tsx
│       │   │   └── StartScreen.spec.tsx
│       │   ├── ControlsPanel/
│       │   │   └── ControlsPanel.tsx
│       │   └── index.ts        # Re-exports all components
│       ├── hooks/              # Custom hooks
│       └── utils/              # Utility functions
│           ├── soundManager.ts
│           └── soundManager.spec.ts
└── test-utils/
    ├── index.ts                # Re-exports
    ├── fixtures.ts             # Mock data & factories
    └── mocks.ts                # Mock implementations
```

**Component Organization Principles:**

- Each component lives in its own folder with its test file
- Co-location of component and test improves discoverability
- `index.ts` provides clean barrel exports
- Test files use `../../../../test-utils` for shared utilities

### Test Utils Organization

#### fixtures.ts - Mock data and prop factories

```typescript
export const mockTheme: ColorTheme = {
  /* ... */
};
export const createMockGameStatsProps = (overrides = {}) => ({
  /* defaults + overrides */
});
export function hexToRgb(hex: string): string {
  /* ... */
}
```

#### mocks.ts - Mock implementations

```typescript
export function setupLocalStorageMock() {
  /* ... */
}
export function setupWebGLMock() {
  /* ... */
}
```

---

## localStorage Conventions

### Key Naming

Use a versioned prefix: `{appname}_{feature}_v{version}`

```typescript
const STORAGE_KEY = "godroll_leaderboard_v1";
const THEME_KEY = "godroll_theme_v1";
```

### Error Handling

Always wrap localStorage access in try-catch for private browsing mode.

```typescript
export function getSavedThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}
```

---

## General Guidelines

### DOs

- ✅ Write tests from the user's perspective
- ✅ Use descriptive test names that explain the scenario
- ✅ Keep setup functions configurable with sensible defaults
- ✅ Clean up after each test (`afterEach → cleanup()`)
- ✅ Test edge cases (0 values, empty arrays, error states)
- ✅ Export interfaces for component props
- ✅ Use TypeScript strict mode
- ✅ Handle localStorage errors gracefully

### DON'Ts

- ❌ Test implementation details (internal state, private methods)
- ❌ Copy-paste render logic across tests
- ❌ Hardcode colors in themed components
- ❌ Ignore async cleanup (fake timers, subscriptions)
- ❌ Write tests that depend on test execution order
- ❌ Use `any` type without justification
- ❌ Leave console errors/warnings in tests

---

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- src/components/DiceRoller/components/GameStats/GameStats.spec.tsx

# Run in watch mode
npm run test -- --watch
```

---

## Running Lint

The project uses [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for fast, reliable linting.

```bash
# Run lint check
npm run lint

# Lint specific files or directories
npx oxlint src/

# Auto-fix issues (when possible)
npx oxlint --fix
```

**Configured Rules (oxlint.json):**

- `no-console`: warn - Avoid console statements in production code
- `no-debugger`: error - Remove debugger statements
- `no-unused-vars`: warn - Clean up unused variables
- `eqeqeq`: error - Use strict equality (===) instead of loose (==)

**Before Committing:**

Always run lint to catch issues early:

```bash
npm run lint && npm run test
```

---

_Last updated: January 2026_
