'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import classNames from 'clsx';
import { useChat } from 'ai/react';
import type { ChatRequestOptions, Message } from 'ai';

import {
  XMarkIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';
import If from '~/core/ui/If';

import chatbotMessagesStore from './lib/chatbot-messages-store';

import ChatBotBubble from './ChatBotBubble';
import { ChatBotContext } from './ChatbotContext';

import { ChatBotMessageRole } from './lib/message-role.enum';
import MarkdownRenderer from '~/core/ui/markdown/MarkdownRenderer';

const NEXT_PUBLIC_CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL;

if (!NEXT_PUBLIC_CHATBOT_API_URL) {
  throw new Error(
    `The environment variable NEXT_PUBLIC_CHATBOT_API_URL is not set`,
  );
}

type ChatBotProps = React.PropsWithChildren<{
  siteName: string;
  chatbotId: string;

  defaultPrompts?: string[];
  storageKey?: string;
  conversationId?: string;

  onClear?: () => void;
  onMessage?: (message: string) => void;
}>;

function ChatBotContainer(
  props: ChatBotProps,
) {
  const { state, onOpenChange, onLoadingChange } = useContext(ChatBotContext);
  const scrollingDiv = useRef<HTMLDivElement>();
  const scrollToBottom = useScrollToBottom(scrollingDiv);
  const [error, setError] = useState<string | undefined>(undefined);

  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    append,
    setMessages,
    isLoading,
  } = useChat({
    api: NEXT_PUBLIC_CHATBOT_API_URL,
    initialMessages: chatbotMessagesStore.loadMessages(props.storageKey, props.siteName),
    onError: (error) => {
      setError('Sorry, we could not process your request. Please try again.');
      onLoadingChange(false);
      console.error(error);
    },
    onResponse: () => {
      onLoadingChange(false);
    },
    onFinish: (message) => {
      if (props.onMessage) {
        props.onMessage(message.content);
      }
    },
    headers: {
      'x-chatbot-id': props.chatbotId,
      'x-conversation-id': props.conversationId ?? '',
    }
  });

  useEffect(() => {
    scrollToBottom({ smooth: true });
    setError(undefined);
    chatbotMessagesStore.saveMessages(messages, props.storageKey);
  }, [messages, scrollToBottom, props.storageKey]);

  return (
    <>
      <If condition={state.isOpen}>
        <ChatbotContentContainer position={state.settings.position}>
          <div className={'flex flex-col h-full'}>
            <ChatBotHeader
              onClose={() => onOpenChange(false)}
              onRefresh={() => {
                chatbotMessagesStore.removeMessages(props.storageKey);
                setMessages(chatbotMessagesStore.loadMessages(props.storageKey, props.siteName));

                if (props.onClear) {
                  props.onClear();
                }
              }}
            />

            <div
              ref={(div) => (scrollingDiv.current = div ?? undefined)}
              className={'overflow-y-auto flex flex-col flex-1'}
            >
              <ChatBotMessages
                isLoading={state.isLoading}
                messages={messages}
                defaultPrompts={props.defaultPrompts}
                onPromptClick={(content) => {
                  onLoadingChange(true);

                  return append({
                    role: ChatBotMessageRole.User,
                    content,
                  });
                }}
              />
            </div>

            <If condition={error}>
              <div className={'p-4'}>
                <span className={'text-xs text-red-500'}>{error}</span>
              </div>
            </If>

            <ChatBotInput
              isLoading={isLoading || state.isLoading}
              input={input}
              disabled={state.isDisabled}
              handleSubmit={handleSubmit}
              handleInputChange={handleInputChange}
            />
          </div>
        </ChatbotContentContainer>
      </If>

      <ChatBotBubble />
    </>
  );
}

export default ChatBotContainer;

