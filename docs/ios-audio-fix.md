# iOS Audio Context Resume Fix

## Problem

On iOS, the Web Audio API's `AudioContext` enters a suspended state when the app goes to the background. When the app returns to the foreground, the `AudioContext` remains suspended, preventing sound from playing until the user interacts with the page again.

## Solution

We've implemented an automatic audio context resumption system using Capacitor's App plugin to detect iOS lifecycle events.

### Key Components

#### 1. useAppLifecycle Hook (`hooks/useAppLifecycle.ts`)

A React hook that listens to app lifecycle events via the Capacitor App plugin:

```typescript
useAppLifecycle(); // Call in a React component to enable lifecycle handling
```

**Features:**
- Automatically resumes AudioContext when app becomes active
- Logs state transitions for debugging
- Gracefully handles errors if resumption fails
- Works transparently in browser (plugin unavailable) and native apps

#### 2. Enhanced SoundManager (`utils/soundManager.ts`)

The `SoundManager` class now includes:

**New Methods:**
- `getState()` - Returns current AudioContext state or "uninitialized"
- Enhanced `resume()` - Includes comprehensive logging and error handling

**Debugging:**
```typescript
console.log(soundManager.getState()); // Check current state
await soundManager.resume(); // Manually resume if needed
```

#### 3. Integration in SoundProvider (`context/SoundContext.tsx`)

The `useAppLifecycle` hook is integrated at the provider level, ensuring all components benefit from automatic audio resumption:

```typescript
export function SoundProvider({ children }) {
  // Automatically handles iOS lifecycle for all children
  useAppLifecycle();
  // ... rest of provider code
}
```

## How It Works

1. **App Goes to Background:** iOS suspends the AudioContext
2. **App Returns to Foreground:** Capacitor fires `appStateChange` event with `isActive: true`
3. **useAppLifecycle Hook:** Detects the event and calls `soundManager.resume()`
4. **SoundManager:** Checks AudioContext state and resumes if suspended
5. **Sound Works:** Audio plays immediately without user interaction

## Logging

The implementation includes comprehensive console logging for debugging:

```
[useAppLifecycle] Setting up app state listener
[useAppLifecycle] App state changed to: active
[useAppLifecycle] App became active - AudioContext state: suspended
[SoundManager] Resume called - Current state: suspended
[SoundManager] AudioContext resumed successfully - New state: running
```

## Edge Cases Handled

- **Browser Environment:** Gracefully handles missing Capacitor plugin (web-only mode)
- **Failed Resumption:** Logs errors but doesn't crash the app
- **Already Running:** Skips unnecessary resume operations
- **Uninitialized Context:** Logs warning and returns early

## Testing

Comprehensive test coverage includes:

- **useAppLifecycle.spec.ts** (6 tests)
  - Listener setup and cleanup
  - Active/background state changes
  - Error handling
  - Browser compatibility

- **soundManager.spec.ts** (16 tests)
  - State tracking with `getState()`
  - Resume behavior with logging
  - Error conditions

Run tests:
```bash
npm run test
```

## iOS Deployment

After implementing this fix:

1. **Sync Capacitor:**
   ```bash
   cd apps/web
   npm run cap:sync
   ```

2. **Open in Xcode:**
   ```bash
   npm run cap:open
   ```

3. **Test on Device:**
   - Build and run on iOS device or simulator
   - Play sound in the app
   - Background the app (swipe up or home button)
   - Return to the app
   - Sound should work immediately without user interaction

## Debugging on iOS

If sound still doesn't work after returning from background:

1. **Check Safari Web Inspector:**
   - Enable on device: Settings > Safari > Advanced > Web Inspector
   - Connect device and open Safari on Mac
   - Develop > [Device] > [App] > Console

2. **Look for log messages:**
   ```
   [useAppLifecycle] App became active
   [SoundManager] Resume called
   ```

3. **Verify AudioContext state:**
   - Should transition from "suspended" to "running"
   - If still "suspended", check for iOS restrictions

## Known Limitations

- **iOS Restrictions:** Some iOS versions may have additional restrictions on background audio
- **Silent Mode:** Sounds won't play if device is in silent mode (expected behavior)
- **Low Power Mode:** May affect audio playback on iOS
- **User Opt-in Required:** First sound must follow user interaction (browser security)

## Dependencies

- `@capacitor/app` ^8.0.0 - App lifecycle events
- `@capacitor/core` ^8.0.0 - Capacitor runtime
- `@capacitor/ios` ^8.0.0 - iOS platform support

## Related Files

- `apps/web/src/components/DiceRoller/hooks/useAppLifecycle.ts`
- `apps/web/src/components/DiceRoller/hooks/useAppLifecycle.spec.ts`
- `apps/web/src/components/DiceRoller/utils/soundManager.ts`
- `apps/web/src/components/DiceRoller/utils/soundManager.spec.ts`
- `apps/web/src/components/DiceRoller/context/SoundContext.tsx`
- `apps/web/ios/App/App/AppDelegate.swift`

## Additional Resources

- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Capacitor App Plugin Docs](https://capacitorjs.com/docs/apis/app)
- [iOS Audio Session Guide](https://developer.apple.com/documentation/avfoundation/avaudiosession)
