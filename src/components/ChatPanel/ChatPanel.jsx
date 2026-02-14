import { useState, useRef, useEffect } from 'react';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import { ChatHeader } from '../ChatHeader/ChatHeader';
import './ChatPanel.css';

export const ChatPanel = ({
  conversation,
  messages,
  messagesLoading,
  ticket,
  onSendMessage,
  onTakeover,
  onResolve,
  onClose
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const text = messageInput.trim();
    setMessageInput('');
    await onSendMessage(text);
  };

  if (!conversation) {
    return (
      <div className="main-panel">
        <div className="empty-chat">
          <div className="empty-chat-content">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the sidebar to view messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-panel">
      <ChatHeader
        conversation={conversation}
        ticket={ticket}
        onTakeover={onTakeover}
        onResolve={onResolve}
        onClose={onClose}
      />

      <MessageList
        messages={messages}
        loading={messagesLoading}
        messagesEndRef={messagesEndRef}
      />

      <MessageInput
        value={messageInput}
        onChange={setMessageInput}
        onSubmit={handleSend}
        disabled={conversation.status === 'closed'}
      />
    </div>
  );
};
