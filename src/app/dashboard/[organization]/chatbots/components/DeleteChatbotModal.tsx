import Modal from '~/core/ui/Modal';
import { deleteChatbotAction } from '../actions.server';
import DeleteChatSubmitButton from './DeleteChatSubmitButton';
import Trans from '~/core/ui/Trans';

function DeleteChatbotModal(
  props: React.PropsWithChildren<{
    chatbotId: string
  }>,
) {
  return (
    <Modal heading={
      <Trans i18nKey={'chatbot:deleteChatbotButton'} />
    } Trigger={props.children}>
      <form action={deleteChatbotAction}>
        <input type='hidden' name={'chatbotId'} value={props.chatbotId} />

        <div className={'flex flex-col space-y-4 text-sm'}>
          <div className={'flex flex-col space-y-2'}>
            <div>
              <Trans i18nKey={'chatbot:deleteChatbotDescription'} />
            </div>

            <div>
              <Trans i18nKey={'common:modalConfirmationQuestion'} />
            </div>
          </div>

          <DeleteChatSubmitButton />
        </div>
      </form>
    </Modal>
  );
}

export default DeleteChatbotModal;
