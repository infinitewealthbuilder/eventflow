/**
 * Auth Kit — Server Exports
 *
 * Usage:
 *   import { getAuth, requireAuth, requireRole, createAuthClient, createAdminClient } from '@/lib/auth-kit/server';
 */

export { getAuth } from './get-auth';
export { requireAuth } from './require-auth';
export { requireRole } from './require-role';
export { createAuthClient } from './client';
export { createAdminClient } from './admin-client';
