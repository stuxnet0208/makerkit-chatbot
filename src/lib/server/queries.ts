import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';

/**
 * @description Fetch user object data (not auth!) by ID {@link userId}
 */
export async function getUserDataById(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const result = await client
    .from('users')
    .select(
      `
      id,
      displayName: display_name,
      photoUrl: photo_url,
      onboarded
    `,
    )
    .eq('id', userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}
