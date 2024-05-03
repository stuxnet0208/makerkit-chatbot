import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';

interface Params {
  organizationName: string;
  client: SupabaseClient<Database>;
}

/**
 * @name completeOnboarding
 * @description Handles the submission of the onboarding flow. By default,
 * we use the submission to create the Organization and the user record
 * associated with the User who signed up using its ID
 * @param organizationName
 * @param client
 */
async function completeOnboarding({ organizationName, client }: Params) {
  return client
    .rpc('create_new_organization', {
      org_name: organizationName,
    })
    .single<string>();
}

export default completeOnboarding;
