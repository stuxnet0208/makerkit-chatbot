import { redirect } from 'next/navigation';
import { z } from 'zod';

import Modal from '~/core/ui/Modal';
import { TextFieldHint, TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getSdk from '~/lib/sdk';

import Textarea from '~/core/ui/Textarea';
import ErrorBoundary from '~/core/ui/ErrorBoundary';
import { Alert, AlertHeading } from '~/core/ui/Alert';
import If from '~/core/ui/If';
import Button from '~/core/ui/Button';
import { insertChatbot } from '~/lib/chatbots/mutations';
import Trans from '~/core/ui/Trans';

function CreateChatbotModal(
  props: React.PropsWithChildren<{
    canCreateChatbot: boolean;
  }>,
) {
  return (
    <Modal Trigger={props.children} heading={
      <Trans i18nKey={'chatbot:createChatbotModalHeading'} />
    }>
      <If
        condition={props.canCreateChatbot}
        fallback={<CannotCreateChatbotAlert />}
      >
        <ErrorBoundary fallback={<ChatbotErrorAlert />}>
          <CreateChatbotForm />
        </ErrorBoundary>
      </If>
    </Modal>
  );
}

export default CreateChatbotModal;

function CreateChatbotForm() {
  return (
    <form action={createChatbotAction}>
      <div className={'flex flex-col space-y-4'}>
        <div>
          <p className={'text-sm text-gray-500'}>
            <Trans i18nKey={'chatbot:createChatbotModalSubheading'} />
          </p>
        </div>

        <TextFieldLabel>
          <Trans i18nKey={'chatbot:chatbotName'} />

          <TextFieldInput
            name={'name'}
            required
            placeholder={'Ex. Home Page Chatbot'}
          />
        </TextFieldLabel>

        <TextFieldLabel>
          <Trans i18nKey={'chatbot:chatbotWebsiteName'} />

          <TextFieldInput
            name={'siteName'}
            required
            placeholder={'Ex. Supabase'}
          />

          <TextFieldHint>
            <Trans i18nKey={'chatbot:chatbotWebsiteNameHint'} />
          </TextFieldHint>
        </TextFieldLabel>

        <TextFieldLabel>
          <Trans i18nKey={'chatbot:chatbotWebsiteUrl'} />
          <TextFieldInput name={'url'} placeholder={'https://...'} type={'url'} defaultValue={'https://'} />
        </TextFieldLabel>

        <TextFieldLabel>
          <Trans i18nKey={'chatbot:chatbotDescription'} />
          <Textarea name={'description'} placeholder={'Description...'} />
        </TextFieldLabel>

        <Button>
          <Trans i18nKey={'chatbot:createChatbotSubmitButton'} />
        </Button>
      </div>
    </form>
  );
}

function ChatbotErrorAlert() {
  return (
    <Alert type={'error'}>
      <AlertHeading>
        <Trans i18nKey={'chatbot:createChatbotAlertError'} />
      </AlertHeading>

      <Trans i18nKey={'chatbot:createChatbotAlertErrorDescription'} />
    </Alert>
  );
}

function CannotCreateChatbotAlert() {
  return (
    <Alert type={'warn'}>
      <AlertHeading>
        <Trans i18nKey={'chatbot:cannotCreateChatbot'} />
      </AlertHeading>

      <Trans i18nKey={'chatbot:cannotCreateChatbotDescription'} />
    </Alert>
  );
}

async function createChatbotAction(data: FormData) {
  'use server';

  const name = z.string().min(2).parse(data.get('name'));
  const description = z.string().optional().parse(data.get('description'));
  const url = z.string().parse(data.get('url'));
  const siteName = z.string().parse(data.get('siteName'));

  const client = getSupabaseServerActionClient();
  const sdk = getSdk(client);

  const organization = await sdk.organization.getCurrent();

  if (!organization) {
    throw new Error('Organization not found');
  }

  const { data: chatbot, error } = await insertChatbot(client, {
    name,
    description,
    url,
    siteName,
    organizationId: organization.id,
  })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/dashboard/${organization.uuid}/chatbots/${chatbot.id}/documents`);
}
