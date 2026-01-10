/**
 * useDisplayNameEditor - Hook for managing display name editing with debounced availability checking
 *
 * Follows React best practices:
 * - Validation happens in event handlers (synchronous, immediate feedback)
 * - Availability checking uses effect only for the async API call (external system sync)
 * - Debouncing handled cleanly with cleanup
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkDisplayNameAvailable,
  validateDisplayNameFormat,
} from "../utils/profileService";

// ============================================================================
// TYPES
// ============================================================================

interface UseDisplayNameEditorOptions {
  initialName: string;
  playerId: string;
  debounceMs?: number;
}

interface UseDisplayNameEditorResult {
  /** Current input value */
  displayName: string;
  /** Whether currently in edit mode */
  isEditing: boolean;
  /** Format validation error (instant feedback) */
  formatError: string | null;
  /** Availability error from API */
  availabilityError: string | null;
  /** Combined error for display */
  error: string | null;
  /** Whether name is available (null = not checked yet) */
  isAvailable: boolean | null;
  /** Whether currently checking availability */
  isChecking: boolean;
  /** Whether the name can be saved */
  canSave: boolean;

  // Actions
  startEditing: () => void;
  cancelEditing: () => void;
  setDisplayName: (name: string) => void;
  resetAfterSave: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDisplayNameEditor({
  initialName,
  playerId,
  debounceMs = 500,
}: UseDisplayNameEditorOptions): UseDisplayNameEditorResult {
  const [displayName, setDisplayNameState] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Track if we need to check availability
  const [needsAvailabilityCheck, setNeedsAvailabilityCheck] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle display name changes - validation in event handler (not effect!)
  const setDisplayName = useCallback(
    (name: string) => {
      setDisplayNameState(name);

      // Reset availability state when input changes
      setIsAvailable(null);
      setAvailabilityError(null);

      // If same as initial, no need to check
      if (name.trim() === initialName) {
        setFormatError(null);
        setNeedsAvailabilityCheck(false);
        return;
      }

      // Validate format immediately (no effect needed - this is derived state)
      const validation = validateDisplayNameFormat(name);
      if (!validation.valid) {
        setFormatError(validation.error || null);
        setNeedsAvailabilityCheck(false);
      } else {
        setFormatError(null);
        // Format is valid, trigger availability check
        setNeedsAvailabilityCheck(true);
      }
    },
    [initialName]
  );

  // Effect ONLY for async availability check (syncing with external system)
  // This is a valid use of useEffect per React docs
  useEffect(() => {
    if (!isEditing || !needsAvailabilityCheck || formatError) {
      return;
    }

    const trimmed = displayName.trim();
    if (trimmed === initialName) {
      return;
    }

    // Cancel any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsChecking(true);

    const timer = setTimeout(async () => {
      try {
        const result = await checkDisplayNameAvailable(trimmed, playerId);
        // Only update if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setIsAvailable(result.available);
          setAvailabilityError(result.available ? null : result.error || null);
          setIsChecking(false);
          setNeedsAvailabilityCheck(false);
        }
      } catch {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsAvailable(false);
          setAvailabilityError("Failed to check availability");
          setIsChecking(false);
          setNeedsAvailabilityCheck(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [
    isEditing,
    needsAvailabilityCheck,
    displayName,
    initialName,
    playerId,
    formatError,
    debounceMs,
  ]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setDisplayNameState(initialName);
    setFormatError(null);
    setAvailabilityError(null);
    setIsAvailable(null);
  }, [initialName]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDisplayNameState(initialName);
    setFormatError(null);
    setAvailabilityError(null);
    setIsAvailable(null);
    setNeedsAvailabilityCheck(false);
    abortControllerRef.current?.abort();
  }, [initialName]);

  const resetAfterSave = useCallback(() => {
    setIsEditing(false);
    setFormatError(null);
    setAvailabilityError(null);
    setIsAvailable(null);
    setNeedsAvailabilityCheck(false);
  }, []);

  // Computed values
  const error = formatError || availabilityError;
  const canSave =
    isAvailable === true && !formatError && displayName.trim() !== initialName;

  return {
    displayName,
    isEditing,
    formatError,
    availabilityError,
    error,
    isAvailable,
    isChecking,
    canSave,
    startEditing,
    cancelEditing,
    setDisplayName,
    resetAfterSave,
  };
}
