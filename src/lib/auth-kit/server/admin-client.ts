/**
 * Auth Kit — Admin Client
 *
 * Service role client that bypasses RLS. Use for admin operations only:
 * user management, cross-tenant queries, webhooks, migrations.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../config';

let _adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  _adminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}
