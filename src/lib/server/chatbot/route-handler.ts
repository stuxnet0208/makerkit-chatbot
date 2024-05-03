import { NextRequest } from 'next/server';
import isBot from 'isbot';
import { StreamingTextResponse } from 'ai';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';

import { getConversationIdHeaderName } from '~/lib/chatbots/conversion-cookie-name';

import generateReplyFromChain, { insertConversationMessages } from './langchain';
import getSupabaseRouteHandlerClient from '~/core/supabase/route-handler-client';
import getVectorStore from '~/lib/server/chatbot/vector-store';
import { Database } from '~/database.types';
import { CHATBOTS_TABLE } from '~/lib/db-tables';
import { insertConversation } from '~/lib/chatbots/mutations';
import getLogger from '~/core/logger';
import configuration from '~/configuration';

const CONVERSATION_ID_STORAGE_KEY = getConversationIdHeaderName();
const isProduction = configuration.production;

// Set this to true to use a fake data streamer for testing purposes.
let USE_FAKE_DATA_STREAMER = false;

// make sure to set this to false in production
if (isProduction) {
  USE_FAKE_DATA_STREAMER = false;
}

// simple short-lived cache for site names
const siteNameCache = new Map<string, string>();

/**
 * Handles a chat bot request. This function should be exported from a
 * Next.js App Router route handler as a POST request.
 *
 * @example
 * file: app/api/chat/route.ts
 *
 * export const POST = handleChatBotRequest;
 *
 * */
export function handleChatBotRequest({ responseHeaders }: {
  responseHeaders: Record<string, string>;
}) {
  return async function (req: NextRequest) {
    const logger = getLogger();
    const userAgent = req.headers.get('user-agent');

    if (isBot(userAgent)) {
      return new Response(`No chatbot for you!`, {
        status: 403,
      });
    }

    // we parse the request body to get the messages sent by the user
    const zodSchema = z.object({
      messages: z.array(
        z.object({
          content: z.string(),
          role: z.enum(['user', 'assistant'] as const),
        }),
      ),
    });

    const chatbotId = z.string().uuid().parse(req.headers.get('x-chatbot-id'));
    const { messages } = zodSchema.parse(await req.json());

    const conversationReferenceId = req.headers.get(
      CONVERSATION_ID_STORAGE_KEY,
    ) ?? undefined;

    /**
     * If the conversation reference id is missing, we don't save the conversation.
     * This should never happen in production (unless the cookie gets cleared during a session)
     * but it's possible in development when using the playground.
     */
    if (!conversationReferenceId) {
      logger.warn({
        chatbotId,
      }, `Missing conversation reference id. This conversation will not be saved.`);
    }

    logger.info({
      conversationReferenceId,
      chatbotId,
    }, `Received chatbot message. Responding...`);

    // if the user is using the fake data streamer, we return a fake response
    if (USE_FAKE_DATA_STREAMER) {
      return fakeDataStreamer();
    }

    const client = getSupabaseRouteHandlerClient({
      admin: true,
    });

    const canGenerateAIResponse = await client.rpc('can_respond_to_message', {
      chatbot: chatbotId,
    });

    // if it's the first message we insert a new conversation
    if (conversationReferenceId) {
      if (messages.length <= 2) {
        logger.info({
          conversationReferenceId,
          chatbotId,
        }, `Detected new conversation. Inserting conversation...`);

        const { data, error } = await insertConversation(client, {
          chatbotId,
          conversationReferenceId,
        });

        if (error) {
          logger.error({
            conversationReferenceId,
            chatbotId,
          }, `Error inserting conversation.`);
        } else {
          logger.info({
            conversationReferenceId,
            conversationId: data.id,
            chatbotId,
          }, `Successfully inserted conversation.`);
        }
      }
    }

    // this is the user's latest message - eg. the message we want to respond to
    const latestMessage = messages[messages.length - 1];

    const returnFallbackReply = () => {
      logger.info({
        conversationReferenceId,
        chatbotId,
      }, `Cannot generate AI Response. Falling back to search...`);

      return fallbackSearchDocuments({
        client,
        query: latestMessage.content,
        chatbotId,
        conversationReferenceId,
      });
    };

    // if the Organization can't generate an AI response, we use a normal search
    if (!canGenerateAIResponse.data) {
      return returnFallbackReply();
    }

    try {
      const siteName = await getChatbotSiteName(client, chatbotId);

      const stream = await generateReplyFromChain({
        client,
        messages,
        chatbotId,
        siteName,
        conversationReferenceId,
      });

      // if the AI can generate a response, we return a streaming response
      logger.info({
        conversationReferenceId,
        chatbotId,
      }, `Stream generated. Sending response...`);

      return new StreamingTextResponse(stream, {
        headers: responseHeaders,
      });
    } catch (error) {
      // if there's an error generating the response
      // we fallback to a normal search

      logger.warn({
        conversationReferenceId,
        chatbotId,
        error,
      }, `Error generating response.`);

      return returnFallbackReply();
    }
  };
}

