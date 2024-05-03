import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';

import NavigationMenu from '~/core/ui/Navigation/NavigationMenu';
import NavigationMenuItem from '~/core/ui/Navigation/NavigationItem';
import { getChatbot } from '~/lib/chatbots/queries';
import { PageHeader } from '~/core/ui/Page';
import configuration from '~/configuration';
import Button from '~/core/ui/Button';
import EditChatbotModal from '../components/EditChatbotModal';
import Trans from '~/core/ui/Trans';

async function ChatbotLayout(
  props: React.PropsWithChildren<{
    params: {
      organization: string;
      chatbot: string;
    };
  }>,
) {
  const client = getSupabaseServerComponentClient();
  const chatbot = await getChatbot(client, props.params.chatbot);

  const path = (path: string = '') => {
    const { organization, chatbot } = props.params;

    return [
      configuration.paths.appHome,
      organization,
      'chatbots',
      chatbot,
      path,
    ]
      .filter(Boolean)
      .join('/');
  };

  return (
    <div className={'flex flex-col h-full'}>
      <PageHeader title={chatbot.name} description={chatbot.description}>
        <div className={'flex space-x-2'}>
          <Button size={'sm'} variant={'ghost'} href={'../'}>
            <ArrowLeftIcon className={'h-4 mr-2'} />
            <span>
              <Trans i18nKey={'chatbot:backToChatbotsButton'} />
            </span>
          </Button>

          <EditChatbotModal chatbot={chatbot}>
            <Button size={'sm'} variant={'outline'}>
              <PencilSquareIcon className={'h-4 mr-2'} />
              <span>
                <Trans i18nKey={'chatbot:editChatbotTitle'} />
              </span>
            </Button>
          </EditChatbotModal>
        </div>
      </PageHeader>

      <div className={'px-container'}>
        <NavigationMenu bordered>
          <NavigationMenuItem
            link={{
              path: path('documents'),
              label: 'chatbot:documentsTab',
            }}
          />

          <NavigationMenuItem
            link={{
              path: path('training'),
              label: 'chatbot:trainingTab',
            }}
          />

          <NavigationMenuItem
            link={{
              path: path('design'),
              label: 'chatbot:designTab',
            }}
          />

          <NavigationMenuItem
            link={{
              path: path('playground'),
              label: 'chatbot:playgroundTab',
            }}
          />

          <NavigationMenuItem
            link={{
              path: path('publish'),
              label: 'chatbot:publishTab',
            }}
          />
        </NavigationMenu>
      </div>

      {props.children}
    </div>
  );
}

export default ChatbotLayout;
