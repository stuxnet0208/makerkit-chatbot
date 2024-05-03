'use client';

import { useFormStatus } from 'react-dom';
import Button from '~/core/ui/Button';
import Trans from '~/core/ui/Trans';

function DeleteChatSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button loading={pending} variant={'destructive'}>
      <Trans i18nKey={'chatbot:confirmDeleteChatbotButton'} />
    </Button>
  );
}

export default DeleteChatSubmitButton;
