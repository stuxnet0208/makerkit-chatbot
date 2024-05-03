import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { JOBS_TABLE } from '~/lib/db-tables';

type Client = SupabaseClient<Database>;

export async function insertJob(
  client: Client,
  job: {
    chatbotId: string;
    organizationId: number;
    totalTasks: number;
  },
) {
  return client
    .from(JOBS_TABLE)
    .insert({
      chatbot_id: job.chatbotId,
      organization_id: job.organizationId,
      tasks_count: job.totalTasks,
    })
    .select('id')
    .single();
}

export async function updateJob(
  client: Client,
  id: number,
  job: Database['public']['Tables']['jobs']['Update'],
) {
  return client
    .from(JOBS_TABLE)
    .update(job)
    .eq('id', id);
}