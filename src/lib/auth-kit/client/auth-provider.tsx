'use client';

/**
 * Auth Kit — AuthProvider
 *
 * React context provider that replaces ClerkProvider.
 * Subscribes to Supabase auth state changes and provides auth context to children.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserClient } from './browser-client';
import type { ClientAuthState, UserProfile } from '../types';

interface AuthContextValue extends ClientAuthState {
  user: UserProfile | null;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue>({
  userId: null,
  tenantId: null,
  role: null,
  email: null,
  isLoaded: false,
  isSignedIn: false,
  user: null,
  signOut: async () => {},
});

function mapUser(user: User | null): { auth: ClientAuthState; profile: UserProfile | null } {
  if (!user) {
    return {
      auth: { userId: null, tenantId: null, role: null, email: null, isLoaded: true, isSignedIn: false },
      profile: null,
    };
  }

  const meta = user.user_metadata ?? {};

  return {
    auth: {
      userId: user.id,
      tenantId: (meta.tenant_id as string) || user.id,
      role: (meta.role as string) || null,
      email: user.email || null,
      isLoaded: true,
      isSignedIn: true,
    },
    profile: {
      id: user.id,
      email: user.email || '',
      firstName: meta.first_name as string | undefined,
      lastName: meta.last_name as string | undefined,
      avatar: meta.avatar_url as string | undefined,
      phone: user.phone || undefined,
      emailVerified: !!user.email_confirmed_at,
      metadata: meta,
      createdAt: user.created_at ? new Date(user.created_at) : undefined,
      updatedAt: user.updated_at ? new Date(user.updated_at) : undefined,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setIsLoaded(true);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoaded(true);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
  }, []);

  const { auth, profile } = useMemo(() => {
    if (!isLoaded) {
      return {
        auth: { userId: null, tenantId: null, role: null, email: null, isLoaded: false, isSignedIn: false },
        profile: null,
      };
    }
    return mapUser(user);
  }, [user, isLoaded]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...auth, user: profile, signOut }),
    [auth, profile, signOut],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthCtx);
}
