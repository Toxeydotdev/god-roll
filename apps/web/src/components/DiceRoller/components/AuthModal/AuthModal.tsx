/**
 * AuthModal - Login/Signup modal with guest progress claiming
 *
 * Allows users to:
 * - Sign up with email/password to save their progress
 * - Sign in to an existing account
 * - View their current guest progress that will be claimed
 * - Set a unique display name for the leaderboard
 */

import type { User } from "@supabase/supabase-js";
import { useCallback, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { UserProfile } from "../../achievements";
import type { ColorTheme } from "../../colorThemes";
import { useAchievements } from "../../context/AchievementContext";
import { useAuth } from "../../context/AuthContext";
import { useDisplayNameEditor } from "../../hooks/useDisplayNameEditor";
import { updateDisplayName } from "../../utils/profileService";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
}

type AuthMode = "signin" | "signup" | "forgot";

// ============================================================================
// AUTHENTICATED VIEW COMPONENT
// ============================================================================

interface AuthenticatedViewProps {
  user: User;
  profile: UserProfile;
  theme: ColorTheme;
  onClose: () => void;
}

function AuthenticatedView({
  user,
  profile,
  theme,
  onClose,
}: AuthenticatedViewProps) {
  const { syncNow } = useAchievements();
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Use custom hook for display name editing (cleaner than inline effect)
  const {
    displayName: displayNameInput,
    isEditing: isEditingName,
    error: nameError,
    isAvailable: nameAvailable,
    isChecking: isCheckingName,
    canSave,
    startEditing,
    cancelEditing,
    setDisplayName,
    resetAfterSave,
  } = useDisplayNameEditor({
    initialName: profile.displayName,
    playerId: profile.playerId,
  });

  const handleSaveName = async () => {
    if (!canSave || isSavingName) return;

    setIsSavingName(true);
    setSaveError(null);
    setSaveSuccess(null);

    const result = await updateDisplayName(
      profile.playerId,
      displayNameInput.trim()
    );

    if (result.success) {
      setSaveSuccess("Display name updated!");
      resetAfterSave();
      // Sync to update local profile
      await syncNow();
    } else {
      setSaveError(result.error || "Failed to update name");
    }

    setIsSavingName(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.backgroundCss }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: theme.textPrimary }}
          aria-label="Close"
        >
          ×
        </button>

        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: theme.textPrimary }}
        >
          👤 Account
        </h2>

        {/* Email */}
        <div
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: `${theme.textPrimary}15` }}
        >
          <p
            className="text-sm opacity-70"
            style={{ color: theme.textPrimary }}
          >
            Signed in as
          </p>
          <p className="font-bold" style={{ color: theme.textPrimary }}>
            {user.email}
          </p>
        </div>

        {/* Display Name Editor */}
        <div
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: `${theme.textPrimary}15` }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-sm font-bold"
              style={{ color: theme.textPrimary }}
            >
              Display Name (for leaderboard)
            </p>
            {!isEditingName && (
              <button
                onClick={startEditing}
                className="text-sm px-2 py-1 rounded hover:opacity-80"
                style={{ color: theme.accentColor }}
              >
                Edit
              </button>
            )}
          </div>

          {isEditingName ? (
            <div>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg border-2 transition-colors mb-2"
                style={{
                  backgroundColor: theme.backgroundCss,
                  borderColor: nameError
                    ? "#ef4444"
                    : nameAvailable
                    ? "#22c55e"
                    : `${theme.textPrimary}40`,
                  color: theme.textPrimary,
                }}
                placeholder="Enter display name"
              />

              {/* Availability indicator */}
              <div className="text-sm mb-2">
                {isCheckingName && (
                  <span style={{ color: theme.textSecondary }}>
                    Checking availability...
                  </span>
                )}
                {!isCheckingName && nameAvailable === true && (
                  <span style={{ color: "#22c55e" }}>✓ Name is available</span>
                )}
                {!isCheckingName && nameError && (
                  <span style={{ color: "#ef4444" }}>✗ {nameError}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={!canSave || isSavingName}
                  className="flex-1 py-2 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: theme.textPrimary,
                    color: theme.backgroundCss,
                  }}
                >
                  {isSavingName ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 rounded-lg font-bold text-sm"
                  style={{
                    border: `2px solid ${theme.textPrimary}`,
                    color: theme.textPrimary,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              className="font-bold text-lg"
              style={{ color: theme.textPrimary }}
            >
              {profile.displayName}
            </p>
          )}

          {saveSuccess && (
            <p className="text-sm mt-2" style={{ color: "#22c55e" }}>
              ✓ {saveSuccess}
            </p>
          )}
          {saveError && (
            <p className="text-sm mt-2" style={{ color: "#ef4444" }}>
              ✗ {saveError}
            </p>
          )}
        </div>

        {/* Stats */}
        <div
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: `${theme.textPrimary}15` }}
        >
          <p className="font-bold mb-2" style={{ color: theme.textPrimary }}>
            Your Stats
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span style={{ color: theme.textPrimary, opacity: 0.7 }}>
                High Score:
              </span>
              <span
                className="ml-2 font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.highestScore}
              </span>
            </div>
            <div>
              <span style={{ color: theme.textPrimary, opacity: 0.7 }}>
                Games:
              </span>
              <span
                className="ml-2 font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.totalGamesPlayed}
              </span>
            </div>
            <div>
              <span style={{ color: theme.textPrimary, opacity: 0.7 }}>
                Total Score:
              </span>
              <span
                className="ml-2 font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.totalScore}
              </span>
            </div>
            <div>
              <span style={{ color: theme.textPrimary, opacity: 0.7 }}>
                Best Round:
              </span>
              <span
                className="ml-2 font-bold"
                style={{ color: theme.textPrimary }}
              >
                {profile.highestRound}
              </span>
            </div>
          </div>
        </div>

        <p
          className="text-center text-sm"
          style={{ color: theme.textPrimary, opacity: 0.7 }}
        >
          ✅ Your progress is synced to the cloud
        </p>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AuthModal({ isOpen, onClose, theme }: AuthModalProps) {
  const { signIn, signUp, resetPassword, isLoading, isAuthenticated, user } =
    useAuth();
  const { profile } = useAchievements();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setSubmitting(true);

      try {
        if (mode === "signup") {
          if (password !== confirmPassword) {
            setError("Passwords don't match");
            setSubmitting(false);
            return;
          }
          if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setSubmitting(false);
            return;
          }
          const { error: signUpError } = await signUp(email, password);
          if (signUpError) {
            setError(signUpError.message);
          } else {
            setSuccess(
              "Check your email to confirm your account! Your progress will sync after confirmation."
            );
          }
        } else if (mode === "signin") {
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            setError(signInError.message);
          } else {
            setSuccess("Signed in! Your progress is now syncing...");
            setTimeout(onClose, 1500);
          }
        } else if (mode === "forgot") {
          const { error: resetError } = await resetPassword(email);
          if (resetError) {
            setError(resetError.message);
          } else {
            setSuccess("Password reset email sent! Check your inbox.");
          }
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setSubmitting(false);
      }
    },
    [
      mode,
      email,
      password,
      confirmPassword,
      signIn,
      signUp,
      resetPassword,
      onClose,
    ]
  );

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }, []);

  const switchMode = useCallback(
    (newMode: AuthMode) => {
      resetForm();
      setMode(newMode);
    },
    [resetForm]
  );

  if (!isOpen) return null;

  // If already authenticated, show account info with display name editor
  if (isAuthenticated && user) {
    return (
      <AuthenticatedView
        user={user}
        profile={profile}
        theme={theme}
        onClose={onClose}
      />
    );
  }

  // Guest view - show progress that will be claimed
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.backgroundCss }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: theme.textPrimary }}
          aria-label="Close"
        >
          ×
        </button>

        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: theme.textPrimary }}
        >
          {mode === "signin"
            ? "🔑 Sign In"
            : mode === "signup"
            ? "📝 Create Account"
            : "🔄 Reset Password"}
        </h2>

        {/* Guest progress preview */}
        {mode === "signup" && profile.totalGamesPlayed > 0 && (
          <div
            className="p-3 rounded-lg mb-4"
            style={{ backgroundColor: `${theme.textPrimary}15` }}
          >
            <p
              className="text-sm font-bold mb-1"
              style={{ color: theme.textPrimary }}
            >
              🎮 Your current progress will be saved:
            </p>
            <div className="text-sm grid grid-cols-2 gap-1">
              <span style={{ color: theme.textPrimary, opacity: 0.8 }}>
                {profile.totalGamesPlayed} games played
              </span>
              <span style={{ color: theme.textPrimary, opacity: 0.8 }}>
                High score: {profile.highestScore}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: theme.textPrimary }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 transition-colors"
              style={{
                backgroundColor: theme.backgroundCss,
                borderColor: `${theme.textPrimary}40`,
                color: theme.textPrimary,
              }}
              placeholder="your@email.com"
              required
              disabled={submitting || isLoading}
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: theme.textPrimary }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors"
                style={{
                  backgroundColor: theme.backgroundCss,
                  borderColor: `${theme.textPrimary}40`,
                  color: theme.textPrimary,
                }}
                placeholder="••••••••"
                required
                disabled={submitting || isLoading}
                minLength={6}
              />
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: theme.textPrimary }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors"
                style={{
                  backgroundColor: theme.backgroundCss,
                  borderColor: `${theme.textPrimary}40`,
                  color: theme.textPrimary,
                }}
                placeholder="••••••••"
                required
                disabled={submitting || isLoading}
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: "#ef444420", color: "#ef4444" }}
            >
              ❌ {error}
            </div>
          )}

          {success && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}
            >
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full py-3 rounded-lg font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.textPrimary,
              color: theme.backgroundCss,
            }}
          >
            {submitting || isLoading
              ? "Loading..."
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Email"}
          </button>
        </form>

        {/* Mode switching links */}
        <div className="mt-4 text-center text-sm space-y-2">
          {mode === "signin" && (
            <>
              <p>
                <span style={{ color: theme.textPrimary, opacity: 0.7 }}>
                  Don't have an account?{" "}
                </span>
                <button
                  onClick={() => switchMode("signup")}
                  className="font-bold hover:underline"
                  style={{ color: theme.textPrimary }}
                >
                  Sign Up
                </button>
              </p>
              <p>
                <button
                  onClick={() => switchMode("forgot")}
                  className="hover:underline"
                  style={{ color: theme.textPrimary, opacity: 0.7 }}
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              <span style={{ color: theme.textPrimary, opacity: 0.7 }}>
                Already have an account?{" "}
              </span>
              <button
                onClick={() => switchMode("signin")}
                className="font-bold hover:underline"
                style={{ color: theme.textPrimary }}
              >
                Sign In
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              <button
                onClick={() => switchMode("signin")}
                className="font-bold hover:underline"
                style={{ color: theme.textPrimary }}
              >
                ← Back to Sign In
              </button>
            </p>
          )}
        </div>

        {/* Guest note */}
        <div
          className="mt-4 p-3 rounded-lg text-center text-sm"
          style={{ backgroundColor: `${theme.textPrimary}10` }}
        >
          <p style={{ color: theme.textPrimary, opacity: 0.7 }}>
            🎮 You can keep playing as a guest.
            <br />
            Create an account to sync progress across devices.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
