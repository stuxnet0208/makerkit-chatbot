import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CHATBOTS_TABLE, DOCUMENTS_TABLE } from '~/lib/db-tables';

type Client = SupabaseClient<Database>;

export async function getChatbots(client: Client, organizationId: number) {
  return client
    .from(CHATBOTS_TABLE)
    .select(
      `
      id,
      name,
      description,
      createdAt: created_at
    `,
      {
        count: 'exact',
      }
    )
    .eq('organization_id', organizationId);
}

export async function getChatbot(client: Client, chatbotId: string) {
  const { data, error } = await client
    .from(CHATBOTS_TABLE)
    .select(
      `
      id,
      name,
      description,
      siteName: site_name,
      organizationId: organization_id,
      url,
      createdAt: created_at,
      settings
    `,
    )
    .eq('id', chatbotId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getChatbotSettings(client: Client, chatbotId: string) {
  const { data, error } = await client
    .from(CHATBOTS_TABLE)
    .select(
      `
      settings,
      siteName: site_name
    `,
    )
    .eq('id', chatbotId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getChatbotDocuments(
  client: Client,
  chatbotId: string,
  params: {
    from: number;
    to: number;
    query?: string;
  },
) {
  let query = client
    .from(DOCUMENTS_TABLE)
    .select(
      `
      createdAt: created_at,
      id,
      title,
      content
    `,
      {
        count: 'exact',
      },
    )
    .eq('chatbot_id', chatbotId)
    .range(params.from, params.to);

  if (params.query) {
    query = query.textSearch('name', params.query);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data,
    count: count ?? 0,
  };
}

export async function getDocumentById(client: Client, id: string) {
  return client
    .from('documents')
    .select(
      `
      id,
      createdAt: created_at,
      content,
      title,
      chatbotId: chatbot_id
    `,
    )
    .eq('id', id)
    .single();
}

export async function getDocumentByHash(
  client: Client,
  params: {
    hash: string;
    chatbotId: string;
  },
) {
  const query = client
    .from('documents_embeddings')
    .select(`id`, {
      head: true,
    })
    .eq('metadata -> hash::text', params.hash)
    .eq('metadata -> chatbot_id:uuid', `"${params.chatbotId}"`)
    .limit(1)
    .maybeSingle();

  const { data } = await query;

  return data;
}
