'use client';

import { toast } from 'sonner';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

import Button from '~/core/ui/Button';

function CopyToClipboardButton(
  props: React.PropsWithChildren<{
    text: string;
  }>,
) {
  const { t } = useTranslation('chatbot');

  const onCopy = async () => {
    await navigator.clipboard.writeText(props.text);

    toast.success(t('copyToClipboardSuccessToast'));
  };

  return (
    <Button variant={'outline'} onClick={onCopy}>
      <ClipboardIcon className={'w-4 mr-2'} />

      <span>{t('copyToClipboardButton')}</span>
    </Button>
  );
}

export default CopyToClipboardButton;
