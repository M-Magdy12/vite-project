import './MessageInput.css';

export const MessageInput = ({ value, onChange, onSubmit, disabled }) => {
  return (
    <div className="message-input-container">
      <form className="message-input-form" onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? "Conversation is closed" : "Type your message here..."}
          className="message-input"
          disabled={disabled}
          autoFocus
        />
        <button type="submit" className="send-button" disabled={!value.trim() || disabled}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Send
        </button>
      </form>
    </div>
  );
};
