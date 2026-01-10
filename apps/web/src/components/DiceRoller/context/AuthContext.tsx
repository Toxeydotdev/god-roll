/**
 * AuthContext - Authentication state management
 *
 * Provides optional Supabase authentication with guest-to-account upgrade path.
 * Users start as anonymous guests and can create an account to sync their progress.
 */

import type { AuthError, Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "../../../lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export type AuthStatus = "loading" | "guest" | "authenticated";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  isSupabaseAvailable: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Supabase not configured, user is guest
      setStatus("guest");
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setStatus(initialSession ? "authenticated" : "guest");
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setStatus(newSession ? "authenticated" : "guest");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email/password
  const signUp = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: AuthError | null }> => {
      if (!supabase) {
        return {
          error: {
            message: "Supabase not configured",
            name: "AuthError",
            status: 500,
          } as AuthError,
        };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      return { error };
    },
    []
  );

  // Sign in with email/password
  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: AuthError | null }> => {
      if (!supabase) {
        return {
          error: {
            message: "Supabase not configured",
            name: "AuthError",
            status: 500,
          } as AuthError,
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    },
    []
  );

  // Sign out
  const signOut = useCallback(async (): Promise<{
    error: AuthError | null;
  }> => {
    if (!supabase) {
      return {
        error: {
          message: "Supabase not configured",
          name: "AuthError",
          status: 500,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  // Reset password
  const resetPassword = useCallback(
    async (email: string): Promise<{ error: AuthError | null }> => {
      if (!supabase) {
        return {
          error: {
            message: "Supabase not configured",
            name: "AuthError",
            status: 500,
          } as AuthError,
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    },
    []
  );

  const value: AuthContextValue = {
    status,
    user,
    session,
    isGuest: status === "guest",
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signUp,
    signIn,
    signOut,
    resetPassword,
    isSupabaseAvailable: isSupabaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
