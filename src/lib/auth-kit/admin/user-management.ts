/**
 * Auth Kit — User Management (Admin)
 *
 * Server-only admin operations using service role.
 * Replaces Clerk's clerkClient().users.* methods.
 */

import { createAdminClient } from '../server/admin-client';
import type { UserProfile } from '../types';

interface CreateUserOptions {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, unknown>;
  emailConfirm?: boolean;
}

interface UpdateUserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, unknown>;
}

function mapToProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  phone?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}): UserProfile {
  const meta = user.user_metadata ?? {};
  return {
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
  };
}

export async function createUser(options: CreateUserOptions): Promise<UserProfile> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    password: options.password,
    email_confirm: options.emailConfirm ?? true,
    user_metadata: {
      first_name: options.firstName,
      last_name: options.lastName,
      ...options.metadata,
    },
  });

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return mapToProfile(data.user);
}

export async function updateUser(userId: string, options: UpdateUserOptions): Promise<UserProfile> {
  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (options.email) updateData.email = options.email;
  if (options.password) updateData.password = options.password;

  const metaUpdates: Record<string, unknown> = {};
  if (options.firstName !== undefined) metaUpdates.first_name = options.firstName;
  if (options.lastName !== undefined) metaUpdates.last_name = options.lastName;
  if (options.metadata) Object.assign(metaUpdates, options.metadata);

  if (Object.keys(metaUpdates).length > 0) {
    updateData.user_metadata = metaUpdates;
  }

  const { data, error } = await admin.auth.admin.updateUserById(userId, updateData);

  if (error) throw new Error(`Failed to update user: ${error.message}`);
  return mapToProfile(data.user);
}

export async function deleteUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Failed to delete user: ${error.message}`);
}

export async function getUserById(userId: string): Promise<UserProfile> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`Failed to get user: ${error.message}`);
  return mapToProfile(data.user);
}

export async function listUsers(options?: {
  page?: number;
  perPage?: number;
}): Promise<UserProfile[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: options?.page ?? 1,
    perPage: options?.perPage ?? 50,
  });

  if (error) throw new Error(`Failed to list users: ${error.message}`);
  return data.users.map(mapToProfile);
}
