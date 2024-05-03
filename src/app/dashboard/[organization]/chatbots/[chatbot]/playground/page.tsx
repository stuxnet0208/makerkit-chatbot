import dynamic from 'next/dynamic';

import { PageBody } from '~/core/ui/Page';
import Heading from '~/core/ui/Heading';
import { getChatbot } from '~/lib/chatbots/queries';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { ChatbotSettings } from '~/components/chatbot/lib/types';
import { withI18n } from '~/i18n/with-i18n';
import Trans from '~/core/ui/Trans';

const ChatBot = dynamic(() => import('~/components/chatbot/ChatBot'), {
  ssr: false,
});

interface ChatbotPlaygroundPageParams {
  params: {
    organization: string;
    chatbot: string;
  };
}

const LOCAL_STORAGE_KEY = 'chatbot-playground';

export const metadata = {
  title: 'Playground',
};

async function ChatbotPlaygroundPage({ params }: ChatbotPlaygroundPageParams) {
  const client = getSupabaseServerComponentClient();
  const chatbot = await getChatbot(client, params.chatbot);
  const settings = chatbot.settings as unknown as ChatbotSettings;

  return (
    <>
      <PageBody className={'py-container space-y-2'}>
        <Heading type={4}>
          <Trans i18nKey={'chatbot:playgroundTab'} />
        </Heading>

        <p className={'text-sm text-gray-500 dark:text-gray-400'}>
          <Trans i18nKey={'chatbot:playgroundTabSubheading'} />
        </p>
      </PageBody>

      <ChatBot
        isOpen
        chatbotId={chatbot.id}
        siteName={chatbot.siteName}
        settings={settings}
        storageKey={LOCAL_STORAGE_KEY}
      />
    </>
  );
}

export default withI18n(ChatbotPlaygroundPage);
