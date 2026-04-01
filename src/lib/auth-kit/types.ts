/**
 * Auth Kit — Types
 *
 * Provider-agnostic auth types used across server, client, and middleware layers.
 * Based on EAT R2's IAuthProvider types, simplified for direct Supabase usage.
 */

export interface AuthContext {
  userId: string;
  tenantId: string;
  orgId?: string;
  sessionId?: string | null;
  role?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  emailVerified?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthMiddlewareConfig {
  publicRoutes: string[];
  signInUrl?: string;
  afterSignInUrl?: string;
  onBeforeAuth?: (req: import('next/server').NextRequest) => Promise<import('next/server').NextResponse | null | void>;
  onAfterAuth?: (
    req: import('next/server').NextRequest,
    auth: AuthContext | null,
  ) => Promise<import('next/server').NextResponse | null | void>;
  onUnauthenticated?: (req: import('next/server').NextRequest) => Promise<import('next/server').NextResponse | null>;
}

export interface ClientAuthState {
  userId: string | null;
  tenantId: string | null;
  role: string | null;
  email: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

export interface ClientUserState {
  user: UserProfile | null;
  isLoaded: boolean;
}
