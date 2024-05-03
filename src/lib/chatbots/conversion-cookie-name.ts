export function getConversationIdHeaderName() {
  return process.env.CONVERSATION_ID_STORAGE_KEY || `x-conversation-id`;
}