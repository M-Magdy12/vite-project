import './MessageList.css';

export const MessageList = ({ messages, loading, messagesEndRef }) => {
  // Debug: Log messages to console
  console.log('MessageList - messages:', messages);
  console.log('MessageList - loading:', loading);
  console.log('MessageList - message count:', messages?.length);

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading-messages">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-container">
        <div className="empty-messages">
          <p>No messages yet. Waiting for customer or AI interaction.</p>
          <p style={{ fontSize: '12px', marginTop: '10px', opacity: 0.5 }}>
            Debug: messages = {JSON.stringify(messages)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.map((msg) => {
        console.log('Rendering message:', msg);
        return (
          <div key={msg.id} className={`message message-${msg.sender_type}`}>
            <div className="message-wrapper">
              <div className="message-avatar">
                {msg.sender_type === 'customer' && 'C'}
                {msg.sender_type === 'ai' && 'AI'}
                {msg.sender_type === 'agent' && 'A'}
              </div>
              <div className="message-bubble">
                <div className="message-sender">
                  {msg.sender_type === 'customer' && 'Customer'}
                  {msg.sender_type === 'ai' && 'AI Assistant'}
                  {msg.sender_type === 'agent' && 'Agent'}
                </div>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
