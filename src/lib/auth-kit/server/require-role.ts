/**
 * Auth Kit — requireRole()
 *
 * Authenticates and checks that the user has one of the allowed roles.
 */

import { requireAuth } from './require-auth';
import { ForbiddenError } from '../errors';
import type { AuthContext } from '../types';

export async function requireRole(allowedRoles: string[]): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!auth.role || !allowedRoles.includes(auth.role)) {
    throw new ForbiddenError(`Role '${auth.role || 'none'}' not in [${allowedRoles.join(', ')}]`);
  }
  return auth;
}
