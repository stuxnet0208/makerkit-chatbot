import { useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import Modal from '~/core/ui/Modal';
import Button from '~/core/ui/Button';
import { deleteDocumentAction } from '~/app/dashboard/[organization]/chatbots/[chatbot]/actions.server';

function DeleteDocumentModal({
  documentId,
  onBeforeDelete,
  children,
}: React.PropsWithChildren<{
  documentId: string;
  onBeforeDelete?: () => void;
}>) {
  const [pending, startTransition] = useTransition();
  const { t } = useTranslation('chatbot');

  const deleteAction = (data: FormData) => {
    startTransition(async () => {
      if (onBeforeDelete) {
        onBeforeDelete();
      }

      const promise = deleteDocumentAction(data);

      toast.promise(promise, {
        success: t('deleteDocumentSuccessToast'),
        error: t('deleteDocumentErrorToast'),
        loading: t('deleteDocumentLoadingToast'),
      });
    });
  };

  return (
    <Modal Trigger={children} heading={t('deleteDocument')}>
      <div className={'flex flex-col space-y-6'}>
        <div>{t('deleteDocumentDescription')}</div>

        <form>
          <input type="hidden" name={'documentId'} value={documentId} />

          <div className={'flex justify-end'}>
            <Button
              loading={pending}
              formAction={deleteAction}
              variant={'destructive'}
            >
              {t('confirmDeleteDocumentButton')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default DeleteDocumentModal;
