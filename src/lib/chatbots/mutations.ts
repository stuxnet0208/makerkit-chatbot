import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '~/database.types';
import {
  CHATBOTS_TABLE,
  CONVERSATIONS_TABLE,
  DOCUMENTS_TABLE,
} from '~/lib/db-tables';
import { ChatbotSettings } from '~/components/chatbot/lib/types';

type Client = SupabaseClient<Database>;

export function insertChatbot(
  client: Client,
  chatbot: {
    name: string;
    url: string;
    siteName: string;
    description?: string;
    organizationId: number;
  },
) {
  return client.from(CHATBOTS_TABLE).insert({
    name: chatbot.name,
    url: chatbot.url,
    description: chatbot.description,
    organization_id: chatbot.organizationId,
    site_name: chatbot.siteName,
  });
}

export async function updateChatbot(
  client: Client,
  chatbot: {
    id: string;
    name: string;
    url: string;
    description: string | null;
  },
) {
  return client
    .from(CHATBOTS_TABLE)
    .update({
      name: chatbot.name,
      url: chatbot.url,
      description: chatbot.description,
    })
    .match({
      id: chatbot.id,
    });
}

export async function updateChatbotSettings(
  client: Client,
  chatbotId: string,
  settings: ChatbotSettings,
) {
  return client
    .from(CHATBOTS_TABLE)
    .update({
      settings: settings as unknown as Json,
    })
    .match({
      id: chatbotId,
    });
}

export async function deleteChatbot(client: Client, chatbotId: string) {
  const deleteChatbotPromise = client.from(CHATBOTS_TABLE).delete().match({
    id: chatbotId
  });

  const deleteDocumentsPromise = client.from(DOCUMENTS_TABLE).delete().eq('metadata -> chatbot_id:uuid', `"${chatbotId}"`);

  return Promise.all([deleteChatbotPromise, deleteDocumentsPromise]);
}

export async function deleteDocument(client: Client, documentId: number) {
  return client.from(DOCUMENTS_TABLE).delete().match({
    id: documentId,
  });
}

export async function insertConversation(
  client: Client,
  params: {
    chatbotId: string;
    conversationReferenceId: string;
  },
) {
  return client
    .from(CONVERSATIONS_TABLE)
    .insert({
      chatbot_id: params.chatbotId,
      reference_id: params.conversationReferenceId,
    })
    .select('id')
    .single();
}
