/**
 * Auth Kit — Admin Exports
 *
 * Server-only. Uses service role key.
 *
 * Usage:
 *   import { createUser, updateUser, setUserMetadata, setAppMetadata } from '@/lib/auth-kit/admin';
 */

export {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  listUsers,
} from './user-management';

export {
  getUserMetadata,
  setUserMetadata,
  getAppMetadata,
  setAppMetadata,
} from './metadata';
