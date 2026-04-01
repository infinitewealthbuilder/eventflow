/**
 * Auth Kit — Middleware Exports
 *
 * Usage:
 *   import { createAuthMiddleware, createRouteMatcher } from '@/lib/auth-kit/middleware';
 */

export { createAuthMiddleware } from './create-middleware';
export { createRouteMatcher } from './route-matcher';
export { refreshSession } from './cookie-refresh';
