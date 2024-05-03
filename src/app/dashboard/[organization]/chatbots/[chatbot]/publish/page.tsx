import { PageBody } from '~/core/ui/Page';
import Heading from '~/core/ui/Heading';
import CopyToClipboardButton from './components/CopyToClipboardButton';
import Trans from '~/core/ui/Trans';
import { withI18n } from '~/i18n/with-i18n';

interface ChatbotPublishPageParams {
  params: {
    organization: string;
    chatbot: string;
  };
}

export const metadata = {
  title: 'Publish',
};

async function ChatbotPublishPage({ params }: ChatbotPublishPageParams) {
  const widgetHostingUrl = process.env.NEXT_PUBLIC_WIDGET_HOSTING_URL;

  const script = `
    <script async data-chatbot='${params.chatbot}' src='${widgetHostingUrl}' />
  `.trim();

  return (
    <PageBody className={'py-container space-y-4'}>
      <div className={'flex flex-col space-y-2'}>
        <Heading type={4}>
          <Trans i18nKey={'chatbot:publishTab'} />
        </Heading>

        <div>
          <p className={'text-sm text-gray-500 dark:text-gray-400'}>
            <Trans i18nKey={'chatbot:publishTabSubheading'} />
          </p>
        </div>
      </div>

      <pre className={'border text-sm text-gray-600 dark:text-gray-400 rounded-lg p-container'}>
        <code>{script}</code>
      </pre>

      <div>
        <CopyToClipboardButton text={script} />
      </div>
    </PageBody>
  );
}

export default withI18n(ChatbotPublishPage);
