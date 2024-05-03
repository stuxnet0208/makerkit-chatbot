'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getLogger from '~/core/logger';
import requireSession from '~/lib/user/require-session';
import { deleteChatbot } from '~/lib/chatbots/mutations';

export async function deleteChatbotAction(data: FormData) {
  const client = getSupabaseServerActionClient();
  const logger = getLogger();

  await requireSession(client);

  const chatbotId = z.string().uuid().parse(data.get('chatbotId'));

  logger.info(
    {
      chatbotId
    },
    `Deleting chatbot...`,
  );

  const results = await deleteChatbot(client, chatbotId);

  if (results[0].error) {
    logger.error(
      {
        chatbotId,
        error: results[0].error
      },
      `Failed to delete chatbot.`,
    );

    throw new Error(`Failed to delete chatbot.`);
  }

  logger.info(
    {
      chatbotId
    },
    `Chatbot deleted successfully.`,
  );

  if (results[1].error) {
    logger.error({
      chatbotId,
      error: results[1].error
    }, `Failed to delete documents.`);
  }

  revalidatePath(`/dashboard/[organization]/chatbots`, `page`);
  revalidatePath(`/dashboard/[organization]/chatbots/[chatbot]`, `layout`);

  return {
    success: true,
  };
}