function ChatBotHeader(
  props: React.PropsWithChildren<{
    onClose: () => void;
    onRefresh: () => void;
  }>,
) {
  const { state } = useContext(ChatBotContext);

  return (
    <div
      className={
        'px-4 py-3 flex border-b md:rounded-t-xl justify-between' +
        ' items-center dark:border-dark-600'
      }
    >
      <div className={'flex flex-col text-foreground'}>
        <span className={'font-semibold'}>{state.settings.title}</span>
      </div>

      <div className={'flex space-x-4 items-center'}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={props.onRefresh}>
              <ArrowPathIcon
                className={'h-4 text-foreground dark:hover:text-white'}
              />
            </button>
          </TooltipTrigger>

          <TooltipContent>Reset conversation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={props.onClose}>
              <XMarkIcon
                className={'h-4 text-foreground dark:hover:text-white'}
              />
            </button>
          </TooltipTrigger>

          <TooltipContent>Close</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ChatBotMessages(
  props: React.PropsWithChildren<{
    isLoading: boolean;
    defaultPrompts?: string[];
    messages: Message[];
    onPromptClick: (prompt: string) => void;
  }>,
) {
  const shouldDisplayHelpButtons = useShouldDisplayHelpButtons(props.messages);
  const shouldDisplayDefaultPrompts = props.messages.length < 2;

  return (
    <div className={'flex-1 relative p-4 flex-col space-y-2'}>
      {props.messages.map((message, index) => {
        return <ChatBotMessage key={index} message={message} />;
      })}

      <If condition={props.isLoading}>
        <BubbleAnimation />
      </If>

      <If condition={shouldDisplayHelpButtons}>
        <div className={'py-1'}>
          <HelpButtonsContainer />
        </div>
      </If>

      <If condition={shouldDisplayDefaultPrompts}>
        <div className={'py-4'}>
          <DefaultPromptsContainer
            onPromptClick={props.onPromptClick}
            defaultPrompts={props.defaultPrompts}
          />
        </div>
      </If>
    </div>
  );
}

function ChatBotMessage({ message }: { message: Message }) {
  const { state } = useContext(ChatBotContext);

  const isBot = message.role === ChatBotMessageRole.Assistant;
  const isUser = message.role === ChatBotMessageRole.User;

  const className = classNames(
    `px-2.5 py-1.5 flex space-x-2 inline-flex text-sm rounded items-center`,
    {
      'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100': isBot,
      [`text-primary-foreground`]: isUser,
    },
  );

  const primaryColor = state.settings.branding.primaryColor;
  const textColor = state.settings.branding.textColor;

  const style = isUser
    ? {
        backgroundColor: primaryColor,
        color: textColor,
      }
    : {};

  return (
    <div
      className={classNames(`flex`, {
        'justify-end': isUser,
        'justify-start': isBot,
      })}
    >
      <div className={'flex space-y-1.5 flex-col overflow-x-hidden'}>
        <span
          className={classNames('text-sm py-1 px-1 font-medium', {
            'text-right pr-2': isUser,
          })}
        >
          {isBot ? `AI` : `You`}
        </span>

        <div style={style} className={className}>
          <MarkdownRenderer className="overflow-x-hidden prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
            {message.content}
          </MarkdownRenderer>
        </div>
      </div>
    </div>
  );
}

function ChatBotInput({
  isLoading,
  disabled,
  input,
  handleSubmit,
  handleInputChange,
}: React.PropsWithChildren<{
  input: string;
  isLoading: boolean;
  disabled: boolean;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  handleInputChange: React.ChangeEventHandler<HTMLInputElement>;
}>) {
  const { onLoadingChange } = useContext(ChatBotContext);
  const { state } = useContext(ChatBotContext);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();

      if (isLoading || disabled) {
        return;
      }

      onLoadingChange(true);

      handleSubmit(e);
    },
    [handleSubmit, disabled, isLoading, onLoadingChange],
  );

  return (
    <form onSubmit={onSubmit}>
      <div className={'flex relative'}>
        <input
          disabled={isLoading || disabled}
          autoComplete={'off'}
          required
          value={input}
          onChange={handleInputChange}
          name={'message'}
          className={
            'p-4 h-14 dark:focus:text-white dark:hover:text-white' +
            ' rounded-bl-xl rounded-br-xl w-full outline-none' +
            ' transition-colors resize-none border-t text-sm dark:bg-dark-800' +
            ' dark:border-dark-700 pr-8'
          }
          placeholder="Ask our chatbot a question..."
        />

        <button
          disabled={isLoading || disabled}
          type={'submit'}
          className={'absolute right-4 top-4 bg-transparent'}
        >
          <PaperAirplaneIcon
            style={{ color: state.settings.branding.primaryColor }}
            className={'h-6'}
          />
        </button>
      </div>
    </form>
  );
}