export default handleChatBotRequest;

/**
 * Fallback search documents when the AI can't generate a response or
 * when the user has exhausted the number of messages in their plan
 */
async function fallbackSearchDocuments(params: {
  client: ReturnType<typeof getSupabaseRouteHandlerClient>;
  query: string;
  chatbotId: string;
  conversationReferenceId?: string;
}) {
  const { client, query, chatbotId, conversationReferenceId } = params;

  // in this case, use a normal search function
  const { text, stream } = await searchDocuments({
    client,
    query,
    filter: {
      chatbot_id: chatbotId,
    },
  });

  if (conversationReferenceId) {
    await insertConversationMessages({
      client,
      chatbotId,
      conversationReferenceId,
      text,
      previousMessage: query,
    });
  }

  return new StreamingTextResponse(stream);
}

async function searchDocuments(params: {
  client: ReturnType<typeof getSupabaseRouteHandlerClient>;
  query: string;
  filter: {
    chatbot_id: string;
  };
}) {
  const { client, filter, query } = params;
  const store = await getVectorStore(client);

  const documents = await store
    .asRetriever({
      filter,
    })
    .getRelevantDocuments(query);

  const content = documents
    .map((document) => {
      return `<a target='_blank' class='document-link' href="${document.metadata.url}">${document.metadata.title}</a>`;
    })
    .join('\n\n');

  const contentResponse = `I found these documents that might help you:\n\n${content}`;
  const text = documents.length ? contentResponse : 'Sorry, I was not able to find an answer for you.';

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(text);
      controller.close();
    },
  });

  return {
    stream,
    text,
  }
}

/**
 * @returns {Response} - A fake data streamer response.
 */
function fakeDataStreamer() {
  let timerId: number | undefined;
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // @ts-ignore
      timerId = setInterval(() => {
        if (closed) return;

        controller.enqueue(encoder.encode('TEXT'));
      }, 200);

      setTimeout(() => {
        controller.close();
        closed = true;
      }, 5_000);
    },
    cancel() {
      if (typeof timerId === 'number') {
        clearInterval(timerId);
      }
    },
  });

  return new Response(stream);
}

/**
 * Gets the site name for a chatbot
 * Stores the site name in a cache for faster access when hitting the same instance.
 * @param client
 * @param chatbotId
 */
async function getChatbotSiteName(
  client: SupabaseClient<Database>,
  chatbotId: string,
) {
  if (siteNameCache.get(chatbotId)) {
    return siteNameCache.get(chatbotId) as string;
  }

  const response = await client
    .from(CHATBOTS_TABLE)
    .select(`site_name`)
    .eq('id', chatbotId)
    .single();

  if (response.error) {
    throw response.error;
  }

  const siteName = response.data.site_name;

  siteNameCache.set(chatbotId, siteName);

  return siteName;
}