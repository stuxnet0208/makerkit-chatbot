import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import isBot from 'isbot';

import getSupabaseRouteHandlerClient from '~/core/supabase/route-handler-client';
import { getChatbotSettings } from '~/lib/chatbots/queries';
import { getConversationIdHeaderName } from '~/lib/chatbots/conversion-cookie-name';

const CONVERSATION_ID_STORAGE_KEY = getConversationIdHeaderName();

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type, x-chatbot-id, x-conversation-id, User-Agent',
};

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: HEADERS,
  });
}

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get('user-agent');

  if (isBot(userAgent)) {
    return new Response(`No chatbot for you!`, {
      status: 403,
    });
  }

  const chatbotId = req.nextUrl.searchParams.get('id');
  let conversationId = req.headers.get(CONVERSATION_ID_STORAGE_KEY);

  if (!chatbotId) {
    return new Response('Missing chatbot ID', { status: 400 });
  }

  const client = getSupabaseRouteHandlerClient({
    admin: true,
  });

  const { settings, siteName } = await getChatbotSettings(client, chatbotId);

  // if there is no conversation ID, we generate one and store it in a cookie
  // so that we can keep track of the conversation
  if (!conversationId) {
    conversationId = nanoid(16);
  }

  const payload = {
    settings,
    siteName,
    conversationId,
  };

  return NextResponse.json(payload, {
    headers: HEADERS
  });
}
