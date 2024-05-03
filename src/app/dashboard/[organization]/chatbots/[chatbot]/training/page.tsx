import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { ServerDataLoader } from '@makerkit/data-loader-supabase-nextjs';

import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';

import { PageBody } from '~/core/ui/Page';
import JobsTable from './components/JobsTable';
import CrawlWebsiteModal from '../components/CrawlWebsiteModal';
import { getChatbot } from '~/lib/chatbots/queries';
import Button from '~/core/ui/Button';
import Heading from '~/core/ui/Heading';
import { withI18n } from '~/i18n/with-i18n';
import Trans from '~/core/ui/Trans';

interface ChatbotTrainingPageParams {
  params: {
    organization: string;
    chatbot: string;
  };

  searchParams: {
    page?: string;
  };
}

export const metadata = {
  title: 'Training',
};

async function ChatbotTrainingPage({
  params,
  searchParams,
}: ChatbotTrainingPageParams) {
  const client = getSupabaseServerComponentClient();
  const page = searchParams.page ? +searchParams.page : 1;
  const chatbot = await getChatbot(client, params.chatbot);

  return (
    <PageBody className={'py-container space-y-4'}>
      <div className={'flex space-x-4 justify-between items-end'}>
        <div className={'flex flex-col space-y-2'}>
          <Heading type={4}>
            <Trans i18nKey={'chatbot:trainingTab'} />
          </Heading>

          <p className={'text-sm text-gray-500 dark:text-gray-400'}>
            <Trans i18nKey={'chatbot:trainingTabSubheading'} />
          </p>
        </div>

        <div>
          <TrainingButton chatbotId={chatbot.id} url={chatbot.url} />
        </div>
      </div>

      <ServerDataLoader
        client={client}
        table={'jobs'}
        camelCase
        page={page}
        where={{
          chatbot_id: {
            eq: chatbot.id,
          },
        }}
      >
        {({ data, count, pageSize }) => {
          if (!count) {
            return <EmptyState chatbotId={chatbot.id} url={chatbot.url} />;
          }

          return (
            <JobsTable
              jobs={data}
              page={page}
              perPage={pageSize}
              count={count}
            />
          );
        }}
      </ServerDataLoader>
    </PageBody>
  );
}

export default withI18n(ChatbotTrainingPage);

function TrainingButton(props: { chatbotId: string; url: string }) {
  return (
    <div className={'flex'}>
      <CrawlWebsiteModal {...props}>
        <Button size={'sm'} variant={'outline'}>
          <PlusCircleIcon className={'h-4 w-4 mr-2'} />

          <span>
            <Trans i18nKey={'chatbot:trainChatbotButton'} />
          </span>
        </Button>
      </CrawlWebsiteModal>
    </div>
  );
}

function EmptyState(props: { chatbotId: string; url: string }) {
  return (
    <>
      <div
        className={'flex flex-col space-y-8 items-center justify-center flex-1'}
      >
        <div className={'flex flex-col space-y-2 items-center justify-center'}>
          <Heading type={3}>
            <Trans i18nKey={'chatbot:noJobsFound'} />
          </Heading>

          <div>
            <Trans i18nKey={'chatbot:noJobsFoundDescription'} />
          </div>
        </div>

        <div>
          <CrawlWebsiteModal {...props}>
            <Button>
              <Trans i18nKey={'chatbot:importDocumentsButton'} />
            </Button>
          </CrawlWebsiteModal>
        </div>
      </div>
    </>
  );
}
