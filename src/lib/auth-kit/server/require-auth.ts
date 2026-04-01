/**
 * Auth Kit — requireAuth()
 *
 * Throws UnauthorizedError if not authenticated. Eliminates null checks in protected routes.
 */

import { getAuth } from './get-auth';
import { UnauthorizedError } from '../errors';
import type { AuthContext } from '../types';

export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) throw new UnauthorizedError();
  return auth;
}
