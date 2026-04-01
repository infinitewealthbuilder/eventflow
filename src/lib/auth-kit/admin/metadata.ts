/**
 * Auth Kit — Metadata Management (Admin)
 *
 * Get/set user_metadata and app_metadata via service role.
 * user_metadata: readable by user, writable by user + admin
 * app_metadata: readable by user, writable by admin ONLY (use for privileged fields like platform_role)
 */

import { createAdminClient } from '../server/admin-client';

export async function getUserMetadata(userId: string): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`Failed to get user metadata: ${error.message}`);
  return (data.user.user_metadata as Record<string, unknown>) ?? {};
}

export async function setUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
  if (error) throw new Error(`Failed to set user metadata: ${error.message}`);
}

export async function getAppMetadata(userId: string): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`Failed to get app metadata: ${error.message}`);
  return (data.user.app_metadata as Record<string, unknown>) ?? {};
}

export async function setAppMetadata(
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: metadata,
  });
  if (error) throw new Error(`Failed to set app metadata: ${error.message}`);
}
