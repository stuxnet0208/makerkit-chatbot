import { useContext } from 'react';
import classNames from 'clsx';

import {
  ChatBubbleBottomCenterIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { ChatBotContext } from '~/components/chatbot/ChatbotContext';

function ChatBotBubble() {
  const { state, onOpenChange } = useContext(ChatBotContext);

  const isOpen = state.isOpen;
  const position = state.settings.position;
  const primaryColor = state.settings.branding.primaryColor;

  const className = classNames({
    'bottom-8 md:bottom-16 md:right-8': position === 'bottom-right',
    'bottom-8 md:bottom-16 md:left-8': position === 'bottom-left',
    'hidden md:flex': isOpen
  });

  const iconClassName = 'w-8 h-8 animate-in fade-in zoom-in';

  const Icon = isOpen ? (
    <XMarkIcon className={iconClassName} />
  ) : (
    <ChatBubbleBottomCenterIcon className={iconClassName} />
  );

  return (
    <button
      style={{
        backgroundColor: primaryColor,
      }}
      className={classNames(
        'animate-out text-white h-16 w-16 rounded-full' +
          ' flex items-center justify-center fixed animate-in zoom-in slide-in-from-bottom-16' +
          ' hover:shadow-xl hover:opacity/90 transition-all' +
          ' hover:-translate-y-1 duration-500 hover:scale-105 z-50',
        className,
      )}
      onClick={() => onOpenChange(!isOpen)}
    >
      {Icon}
    </button>
  );
}

export default ChatBotBubble;
