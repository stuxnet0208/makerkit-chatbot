import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/database.types';

async function getVectorStore(client: SupabaseClient<Database>) {
  return SupabaseVectorStore.fromExistingIndex(new OpenAIEmbeddings(), {
    client,
    tableName: 'documents_embeddings',
    queryName: 'match_documents',
  });
}

export default getVectorStore;