function HelpButtonsContainer() {
  const supportFallbackUrl = process.env.NEXT_PUBLIC_CHATBOT_FALLBACK_URL;

  if (!supportFallbackUrl) {
    return null;
  }

  return (
    <div className={'flex'}>
      <ClickablePrompt href={supportFallbackUrl}>
        Contact Support
      </ClickablePrompt>
    </div>
  );
}

function DefaultPromptsContainer({
  defaultPrompts,
  onPromptClick,
}: {
  defaultPrompts?: string[];
  onPromptClick: (prompt: string) => void;
}) {
  if (!defaultPrompts) {
    return null;
  }

  return (
    <div className={'grid grid-cols-2 gap-2'}>
      {defaultPrompts.map((text, index) => {
        return (
          <ClickablePrompt
            key={index}
            onClick={() => {
              onPromptClick(text);
            }}
          >
            {text}
          </ClickablePrompt>
        );
      })}
    </div>
  );
}

function ClickablePrompt(
  props: React.PropsWithChildren<
    | {
        onClick: () => void;
      }
    | {
        href: string;
      }
  >,
) {
  const className = `p-1.5 rounded-md text-xs inline-flex border dark:bg-dark-800
      text-left transition-all dark:hover:border-dark-600 dark:border-dark-700 
      hover:bg-gray-50 dark:hover:bg-dark-700`;

  if ('href' in props) {
    return (
      <a href={props.href} className={className}>
        {props.children}
      </a>
    );
  }

  return (
    <button className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

function BubbleAnimation() {
  const dotClassName = `rounded-full dark:bg-dark-600 bg-gray-100 h-2.5 w-2.5`;

  return (
    <div
      className={
        'animate-in slide-in-from-bottom-12 duration-1000 ease-out py-4'
      }
    >
      <div className={'flex space-x-1 animate-bounce duration-750'}>
        <div className={dotClassName} />
        <div className={dotClassName} />
        <div className={dotClassName} />
      </div>
    </div>
  );
}

function useShouldDisplayHelpButtons(messages: Message[]) {
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    return false;
  }

  return lastMessage.content.includes(
    `Sorry, I don\'t know how to help with that`,
  );
}

function useScrollToBottom(
  scrollingDiv: React.MutableRefObject<HTMLDivElement | undefined>,
) {
  return useCallback(
    ({ smooth } = { smooth: false }) => {
      setTimeout(() => {
        const div = scrollingDiv.current;

        if (!div) return;

        div.scrollTo({
          behavior: smooth ? 'smooth' : 'auto',
          top: div.scrollHeight,
        });
      }, 50);
    },
    [scrollingDiv],
  );
}

function ChatbotContentContainer(
  props: React.PropsWithChildren<{
    position?: 'bottom-left' | 'bottom-right';
  }>,
) {
  const position = props.position ?? 'bottom-right';

  const className = classNames({
    'bottom-0 md:bottom-36 md:right-8': position === 'bottom-right',
    'bottom-0 md:bottom-36 md:left-8': position === 'bottom-left',
  });

  return (
    <div
      className={classNames(
        'animate-in fixed z-50 fade-in slide-in-from-bottom-24 duration-200' +
          ' bg-white dark:bg-dark-800 font-sans md:rounded-lg' +
          ' w-full h-[60vh] md:w-[40vw] xl:w-[26vw]' +
          ' shadow-2xl zoom-in-90 border dark:border-dark-700',
        className,
      )}
    >
      {props.children}
    </div>
  );
}
