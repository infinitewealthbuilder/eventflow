/**
 * Auth Kit — Public API
 *
 * Supabase Auth replacement for Clerk. Drop into any Next.js + Supabase project.
 *
 * Server:  import { getAuth, requireAuth, requireRole, createAuthClient } from '@/lib/auth-kit/server'
 * Client:  import { AuthProvider, useAuth, useUser } from '@/lib/auth-kit/client'
 * Middle:  import { createAuthMiddleware } from '@/lib/auth-kit/middleware'
 * UI:      import { SignInForm, SignUpForm, UserButton } from '@/lib/auth-kit/components'
 */

export type {
  AuthContext,
  UserProfile,
  AuthMiddlewareConfig,
  ClientAuthState,
  ClientUserState,
} from './types';

export { AuthError, UnauthorizedError, ForbiddenError } from './errors';
